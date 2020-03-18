import 'source-map-support/register'

import express from 'express'
import isBot from 'isbot'
import { r, Link } from './pool'
import cors from 'cors'
import cheerio from 'cheerio'
import fetch from 'node-fetch'

import owoify from './owoifier'

import { owo } from './generators/owo'
import { zws } from './generators/zws'

const app = express()
const isUrl = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/

app.use(express.json())

app.use(cors())
app.options('/generate', cors())

app.post('/generate', async (req, res) => {
  if (req.body && req.body.link && isUrl.test(req.body.link)) {
    let generator = owo
    if (req.body.generator) {
      switch (req.body.generator) {
        case 'owo':
          generator = owo
          break

        case 'zws':
          generator = zws
          break

        default:
          res.status(400).send('Invalid generator')
          return
      }
    }
    const id = generator()
    const dbResponse = await r.table('links').insert({
      destination: req.body.link,
      id,
      preventScrape: !!req.body.preventScrape,
      owoify: !!req.body.owoify
    }).run()
    if (dbResponse.errors > 0) {
      res.status(500).send('Conflicting IDs')
    } else {
      res.json({
        result: id,
        destination: req.body.link,
        preventScrape: !!req.body.preventScrape,
        owoify: !!req.body.owoify
      })
    }
  } else {
    res.status(400).send('Malformed request')
  }
})

app.use(async (req, res) => {
  if (req.method === 'GET') {
    const url = decodeURI(req.hostname + req.path)
    console.log(url)
    const linkData = await r.table('links').get(url).run() as Link
    if (linkData) {
      if (linkData.preventScrape && isBot(req.header('User-Agent'))) {
        return res.status(200).end()
      } else if (linkData.owoify && isBot(req.header('User-Agent'))) {
        const page = await fetch(linkData.destination, {
          headers: {
            'User-Agent': 'OWObot (https://owo.vc)'
          }
        })
        if (page.ok) {
          const $ = cheerio.load(await page.text())
          const metaTags = $('meta')
          let metadataHTML = ''

          const owodTags = [
            'og:title',
            'og:site_name',
            'og:description',
            'description',
            'twitter:title',
            'twitter:description'
          ]

          for (const key in metaTags) {
            const tag = metaTags[key].attribs?.property || metaTags[key].attribs?.name
            if (owodTags.includes(tag)) {
              if (metaTags[key].attribs.content) {
                metaTags[key].attribs.content = owoify(metaTags[key].attribs.content)
              }
              if (metaTags[key].attribs.value) {
                metaTags[key].attribs.value = owoify(metaTags[key].attribs.value)
              }
            }
          }

          return res.send(`<html><head>${cheerio.html(metaTags)}</head><body></body></html>`)
        }
      }
      res.redirect(linkData.destination)
    } else {
      res.status(404).send('Not found')
    }
  } else {
    res.status(404).send('Not found')
  }
})

app.listen(parseInt(process.env.WEB_PORT, 10) || 80)

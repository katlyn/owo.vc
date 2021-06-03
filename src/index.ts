import 'source-map-support/register'

import express from 'express'
import isBot from 'isbot'
import { r, Link } from './pool'
import cors from 'cors'
import cheerio from 'cheerio'
import fetch from 'node-fetch'

import owoify from './owoifier'

import { gay } from './generators/gay'
import { owo } from './generators/owo'
import { zws } from './generators/zws'

const app = express()
const isUrl = /(?:https?:\/\/).+\..+/

app.use(express.json())

app.use(cors())
app.options('/generate', cors())

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.post('/generate', async (req, res) => {
  if (typeof req.body.link === 'string' && isUrl.test(req.body.link)) {
    let generator = owo
    if (typeof req.body.generator === 'string') {
      switch (req.body.generator) {
        case 'gay':
          generator = gay
          break

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
      preventScrape: !!(req.body.preventScrape as boolean),
      owoify: !!(req.body.owoify as boolean)
    }).run()
    if (dbResponse.errors > 0) {
      res.status(500).send('Conflicting IDs')
    } else {
      res.json({
        result: id,
        destination: req.body.link,
        preventScrape: !!(req.body.preventScrape as boolean),
        owoify: !!(req.body.owoify as boolean)
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
    const linkData = await r.table<Link>('links').get(url).run()
    if (linkData !== null) {
      if (linkData.preventScrape && isBot(req.header('User-Agent') as string)) {
        return res.status(200).end()
      } else if (linkData.owoify && isBot(req.header('User-Agent') as string)) {
        const page = await fetch(linkData.destination, {
          headers: {
            'User-Agent': 'OWObot (https://owo.vc)'
          }
        })
        if (page.ok) {
          // Only owoify if the page is actually html.
          const contentType = page.headers.get('content-type')
          // Yes, I know. Optional chaining makes this weird.
          if (contentType?.includes('text/html') !== true) {
            return res.redirect(linkData.destination)
          }

          const $ = cheerio.load(await page.text())
          const metaTags = $('meta')

          const owodTags = [
            'og:title',
            'og:site_name',
            'og:description',
            'description',
            'twitter:title',
            'twitter:description'
          ]

          for (const el of metaTags) {
            const tag = el.attribs?.property ?? el.attribs?.name
            if (owodTags.includes(tag)) {
              if (el.attribs.content !== void 0) {
                el.attribs.content = owoify(el.attribs.content)
              }
              if (el.attribs.value !== void 0) {
                el.attribs.value = owoify(el.attribs.value)
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

app.listen(80)

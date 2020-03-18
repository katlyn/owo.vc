import express from 'express'
import isBot from 'isbot'
import { r, Link } from './pool'
import cors from 'cors'
import og from 'open-graph-scraper'

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
        try {
          const metadata = await og({
            headers: {
              'User-Agent': 'OWObot (https://owo.vc)'
            },
            url: linkData.destination
          })
          if (metadata.success) {
            const { data } = metadata
            let page = '<html><head>'
            if (data.ogTitle) {
              page += `<meta property="og:title" content="${owoify(data.ogTitle)}"/>`
            }
            if (data.ogType) {
              page += `<meta property="og:type" content="${data.ogType}"/>`
            }
            if (data.ogUrl) {
              page += `<meta property="og:url" content="${data.ogUrl}"/>`
            }
            if (data.ofDescription) {
              page += `<meta property="og:description" content="${owoify(data.ogDescription)}"/>`
            }
            if (data.ogImage) {
              const image = data.ogImage

              if (image.url) {
                page += `<meta property="og:image" content="${image.url}"/>`
              }
              if (image.width) {
                page += `<meta property="og:image:width" content="${image.width}"/>`
              }
              if (image.height) {
                page += `<meta property="og:image:height" content="${image.height}"/>`
              }
              if (image.type) {
                page += `<meta property="og:image:type" content="${image.type}"/>`
              }
            }
            page += '</head><body></body></html>'
            return res.send(page)
          }
        } catch (_) { console.error(_) }
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

import express from 'express'
import isBot from 'isbot'
import { r, Link } from './pool'
import cors from 'cors'

import { owo } from './generators/owo'
import { zws } from './generators/zws'

const app = express()
const isUrl = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/

app.use(express.json())

// typ:disable
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
      preventScrape: !!req.body.preventScrape
    }).run()
    if (dbResponse.errors > 0) {
      res.status(500).send('Conflicting IDs')
    } else {
      res.json({
        result: id,
        destination: req.body.link,
        preventScrape: !!req.body.preventScrape
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

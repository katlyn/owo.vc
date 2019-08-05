import express from 'express'
import { r, Link } from './pool'
import { owo } from './generators/owo'

const app = express()
const isUrl = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/

app.use(express.json())

app.post('/generate', async (req, res) => {
  if (req.body && req.body.link && isUrl.test(req.body.link)) {
    const id = owo()
    const dbResponse = await r.table('links').insert({
      destination: req.body.link,
      id
    }).run()
    if (dbResponse.errors > 0) {
      res.status(500).send('Conflicting IDs')
    } else {
      res.json({
        result: id,
        destination: req.body.link
      })
    }
  } else {
    res.status(400).send('Malformed request')
  }
})

app.use(async (req, res) => {
  if (req.method === 'GET') {
    const url = req.hostname + req.path
    console.log(url)
    const linkData = await r.table('links').get(url).run() as Link
    if (linkData) {
      res.redirect(linkData.destination)
    } else {
      res.status(404).send('Not found')
    }
  } else {
    res.status(404).send('Not found')
  }
})

app.listen(80)

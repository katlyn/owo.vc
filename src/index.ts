import 'source-map-support/register'

import express from 'express'
import isBot from 'isbot'
import cors from 'cors'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import { Prisma, PrismaClient } from '@prisma/client'
import { join } from 'path'

import owoify from './owoifier'

import { gay } from './generators/gay'
import { owo } from './generators/owo'
import { zws } from './generators/zws'
import { sketchy } from './generators/sketchy'

const prisma = new PrismaClient()

const app = express()
const isUrl = /(?:https?:\/\/).+\..+/

app.use(express.json())

app.use(cors())
app.options('/generate', cors())

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.post('/generate', async (req, res) => {
  if (typeof req.body.link === 'string' && isUrl.test(req.body.link)) {
    const url = new URL(req.body.link)
    if (['owo.vc', 'owo.gay', '0x6f776f2e7663.net'].find(d => url.hostname.includes(d)) !== void 0) {
      res.status(400).send('Refusing to shorten an already shortened link')
      return
    }
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

        case 'sketchy':
          generator = sketchy
          break

        default:
          res.status(400).send('Invalid generator')
          return
      }
    }
    const id = generator()
    try {
      const dbResponse = await prisma.link.create({
        data: {
          id,
          destination: req.body.link,
          preventScrape: !!(req.body.preventScrape as boolean),
          owoify: !!(req.body.owoify as boolean)
        }
      })
      res.json({
        ...dbResponse,
        result: dbResponse.id
      })
    } catch (e) {
      res.status(500).send({ error: 'Conflicting IDs' })
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          res.status(500).send({ error: 'Conflicting IDs' })
        } else {
          res.status(500).send({ error: 'Uknown Error' })
        }
      }
    }
  } else {
    res.status(400).send('Malformed request')
  }
})

app.get('/info/:url', async (req, res) => {
  if (typeof req.params.url === 'string') {
    const url = decodeURIComponent(req.params.url)
    const linkData = await prisma.link.findUnique({ where: { id: url } })
    if (linkData === null) {
      res.status(404).send({ error: 'link not found' })
      return
    }
    res.json(linkData)
  }
})

const serveStatic = express.static(join(__dirname, '../static'))

app.use(async (req, res, next) => {
  // Serve static files only on owo.vc
  if (req.hostname === process.env.DOMAIN) {
    serveStatic(req, res, next)
  } else {
    next()
  }
})

app.use(async (req, res, next) => {
  if (req.method === 'GET') {
    // TODO: Add some sort of logging or metrics here
    const url = decodeURI(req.hostname + req.path)
    const bot = isBot(req.header('User-Agent'))
    try {
      const linkData = await prisma.link.update({
        where: { id: url },
        data: {
          visits: {
            increment: bot ? 0 : 1
          },
          scrapes: {
            increment: bot ? 1 : 0
          }
        }
      })

      if (linkData.preventScrape && bot) {
        return res.status(200).end()
      } else if (linkData.owoify && bot) {
        // TODO: Move metadata fetching to link creation and cache it
        const page = await fetch(linkData.destination, {
          headers: {
            'User-Agent': `OWObot (https://${process.env.DOMAIN}/)`
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
      return res.redirect(linkData.destination)
    } catch (e) {
      // Beep boop? Boop beep.
    }
  }
  res.status(404).send('404 Not Found u-u')
})

app.listen(80).on('close', async () => {
  await prisma.$disconnect()
})

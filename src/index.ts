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

const prisma = new PrismaClient()

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
    try {
      const dbResponse = await prisma.link.create({
        data: {
          id,
          destination: req.body.link,
          preventScrape: !!(req.body.preventScrape as boolean),
          owoify: !!(req.body.owoify as boolean)
        }
      })
      res.json(dbResponse)
    } catch (e) {
      res.status(500).send({ error: 'Conflicting IDs'})
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

const serveStatic = express.static(join(__dirname, '../static'))
app.use(async (req, res, next) => {
  // Serve static files on owo.vc
  if (req.hostname === '172.18.0.4') {
    serveStatic(req, res, next)
    return
  }

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
            'User-Agent': 'OWObot (https://owo.vc/)'
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

app.listen(80).on('close', () => {
  prisma.$disconnect()
})

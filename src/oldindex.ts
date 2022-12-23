import 'source-map-support/register'

import express from 'express'
import isBot from 'isbot'
import cors from 'cors'
import cheerio from 'cheerio'
import fetch from 'node-fetch'
import { Prisma, PrismaClient, LinkStatus } from '@prisma/client'
import { join } from 'path'

import env from './config/env'

import { owoifyString } from './util/owoifier'

import { gay } from './generators/gay'
import { owo } from './generators/owo'
import { zws } from './generators/zws'
import { sketchy } from './generators/sketchy'

const prisma = new PrismaClient()

const app = express()
const isUrl = /(https?:\/\/).+\..+/

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
          preventScrape: req.body.preventScrape as unknown === true,
          owoify: req.body.owoify as unknown === true
        }
      })
      res.json({
        ...dbResponse,
        result: dbResponse.id
      })
      res.end()

      const reportingRequest = await fetch(env.reportingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            timestamp: dbResponse.createdAt.toISOString(),
            fields: [{
              name: 'ID',
              value: dbResponse.id
            }, {
              name: 'Destination',
              value: dbResponse.destination
            }, {
              name: 'Features',
              value: `${dbResponse.owoify ? 'owoify' : ''} ${dbResponse.preventScrape ? 'preventScrape' : ''}`.trim()
            }],
            footer: {
              text: req.headers['user-agent'] ?? 'No useragent'
            }
          }]
        })
      })
      if (!reportingRequest.ok) {
        console.error('Unable to report link creation', dbResponse, await reportingRequest.text())
      }
    } catch (e) {
      res.status(500).send({ error: 'Conflicting IDs' })
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          res.status(500).send({ error: 'Conflicting IDs' })
        } else {
          res.status(500).send({ error: 'Unknown Error' })
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
    const linkData = await prisma.link.findUnique({
      where: { id: url },
      include: { comment: true }
    })
    if (linkData === null) {
      res.status(404).send({ error: 'link not found' })
      return
    }
    // Obscure destination link if the link is disabled
    if (linkData.status === LinkStatus.DISABLED) {
      linkData.destination = `https://${linkData.id}`
    }
    res.json(linkData)
  }
})

app.post('/disable/:url', async (req, res) => {
  // Check to see fi the request is authorized
  const { authorization } = req.headers
  if (authorization !== `Bearer ${env.adminAuth.reveal()}`) {
    return res.status(401).send('Permission denied').end()
  }
  const url = req.params.url
  const comment = req.body.comment as string | undefined
  const updateData: Parameters<typeof prisma.link.update>[0] = {
    where: {
      id: url
    },
    data: {
      status: LinkStatus.DISABLED
    },
    include: {
      comment: true
    }
  }
  if (comment !== void 0) {
    updateData.data.comment = {
      upsert: {
        create: { text: comment },
        update: { text: comment }
      }
    }
  }
  const linkData = await prisma.link.update(updateData)
  return res.status(200).json(linkData)
})

const serveStatic = express.static(join(__dirname, '../static'))

app.use(async (req, res, next) => {
  // Serve static files only on owo.vc
  if (req.hostname === env.domain) {
    serveStatic(req, res, next)
  } else {
    next()
  }
})

app.get('/robots.txt', (req, res) => {
  res.contentType('txt').send('User-Agent: *\nDisallow: /')
})

app.use(async (req, res) => {
  if (req.method === 'GET') {
    // Don't attempt to service our own scraper
    if (req.header('User-Agent')?.toLowerCase().includes('owobot') ?? false) {
      return res.status(204).end()
    }
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
        },
        include: {
          comment: true
        }
      })

      if (linkData.status === LinkStatus.DISABLED) {
        res.status(410)
        let reply = 'This link is no longer available.'
        if (linkData.comment !== null) {
          reply += `\nOperator comments: ${linkData.comment.text}`
        }
        res.send(reply)
        return res.end()
      }

      if (linkData.preventScrape && bot) {
        return res.status(200).end()
      } else if (linkData.owoify && bot) {
        // TODO: Move metadata fetching to link creation and cache it
        const page = await fetch(linkData.destination, {
          headers: {
            'User-Agent': `OWObot (https://${env.domain}/)`
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
                el.attribs.content = owoifyString(el.attribs.content)
              }
              if (el.attribs.value !== void 0) {
                el.attribs.value = owoifyString(el.attribs.value)
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

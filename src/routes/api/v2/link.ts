import { FastifyInstance } from 'fastify'
import { BadRequest, InternalServerError, NotFound } from 'http-errors'
import { LinkStatus } from '@prisma/client'
import { Static, Type } from '@sinclair/typebox'

import generators from '@/generators'
import prisma from '@/config/prisma'
import { makeLinkReport } from '@/config/reporting'
import { urlRegEx } from '@/config/constants'

interface LinkParams {
  link: string
}

export const GenerateOptions = Type.Object({
  link: Type.RegEx(urlRegEx),
  generator: Type.Union([
    Type.Literal('owo'),
    Type.Literal('gay'),
    Type.Literal('zws'),
    Type.Literal('sketchy')
  ]),
  preventScrape: Type.Boolean({ default: false }),
  owoify: Type.Boolean({ default: false })
})

export type GenerateOptionsType = Static<typeof GenerateOptions>

async function link (fastify: FastifyInstance): Promise<void> {
  // POST request to /link, generate a new shortened link
  fastify.post<{ Body: GenerateOptionsType }>('/', {
    schema: {
      body: GenerateOptions
    }
  }, async (request) => {
    const options = request.body

    const url = new URL(options.link)
    if (['owo.vc', 'owo.gay', '0x6f776f2e7663.net'].find(d => url.hostname.includes(d)) !== void 0) {
      throw new BadRequest('Refusing to recursively shorten link')
    }

    const id = generators[options.generator]()

    try {
      const dbResponse = await prisma.link.create({
        data: {
          id,
          destination: options.link,
          preventScrape: options.preventScrape,
          owoify: options.owoify
        }
      })
      // Report the link creation, discard any errors
      void makeLinkReport(dbResponse, request.headers['user-agent'])
      return dbResponse
    } catch (e) {
      console.error(e)
      throw new InternalServerError('Unable to complete the request.')
    }
  })

  // GET request to /link/:url, return information on the provided link
  fastify.get<{ Params: LinkParams }>('/:link', async (request) => {
    const linkData = await prisma.link.findUnique({
      where: {
        id: request.params.link
      },
      include: {
        comment: true
      }
    })

    if (linkData === null) {
      throw new NotFound('link not found')
    }

    // If the link has been disabled, obscure the original destination link
    if (linkData.status === LinkStatus.DISABLED) {
      linkData.destination = `https://${linkData.id}`
    }
    return linkData
  })
}

export default link

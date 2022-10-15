import { FastifyInstance } from 'fastify'
import { Static, Type } from '@sinclair/typebox'
import { BadRequest, InternalServerError } from 'http-errors'

import generators from '@/generators'
import { urlRegEx } from '@/config/constants'
import prisma from '@/config/prisma'
import { makeLinkReport } from '@/config/reporting'

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

async function generate (fastify: FastifyInstance): Promise<void> {
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
      void makeLinkReport(dbResponse, request.headers['user-agent'])
      return dbResponse
    } catch (e) {
      console.error(e)
      throw new InternalServerError('Unable to complete the request.')
    }
  })
}

export default generate

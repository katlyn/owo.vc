import { LinkStatus } from "@prisma/client"
import { Static, Type } from "@sinclair/typebox"
import { FastifyInstance } from "fastify"
import { NotFound, Unauthorized } from "http-errors"

import env from "@/config/env"
import prisma from "@/config/prisma"
import { makeLinkReport } from "@/config/reporting"
import { urlRegEx } from "@/util/constants"
import shorten from "@/util/shorten"

interface LinkParams {
  link: string
}

export const GenerateOptions = Type.Object({
  link: Type.RegEx(urlRegEx),
  generator: Type.Union([
    Type.Literal("owo"),
    Type.Literal("gay"),
    Type.Literal("zws"),
    Type.Literal("sketchy")
  ]),
  preventScrape: Type.Boolean({ default: false }),
  owoify: Type.Boolean({ default: false })
})

export const DisableOptions = Type.Object({
  comment: Type.Optional(Type.String())
})

export type GenerateOptionsType = Static<typeof GenerateOptions>
export type DisableOptionsType = Static<typeof DisableOptions>

async function link (fastify: FastifyInstance): Promise<void> {
  // POST request to /link, generate a new shortened link
  fastify.post<{ Body: GenerateOptionsType }>("/", {
    schema: {
      body: GenerateOptions
    }
  }, async request => {
    const options = request.body
    const dbResponse = await shorten(options)

    // Report the link creation, discard any errors
    void makeLinkReport(dbResponse, request.headers["user-agent"])

    return dbResponse
  })

  // GET request to /link/:link, return information on the provided link
  fastify.get<{ Params: LinkParams }>("/:link", async request => {
    const linkData = await prisma.link.findUnique({
      where: {
        id: request.params.link
      },
      include: {
        comment: true
      }
    })

    if (linkData === null) {
      throw new NotFound("link not found")
    }

    // If the link has been disabled, obscure the original destination link
    if (linkData.status === LinkStatus.DISABLED) {
      linkData.destination = `https://${linkData.id}`
    }
    return linkData
  })

  // PATCH request to /link/:link, allows administrators to disable links
  // This will probably be extended with more functionality in the future
  fastify.patch<{ Params: LinkParams, Body: DisableOptionsType }>("/:link", {
    preParsing: async request => {
      const { authorization } = request.headers
      if (authorization !== `Bearer ${env.adminAuth.reveal()}`) {
        throw new Unauthorized()
      }
    },
    schema: {
      body: DisableOptions
    }
  }, async request => {

    const updateData: Parameters<typeof prisma.link.update>[0] = {
      where: {
        id: request.params.link
      },
      data: {
        // TODO: Allow re-enabling disabled links
        status: LinkStatus.DISABLED
      },
      include: {
        comment: true
      }
    }

    if (request.body.comment !== void 0) {
      const { comment } = request.body
      updateData.data.comment = {
        upsert: {
          create: { text: comment },
          update: { text: comment }
        }
      }
    }

    return await prisma.link.update(updateData)
  })
}

export default link

import cors from "@fastify/cors"
import { LinkStatus, MetadataHandling } from "@prisma/client"
import { Static, Type } from "@sinclair/typebox"
import { FastifyInstance } from "fastify"
import { NotFound } from "http-errors"

import prisma from "@/config/prisma"
import { makeLinkReport } from "@/config/reporting"
import { urlRegEx } from "@/util/constants"
import shorten from "@/util/shorten"

// This file contains code to enable backwards compatibility with the original API for owo.vc. This API is deprecated
// and will likely be removed in a future version.
// Note: The disable API is not included in this implementation as it is not intended to be used by the public.

interface LinkParams {
  link: string
}

const GenerateOptions = Type.Object({
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

type GenerateOptionsType = Static<typeof GenerateOptions>

async function backcompat (fastify: FastifyInstance): Promise<void> {
  void fastify.register(cors)

  fastify.post<{ Body: GenerateOptionsType }>("/generate", {
    schema: {
      body: GenerateOptions
    }
  }, async request => {

    const options = request.body
    const dbResponse = await shorten({
      ...options,
      metadata: options.preventScrape ? MetadataHandling.IGNORE : options.owoify ? MetadataHandling.OWOIFY : MetadataHandling.PROXY
    })

    // Report the link creation, discard any errors
    void makeLinkReport(dbResponse, request.headers["user-agent"], "backcompat")

    return {
      ...dbResponse,
      result: dbResponse.id,
      owoify: dbResponse.metadata === MetadataHandling.OWOIFY,
      preventScrape: dbResponse.metadata === MetadataHandling.IGNORE
    }
  })

  fastify.get<{ Params: LinkParams }>("/info/:link", async (request, reply) => {
    const linkData = await prisma.link.findUnique({
      where: {
        id: request.params.link
      }
    })
    if (linkData == null) {
      throw new NotFound("link not found")
    }
    if (linkData.status === LinkStatus.DISABLED) {
      linkData.destination = `https://${linkData.id}`
    }
    return {
      ...linkData,
      owoify: linkData.metadata === MetadataHandling.OWOIFY,
      preventScrape: linkData.metadata === MetadataHandling.IGNORE
    }
  })
}

export default backcompat

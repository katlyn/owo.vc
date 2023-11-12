import { LinkStatus, ShortenMethods } from "@prisma/client"
import { BadRequest, InternalServerError } from "http-errors"

import prisma from "@/config/prisma"
import generators from "@/generators"
import { GenerateOptionsType } from "@/routes/api/v2/link"

const methodToEnum: Record<GenerateOptionsType["generator"], ShortenMethods> = {
  owo: ShortenMethods.OWO_VC,
  zws: ShortenMethods.ZWS,
  gay: ShortenMethods.GAY,
  sketchy: ShortenMethods.SKETCHY
}

const shorten = async (options: GenerateOptionsType) => {
  const url = new URL(options.link)
  if ([ "owo.vc", "owo.gay", "0x6f776f2e7663.net" ].find(d => url.hostname.includes(d)) !== void 0) {
    throw new BadRequest("Refusing to recursively shorten link")
  }

  // Check to see if the link has been shortened recently or is disabled
  const existing = await prisma.link.findFirst({
    where: {
      OR: [
        {
          createdAt: {
            // Created in the last five minutes
            gte: new Date(Date.now() - 5 * 60 * 1e3)
          }
        },
        {
          status: LinkStatus.DISABLED
        }
      ],
      AND: {
        destination: options.link,
        method: methodToEnum[options.generator]
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  if (existing != null) {
    return existing
  }

  const id = generators[options.generator]()

  try {
    return await prisma.link.create({
      data: {
        id,
        destination: options.link,
        method: methodToEnum[options.generator],
        metadata: options.metadata
      }
    })
  } catch (e) {
    console.error(e)
    throw new InternalServerError("Unable to complete the request.")
  }
}

export default shorten

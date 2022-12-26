import { BadRequest, InternalServerError } from "http-errors"

import prisma from "@/config/prisma"
import generators from "@/generators"
import { GenerateOptionsType } from "@/routes/api/v2/link"

const shorten = async (options: GenerateOptionsType) => {

  const url = new URL(options.link)
  if ([ "owo.vc", "owo.gay", "0x6f776f2e7663.net" ].find(d => url.hostname.includes(d)) !== void 0) {
    throw new BadRequest("Refusing to recursively shorten link")
  }

  const id = generators[options.generator]()

  try {
    return await prisma.link.create({
      data: {
        id,
        destination: options.link,
        preventScrape: options.preventScrape,
        owoify: options.owoify
      }
    })
  } catch (e) {
    console.error(e)
    throw new InternalServerError("Unable to complete the request.")
  }
}

export default shorten

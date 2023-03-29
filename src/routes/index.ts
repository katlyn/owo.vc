import { fastifyStatic } from "@fastify/static"
import { LinkStatus } from "@prisma/client"
import { FastifyInstance } from "fastify"
import { Gone, NotFound } from "http-errors"
import isbot from "isbot"
import * as path from "path"

import prisma from "@/config/prisma"
import backcompat from "@/routes/backcompat"

import api from "./api"

async function routes (fastify: FastifyInstance): Promise<void> {
  await fastify.register(api, { prefix: "/api" })
  void fastify.register(backcompat)

  // Handle static files
  void fastify.register(fastifyStatic, {
    root: path.join(__dirname, "../../static"),
    wildcard: false
  })

  fastify.get("*", async (request, reply) => {
    const url = `${request.hostname}${request.url}`
    const bot = isbot(request.headers["User-Agent"])
    const linkData = await prisma.link.update({
      where: {
        id: url
      },
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

    if (linkData === null) {
      throw new NotFound("Link not found")
    }

    if (linkData.status === LinkStatus.DISABLED) {
      let reply = "This link is no longer available."
      if (linkData.comment !== null) {
        reply += `\nOperator comments: ${linkData.comment.text}`
      }
      throw new Gone(reply)

    }

    void reply.redirect(linkData.destination)
  })
}

export default routes

import { fastifyStatic } from "@fastify/static"
import { LinkStatus, MetadataHandling, Prisma } from "@prisma/client"
import { FastifyInstance } from "fastify"
import { Gone, InternalServerError, isHttpError, NotFound } from "http-errors"
import isBot from "isbot"
import * as path from "path"

import prisma from "@/config/prisma"
import backcompat from "@/routes/backcompat"
import { owoifyMetadata } from "@/util/owoifier"

import api from "./api"

async function routes (fastify: FastifyInstance): Promise<void> {
  await fastify.register(api, { prefix: "/api" })
  void fastify.register(backcompat)

  // Handle static files
  void fastify.register(fastifyStatic, {
    root: path.join(__dirname, "../../static"),
    wildcard: false
  })

  fastify.get("*", async (request, reply): Promise<void | string> => {
    // We need to manually decode this as fastify only decodes path parameters automatically
    const decodedPath = decodeURIComponent(request.url)
    const url = `${request.hostname}${decodedPath}`
    const bot = isBot(request.headers["user-agent"])

    try {
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

      if (linkData.status === LinkStatus.DISABLED) {
        let reply = "This link is no longer available."
        if (linkData.comment !== null) {
          reply += ` Operator comments: ${linkData.comment.text}`
        }
        throw new Gone(reply)
      }

      if (bot) {
        switch (linkData.metadata) {
          case MetadataHandling.OWOIFY: {
            const owoified = await owoifyMetadata(linkData.destination)
            if (owoified != null) {
              reply.type("text/html")
              return owoified
            }
            break
          }
          case MetadataHandling.IGNORE: {
            reply.status(204)
            return
          }
        }
      }

      void reply.redirect(linkData.destination)
    } catch (e) {
      if (isHttpError(e)) {
        throw e
      } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025") {
          throw new NotFound("Link not found")
        } else {
          console.error(e)
          throw new InternalServerError("Unknown database error")
        }
      }
      console.error(e)
      throw new InternalServerError()
    }
  })
}

export default routes

import { fastifyStatic } from "@fastify/static"
import { FastifyInstance } from "fastify"
import { NotFound } from "http-errors"
import * as path from "path"

import prisma from "@/config/prisma"
import backcompat from "@/routes/backcompat"

import api from "./api"

async function routes(fastify: FastifyInstance): Promise<void> {
  void fastify.register(api, { prefix: "/api" })
  void fastify.register(backcompat)

  console.log(path.join(__dirname, "../../static"))
  // Handle static files
  void fastify.register(fastifyStatic, {
    root: path.join(__dirname, "../../static"),
    wildcard: false
  })

  fastify.get("*", async (request, reply) => {
    const url = `${request.hostname}${request.url}`
    const linkData = await prisma.link.findUnique({
      where: {
        id: url
      }
    })

    if (linkData === null) {
      throw new NotFound("Link not found")
    }

    void reply.redirect(linkData.destination)
  })
}

export default routes

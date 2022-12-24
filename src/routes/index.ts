import { FastifyInstance } from "fastify"
import { NotFound } from "http-errors"

import prisma from "@/config/prisma"

import api from "./api"

async function routes (fastify: FastifyInstance): Promise<void> {
  void fastify.register(api, { prefix: "/api" })

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

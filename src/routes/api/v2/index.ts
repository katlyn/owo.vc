import { FastifyInstance } from "fastify"
import { Forbidden } from "http-errors"

import env from "@/config/env"
import link from "@/routes/api/v2/link"

async function v2 (fastify: FastifyInstance): Promise<void> {
  fastify.addHook("onRequest", (request, reply, done) => {
    if (request.hostname !== env.domain) {
      throw new Forbidden()
    }
    console.log(request.hostname)
    done()
  })

  void fastify.register(link, { prefix: "/link" })
}

export default v2

import { FastifyInstance } from "fastify"

import link from "@/routes/api/v2/link"
import { ServiceUnavailable } from "http-errors"

async function v2 (fastify: FastifyInstance): Promise<void> {
  fastify.all("*", async () => {
    throw new ServiceUnavailable("Service temporarily unavailable due to extended maintenance.")
  })
  // void fastify.register(link, { prefix: "/link" })
}

export default v2

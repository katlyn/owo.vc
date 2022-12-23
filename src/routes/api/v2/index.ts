import { FastifyInstance } from "fastify"

import link from "@/routes/api/v2/link"

async function v2 (fastify: FastifyInstance): Promise<void> {
  await fastify.register(link, { prefix: "/link" })
}

export default v2

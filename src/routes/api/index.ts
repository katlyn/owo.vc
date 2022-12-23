import { FastifyInstance } from "fastify"

import v2 from "./v2"

async function api (fastify: FastifyInstance): Promise<void> {
  await fastify.register(v2, { prefix: "/v2" })
}

export default api

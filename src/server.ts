import fastify from "fastify"

import routes from "./routes"

export default function build (opts = {}): ReturnType<typeof fastify> {
  const server = fastify(opts)

  void server.register(routes, {})

  return server
}

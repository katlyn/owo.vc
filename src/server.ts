import fastify from 'fastify'
import { join } from 'path'
import routes from './routes'

export default function build (opts = {}): ReturnType<typeof fastify> {
  const server = fastify(opts)

  void server.register(routes, {
    dir: join(__dirname, 'routes')
  })

  return server
}

import { FastifyInstance } from 'fastify'
import generate from './generate'
import link from '@/routes/api/v2/link'

async function v2 (fastify: FastifyInstance): Promise<void> {
  // TODO: /generate should be post on /link
  void fastify.register(generate, { prefix: '/generate' })
  void fastify.register(link, { prefix: '/link' })
}

export default v2

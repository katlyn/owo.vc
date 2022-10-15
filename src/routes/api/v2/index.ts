import { FastifyInstance } from 'fastify'
import generate from './generate'

async function v2 (fastify: FastifyInstance): Promise<void> {
  void fastify.register(generate, { prefix: '/generate' })
}

export default v2

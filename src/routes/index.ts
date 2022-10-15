import { FastifyInstance } from 'fastify'
import api from './api'

async function routes (fastify: FastifyInstance): Promise<void> {
  void fastify.register(api, { prefix: '/api' })
}

export default routes

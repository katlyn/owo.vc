import { FastifyInstance } from 'fastify'
import prisma from '@/config/prisma'
import { NotFound } from 'http-errors'
import { LinkStatus } from '@prisma/client'

interface LinkParams {
  link: string
}

async function link (fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Params: LinkParams }>('/:link', async (request) => {
    const linkData = await prisma.link.findUnique({
      where: {
        id: request.params.link
      },
      include: {
        comment: true
      }
    })
    if (linkData === null) {
      throw new NotFound('link not found')
    }
    if (linkData.status === LinkStatus.DISABLED) {
      linkData.destination = `https://${linkData.id}`
    }
    return linkData
  })
}

export default link

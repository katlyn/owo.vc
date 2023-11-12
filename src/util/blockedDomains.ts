import prisma from "@/config/prisma"
import { BadRequest } from "http-errors"
import { BlockedDomain } from "@prisma/client"

export async function getDomainBlock (url: URL): Promise<BlockedDomain | null> {
  // Check to see if the destination domain is blocked
  const domainParts = url.hostname.split(".").reduceRight((prev, current) => {
    if (prev.length === 0) {
      return [current]
    }
    return [...prev, `${current}.${prev[prev.length - 1]}`]
  }, <string[]>[])
  return prisma.blockedDomain.findFirst({
    where: {
      domain: { in: domainParts }
    }
  })
}

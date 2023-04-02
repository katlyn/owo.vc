import env from "@/config/env"
import prisma from "@/config/prisma"
import redis from "@/config/redis"

import build from "./server"

const envToLogger: Record<string, boolean | object> = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true
}

const server = build({
  logger: envToLogger[env.nodeEnv] ?? true
})

server.listen({
  host: "0.0.0.0",
  port: env.port
}, (err, address) => {
  if (err !== null) {
    server.log.error(err)
    process.exit(1)
  }
  server.log.info(`Listening on ${address}`)
})

let isShuttingDown = false

async function shutdown () {
  if (isShuttingDown) {
    console.log("Exiting forcefully")
    process.exit(1)
  }
  console.log("Shutting down...")
  isShuttingDown = true

  server.close()
  await Promise.all([ prisma.$disconnect(), redis.quit() ])
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

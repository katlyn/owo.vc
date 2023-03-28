import env from "@/config/env"

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

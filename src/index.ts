import env from "@/config/env"

import build from "./server"

const server = build({
  logger: {
    level: "info"
  }
})

const port = isNaN(env.port) ? 80 : env.port
server.listen(port, "0.0.0.0", (err, address) => {
  if (err !== null) {
    server.log.error(err)
    process.exit(1)
  }
  server.log.info(`Listening on ${address}`)
})

import Redis from "ioredis"

import env from "@/config/env"

const client = new Redis(env.redis)
export default client

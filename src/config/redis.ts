import { createClient } from "redis"

import env from "@/config/env"

const client = createClient({ url: env.redis })

export default client

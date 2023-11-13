import { secret, strictVerify, transform } from "env-verifier"

const defaults: Record<string, string> = {
  HTTP_PORT: "8080",
  HTTP_HOST: "0.0.0.0",
  HTTP_TRUST_PROXY: "false",
  DOMAIN: "owo.vc",
  NODE_ENV: "development"
}

const config = {
  domain: "DOMAIN",
  database: secret("DATABASE_URL"),
  adminAuth: secret("ADMIN_AUTH"),
  reportingUrl: "REPORTING_URL",
  redis: "REDIS_URL",
  port: transform("HTTP_PORT", Number),
  nodeEnv: "NODE_ENV",
  trustProxy: transform("HTTP_TRUST_PROXY", v => {
    if (v.toLowerCase() === "true") {
      return true
    }
    const parsed = Number(v)
    if (!isNaN(parsed)) {
      return parsed
    }
    if (v.includes(".") || v.includes(":")) {
      return v.split(",").map(s => s.trim())
    }
    return false
  })
}

const env = strictVerify<typeof config>(config, { ...defaults, ...process.env })

export default env

import { secret, strictVerify, transform } from "env-verifier"

const defaults: Record<string, string> = {
  HTTP_PORT: "8080",
  HTTP_HOST: "0.0.0.0",
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
  nodeEnv: "NODE_ENV"
}

const env = strictVerify<typeof config>(config, { ...defaults, ...process.env })

export default env

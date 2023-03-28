import { secret, strictVerify, transform } from "env-verifier"

const defaults: Record<string, string> = {
  HTTP_PORT: "8080",
  HTTP_HOST: "0.0.0.0",
  DOMAIN: "https://owo.vc",
  NODE_ENV: "development"
}

const config = {
  domain: "DOMAIN",
  database: secret("DATABASE_URL"),
  adminAuth: secret("ADMIN_AUTH"),
  reportingUrl: "REPORTING_URL",
  port: transform("PORT", Number),
  nodeEnv: "NODE_ENV"
}

const env = strictVerify<typeof config>(config, { ...defaults, ...process.env })

export default env

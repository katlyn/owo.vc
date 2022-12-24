import { secret, strictVerify, transform } from "env-verifier"

const config = {
  domain: "DOMAIN",
  database: secret("DATABASE_URL"),
  adminAuth: secret("ADMIN_AUTH"),
  reportingUrl: "REPORTING_URL",
  port: transform("PORT", Number),
  nodeEnv: "NODE_ENV"
}

const env = strictVerify<typeof config>(config)

export default env

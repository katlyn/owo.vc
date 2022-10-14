import { secret, strictVerify } from 'env-verifier'

const config = {
  domain: 'DOMAIN',
  database: secret('DATABASE_URL'),
  adminAuth: secret('ADMIN_AUTH'),
  reportingUrl: 'REPORTING_URL'
}

const env = strictVerify<typeof config>(config)

export default env

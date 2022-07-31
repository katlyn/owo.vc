import { randomBytes } from 'crypto'

const urlParts = [
  'cgi-bin', 'store', 'bank-login', 'password', 'hidden', 'grab', 'account',
  'google.com', 'discord.gg', 'facebook.com', 'twitter.com', 'spotify.com'
]

export const sketchy = (): string => {
  const rand = randomBytes(32).toString('base64url')
  const directories = [...randomBytes(2)].map(v => urlParts[v % urlParts.length])
  if (directories[0] === directories[1]) {
    directories[1] = 'bypass'
  }
  return '0x6f776f2e7663.net/' + directories.join('/') + '/' + rand
}

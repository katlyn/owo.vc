import { randomBytes } from 'crypto'

const zwChars = [
  '\u200B',
  '\u200D',
  '\u2060',
  '\u180E'
]

// Cap every link with this so it won't get trimmed out of messages
const zwc = '\u200B'

export const zws = (): string => {
  return 'owo.vc/' + [...randomBytes(32)].reduce((prev, curr) => prev + zwChars[curr % zwChars.length], '') + zwc
}

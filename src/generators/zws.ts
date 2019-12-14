import { randomBytes } from 'crypto'

const zwChars = [
  '\u200b', // Zero-width space
  '\u200c', // Zero-width non-joiner
  '\u2060', // Zero-width word joiner
  '\ufeff'  // Zero-width no-break space
]

// Cap every link with this so it won't get trimmed out of messages
const zwc = '\u200b'

export const zws = () => {
  return 'owo.vc/' + [...randomBytes(32)].reduce((prev, curr) => prev + zwChars[curr % zwChars.length], '') + zwc
}

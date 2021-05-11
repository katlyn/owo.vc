export const owos = [
  'owo', 'Owo', 'OwO', 'owO',
  'uwu', 'Uwu', 'UwU', 'uwU',
  '^~^', 'uwo', 'owu', 'òwó',
  'ùwú', 'ówò', 'úwù', 'o~o'
]

export default (s: string): string => {
  return s.replace(/(?:r|l)/g, 'w')
    .replace(/(?:R|L)/g, 'W')
    .replace(/n([aeiou])/g, 'ny$1')
    .replace(/N([aeiou])/g, 'Ny$1')
    .replace(/ove/g, 'uv')
    .replace(/!+/g, ' ' + owos[Math.floor(Math.random() * owos.length)] + ' ') +
    ' ' + owos[Math.floor(Math.random() * owos.length)]
}

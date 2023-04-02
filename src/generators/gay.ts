import { randomBytes } from "crypto"

const gays = [
  "LGBT", "lgbt",
  "gay", "homosexual",
  "lesbian",
  "bi", "bisexual",
  "ace", "asexual",
  "aro", "aromantic",
  "trans", "transgender", "enby", "nonbinary",
  "pan", "pansexual",
  "poly",
  "proud"
]

const subdomains = [ ...new Set(gays.map(w => w.toLocaleLowerCase())) ]

const dividers = [ "-", "_", "/", "." ]

export const gay = (): string => {
  const random = [ ...randomBytes(12) ]
  let id = subdomains[+random[0] % subdomains.length]
  id += ".owo.gay/"
  id += gays[+random[1] % gays.length]
  id += dividers[+random[2] % dividers.length]
  id += gays[+random[3] % gays.length]
  id += dividers[+random[4] % dividers.length]
  id += gays[+random[5] % gays.length]
  id += dividers[+random[6] % dividers.length]
  id += gays[+random[7] % gays.length]
  id += dividers[+random[8] % dividers.length]
  id += gays[+random[9] % gays.length]
  id += dividers[+random[10] % dividers.length]
  id += gays[+random[11] % gays.length]
  return id
}

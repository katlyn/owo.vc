import { randomBytes } from "crypto"

const owos = [
  "owo", "Owo", "OwO", "owO", "oWo", "OWO",
  "uwu", "Uwu", "UwU", "uwU", "uWu", "UWU",
  "ovo", "Ovo", "OvO", "ovO", "oVo", "oVo",
  "uvu", "Uvu", "UvU", "uvU", "uVu", "UVU"
]

const subdomains = [ "owo", "uwu", "ovo", "uvu" ]

const dividers = [ "-", "_", "/", "." ]

export const owo = (): string => {
  const random = [ ...randomBytes(8) ]
  let id = subdomains[+random[0] % subdomains.length]
  id += ".owo.vc/"
  id += owos[+random[1] % owos.length]
  id += dividers[+random[2] % dividers.length]
  id += owos[+random[3] % owos.length]
  id += dividers[+random[4] % dividers.length]
  id += owos[+random[5] % owos.length]
  id += dividers[+random[6] % dividers.length]
  id += owos[+random[7] % owos.length]
  return id
}

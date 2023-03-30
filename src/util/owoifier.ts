import cheerio from "cheerio"

import env from "@/config/env"
import redis from "@/config/redis"

export const owos = [
  "owo", "Owo", "OwO", "owO",
  "uwu", "Uwu", "UwU", "uwU",
  "^~^", "uwo", "owu", "òwó",
  "ùwú", "ówò", "úwù", "o~o"
]

export function owoifyString (s: string): string {
  return s.replace(/([rl])/g, "w")
    .replace(/([RL])/g, "W")
    .replace(/n([aeiou])/g, "ny$1")
    .replace(/N([aeiou])/g, "Ny$1")
    .replace(/ove/g, "uv")
    .replace(/!+/g, " " + owos[Math.floor(Math.random() * owos.length)] + " ") +
    " " + owos[Math.floor(Math.random() * owos.length)]
}

/**
 * Scrapes the given url and returns the owoified page metadata.
 * @param url
 */
export async function owoifyMetadata (url: string): Promise<string | null> {
  // Check if the metadata is cached
  const cached = await redis.get(`metacache:${url}`)
  if (cached != null) {
    return cached
  }

  // Fetch and owoify the metadata
  const page = await fetch(url, {
    headers: {
      "User-Agent": `OWObot (https://${env.domain})`
    }
  })
  if (page.ok) {
    // Check if the page is HTML based
    const contentType = page.headers.get("content-type") ?? ""
    if (!contentType.includes("text/html")) {
      return null
    }

    const $ = cheerio.load(await page.text())
    const metaTags = $("meta")

    // These are the tags that will be copied to the owoified output
    const owodTags = [
      "og:title",
      "og:site_name",
      "og:description",
      "description",
      "twitter:title",
      "twitter:description"
    ]

    for (const meta of metaTags) {
      const tag = meta.attribs.property ?? meta.attribs.name ?? meta.tagName
      if (owodTags.includes(tag)) {
        if (meta.attribs.content !== void 0) {
          meta.attribs.content = owoifyString(meta.attribs.content)
        } else if (meta.attribs.value !== void 0) {
          meta.attribs.value = owoifyString(meta.attribs.value)
        }
      }
    }

    const result = `<html><head>${cheerio.html(metaTags)}</head><body></body></html>`

    // Cache the result for future use
    await redis.set(`metacache:${url}`, result, "EX", 10 * 60) // Expire after ten minutes

    return result
  }
  return null
}

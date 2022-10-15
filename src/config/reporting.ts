import env from '@/config/env'
import fetch from 'node-fetch'
import { Link } from '@prisma/client'

async function makeReportingRequest (body: object): Promise<boolean> {
  const req = await fetch(env.reportingUrl, {
    method: 'POST',
    body: JSON.stringify(body)
  })

  if (!req.ok) {
    console.error('Unable to report link creation', body, await req.text())
  }

  return req.ok
}

export async function makeLinkReport (link: Link, useragent?: string): ReturnType<typeof makeReportingRequest> {
  return await makeReportingRequest({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        timestamp: link.createdAt.toISOString(),
        fields: [{
          name: 'ID',
          value: link.id
        }, {
          name: 'Destination',
          value: link.destination
        }, {
          name: 'Features',
          value: `${link.owoify ? 'owoify' : ''} ${link.preventScrape ? 'preventScrape' : ''}`.trim()
        }],
        footer: {
          text: useragent ?? 'No useragent'
        }
      }]
    })
  })
}

export default makeReportingRequest

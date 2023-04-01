import { Link } from "@prisma/client"

import env from "@/config/env"

async function makeReportingRequest (body: object): Promise<boolean> {
  const req = await fetch(env.reportingUrl, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })

  if (!req.ok) {
    console.error("Unable to report link creation", body, await req.text())
  }

  return req.ok
}

export async function makeLinkReport (link: Link, useragent?: string): ReturnType<typeof makeReportingRequest> {
  return await makeReportingRequest({
    embeds: [
      {
        timestamp: link.createdAt.toISOString(),
        fields: [
          {
            name: "ID",
            value: link.id
          }, {
            name: "Destination",
            value: link.destination
          }, {
            name: "Metadata",
            value: link.metadata
          }
        ],
        footer: {
          text: useragent ?? "No useragent"
        }
      }
    ]
  })
}

export default makeReportingRequest

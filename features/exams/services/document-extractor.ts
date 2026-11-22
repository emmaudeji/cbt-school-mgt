
import "server-only"

import mammoth from "mammoth"
import * as cheerio from "cheerio"

export type DocumentExtraction = {
  text: string
  warnings: string[]
}

export async function extractDocxText(
  buffer: Buffer
): Promise<DocumentExtraction> {
  const result = await mammoth.convertToHtml({ buffer })
  const $ = cheerio.load(result.value)

  const lines: string[] = []
  let images = 0

  $("br").replaceWith("\n")

  $("img").each((_, img) => {
    images++
    $(img).replaceWith(" [Image omitted] ")
  })

  const process = (element: any) => {
    const tag = element.tagName?.toLowerCase()

    if (tag === "table") {
      lines.push("[TABLE]")

      $(element)
        .find("tr")
        .each((_, row) => {
          const cells = $(row)
            .children("td, th")
            .map((_, cell) =>
              $(cell)
                .text()
                .replace(/\s+/g, " ")
                .trim()
            )
            .get()

          lines.push(cells.join(" | "))
        })

      lines.push("[/TABLE]", "")
    } else if (tag === "ul" || tag === "ol") {
      $(element)
        .children("li")
        .each((_, li) => {
          const content = $(li)
            .clone()
            .children("ul,ol")
            .remove()
            .end()
            .text()
            .trim()

          lines.push(`• ${content}`)

          $(li)
            .children("ul,ol")
            .each((_, child) => process(child))
        })

      lines.push("")
    } else if (
      ["p", "h1", "h2", "h3", "h4", "h5", "h6", "pre"]
        .includes(tag)
    ) {
      lines.push($(element).text().trim(), "")
    } else {
      $(element)
        .children()
        .each((_, child) => process(child))
    }
  }

  $("body")
    .children()
    .each((_, child) => process(child))

  return {
    text: lines.join("\n"),
    warnings: [
      ...result.messages.map(
        (message) => message.message
      ),
      ...(images
        ? [
            `${images} embedded image(s) need separate handling.`,
          ]
        : []),
    ],
  }
}

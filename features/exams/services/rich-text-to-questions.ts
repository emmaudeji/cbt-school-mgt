
/**
 * Converts ReactQuill HTML into plain text suitable
 * for the existing CBT question extraction service.
 *
 * Must run in the browser because it uses DOMParser.
 */
export function richTextToQuestionText(html: string): string {
  if (!html.trim()) return ""

  const document = new DOMParser().parseFromString(
    html,
    "text/html"
  )

  let output = ""

  const append = (text: string) => {
    output += text
  }

  const newLine = () => {
    if (!output.endsWith("\n")) {
      output += "\n"
    }
  }

  const isBlock = (tag: string) =>
    [
      "P",
      "DIV",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "BLOCKQUOTE",
      "PRE",
    ].includes(tag)

  const hasPrefix = (text: string) =>
    /^(?:\d+|[A-Da-d])[.)]\s+/.test(text)

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      append(node.textContent ?? "")
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return
    }

    const element = node as HTMLElement
    const tag = element.tagName

    if (tag === "SCRIPT" || tag === "STYLE") {
      return
    }

    if (tag === "BR") {
      append("\n")
      return
    }

    if (tag === "OL" || tag === "UL") {
      newLine()

      let number = 0

      for (const child of Array.from(element.children)) {
        if (child.tagName !== "LI") continue

        const item = child as HTMLElement
        const listType =
          item.getAttribute("data-list") ??
          (tag === "OL" ? "ordered" : "bullet")

        const content = item.textContent?.trim() ?? ""

        if (!content) {
          newLine()
          continue
        }

        // Quill uses data-list attributes for its
        // ordered and bullet list formatting.
        let prefix = ""

        if (listType === "ordered") {
          number += 1
          prefix = `${number}. `
        } else if (listType === "bullet") {
          prefix = "- "
        }

        // Do not duplicate manually typed prefixes
        // such as "1." or "A.".
        if (!hasPrefix(content)) {
          append(prefix)
        }

        append(content)
        newLine()
      }

      return
    }

    if (isBlock(tag)) {
      newLine()
    }

    for (const child of Array.from(element.childNodes)) {
      walk(child)
    }

    if (isBlock(tag)) {
      newLine()
    }
  }

  for (const node of Array.from(document.body.childNodes)) {
    walk(node)
  }

  return output
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(line => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

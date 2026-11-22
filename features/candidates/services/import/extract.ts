// Extractors never infer field meaning or modify names. Formatter handles interpretation.
import type { ExtractedDocument, ExtractedRow } from "./types"

const MAX_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 500

function assertFile(file: File) {
  if (file.size > MAX_BYTES) throw new Error("Choose a file smaller than 5 MB.")
  if (!file.size) throw new Error("The uploaded file is empty.")
}

export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  let closedQuote = false
  const input = text.replace(/^\uFEFF/, "")
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++ }
      else if (quoted) { quoted = false; closedQuote = true }
      else if (!cell.trim() && !closedQuote) quoted = true
      else throw new Error(`Unexpected quotation mark near character ${i + 1}`)
    } else if (!quoted && ch === delimiter) {
      row.push(cell.trim()); cell = ""; closedQuote = false
    } else if (!quoted && (ch === "\n" || ch === "\r")) {
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row)
      row = []; cell = ""; closedQuote = false
      if (ch === "\r" && input[i + 1] === "\n") i++
    } else {
      if (!quoted && closedQuote && ch.trim()) throw new Error("Unexpected text after a closing quote")
      cell += ch
    }
  }
  if (quoted) throw new Error("An enclosed value is missing a closing quotation mark")
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function detectDelimiter(text: string) {
  const first = text.split(/\r?\n/).filter(line => line.trim()).slice(0, 5)
  const choices = [",", "\t", ";", "|"]
  return choices.sort((a, b) => first.reduce((n, x) => n + x.split(b).length - 1, 0) - first.reduce((n, x) => n + x.split(a).length - 1, 0))[0]
}

function toDocument(matrix: string[][], source: string, warnings: string[] = []): ExtractedDocument {
  const rows: ExtractedRow[] = matrix.filter(row => row.some(cell => cell.trim())).slice(0, MAX_ROWS + 1).map((cells, i) => ({ cells, sourceLine: i + 1 }))
  if (rows.length > MAX_ROWS) throw new Error(`Too many rows. Maximum ${MAX_ROWS}; split your file.`)
  return { headers: null, rows, warnings, source }
}

async function readSpreadsheet(file: File): Promise<ExtractedDocument> {
  const { readSheet } = await import("read-excel-file/browser")
  const rows = await readSheet(file)
  return toDocument(rows.map(row => row.map(cell => cell == null ? "" : String(cell))), file.name)
}

const NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
const els = (root: Element | Document, name: string) => Array.from(root.getElementsByTagNameNS(NS, name))
const direct = (root: Element, name: string) => Array.from(root.children).filter(x => x.namespaceURI === NS && x.localName === name)
const paragraph = (root: Element) => els(root, "t").map(t => t.textContent ?? "").join("").trim()

// Extract Word tables as rows, including a single-column "Full Name" table.
// Field interpretation and name splitting remain in format.ts.
const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
const candidateHeadings = new Set([
  "fullname", "name", "names", "studentname", "candidatename",
  "firstname", "givenname", "forename", "lastname", "surname", "familyname",
])

function looksLikeCandidateTable(rows: string[][]): boolean {
  if (!rows.length) return false
  const first = rows[0].map(normalizeHeader)
  if (first.some(cell => candidateHeadings.has(cell))) return true

  // Headerless lists are allowed, but reject tiny instruction/layout tables.
  // Import review remains the final authority for candidate names.
  if (rows.length < 2 || rows.some(row => row.length > 4)) return false
  const content = rows.slice(0, 6).flat().filter(Boolean)
  return content.length >= 2 && content.filter(cell =>
    /^[\p{L}][\p{L}.'’\- ]{1,119}$/u.test(cell) &&
    cell.trim().split(/\s+/).length <= 5
  ).length >= Math.ceil(content.length * 0.7)
}

async function readDocx(file: File): Promise<ExtractedDocument> {
  const JSZip = (await import("jszip")).default
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const documentXml = zip.file("word/document.xml")
  if (!documentXml) throw new Error("This Word file does not contain a readable document.")

  const xml = new DOMParser().parseFromString(await documentXml.async("string"), "application/xml")
  if (xml.getElementsByTagName("parsererror").length) throw new Error("Word document XML is invalid.")
  const body = els(xml, "body")[0]
  if (!body) throw new Error("No Word document body was found.")

  const tables: string[][][] = []
  const paragraphs: string[][] = []

  for (const node of Array.from(body.children)) {
    if (node.namespaceURI !== NS) continue
    if (node.localName === "tbl") {
      const rows = direct(node, "tr").map(tr =>
        direct(tr, "tc").map(tc =>
          direct(tc, "p").map(paragraph).filter(Boolean).join(" ").trim()
        )
      ).filter(row => row.some(Boolean))
      if (rows.length) tables.push(rows)
    } else if (node.localName === "p") {
      const line = paragraph(node)
      if (!line) continue
      const delimiter = ["\t", "|", ";"].find(value => line.includes(value))
      paragraphs.push(delimiter ? (parseDelimited(line, delimiter)[0] ?? [line]) : [line])
    }
  }

  const selected = tables.filter(looksLikeCandidateTable)
  if (selected.length) {
    // Each separate table can have its own header. Keep one consistent shape;
    // warn instead of mixing ambiguous tables into one candidate list.
    const primary = selected[0]
    const compatible = selected.slice(1).filter(rows =>
      rows[0].length === primary[0].length &&
      rows[0].map(normalizeHeader).join("|") === primary[0].map(normalizeHeader).join("|")
    )
    const combined = [
      ...primary,
      ...compatible.flatMap(rows => rows.slice(candidateHeadings.has(normalizeHeader(rows[0][0])) ? 1 : 0)),
    ]
    const warnings = ["Candidate table extracted. Titles and instructions outside the table were excluded."]
    if (tables.length !== 1 || selected.length > 1) warnings.push("This document contains multiple tables. Review the extracted rows before importing.")
    return toDocument(combined, file.name, warnings)
  }

  if (tables.length) {
    throw new Error("Word tables were found, but none looks like a candidate list. Use a 'Full Name' or 'First Name / Surname' header, or paste the names as text.")
  }

  // No tables: preserve paragraph text for explicit staff mapping and review.
  const possibleNames = paragraphs.filter(row =>
    row.length >= 2 ||
    (row[0].trim().split(/\s+/).length >= 2 &&
      /^[\p{L}][\p{L}.'’\- ]+$/u.test(row[0]) &&
      row[0].length <= 120)
  )
  return toDocument(possibleNames, file.name, [
    "No Word table found. Possible name lines were extracted from paragraphs; review each row before import.",
  ])
}

function readText(text: string, source: string): ExtractedDocument {
  const cleaned = text.replace(/^\uFEFF/, "").trim()
  if (!cleaned) throw new Error("The text is empty.")
  const delimiter = detectDelimiter(cleaned)
  const parsed = parseDelimited(cleaned, delimiter)
  return toDocument(parsed, source)
}

async function readLegacyOffice(file: File): Promise<ExtractedDocument> {
  const form = new FormData()
  form.append("file", file)
  const response = await fetch("/api/candidates/import/extract-legacy", {
    method: "POST",
    body: form,
    credentials: "same-origin",
  })
  const result: { matrix?: string[][]; warnings?: string[]; error?: string } = await response.json()
  if (!response.ok || !result.matrix) {
    throw new Error(result.error ?? "Unable to read this legacy Office document.")
  }
  return toDocument(result.matrix, file.name, result.warnings ?? [])
}

export async function extractCandidates(file: File): Promise<ExtractedDocument> {
  assertFile(file)
  const extension = file.name.toLowerCase().split(".").pop()
  if (extension === "xlsx") return readSpreadsheet(file)
  if (extension === "docx") return readDocx(file)
  if (extension === "doc" || extension === "xls") return readLegacyOffice(file)
  if (extension === "csv" || extension === "tsv" || extension === "txt") return readText(await file.text(), file.name)
  throw new Error("Supported formats: .csv, .tsv, .xls, .xlsx, .doc, .docx and .txt.")
}


export function extractPastedText(
  text: string
): ExtractedDocument {
  const cleaned = text
    .replace(/^\uFEFF/, "")
    .trim()

  if (!cleaned) {
    throw new Error("Enter at least one name.")
  }

  // Detect actual CSV/TSV column headers before treating
  // commas or semicolons as separators between full names.
  const firstLine =
    cleaned.split(/\r?\n/).find(line => line.trim()) ?? ""

  const headerCells = firstLine
    .split(/[,;\t|]/)
    .map(cell =>
      cell.toLowerCase().replace(/[^a-z0-9]/g, "")
    )

  const knownHeaders = new Set([
    "firstname",
    "givenname",
    "forename",
    "lastname",
    "surname",
    "familyname",
    "fullname",
    "name",
    "studentname",
    "candidatename",
    "candidatecode",
    "admissionno",
    "admissionnumber",
  ])

  const hasColumnHeaders =
    headerCells.length > 1 &&
    headerCells.some(cell => knownHeaders.has(cell))

  // Full-name lists can use newlines, commas or semicolons.
  // Keep quoted CSV and tab-separated tables on the
  // existing delimiter parser instead.
  if (
    !hasColumnHeaders &&
    !cleaned.includes('"') &&
    !cleaned.includes("\t") &&
    (cleaned.includes(",") || cleaned.includes(";"))
  ) {
    const names = cleaned
      .split(/[,;\r\n]+/)
      .map(value => value.trim())
      .filter(Boolean)

    const allLookLikeFullNames =
      names.length > 0 &&
      names.every(name => {
        const words = name.split(/\s+/)
        return (
          words.length >= 2 &&
          words.length <= 12 &&
          name.length <= 250
        )
      })

    if (allLookLikeFullNames) {
      return toDocument(
        names.map(name => [name]),
        "Pasted names"
      )
    }
  }

  // Preserve the existing parser for CSV, TSV,
  // first-name/surname columns and ordinary line lists.
  return readText(cleaned, "Pasted text")
}


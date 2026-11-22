import { getStaffContext } from "@/services/auth"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const MAX_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 500
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function normalize(matrix: unknown[][]): string[][] {
  const result = matrix
    .map(row => row.map(cell => cell == null ? "" : String(cell).trim()))
    .filter(row => row.some(Boolean))
  if (result.length > MAX_ROWS + 1) {
    throw new Error(`Too many rows. Maximum ${MAX_ROWS}; split your file.`)
  }
  if (result.some(row => row.length > 50 || row.some(cell => cell.length > 1000))) {
    throw new Error("The document contains an unusually large row or cell.")
  }
  return result
}

function splitWordBody(body: string): string[][] {
  // Legacy Word text extraction preserves tabs and line breaks but not all table structure.
  // Do not guess names here: the existing formatter does that after staff review.
  return body.split(/\r\n|\n|\r/)
    .map(line => line.split("\t").map(cell => cell.trim()))
    .filter(row => row.some(Boolean))
}

export async function POST(request: NextRequest) {
  try {
    const context = await getStaffContext()
    if (!context) return error("Sign in to your organization to import candidates.", 401)

    const length = Number(request.headers.get("content-length") ?? "0")
    if (length > MAX_BYTES + 100_000) return error("Maximum file size is 5 MB.", 413)
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) {
      return error("Choose a valid file smaller than 5 MB.", 400)
    }

    const extension = file.name.toLowerCase().split(".").pop()
    if (extension !== "doc" && extension !== "xls") {
      return error("Only legacy .doc and .xls files are accepted here.", 400)
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!OLE.every((byte, index) => buffer[index] === byte)) {
      return error("This file is not a valid legacy Office document.", 400)
    }

    if (extension === "xls") {
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(buffer, {
        // type: "buffer", bookVBA: false, bookLinks: false, cellFormula: false,
        type: "buffer", bookVBA: false, cellFormula: false,
      })
      const firstSheet = workbook.SheetNames[0]
      if (!firstSheet) return error("The Excel workbook has no worksheets.", 422)
      const sheet = workbook.Sheets[firstSheet]
      if (!sheet) return error("The first worksheet is unreadable.", 422)
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1, defval: "", raw: false, blankrows: false,
      })
      return NextResponse.json({
        matrix: normalize(rows),
        warnings: ["Legacy Excel file read from the first worksheet. Review names before importing."],
      })
    }

    // word-extractor reads binary .doc without requiring Microsoft Office or LibreOffice.
    // It exports text, not a reliable cell-grid for every Word table style.
    const WordExtractor = require("word-extractor") as new () => {
      extract(buffer: Buffer): Promise<{ getBody(): string }>
    }
    const extractor = new WordExtractor()
    const document = await extractor.extract(buffer)
    const body = String(document.getBody() ?? "")
    if (!body.trim()) return error("No readable text was found in the Word document.", 422)
    return NextResponse.json({
      matrix: normalize(splitWordBody(body)),
      warnings: ["Legacy Word text was extracted. Check table columns and split names carefully before importing."],
    })
  } catch (issue) {
    console.error("[CBT:LEGACY_CANDIDATE_EXTRACT]", issue instanceof Error ? issue.message : issue)
    const message = issue instanceof Error ? issue.message : "This Office file could not be read."
    return error(message, 422)
  }
}

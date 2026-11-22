import type { ExtractedDocument, FieldMap, ImportIssue, ImportRow } from "./types"

const canon = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
const firstNames = ["firstname", "firstname(s)", "givenname", "forename", "firstname(s)"]
const lastNames = ["lastname", "surname", "familyname", "secondname"]
const wholeNames = ["name", "fullname", "studentname", "candidatename", "names"]
const isHeading = (value: string) => [...firstNames, ...lastNames, ...wholeNames].includes(canon(value))

export function inferMapping(document: ExtractedDocument) {
  const first = document.rows[0]?.cells ?? []
  const header = first.some(isHeading) && first.every(cell => isHeading(cell) || /^(s\/?n|no|number|serial|admission|admissionno|code|candidatecode|candidateid|status|registrationnumber)$/i.test(cell.trim()))
  const headers = header ? first : first.map((_, index) => `Column ${index + 1}`)
  const keys = headers.map(canon)
  const fullIndex = keys.findIndex(key => wholeNames.includes(key))
  const firstIndex = keys.findIndex(key => firstNames.includes(key))
  const lastIndex = keys.findIndex(key => lastNames.includes(key))
  const mapping: FieldMap = {
    first_name: firstIndex >= 0 ? firstIndex : header ? null : first.length > 1 ? 0 : null,
    last_name: lastIndex >= 0 ? lastIndex : header ? null : first.length > 1 ? 1 : null,
  }
  const fullNameIndex = fullIndex >= 0 ? fullIndex : !header && first.length === 1 ? 0 : null
  return {
    data: { ...document, headers, rows: header ? document.rows.slice(1) : document.rows },
    mapping,
    fullNameIndex,
    warnings: [...document.warnings, ...(!header ? ["Check the suggested name columns before importing."] : [])],
  }
}

const splitName = (value: string) => {
  const pieces = value.trim().split(/\s+/).filter(Boolean)
  return { first: pieces.shift() ?? "", last: pieces.join(" ") }
}

export function formatCandidates(document: ExtractedDocument, mapping: FieldMap, fullNameIndex: number | null): ImportRow[] {
  return document.rows.map((source, index) => {
    const get = (field: keyof FieldMap) => mapping[field] === null ? "" : (source.cells[mapping[field]!] ?? "").trim()
    const notes: string[] = []
    let first_name = get("first_name")
    let last_name = get("last_name")
    const fullName = fullNameIndex === null ? "" : (source.cells[fullNameIndex] ?? "").trim()
    if (fullName && !first_name) {
      const names = splitName(fullName.replace(/^\s*\d+[.)]\s+/, ""))
      first_name = names.first
      last_name = names.last
      notes.push("Full name split automatically. Please verify.")
    } else if (source.cells.length === 1 && first_name && !last_name) {
      const names = splitName(first_name.replace(/^\s*\d+[.)]\s+/, ""))
      first_name = names.first
      last_name = names.last
      notes.push("Name split from a text line. Please verify.")
    }
    return { uid: `import-${index}-${source.sourceLine}`, sourceLine: source.sourceLine, first_name, last_name, include: true, notes }
  })
}

export function checkImportRows(rows: ImportRow[]): ImportIssue[] {
  const issues: ImportIssue[] = []
  const names = new Map<string,string[]>()
  for (const row of rows.filter(row => row.include)) {
    for (const note of row.notes) issues.push({ rowId: row.uid, level: "warning", message: note })
    if (!row.first_name.trim() || row.first_name.trim().length > 120 || row.last_name.trim().length > 120) {
      issues.push({ rowId: row.uid, level: "error", message: "First name required (maximum 120 characters); surname maximum 120." })
    }
    const name = `${row.first_name.trim()} ${row.last_name.trim()}`.trim().toLowerCase()
    if (name) names.set(name, [...(names.get(name) ?? []), row.uid])
  }
  for (const ids of names.values()) if (ids.length > 1) {
    for (const id of ids) issues.push({ rowId: id, level: "warning", message: "Name repeated in upload. Check whether these are different people." })
  }
  return issues
}

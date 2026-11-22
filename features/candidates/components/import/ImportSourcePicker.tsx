"use client"

import { useRef, useState } from "react"
import { FileSpreadsheet, FileText, FileUp, ClipboardPaste, Download, FileType2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ExtractedDocument } from "../../services/import/types"
import { extractCandidates, extractPastedText } from "../../services/import/extract"
 

export function ImportSourcePicker({ onExtract, busy }: { onExtract: (value: ExtractedDocument) => void; busy: boolean }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [text, setText] = useState("")
  const [tab, setTab] = useState<"file" | "text">("file")
  const [error, setError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const handle = async (file: File | undefined) => {
    if (!file || busy) return
    setReading(true); setError(null)
    try { onExtract(await extractCandidates(file)) }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Could not read the file") }
    finally { setReading(false); if (fileInput.current) fileInput.current.value = "" }
  }
  const parseText = () => {
    try { setError(null); onExtract(extractPastedText(text)) }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Invalid text") }
  }
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant={tab === "file" ? "default" : "outline"} onClick={() => setTab("file")}><FileUp className="size-4" /> Upload file</Button>
      <Button size="sm" variant={tab === "text" ? "default" : "outline"} onClick={() => setTab("text")}><ClipboardPaste className="size-4" /> Paste text</Button>
    </div>
    {tab === "file" ? <div role="button" tabIndex={0} onKeyDown={event => { if (event.key === "Enter") fileInput.current?.click() }} onClick={() => fileInput.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void handle(event.dataTransfer.files[0]) }} className="cursor-pointer rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition-colors hover:border-primary/60">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10"><FileUp className="size-6 text-primary" /></div>
      <p className="font-semibold">{reading ? "Reading your file..." : "Drop your file here or browse"}</p>
      <p className="mt-1 text-xs text-muted-foreground">CSV, TSV, Excel (.xls/.xlsx), Word (.doc/.docx) or text (.txt) · Max 5 MB</p>
      <input ref={fileInput} hidden type="file" accept=".csv,.tsv,.xls,.xlsx,.doc,.docx,.txt" onChange={event => void handle(event.target.files?.[0])} />
    </div> : <div className="space-y-3">
      
      
      <Textarea
        rows={7}
        value={text}
        onChange={event => setText(event.target.value)}
        placeholder={`Ada Okafor
      Tunde Bello
      Grace Uche

      Or: Ada Okafor, Tunde Bello; Grace Uche`}
      />

      <p className="text-sm font-medium leading-6 text-foreground/85">
        Enter full names, one per line, or separate names
        with commas or semicolons. You can correct each name
        before saving.
      </p>


      <Button disabled={!text.trim() || reading || busy} onClick={parseText}><ClipboardPaste className="size-4" /> Extract pasted text</Button>
    </div>}
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    <div className="rounded-xl border border-primary/20 p-4">
      <p className="mb-3 text-sm font-semibold">Download a starter template</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild><a href="/templates/candidates-import.csv" download><FileText className="size-4" /> CSV <Download className="size-3" /></a></Button>
        <Button variant="outline" size="sm" asChild><a href="/templates/candidates-import.xlsx" download><FileSpreadsheet className="size-4" /> Excel <Download className="size-3" /></a></Button>
        <Button variant="outline" size="sm" asChild><a href="/templates/candidates-import.docx" download><FileType2 className="size-4" /> Word table <Download className="size-3" /></a></Button>
        <Button variant="outline" size="sm" asChild><a href="/templates/candidates-import.txt" download><FileText className="size-4" /> Text <Download className="size-3" /></a></Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Just a list of names is enough. Candidate codes and Active status are assigned by the system.</p>
    </div>
  </div>
}

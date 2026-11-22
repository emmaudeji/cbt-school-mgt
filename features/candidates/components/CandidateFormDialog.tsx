"use client"

import { useEffect, useState, useTransition } from "react"
import { Loader2, UserRoundPlus, LockKeyhole } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { previewCandidateCodesAction } from "../services/import/actions"
import { saveDirectoryCandidateAction } from "../services/directory-actions"
import type { CandidateFormValues, DirectoryCandidate } from "../services/directory-types"

type Props = {
  open: boolean
  candidate: DirectoryCandidate | null
  onClose: () => void
  onSaved: () => void
}

const empty: CandidateFormValues = {
  firstName: "",
  lastName: "",
  candidateCode: "",
  status: "active",
}

export function CandidateFormDialog({ open, candidate, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CandidateFormValues>(empty)
  const [saving, startSaving] = useTransition()
  const [proposedCode, setProposedCode] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(candidate ? {
      id: candidate.id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      candidateCode: candidate.candidate_code ?? "",
      status: candidate.status,
    } : { ...empty })
  }, [candidate, open])

  useEffect(() => {
    if (!open || candidate) return
    let mounted = true
    void previewCandidateCodesAction(1).then(reply => { if (mounted) setProposedCode(reply.preview?.codes[0] ?? null) })
    return () => { mounted = false }
  }, [open, candidate])

  const change = <K extends keyof CandidateFormValues>(key: K, value: CandidateFormValues[K]) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const submit = () => {
    if (saving) return
    startSaving(async () => {
      try {
        const result = await saveDirectoryCandidateAction(form)
        if (!result.success) {
          toast.error(result.error ?? "Unable to save candidate")
          return
        }
        toast.success(candidate ? "Candidate updated" : "Candidate added to directory")
        onSaved()
      } catch {
        toast.error("Unable to save candidate. Please retry.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={value => { if (!value && !saving) onClose() }}>
      <DialogContent className="border-primary/20 shadow-none sm:max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <UserRoundPlus className="size-5" />
          </div>
          <DialogTitle>{candidate ? "Edit candidate" : "Add candidate"}</DialogTitle>
          <DialogDescription>
            {candidate ? "Update this candidate's directory details." : "Create a reusable candidate record for this organization."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); submit() }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="candidate-first-name">First name *</Label>
              <Input id="candidate-first-name" value={form.firstName} required maxLength={120} onChange={event => change("firstName", event.target.value)} placeholder="First name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="candidate-last-name">Last name</Label>
              <Input id="candidate-last-name" value={form.lastName} maxLength={120} onChange={event => change("lastName", event.target.value)} placeholder="Last name" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="candidate-code">Candidate code (automatic)</Label>
            <div className="relative"><LockKeyhole className="absolute left-3 top-2.5 size-4 text-primary" /><Input id="candidate-code" readOnly value={candidate ? form.candidateCode : proposedCode ?? "Generating code..."} className="bg-primary/5 pl-9" /></div>
            <p className="text-xs text-muted-foreground">Permanent, automatically assigned on save. Preview may change if another candidate is created first.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="candidate-status">Status</Label>
            <select id="candidate-status" value={form.status} onChange={event => change("status", event.target.value as "active" | "inactive")}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {candidate && <p className="text-xs text-amber-700 dark:text-amber-300">Changing status does not delete or revoke existing examination assignments or attempts.</p>}
          </div>
          {candidate && candidate.source !== "manual" && (
            <p className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-muted-foreground">
              This candidate came from {candidate.source}. The original source and linked identity are preserved.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.firstName.trim()}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {candidate ? "Save Changes" : "Add Candidate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

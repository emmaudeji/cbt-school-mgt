
"use client"

import Link from "next/link"
import { useActionState, useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Info,
  Loader2,
} from "lucide-react"
import { toast } from "react-toastify"

import { urls } from "@/constants"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InputField } from "@/components/shared/InputField"
import { TextareaField } from "@/components/shared/TextareaField"
import SelectOrCreateDropdown, { SelectOption } from "@/components/shared/SelectOrCreateDropdown"
import { createCategoryAction, createExamAction, createQuestionBankAction } from "../services/action"
 

type CategoryOption = SelectOption & {
  bank_id: string
}

type Props = {
  banks: SelectOption[]
  categories: CategoryOption[]
}

const initialState = { error: null as string | null }

export default function NewExamForm({
  banks,
  categories,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createExamAction,
    initialState
  )

  const [title, setTitle] = useState("")
  const [bankId, setBankId] = useState("")
  const [categoryId, setCategoryId] = useState("")

  const [bankOptions, setBankOptions] = useState(banks)
  const [categoryOptions, setCategoryOptions] = useState(categories)

  const availableCategories = useMemo(
    () => categoryOptions.filter((item) => item.bank_id === bankId),
    [categoryOptions, bankId]
  )

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state])

  const changeBank = (value: string) => {
    if (value === bankId) return

    setBankId(value)
    setCategoryId("")
  }

  const addBank = (option: SelectOption) => {
    setBankOptions((current) =>
      current.some((item) => item.id === option.id)
        ? current
        : [...current, option].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
    )
  }

  const addCategory = (option: SelectOption) => {
    setCategoryOptions((current) => {
      if (current.some((item) => item.id === option.id)) return current

      return [...current, { ...option, bank_id: bankId }].sort(
        (a, b) => a.name.localeCompare(b.name)
      )
    })
  }

  const canSubmit =
    !pending &&
    title.trim().length >= 2 &&
    !!bankId &&
    !!categoryId

  return (
    <form action={formAction}>
      <Card className="gap-0 overflow-hidden border-t-4 border-t-primary p-0">
        <CardHeader className="border-b bg-muted/30 py-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-lg">
                Test Information
              </CardTitle>
              <CardDescription>
                Set up your test and organize its questions.
                You can change these details while the test is a draft.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="gap-5 py-4">
          <InputField
            name="title"
            label="Test Title"
            description="Give the test a name that helps you identify it later."
            placeholder="e.g. JSS 2 Mathematics First Term Test"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={2}
            maxLength={200}
            autoFocus
            disabled={pending}
          />

          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold">
                  Question Organization
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Choose where questions for this test will be stored.
                  You can reuse these questions in future tests.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectOrCreateDropdown
                name="default_bank_id"
                label="Question Bank"
                description="A collection such as JSS 2, WAEC Preparation or Staff Assessment."
                placeholder="Select question bank"
                createLabel="Create Question Bank"
                value={bankId}
                options={bankOptions}
                onChange={changeBank}
                onCreate={(name) => createQuestionBankAction(name)}
                onCreated={addBank}
                required
                disabled={pending}
              />

              <SelectOrCreateDropdown
                name="default_category_id"
                label="Subject / Category"
                description="The subject or assessment area, such as Mathematics or English."
                placeholder={
                  bankId ? "Select subject" : "Select a bank first"
                }
                createLabel="Create Subject"
                value={categoryId}
                options={availableCategories}
                onChange={setCategoryId}
                onCreate={(name) =>
                  createCategoryAction(bankId, name)
                }
                onCreated={addCategory}
                required
                disabled={pending || !bankId}
              />
            </div>

            {bankId && !availableCategories.length && (
              <p className="text-xs text-muted-foreground">
                This question bank has no subjects yet. Use
                <span className="font-medium text-foreground">
                  {" "}Create Subject{" "}
                </span>
                to add the first one.
              </p>
            )}
          </div>

          <TextareaField
            name="description"
            label="Description (optional)"
            description="Add instructions or notes to help you recognize this test. Candidate instructions can be configured later."
            placeholder="e.g. First Term Mathematics Examination, 2026/2027 session."
            rows={3}
            maxLength={1000}
            disabled={pending}
          />

          <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />

            <div className="space-y-1">
              <p className="text-sm font-medium">
                What happens next?
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your test will be saved as a draft. You can write
                questions, upload a question document or select
                questions from your organization's bank.
              </p>
            </div>
          </div>

          {state.error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 py-5">
          <Button variant="outline" type="button" asChild>
            <Link href={urls.exams}>Cancel</Link>
          </Button>

          <Button type="submit" disabled={!canSubmit}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating Test...
              </>
            ) : (
              <>
                Save & Add Questions
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

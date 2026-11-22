
"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-toastify"
import { ArrowLeft, Check, Loader2, Plus } from "lucide-react"

import { OPTION_KEYS, urls } from "@/constants"
 

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { addExamQuestionAction } from "../services/addExamQuestionAction"
import { TextareaField } from "@/components/shared/TextareaField"
import { InputField } from "@/components/shared/InputField"
import CustomSelect from "@/components/shared/CustomSelect"

 

const optionKeys = OPTION_KEYS

const answerOptions = optionKeys.map((key) => ({
  value: key,
  label: `Option ${key.toUpperCase()}`,
}))

export default function AddQuestionForm({
  slug,
}: {
  slug: string
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [pending, startTransition] = useTransition()
  const [correctOption, setCorrectOption] = useState("")
  const [error, setError] = useState("")

  const submit = (
    event: React.FormEvent<HTMLFormElement>,
    finish: boolean
  ) => {
    event.preventDefault()

    if (pending) return

    if (!correctOption) {
      setError("Select the correct answer.")
      toast.error("Select the correct answer.")
      return
    }

    const formData = new FormData(event.currentTarget)
    formData.set("correctOption", correctOption)

    setError("")

    startTransition(async () => {
      const result = await addExamQuestionAction(slug, formData)

      if (!result.success) {
        setError(result.error ?? "Unable to save question.")
        toast.error(result.error ?? "Unable to save question.")
        return
      }

      toast.success("Question saved successfully.")

      if (finish) {
        router.push(urls.examDetails(slug))
        return
      }

      formRef.current?.reset()
      setCorrectOption("")
      router.refresh()
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => submit(event, false)}
    >
      <Card className="gap-0 p-0 overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-muted/30 py-5">
          <CardTitle className="text-lg">
            Write Question
          </CardTitle>
          <CardDescription>
            Enter the question, its options and the correct answer.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-7 py-6">
          <TextareaField
            name="prompt"
            label="Question"
            placeholder="e.g. What is 12 × 5?"
            rows={3}
            required
            disabled={pending}
          />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">
                Answer Options
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter four possible answers.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {optionKeys.map((key) => (
                <InputField
                  key={key}
                  name={`option_${key}`}
                  label={`Option ${key.toUpperCase()}`}
                  placeholder={`Enter option ${key.toUpperCase()}`}
                  required
                  disabled={pending}
                />
              ))}
            </div>
          </div>

          <CustomSelect
            name="correctOption"
            label="Correct Answer"
            placeholder="Select the correct option"
            options={answerOptions}
            value={correctOption}
            onChange={(value:string) => {
              setCorrectOption(value)
              setError("")
            }}
            error={error || undefined}
            required
            disabled={pending}
          />

          <TextareaField
            name="explanation"
            label="Answer Explanation (optional)"
            description="Explain why the selected answer is correct."
            placeholder="e.g. 12 multiplied by 5 equals 60."
            rows={2}
            disabled={pending}
          />
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 py-5">
          <Button variant="outline" asChild>
            <Link href={urls.examQuestions(slug)}>
              <ArrowLeft className="size-4" />
              Back to Questions
            </Link>
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="outline"
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Save & Add Another
            </Button>

            <Button
              type="button"
              disabled={pending}
              onClick={() => {
                const form = formRef.current
                if (!form) return

                if (!form.reportValidity()) return

                submit(
                  {
                    preventDefault: () => {},
                    currentTarget: form,
                  } as React.FormEvent<HTMLFormElement>,
                  true
                )
              }}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save & Finish
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}

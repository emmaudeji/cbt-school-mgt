
export type ExtractedQuestion = {
  number: number
  prompt: string
  options: {
    key: string
    body: string
  }[]
  correctOption: string | null
  explanation: string
  warnings: string[]
}

type WorkingQuestion = ExtractedQuestion & {
  last: "prompt" | "option" | "explanation"
  optionMode: boolean
  unlabelled: boolean
}

const QUESTION =
  /^(?:(?:question|ques|q)\s*[-:#.]?\s*)?(\d{1,4})\s*[.):\-]\s+(.+)$/i

const EXPLICIT_QUESTION =
  /^(?:question|ques|q)\s*[-:#.]?\s*(\d{1,4})\s*[.):\-]?\s+(.+)$/i

const OPTION =
  /^\s*(?:\(([a-h])\)|([a-h])[.):\-]|option\s+([a-h])\s*[:.)\-])\s*(\S.*)$/i

const BULLET = /^\s*(?:[•●▪◦‣*]|[-–])\s+(.+)$/

const ANSWER =
  /^(?:correct\s+(?:answer|option)|answer|ans(?:wer)?|key)\s*[:=\-]\s*(?:option\s*)?\(?([a-h])\)?\b/i

const EXPLANATION =
  /^(?:explanation|solution|reason|working(?:s)?)\s*[:\-]\s*(.*)$/i

const HEADING =
  /^(?:topics? covered|answer\s*key|solutions?\s*key|instructions?|section\s+[a-z0-9]+|multiple.choice questions?)\s*:?\s*$/i

const TABLE_OPEN = /^\[table\]$/i
const TABLE_CLOSE = /^\[\/table\]$/i

function normalize(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
}

function splitInlineOptions(line: string): string[] {
  const matches = [
    ...line.matchAll(
      /(^|\s)(?:\(([a-h])\)|([a-h])[.):])(?=\s+\S)/gi
    ),
  ]

  if (matches.length < 2) return [line]

  const parts: string[] = []
  const first = matches[0].index! + matches[0][1].length

  if (first > 0) {
    parts.push(line.slice(0, first).trim())
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index! + matches[i][1].length
    const end =
      i + 1 < matches.length
        ? matches[i + 1].index! + matches[i + 1][1].length
        : line.length

    parts.push(line.slice(start, end).trim())
  }

  return parts.filter(Boolean)
}

function questionLike(text: string) {
  return (
    /[?؟]\s*$/.test(text) ||
    /^(?:what|which|who|when|where|why|how|find|calculate|evaluate|solve|simplify|determine|identify|state|choose|select|compute|express|convert|write|explain|a\s+(?:fair|bag|box|class|student|number))\b/i.test(
      text
    )
  )
}

export function parseDocumentQuestions(
  text: string
): ExtractedQuestion[] {
  const lines = normalize(text)
  const result: ExtractedQuestion[] = []
  const answerKey = new Map<number, string>()

  let current: WorkingQuestion | null = null
  let autoNumber = 0
  let table = false
  let answerKeySection = false
  let trailingSection = false
  let blanks = 0

  function complete() {
    if (!current) return

    const q = current
    const warnings = [...q.warnings]

    if (!q.prompt.trim()) {
      warnings.push("Question text is missing.")
    }

    if (q.options.length < 2) {
      warnings.push("Fewer than two answer options found.")
    }

    if (q.options.length > 4) {
      warnings.push(
        "More than four options detected; review before saving."
      )
    }

    if (
      /\[image omitted\]/i.test(q.prompt) ||
      q.options.some((o) =>
        /\[image omitted\]/i.test(o.body)
      )
    ) {
      warnings.push(
        "This question contains an image that needs to be attached separately."
      )
    }

    if (
      new Set(q.options.map((o) => o.key)).size !==
      q.options.length
    ) {
      warnings.push("Duplicate option labels detected.")
    }

    if (!q.correctOption) {
      warnings.push("Correct answer not identified.")
    } else if (
      !q.options.some((o) => o.key === q.correctOption)
    ) {
      warnings.push(
        "Correct answer does not match an option."
      )
    }

    result.push({
      number: q.number,
      prompt: q.prompt.trim(),
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation.trim(),
      warnings: [...new Set(warnings)],
    })

    current = null
  }

  function begin(prompt: string, number?: number) {
    complete()

    autoNumber = number ?? autoNumber + 1

    const inline = splitInlineOptions(prompt.trim())

    current = {
      number: autoNumber,
      prompt: inline[0] ?? prompt.trim(),
      options: [],
      correctOption: null,
      explanation: "",
      warnings: [],
      last: "prompt",
      optionMode: false,
      unlabelled: false,
    }

    if (inline.length > 1) {
      for (const part of inline.slice(1)) {
        const match = part.match(OPTION)

        if (match) {
          current.options.push({
            key: (
              match[1] ??
              match[2] ??
              match[3]
            ).toLowerCase(),
            body: match[4],
          })

          current.last = "option"
          current.optionMode = true
        }
      }
    }
  }

  function append(line: string) {
    if (!current) return

    if (current.last === "explanation") {
      current.explanation +=
        (current.explanation ? "\n" : "") + line
    } else if (
      current.last === "option" &&
      current.options.length
    ) {
      const option =
        current.options[current.options.length - 1]

      option.body += (option.body ? "\n" : "") + line
    } else {
      current.prompt += (current.prompt ? "\n" : "") + line
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (!line) {
      blanks++
      continue
    }

    if (TABLE_OPEN.test(line)) {
      table = true
      if (current) current.last = "prompt"
      continue
    }

    if (TABLE_CLOSE.test(line)) {
      table = false
      if (current) current.last = "prompt"
      continue
    }

    if (table) {
      append(line)
      blanks = 0
      continue
    }

    if (/^answer\s*key\s*:?.*$/i.test(line)) {
      complete()
      answerKeySection = true
      trailingSection = false
      blanks = 0
      continue
    }

    if (/^topics? covered\s*:/i.test(line)) {
      complete()
      trailingSection = true
      answerKeySection = false
      continue
    }

    if (trailingSection) continue

    if (answerKeySection) {
      const key = line.match(
        /^(\d{1,4})\s*[.):\-]\s*(?:option\s*)?\(?([a-h])\)?\s*$/i
      )

      if (key) {
        answerKey.set(
          Number(key[1]),
          key[2].toLowerCase()
        )
      }

      continue
    }

    if (HEADING.test(line)) {
      blanks = 0
      continue
    }

    const explicit = line.match(EXPLICIT_QUESTION)
    const numbered = line.match(QUESTION)

    const isNewNumber =
      numbered &&
      (
        !current ||
        (
          current.options.length > 0 &&
          (
            !current.options.some(
              (o) => o.key === numbered[1]
            ) ||
            !current.optionMode
          )
        ) ||
        (
          !current.optionMode &&
          current.prompt &&
          blanks > 0 &&
          questionLike(numbered[2])
        )
      )

    if (explicit || isNewNumber) {
      const match = (explicit ?? numbered)!

      begin(match[2], Number(match[1]))
      blanks = 0
      continue
    }

    if (!current) {
      if (questionLike(line)) {
        begin(line)
      }

      blanks = 0
      continue
    }

    const answer = line.match(ANSWER)

    if (answer) {
      current.correctOption = answer[1].toLowerCase()
      current.last = "prompt"
      blanks = 0
      continue
    }

    const explanation = line.match(EXPLANATION)

    if (explanation) {
      current.explanation = explanation[1]
      current.last = "explanation"
      blanks = 0
      continue
    }

    if (
      current.options.length &&
      current.correctOption &&
      blanks > 0 &&
      questionLike(line)
    ) {
      begin(line)
      blanks = 0
      continue
    }

    const segments = splitInlineOptions(line)

    if (segments.length > 1) {
      for (const part of segments) {
        const match = part.match(OPTION)

        if (match) {
          const key = (
            match[1] ??
            match[2] ??
            match[3]
          ).toLowerCase()

          current.options.push({
            key,
            body: match[4],
          })

          current.last = "option"
          current.optionMode = true
        } else {
          append(part)
        }
      }

      blanks = 0
      continue
    }

    const option = line.match(OPTION)

    if (option) {
      const key = (
        option[1] ??
        option[2] ??
        option[3]
      ).toLowerCase()

      if (
        key !== "a" &&
        current.options.length === 0 &&
        !current.optionMode
      ) {
        current.warnings.push(
          "Options appear to begin after A; check the question."
        )
      }

      current.options.push({
        key,
        body: option[4],
      })

      current.last = "option"
      current.optionMode = true
      blanks = 0
      continue
    }

    const bullet = line.match(BULLET)

    if (bullet && !current.correctOption) {
      const next = String.fromCharCode(
        97 + current.options.length
      )

      current.options.push({
        key: next,
        body: bullet[1],
      })

      current.last = "option"
      current.optionMode = true
      blanks = 0
      continue
    }

    // Detect four plain unlabelled answers before an answer line.
    if (
      !current.optionMode &&
      current.options.length === 0 &&
      current.prompt
    ) {
      const upcoming = lines
        .slice(i)
        .filter(Boolean)
        .slice(0, 5)

      if (
        upcoming.length === 5 &&
        upcoming.slice(0, 4).every(
          (value) =>
            value.length < 100 &&
            !QUESTION.test(value) &&
            !OPTION.test(value) &&
            !BULLET.test(value) &&
            !EXPLANATION.test(value)
        ) &&
        ANSWER.test(upcoming[4])
      ) {
        current.options.push({
          key: "a",
          body: line,
        })

        current.last = "option"
        current.optionMode = true
        current.unlabelled = true
        blanks = 0
        continue
      }
    }

    if (
      !current.correctOption &&
      current.options.length > 0 &&
      current.optionMode &&
      (current.unlabelled || blanks > 0) &&
      line.length < 100 &&
      !questionLike(line) &&
      current.options.length < 8
    ) {
      const next = String.fromCharCode(
        97 + current.options.length
      )

      current.options.push({
        key: next,
        body: line,
      })
    } else {
      append(line)
    }

    blanks = 0
  }

  complete()

  // Apply separately supplied answer keys.
  for (const question of result) {
    const keyed = answerKey.get(question.number)

    if (keyed && !question.correctOption) {
      question.correctOption = keyed

      question.warnings = question.warnings.filter(
        (warning) =>
          warning !== "Correct answer not identified."
      )

      if (
        !question.options.some(
          (option) => option.key === keyed
        )
      ) {
        question.warnings.push(
          "Answer key refers to a missing option."
        )
      }
    }
  }

  return result
}

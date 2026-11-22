
"use client"

import {
  useId,
  useMemo,
  useState,
  type CSSProperties,
} from "react"
import dynamic from "next/dynamic"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  RemoveFormatting,
  Superscript,
  Subscript,
} from "lucide-react"

import { Label } from "../ui/label"
import { cn } from "@/lib/utils"

import "react-quill-new/dist/quill.snow.css"
import "./rich-text-editor.css"

const ReactQuill = dynamic(
  () => import("react-quill-new"),
  { ssr: false }
)

type EditorVariant = "default" | "exam"

type QuillSelection = {
  index: number
  length: number
}

type QuillInstance = {
  getSelection: (
    focus?: boolean
  ) => QuillSelection | null
  getText: () => string
  insertText: (
    index: number,
    text: string,
    source?: string
  ) => void
  deleteText: (
    index: number,
    length: number,
    source?: string
  ) => void
  setSelection: (
    index: number,
    length: number,
    source?: string
  ) => void
  focus: () => void
}

type ToolbarContext = {
  quill: QuillInstance
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  modules?: Record<string, unknown>
  label?: string
  description?: string
  labelStyle?: string
  name?: string
  error?: string
  required?: boolean
  variant?: EditorVariant
  minHeight?: number
}

const defaultModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "clean"],
  ],
}

const defaultFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "script",
  "list",
  "link",
]

const examFormats = [
  "bold",
  "italic",
  "underline",
  "script",
  "list",
]

function toLetters(index: number) {
  let number = index + 1
  let result = ""

  while (number > 0) {
    number -= 1
    result =
      String.fromCharCode(65 + (number % 26)) +
      result
    number = Math.floor(number / 26)
  }

  return result
}

// An exam-specific helper: create real A., B., C. text.
// This survives conversion to plain text for parsing.
function insertAlphabeticalChoices(
  quill: QuillInstance
) {
  quill.focus()

  const selection = quill.getSelection(true)
  if (!selection) return

  const text = quill.getText()

  if (selection.length === 0) {
    const template = "A. \nB. \nC. \nD. "

    quill.insertText(
      selection.index,
      template,
      "user"
    )

    quill.setSelection(
      selection.index + 3,
      0,
      "silent"
    )

    return
  }

  const start =
    text.lastIndexOf(
      "\n",
      Math.max(0, selection.index - 1)
    ) + 1

  const selectionEnd =
    selection.index + selection.length

  const nextNewline =
    text.indexOf("\n", selectionEnd)

  const end =
    nextNewline === -1
      ? text.length
      : nextNewline

  const selectedText = text.slice(start, end)

  const lines = selectedText
    .split("\n")
    .filter(line => line.trim().length > 0)

  if (!lines.length) return

  const formatted = lines
    .map((line, index) => {
      // Avoid double prefixes when reformatting.
      const content = line
        .trim()
        .replace(
          /^(?:[A-Za-z]{1,2}|\d+)[.)]\s*/,
          ""
        )

      return `${toLetters(index)}. ${content}`
    })
    .join("\n")

  quill.deleteText(
    start,
    end - start,
    "user"
  )

  quill.insertText(
    start,
    formatted,
    "user"
  )

  quill.setSelection(
    start,
    formatted.length,
    "silent"
  )
}

function ExamToolbar({
  id,
}: {
  id: string
}) {
  return (
    <div
      id={id}
      className="ql-toolbar ql-snow exam-editor-toolbar"
      role="toolbar"
      aria-label="Question formatting"
    >
      <span className="ql-formats">
        <button
          type="button"
          className="ql-bold"
          title="Bold"
          aria-label="Bold"
        >
          <Bold />
        </button>

        <button
          type="button"
          className="ql-italic"
          title="Italic"
          aria-label="Italic"
        >
          <Italic />
        </button>

        <button
          type="button"
          className="ql-underline"
          title="Underline"
          aria-label="Underline"
        >
          <Underline />
        </button>
      </span>

      <span className="ql-formats">
        <button
          type="button"
          className="ql-script"
          value="super"
          title="Superscript"
          aria-label="Superscript"
        >
          <Superscript />
        </button>

        <button
          type="button"
          className="ql-script"
          value="sub"
          title="Subscript"
          aria-label="Subscript"
        >
          <Subscript />
        </button>
      </span>

      <span className="ql-formats">
        <button
          type="button"
          className="ql-list"
          value="ordered"
          title="Numbered list"
          aria-label="Numbered list"
        >
          <ListOrdered />
        </button>

        <button
          type="button"
          className="ql-list"
          value="bullet"
          title="Bullet list"
          aria-label="Bullet list"
        >
          <List />
        </button>

        <button
          type="button"
          className="ql-alpha"
          title="Insert or format A–D answer choices"
          aria-label="Alphabetical answer choices"
        >
          <span className="alpha-tool-label">
            A–D
          </span>
        </button>
      </span>

      <span className="ql-formats">
        <button
          type="button"
          className="ql-clean"
          title="Clear formatting"
          aria-label="Clear formatting"
        >
          <RemoveFormatting />
        </button>
      </span>
    </div>
  )
}

export const RichTextEditor = ({
  value,
  onChange,
  className,
  disabled = false,
  modules,
  placeholder = "Write your content here...",
  label,
  required,
  description,
  labelStyle,
  name,
  error,
  variant = "default",
  minHeight = 220,
}: RichTextEditorProps) => {
  const generatedId = useId()
  const toolbarId =
    `exam-toolbar-${generatedId.replace(/:/g, "")}`

  const [mounted, setMounted] =
    useState(false)

  // Client-side mount, required for this editor.
  // Using an effect avoids hydration differences.
  useMemo(() => {
    // Deliberately no browser work during render.
    return null
  }, [])

  const editorModules = useMemo(() => {
    if (modules) return modules

    if (variant === "exam") {
      return {
        toolbar: {
          container: `#${toolbarId}`,
          handlers: {
            alpha: function (
              this: ToolbarContext
            ) {
              insertAlphabeticalChoices(
                this.quill
              )
            },
          },
        },
      }
    }

    return defaultModules
  }, [modules, variant, toolbarId])

  const editorStyle = {
    "--question-editor-min-height":
      `${minHeight}px`,
  } as CSSProperties

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="space-y-1">
          <Label
            htmlFor={name}
            className={cn(
              "flex items-center gap-1 text-sm font-semibold",
              labelStyle
            )}
          >
            {label}

            {required && (
              <span className="text-destructive">
                *
              </span>
            )}
          </Label>

          {description && (
            <p className="text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      <div
        style={editorStyle}
        className={cn(
          "rich-editor",
          variant === "exam" &&
            "rich-editor-exam",
          disabled && "readonly",
          error && "rich-editor-error",
          className
        )}
      >
        {variant === "exam" &&
          !modules && (
            <ExamToolbar id={toolbarId} />
          )}

        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          readOnly={disabled}
          modules={editorModules}
          formats={
            variant === "exam"
              ? examFormats
              : defaultFormats
          }
          placeholder={placeholder}
          className="rich-editor-instance"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}











// 'use client'

// import React, { useEffect, useState } from 'react'
// import dynamic from 'next/dynamic'
// import DOMPurify from 'dompurify'
// import 'react-quill-new/dist/quill.snow.css';
// import { Label } from '../ui/label'
// import { cn } from '@/lib/utils'

// import "./rich-text-editor.css"

// const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

// const cModules = {
//   toolbar: [
//     // Font family and size
//     [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],

//     // Heading levels
//     [{ header: [1, 2, 3, 4, 5, 6, false] }],

//     // Text styles
//     ['bold', 'italic', 'underline', 'strike'],

//     // Subscript / superscript
//     [{ script: 'sub' }, { script: 'super' }],

//     // Blockquote and code
//     ['blockquote', 'code-block'],

//     // Lists and indentation
//     [{ list: 'ordered' }, { list: 'bullet' }],
//     [{ indent: '-1' }, { indent: '+1' }],

//     // Text alignment
//     [{ align: [] }],

//     // Text & background color
//     [{ color: [] }, { background: [] }],

//     // Media and link - add 'video'
//     ['link',   ],
//     // ['link', 'image', ],

//     // Math formula (if enabled in Quill build)
//     ['formula'],

//     // Clear formatting
//     ['clean'],
//   ],
// };

// const formats = [
//   'header',
//   'font',
//   'size',
//   'bold',
//   'italic',
//   'underline',
//   'strike',
//   'script',
//   'blockquote',
//   'code-block',
//   'list',
//   'indent',
//   'align',
//   'color',
//   'background',
//   'link',
//   // 'image',
//   'formula',
// ];



// interface RichTextEditorProps {
//   value: string
//   onChange: (value: string) => void
//   className?: string
//   placeholder?: string
//   disabled?: boolean
//   modules?:any
//   label?:string
//   description?:string
//   labelStyle?:string
//   name?:string
//   error?: string;
//   required?:boolean
// }
// export const RichTextEditor: React.FC<RichTextEditorProps> = ({
//   value,
//   onChange,
//   className,
//   disabled,
//   modules=cModules,
//   placeholder = "Write your content here...",
//   label, required, description, labelStyle, name, error
// }) => {
//   const [isMounted, setIsMounted] = useState(false)

//   useEffect(() => {
//     setIsMounted(true)
//   }, [])

//   if (!isMounted) return <div className="min-h-[300px] border p-4 rounded-md bg-gray-50">Loading editor...</div>

//   return (
//     <div className={cn('pb-2',)}>
//       {label && (
//         <div className="">
//           <Label htmlFor={name} className={cn("flex items-center text-base gap-1", labelStyle)}>
//             {label} {required && <span className="text-red-500">*</span>}
//           </Label>
//           {description && <small className="text-foreground/60">{description}</small>}
//         </div>
//       )}
//       <ReactQuill
//         theme="snow"
//         value={value}
//         onChange={onChange}
//         readOnly={disabled}
//         modules={modules}
//         formats={formats}
//         placeholder={placeholder}
//           className={cn(
//             "rich-editor",
//             disabled && "readonly",
//             className
//           )}
//       />
//       {error && <small className="text-red-500 ">{error}</small>}
//     </div>
//   )
// }


// interface RichTextReadProps {
//   content: string
//   className?: string
// }

// export const RichTextRead: React.FC<RichTextReadProps> = ({
//   content,
//   className,
// }) => {
//   return (
//     <ReactQuill
     
//          value={content}
//         readOnly={true}
//         modules={{}}
//         formats={formats}
 
//           className={cn(
//             "rich-editor",
//             "readonly",
//             className
//           )}
//       />
//   )
// }
 

 

// interface RichTextReadProps {
//   content: string;
//   className?: string;
// }
 
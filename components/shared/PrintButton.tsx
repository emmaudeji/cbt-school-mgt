"use client"

import { useReactToPrint } from "react-to-print"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PrintButtonProps {
  contentRef: React.RefObject<HTMLElement | null>
  title?: string
  label?: string
  className?: string
}

export function PrintButton({
  contentRef,
  title = "Document",
  label = "Print",
  className,
}: PrintButtonProps) {
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: title,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        img {
          max-width: 100%;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        tr {
          break-inside: avoid;
        }
      }
    `,
  })

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handlePrint}
      className={className}
    >
      <Printer className="size-4" />
      {label}
    </Button>
  )
}
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"
import type { VariantProps } from "class-variance-authority"

type LinkButtonProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants> & {
    showArrow?: boolean
  }

export function LinkButton({
  children,
  className,
  showArrow = false,
  variant = "default",
  size = "default",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      {...props}
      className={cn(
        buttonVariants({ variant, size }),
        className,
      )}
    >
      {children}
      {showArrow && <ArrowRight className="size-4" />}
    </Link>
  )
}

import type { CSSProperties } from "react"
import type { AppAppearance } from "@/types"

export function readableTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const linear = (value: number) =>
    value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4

  const luminance =
    0.2126 * linear(r) +
    0.7152 * linear(g) +
    0.0722 * linear(b)

  return luminance > 0.179 ? "#111827" : "#FFFFFF"
}

export function getBrandStyles(
  appearance: AppAppearance
): CSSProperties {
  return {
    "--brand-primary": appearance.primary,
    "--brand-accent": appearance.accent,
    "--brand-primary-foreground":
      readableTextColor(appearance.primary),
  } as CSSProperties
}

export function applyBrandTheme(
  appearance: AppAppearance
) {
  const root = document.documentElement
  const styles = getBrandStyles(appearance)

  Object.entries(styles).forEach(([name, value]) => {
    root.style.setProperty(name, String(value))
  })
}

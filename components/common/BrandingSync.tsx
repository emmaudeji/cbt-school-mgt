
"use client"

import { applyBrandTheme } from "@/lib/brand-theme"
import { useSchoolBranding } from "@/store/branding-store"
import { useEffect } from "react"
 
export function BrandThemeSync() {
  const { appearance } = useSchoolBranding()

  useEffect(() => {
    applyBrandTheme(appearance)
  }, [appearance])

  return null
}

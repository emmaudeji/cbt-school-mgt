
import { Inter, Geist_Mono } from "next/font/google"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./globals.css"
import { getPublicBranding } from "@/services/auth"
import { getBrandStyles } from "@/lib/brand-theme"
import { BrandingProvider } from "@/store/branding-store"
import { BrandThemeSync } from "@/components/common/BrandingSync"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const branding = await getPublicBranding()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-school-brand
      style={getBrandStyles(branding.appearance)}
      className={cn(
        "antialiased font-sans",
        inter.variable,
        fontMono.variable
      )}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme={branding.appearance.mode}
          enableSystem={false}
          disableTransitionOnChange
        >
          <BrandingProvider initialBranding={branding}>
            <BrandThemeSync />

            {children}

            <ToastContainer
              position="top-right"
              autoClose={3500}
              newestOnTop
              pauseOnHover
            />
          </BrandingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

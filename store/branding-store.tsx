
"use client"

import { SchoolBranding } from "@/types"
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"

import { createStore, useStore } from "zustand"

interface BrandingState {
  branding: SchoolBranding
  setBranding: (branding: SchoolBranding) => void
}

function createBrandingStore(initial: SchoolBranding) {
  return createStore<BrandingState>((set) => ({
    branding: initial,
    setBranding: (branding) => set({ branding }),
  }))
}

type BrandingStore = ReturnType<typeof createBrandingStore>

const BrandingContext = createContext<BrandingStore | null>(null)

export function BrandingProvider({
  initialBranding,
  children,
}: {
  initialBranding: SchoolBranding
  children: ReactNode
}) {
  const [store] = useState(() =>
    createBrandingStore(initialBranding)
  )

  return (
    <BrandingContext.Provider value={store}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding<T>(
  selector: (state: BrandingState) => T
): T {
  const store = useContext(BrandingContext)

  if (!store) {
    throw new Error("BrandingProvider is missing")
  }

  return useStore(store, selector)
}

// Convenient hook for ordinary components
export function useSchoolBranding() {
  return useBranding((state) => state.branding)
}

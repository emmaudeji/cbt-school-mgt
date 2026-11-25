
"use client"

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"

import { createStore, useStore } from "zustand"

import type {
  SchoolContext,
  Organization,
  UserProfile,
  OrganizationMembership,
  AppRole,
  AppPermission,
} from "@/types"

interface OrgState {
  organization: Organization
  user: UserProfile
  membership: OrganizationMembership
  roles: AppRole[]
  permissions: AppPermission[]

  // Convenience checks for client-side UI.
  hasRole: (role: AppRole) => boolean
  can: (permission: AppPermission) => boolean
  isSchool: () => boolean
}

function createOrgStore(context: SchoolContext) {
  return createStore<OrgState>((_set, get) => ({
    organization: context.organization,
    user: context.user,
    membership: context.membership,
    roles: context.roles,
    permissions: context.permissions,

    hasRole: (role) => get().roles.includes(role),

    can: (permission) =>
      get().permissions.includes(permission),

    isSchool: () =>
      get().organization.type === "school",
  }))
}

type OrgStore = ReturnType<typeof createOrgStore>

const OrgStoreContext = createContext<OrgStore | null>(null)

interface OrgProviderProps {
  initialContext: SchoolContext
  children: ReactNode
}

export function OrgProvider({
  initialContext,
  children,
}: OrgProviderProps) {
  const [store] = useState(() =>
    createOrgStore(initialContext)
  )

  return (
    <OrgStoreContext.Provider value={store}>
      {children}
    </OrgStoreContext.Provider>
  )
}

export function useOrgStore<T>(
  selector: (state: OrgState) => T
): T {
  const store = useContext(OrgStoreContext)

  if (!store) {
    throw new Error(
      "useOrgStore must be used within OrgProvider"
    )
  }

  return useStore(store, selector)
}

export function useOrgProviderAvailable(): boolean {
  return useContext(OrgStoreContext) !== null
}
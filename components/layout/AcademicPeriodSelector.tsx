
// "use client"

// import {
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react"

// import {
//   usePathname,
//   useRouter,
//   useSearchParams,
// } from "next/navigation"

// import {
//   CalendarDays,
//   Check,
//   ChevronDown,
//   Loader2,
//   RefreshCw,
//   Settings2,
// } from "lucide-react"

// import { toast } from "react-toastify"

// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover"

// import { createClient } from "@/utils/supabase/client"
// import { tables, urls } from "@/constants"
// import { useOrgStore } from "@/store/org-store"

// type AcademicTermOption = {
//   id: string
//   name: string
//   position: number
//   starts_on: string | null
//   ends_on: string | null
// }

// type AcademicSessionOption = {
//   id: string
//   name: string
//   is_current: boolean
//   starts_on: string | null
//   ends_on: string | null
//   terms: AcademicTermOption[]
// }

// function today() {
//   const now = new Date()

//   const parts = new Intl.DateTimeFormat("en-GB", {
//     timeZone: "Africa/Lagos",
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).formatToParts(now)

//   const get = (type: string) =>
//     parts.find((part) => part.type === type)?.value ?? ""

//   return `${get("year")}-${get("month")}-${get("day")}`
// }

// function getDefaultTerm(
//   terms: AcademicTermOption[]
// ): AcademicTermOption | null {
//   const ordered = [...terms].sort(
//     (a, b) => a.position - b.position
//   )

//   const date = today()

//   return (
//     ordered.find(
//       (term) =>
//         term.starts_on &&
//         term.ends_on &&
//         term.starts_on <= date &&
//         date <= term.ends_on
//     ) ??
//     ordered[0] ??
//     null
//   )
// }

// export default function AcademicPeriodSelector() {
//   const router = useRouter()
//   const pathname = usePathname()
//   const searchParams = useSearchParams()

//   const organizationId = useOrgStore(
//     (state) => state.organization.id
//   )

//   const sessionId = useOrgStore(
//     (state) => state.sessionId
//   )

//   const sessionName = useOrgStore(
//     (state) => state.sessionName
//   )

//   const termId = useOrgStore(
//     (state) => state.termId
//   )

//   const termName = useOrgStore(
//     (state) => state.termName
//   )

//   const setAcademicPeriod = useOrgStore(
//     (state) => state.setAcademicPeriod
//   )

//   const [open, setOpen] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [loaded, setLoaded] = useState(false)

//   // Local component data only, never stored globally.
//   const [sessions, setSessions] = useState<
//     AcademicSessionOption[]
//   >([])

//   const loadingRef = useRef(false)

//   const urlSessionId = searchParams.get("session")
//   const urlTermId = searchParams.get("term")

//   const selectedSession = sessions.find(
//     (session) => session.id === sessionId
//   )

//   const selectedTerm = selectedSession?.terms.find(
//     (term) => term.id === termId
//   )

//   const loadSessions = useCallback(
//     async (refresh = false) => {
//       if ((!refresh && loaded) || loadingRef.current) {
//         return
//       }

//       loadingRef.current = true
//       setLoading(true)

//       try {
//         const db = createClient()

//         const { data, error } = await db
//           .from(tables.school_academic_sessions)
//           .select(`
//             id,
//             name,
//             is_current,
//             starts_on,
//             ends_on,
//             terms:school_terms (
//               id,
//               name,
//               position,
//               starts_on,
//               ends_on
//             )
//           `)
//           .eq("organization_id", organizationId)
//           .order("starts_on", { ascending: false })

//         if (error) throw error

//         const records = (
//           data ?? []
//         ) as AcademicSessionOption[]

//         const sorted = records.map((session) => ({
//           ...session,
//           terms: [...(session.terms ?? [])].sort(
//             (a, b) => a.position - b.position
//           ),
//         }))

//         setSessions(sorted)
//         setLoaded(true)

//         // Resolve the selected period from the latest
//         // URL and store values.
//         const params = new URLSearchParams(
//           window.location.search
//         )

//         const requestedSessionId =
//           params.get("session") ?? sessionId

//         const requestedTermId =
//           params.get("term") ?? termId

//         const session =
//           sorted.find(
//             (item) => item.id === requestedSessionId
//           ) ??
//           sorted.find((item) => item.is_current) ??
//           sorted[0]

//         if (!session) {
//           setAcademicPeriod({
//             sessionId: null,
//             sessionName: null,
//             termId: null,
//             termName: null,
//           })
//           return
//         }

//         const term =
//           session.terms.find(
//             (item) => item.id === requestedTermId
//           ) ??
//           getDefaultTerm(session.terms)

//         setAcademicPeriod({
//           sessionId: session.id,
//           sessionName: session.name,
//           termId: term?.id ?? null,
//           termName: term?.name ?? null,
//         })
//       } catch (error) {
//         console.error("[ACADEMIC PERIOD SELECTOR]", error)
//         toast.error("Unable to load academic sessions.")
//       } finally {
//         loadingRef.current = false
//         setLoading(false)
//       }
//     },
//     [
//       loaded,
//       organizationId,
//       sessionId,
//       termId,
//       setAcademicPeriod,
//     ]
//   )

//   // A shared/bookmarked URL may specify a different period
//   // from the school's default current period.
//   // Fetch its details only when this resolution is necessary.
//   useEffect(() => {
//     if (
//       urlSessionId &&
//       (
//         urlSessionId !== sessionId ||
//         (urlTermId !== null && urlTermId !== termId)
//       ) &&
//       !loaded
//     ) {
//         queueMicrotask(() => {
//           void loadSessions()
//         })
//     }
//   }, [
//     urlSessionId,
//     urlTermId,
//     sessionId,
//     termId,
//     loaded,
//     loadSessions,
//   ])

//   function updateUrl(
//     nextSessionId: string,
//     nextTermId: string | null
//   ) {
//     const params = new URLSearchParams(
//       searchParams.toString()
//     )

//     params.set("session", nextSessionId)

//     if (nextTermId) {
//       params.set("term", nextTermId)
//     } else {
//       params.delete("term")
//     }

//     router.replace(
//       `${pathname}?${params.toString()}`,
//       { scroll: false }
//     )
//   }

//   function selectSession(session: AcademicSessionOption) {
//     const term = getDefaultTerm(session.terms)

//     setAcademicPeriod({
//       sessionId: session.id,
//       sessionName: session.name,
//       termId: term?.id ?? null,
//       termName: term?.name ?? null,
//     })

//     updateUrl(session.id, term?.id ?? null)
//   }

//   function selectTerm(term: AcademicTermOption) {
//     if (!selectedSession) return

//     setAcademicPeriod({
//       sessionId: selectedSession.id,
//       sessionName: selectedSession.name,
//       termId: term.id,
//       termName: term.name,
//     })

//     updateUrl(selectedSession.id, term.id)
//     setOpen(false)
//   }

//   return (
//     <Popover
//       open={open}
//       onOpenChange={(nextOpen) => {
//         setOpen(nextOpen)

//         if (nextOpen) {
//           void loadSessions()
//         }
//       }}
//     >
//       <PopoverTrigger asChild>
//         <Button
//           type="button"
//           variant="outline"
//           className="h-10 max-w-64 justify-between gap-2 rounded-full px-3"
//         >
//           <CalendarDays className="size-4 shrink-0 text-primary" />

//           <div className="min-w-0 text-left">
//             <p className="truncate text-xs font-semibold">
//               {selectedSession?.name ??
//                 sessionName ??
//                 "Select Session"}
//             </p>

//             <p className="truncate text-[11px] font-normal text-muted-foreground">
//               {selectedTerm?.name ??
//                 termName ??
//                 "Select Term"}
//             </p>
//           </div>

//           <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
//         </Button>
//       </PopoverTrigger>

//       <PopoverContent
//         align="end"
//         sideOffset={8}
//         className="w-[min(24rem,calc(100vw-1.5rem))] space-y-4 p-4"
//       >
//         <div className="flex items-center justify-between gap-3">
//           <div>
//             <h3 className="font-semibold">
//               Academic Period
//             </h3>

//             <p className="mt-1 text-xs text-muted-foreground">
//               Choose the session and term you want to view.
//             </p>
//           </div>

//           <Button
//             type="button"
//             size="icon"
//             variant="ghost"
//             disabled={loading}
//             aria-label="Refresh academic sessions"
//             onClick={() => void loadSessions(true)}
//           >
//             <RefreshCw
//               className={
//                 loading ? "size-4 animate-spin" : "size-4"
//               }
//             />
//           </Button>
//         </div>

//         {loading && !loaded ? (
//           <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
//             <Loader2 className="size-4 animate-spin" />
//             Loading academic periods...
//           </div>
//         ) : sessions.length === 0 ? (
//           <div className="space-y-3 rounded-lg border border-dashed p-4 text-center">
//             <CalendarDays className="mx-auto size-8 text-muted-foreground" />

//             <p className="text-sm font-medium">
//               No academic sessions found
//             </p>

//             <p className="text-xs text-muted-foreground">
//               Prepare your first session to organize
//               classes and academic records.
//             </p>

//             <Button
//               size="sm"
//               onClick={() => {
//                 setOpen(false)
//                 router.push(urls.sessionSetup)
//               }}
//             >
//               Prepare Session
//             </Button>
//           </div>
//         ) : (
//           <>
//             <div className="space-y-2">
//               <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
//                 Academic Session
//               </p>

//               <div className="max-h-44 space-y-1 overflow-y-auto">
//                 {sessions.map((session) => {
//                   const selected = session.id === sessionId

//                   return (
//                     <button
//                       key={session.id}
//                       type="button"
//                       onClick={() => selectSession(session)}
//                       className={[
//                         "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
//                         selected
//                           ? "bg-primary/10 text-primary"
//                           : "hover:bg-muted",
//                       ].join(" ")}
//                     >
//                       <span className="flex min-w-0 items-center gap-2">
//                         <span className="truncate font-medium">
//                           {session.name}
//                         </span>

//                         {session.is_current && (
//                           <Badge
//                             variant="secondary"
//                             className="text-[10px]"
//                           >
//                             Current
//                           </Badge>
//                         )}
//                       </span>

//                       {selected && (
//                         <Check className="size-4 shrink-0" />
//                       )}
//                     </button>
//                   )
//                 })}
//               </div>
//             </div>

//             <div className="space-y-2 border-t border-border pt-3">
//               <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
//                 Academic Term
//               </p>

//               {selectedSession?.terms.length ? (
//                 <div className="grid grid-cols-3 gap-2">
//                   {selectedSession.terms.map((term) => {
//                     const selected = term.id === termId

//                     return (
//                       <button
//                         key={term.id}
//                         type="button"
//                         onClick={() => selectTerm(term)}
//                         className={[
//                           "flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center transition-colors",
//                           selected
//                             ? "border-primary bg-primary/10 text-primary"
//                             : "border-border hover:bg-muted",
//                         ].join(" ")}
//                       >
//                         <span className="text-xs font-medium">
//                           {term.name}
//                         </span>

//                         {selected && (
//                           <Check className="size-3" />
//                         )}
//                       </button>
//                     )
//                   })}
//                 </div>
//               ) : (
//                 <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
//                   No terms configured for this session.
//                 </p>
//               )}
//             </div>

//             <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
//               <p className="text-[11px] text-muted-foreground">
//                 Changes your viewing period only.
//               </p>

//               <Button
//                 type="button"
//                 size="sm"
//                 variant="ghost"
//                 onClick={() => {
//                   setOpen(false)
//                   router.push(urls.academicPeriods)
//                 }}
//               >
//                 <Settings2 className="size-4" />
//                 Manage
//               </Button>
//             </div>
//           </>
//         )}
//       </PopoverContent>
//     </Popover>
//   )
// }

"use client"

import * as React from "react"
import { AlertTriangle, Inbox, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"

export type Column<T> = {
  key: string
  header: string
  width?: number | string
  render: (row: T) => React.ReactNode
}

type BulkAction<T> = {
  label: string
  onClick: (rows: T[]) => void
  variant?: "default" | "destructive"
}

type DataTableProps<T> = {
  data: T[]
  columns: Column<T>[]
  rowKey: keyof T

  actions?: (row: T) => React.ReactNode
  bulkActions?: BulkAction<T>[]
  pagination?: React.ReactNode

  /** Optional row click handler — pass a function to navigate, open a drawer, etc. */
  onRowClick?: (row: T) => void

  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  actions,
  bulkActions,
  pagination,
  onRowClick,
  isLoading = false,
  error = null,
  emptyMessage = "No records found",
}: DataTableProps<T>) {
  const [selected, setSelected] = React.useState<Set<T[keyof T]>>(new Set())

  const toggleRow = React.useCallback((id: T[keyof T]) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleAll = React.useCallback(() => {
    setSelected((prev) =>
      prev.size === data.length ? new Set() : new Set(data.map((row) => row[rowKey]))
    )
  }, [data, rowKey])

  const selectedRows = React.useMemo(
    () => data.filter((row) => selected.has(row[rowKey])),
    [data, selected, rowKey]
  )

  // Prevent row-click firing when interacting with checkbox / actions cells
  const stopRowClick = (e: React.SyntheticEvent) => e.stopPropagation()

  if (error) {
    return (
      <div className="border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-destructive/5">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <p className="text-sm font-medium text-destructive">Something went wrong</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-background">
      {/* BULK ACTIONS */}
      {selected.size > 0 && bulkActions && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
          <p className="text-sm">{selected.size} selected</p>

          <div className="flex gap-2">
            {bulkActions.map((action) => (
              <button
                key={action.label}
                onClick={() => action.onClick(selectedRows)}
                className={cn(
                  "px-3 py-1.5 text-sm border rounded-md transition",
                  action.variant === "destructive"
                    ? "bg-destructive text-white border-destructive"
                    : "bg-primary text-white border-primary"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TABLE */}
      <div
        className={cn(
          "relative overflow-x-auto",
          // hide scrollbar cross-browser
          "[scrollbar-width:none] [-ms-overflow-style:none]",
          "[&::-webkit-scrollbar]:hidden"
        )}
      >
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-4 py-3 w-[40px]">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selected.size === data.length}
                  onChange={toggleAll}
                  disabled={isLoading}
                  className="rounded"
                />
              </th>

              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="px-4 py-3 text-left font-medium whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}

              {actions && (
                <th
                  scope="col"
                  aria-label="Actions"
                  className="sticky right-0 z-10 bg-muted/30  px-3 py-3 w-[56px]"
                >
                  <span className="flex items-center justify-center">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* LOADING */}
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td colSpan={columns.length + 2} className="px-4 py-4">
                    <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  </td>
                </tr>
              ))}

            {/* EMPTY */}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Inbox className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">Nothing here yet</p>
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {/* DATA */}
            {!isLoading &&
              data.map((row) => {
                const id = row[rowKey]
                const clickable = Boolean(onRowClick)

                return (
                  <tr
                    key={String(id)}
                    onClick={clickable ? () => onRowClick!(row) : undefined}
                    className={cn(
                      "border-t transition",
                      "hover:bg-muted/40",
                      clickable && "cursor-pointer"
                    )}
                  >
                    <td className="px-4 py-3" onClick={stopRowClick}>
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleRow(id)}
                        className="rounded"
                      />
                    </td>

                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render(row)}
                      </td>
                    ))}

                    {actions && (
                      <td
                        className="sticky right-0 z-10 bg-background px-3 py-3 text-center group-hover:bg-muted/40"
                        onClick={stopRowClick}
                      >
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      {pagination && !isLoading && data.length > 0 && (
        <div className="border-t px-4 py-3 flex justify-end">{pagination}</div>
      )}
    </div>
  )
}




// "use client"

// import * as React from "react"
// import { AlertTriangle, Inbox } from "lucide-react"
// import { cn } from "@/lib/utils"

// export type Column<T> = {
//   key: string
//   header: string
//   width?: number | string
//   render: (row: T) => React.ReactNode
// }

// type BulkAction<T> = {
//   label: string
//   onClick: (rows: T[]) => void
//   variant?: "default" | "destructive"
// }

// type DataTableProps<T> = {
//   data: T[]
//   columns: Column<T>[]
//   rowKey: keyof T

//   actions?: (row: T) => React.ReactNode
//   bulkActions?: BulkAction<T>[]
//   pagination?: React.ReactNode

//   isLoading?: boolean
//   error?: string | null
//   emptyMessage?: string
// }

// export function DataTable<T>({
//   data,
//   columns,
//   rowKey,
//   actions,
//   bulkActions,
//   pagination,
//   isLoading = false,
//   error = null,
//   emptyMessage = "No records found",
// }: DataTableProps<T>) {
//   const [selected, setSelected] = React.useState<Set<T[keyof T]>>(new Set())

//   const toggleRow = (id: T[keyof T]) => {
//     setSelected((prev) => {
//       const next = new Set(prev)
//       next.has(id) ? next.delete(id) : next.add(id)
//       return next
//     })
//   }

//   const toggleAll = () => {
//     if (selected.size === data.length) {
//       setSelected(new Set())
//     } else {
//       setSelected(new Set(data.map((row) => row[rowKey])))
//     }
//   }

//   const selectedRows = React.useMemo(
//     () => data.filter((row) => selected.has(row[rowKey])),
//     [data, selected, rowKey]
//   )

//   if (error) {
//     return (
//       <div className="border rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-destructive/5">
//         <AlertTriangle className="h-6 w-6 text-destructive" />

//         <p className="text-sm font-medium text-destructive">
//           Something went wrong
//         </p>

//         <p className="text-sm text-muted-foreground">{error}</p>
//       </div>
//     )
//   }

//   return (
//     <div className="border rounded-xl overflow-hidden bg-background">
//       {/* BULK ACTIONS */}
//       {selected.size > 0 && bulkActions && (
//         <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
//           <p className="text-sm">{selected.size} selected</p>

//           <div className="flex gap-2">
//             {bulkActions.map((action) => (
//               <button
//                 key={action.label}
//                 onClick={() => action.onClick(selectedRows)}
//                 className={cn(
//                   "px-3 py-1.5 text-sm border rounded-md transition",
//                   action.variant === "destructive"
//                     ? "bg-destructive text-white border-destructive"
//                     : "bg-primary text-white border-primary"
//                 )}
//               >
//                 {action.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* TABLE */}
//       <div className="relative overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead className="border-b bg-muted/30">
//             <tr>
//               <th className="px-4 py-3 w-[40px]">
//                 <input
//                   type="checkbox"
//                   checked={data.length > 0 && selected.size === data.length}
//                   onChange={toggleAll}
//                   disabled={isLoading}
//                   className="rounded"
//                 />
//               </th>

//               {columns.map((col) => (
//                 <th
//                   key={col.key}
//                   style={{ width: col.width }}
//                   className="px-4 py-3 text-left font-medium whitespace-nowrap"
//                 >
//                   {col.header}
//                 </th>
//               ))}

//               {actions && (
//                 <th className="px-4 py-3 text-right w-[120px]">
//                   Actions
//                 </th>
//               )}
//             </tr>
//           </thead>

//           <tbody>
//             {/* LOADING */}
//             {isLoading &&
//               Array.from({ length: 6 }).map((_, i) => (
//                 <tr key={i} className="border-t">
//                   <td
//                     colSpan={columns.length + 2}
//                     className="px-4 py-4"
//                   >
//                     <div className="h-4 w-full rounded bg-muted animate-pulse" />
//                   </td>
//                 </tr>
//               ))}

//             {/* EMPTY */}
//             {!isLoading && data.length === 0 && (
//               <tr>
//                 <td colSpan={columns.length + 2} className="px-6 py-16">
//                   <div className="flex flex-col items-center gap-3 text-center">
//                     <Inbox className="h-6 w-6 text-muted-foreground" />

//                     <p className="text-sm font-medium">
//                       Nothing here yet
//                     </p>

//                     <p className="text-sm text-muted-foreground">
//                       {emptyMessage}
//                     </p>
//                   </div>
//                 </td>
//               </tr>
//             )}

//             {/* DATA */}
//             {!isLoading &&
//               data.map((row) => {
//                 const id = row[rowKey]

//                 return (
//                   <tr
//                     key={String(id)}
//                     className="border-t hover:bg-muted/40 transition"
//                   >
//                     <td className="px-4 py-3">
//                       <input
//                         type="checkbox"
//                         checked={selected.has(id)}
//                         onChange={() => toggleRow(id)}
//                         className="rounded"
//                       />
//                     </td>

//                     {columns.map((col) => (
//                       <td key={col.key} className="px-4 py-3">
//                         {col.render(row)}
//                       </td>
//                     ))}

//                     {actions && (
//                       <td className="px-4 py-3 text-right">
//                         {actions(row)}
//                       </td>
//                     )}
//                   </tr>
//                 )
//               })}
//           </tbody>
//         </table>
//       </div>

//       {/* FOOTER */}
//       {pagination && !isLoading && data.length > 0 && (
//         <div className="border-t px-4 py-3 flex justify-end">
//           {pagination}
//         </div>
//       )}
//     </div>
//   )
// }
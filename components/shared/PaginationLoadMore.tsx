"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

type PaginationProps = {
  hasMore: boolean
  loading?: boolean
  onLoadMore: () => void
}

const PaginationLoadMore: React.FC<PaginationProps> = ({ hasMore, loading = false, onLoadMore }) => {
  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = loadMoreRef.current
    if (!element || !hasMore || loading) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore()
      },
      { rootMargin: "300px" }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  if (!hasMore && !loading) return null

  return (
    <div ref={loadMoreRef} className="flex min-h-16 items-center justify-center">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading more...
        </div>
      )}
    </div>
  )
}

export default PaginationLoadMore
import "server-only"

export const EXAM_COMPLETION_GRACE_SECONDS =
  24 * 60 * 60

export function examCookieMaxAge(
  sessionExpiresAt: string
): number {
  const expiresAt = Date.parse(sessionExpiresAt)

  if (!Number.isFinite(expiresAt)) {
    return 0
  }

  const secondsUntilExpiry = Math.floor(
    (expiresAt - Date.now()) / 1000
  )

  if (secondsUntilExpiry <= 0) {
    return 0
  }

  // Keeping the cookie does NOT extend the
  // database candidate session or exam deadline.
  return (
    secondsUntilExpiry +
    EXAM_COMPLETION_GRACE_SECONDS
  )
}
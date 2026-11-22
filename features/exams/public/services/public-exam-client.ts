
import "server-only"

import { createClient } from "@supabase/supabase-js"

export function getPublicExamClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SECRET_KEY

  if (!url || !serviceKey) {
    throw new Error("Public CBT server configuration is missing")
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

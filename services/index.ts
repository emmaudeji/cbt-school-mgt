import "server-only"

import { createClient } from "@/utils/supabase/server"

type Filters = Record<string, string | number | boolean | null>
type Payload = Record<string, unknown>

export type DbResult<T> = {
  data: T | null
  error: string | null
}

const fail = <T>(error: string): DbResult<T> => ({ data: null, error })

type FilterableQuery = {
  eq: (key: string, value: string | number | boolean) => FilterableQuery
  is: (key: string, value: null) => FilterableQuery
}

function applyFilters<Q>(
  query: Q,
  filters: Filters
): Q {
  let filteredQuery = query as unknown as FilterableQuery

  for (const [key, value] of Object.entries(filters)) {
    filteredQuery = value === null
      ? filteredQuery.is(key, null)
      : filteredQuery.eq(key, value)
  }
  return filteredQuery as unknown as Q
}

export async function fetchMultiple<T>(
  table: string,
  filters: Filters = {},
  columns = "*"
): Promise<DbResult<T[]>> {
  const db = await createClient()
  const { data, error } = await applyFilters(
    db.from(table).select(columns), filters
  )

  return error ? fail(error.message) : { data: data as T[], error: null }
}

export async function fetchOne<T>(
  table: string,
  filters: Filters,
  columns = "*"
): Promise<DbResult<T>> {
  if (!Object.keys(filters).length) return fail("Filters are required")

  const db = await createClient()
  const { data, error } = await applyFilters(
    db.from(table).select(columns), filters
  ).maybeSingle()

  return error ? fail(error.message) : { data: data as T | null, error: null }
}

export async function insertData<T>(
  table: string,
  values: Payload,
  columns = "*"
): Promise<DbResult<T>> {
  const db = await createClient()
  const { data, error } = await db.from(table)
    .insert(values).select(columns).single()

  return error ? fail(error.message) : { data: data as T, error: null }
}

export async function updateData<T>(
  table: string,
  filters: Filters,
  values: Payload,
  columns = "*"
): Promise<DbResult<T>> {
  if (!Object.keys(filters).length) return fail("Filters are required")
  if (!Object.keys(values).length) return fail("No changes provided")

  const db = await createClient()
  const { data, error } = await applyFilters(
    db.from(table).update(values).select(columns), filters
  ).single()

  return error ? fail(error.message) : { data: data as T, error: null }
}

export async function deleteData(
  table: string,
  filters: Filters
): Promise<DbResult<number>> {
  if (!Object.keys(filters).length) return fail("Filters are required")

  const db = await createClient()
  const { error, count } = await applyFilters(
    db.from(table).delete({ count: "exact" }), filters
  )

  return error ? fail(error.message) : { data: count ?? 0, error: null }
}
"use client"

import { useCallback, useEffect, useState } from "react"

interface ApiState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

// Fetch a same-origin API route. Pass null to skip (e.g. until a filter is chosen).
export function useApi<T>(url: string | null) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    loading: Boolean(url),
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!url) {
      setState({ data: null, error: null, loading: false })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fetch(url)
      .then(async (res) => {
        const body = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(
            (body && (body.error || body.message)) || `Request failed (${res.status})`
          )
        }
        return body as T
      })
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false })
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ data: null, error: e.message, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [url, version])

  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  return { ...state, refresh }
}

export async function postApi<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Request failed (${res.status})`)
  }
  return data as T
}

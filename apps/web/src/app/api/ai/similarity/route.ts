import { NextResponse } from "next/server"
import { caseSummary, fetchCorpus, ml, MLServiceError } from "@/lib/ml"

interface SearchResult {
  results: Array<{
    fir_id: string
    score: number
    crime_type: string
    location: string
    district: string
    date_time: string
    status: string
    weapon: string
  }>
  total: number
}

// Semantic search over FIR narratives.
export async function POST(request: Request) {
  let query: string
  let district: string | undefined
  let crimeType: string | undefined
  let topK: number
  try {
    const body = await request.json()
    query = String(body.query ?? "").trim()
    district = body.district ? String(body.district) : undefined
    crimeType = body.crimeType ? String(body.crimeType) : undefined
    topK = Math.min(Math.max(Number(body.topK) || 10, 1), 50)
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  try {
    const { firs, byId } = await fetchCorpus({ district, crimeType, limit: 300 })
    if (firs.length === 0) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const search = await ml<SearchResult>("similarity/search", {
      request: { query_text: query, top_k: topK },
      firs,
    })

    const results = search.results.map((r) => {
      const c = byId.get(r.fir_id)
      const s = c ? caseSummary(c) : null
      return {
        firNumber: r.fir_id,
        score: Math.round(r.score * 1000) / 10,
        type: r.crime_type || s?.crimeType || null,
        district: r.district || s?.district || null,
        policeStation: s?.policeStation ?? r.location ?? null,
        date: (r.date_time || s?.date || "").split("T")[0] || null,
        status: r.status || s?.status || null,
        weapon: r.weapon || s?.weapon || null,
        briefFacts: s?.briefFacts?.slice(0, 200) ?? null,
      }
    })

    return NextResponse.json({ results, total: search.total, corpusSize: firs.length })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

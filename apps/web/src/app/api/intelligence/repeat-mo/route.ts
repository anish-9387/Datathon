import { NextResponse } from "next/server"
import { caseSummary, fetchCorpus, ml, MLServiceError } from "@/lib/ml"

interface ClusterResult {
  clusters?: Array<{
    cluster_id: number
    fir_ids: string[]
    size: number
    confidence: number
    representative_mo: string
  }>
}

// Repeat-MO detection: MO clusters with >= minSize members flag a possible
// serial offender pattern.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? undefined
  const minSize = Math.max(parseInt(searchParams.get("minSize") || "3", 10) || 3, 2)

  try {
    const { firs, byId } = await fetchCorpus({ district, limit: 400 })
    if (firs.length === 0) return NextResponse.json({ patterns: [] })

    const result = await ml<ClusterResult>("clustering/mo-discover", {
      request: { fir_ids: firs.map((f) => f.fir_id), algorithm: "dbscan", min_samples: minSize },
      firs,
    })

    const patterns = (result.clusters ?? [])
      .filter((c) => c.size >= minSize)
      .sort((a, b) => b.size - a.size)
      .map((c, i) => {
        const members = c.fir_ids
          .map((id) => byId.get(id))
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
        const summaries = members.map(caseSummary)
        const dates = summaries.map((s) => s.date).filter(Boolean).sort()
        const lastIncident = dates[dates.length - 1] ?? null
        const recentDays = lastIncident
          ? (Date.now() - new Date(lastIncident).getTime()) / 86400000
          : Infinity
        const risk =
          c.size >= 8 || (c.size >= 5 && recentDays < 90)
            ? "critical"
            : c.size >= 5 || recentDays < 90
              ? "high"
              : "medium"
        return {
          id: `MO-${String(i + 1).padStart(3, "0")}`,
          pattern: c.representative_mo,
          frequency: c.size,
          similarity: Math.round(c.confidence * 100),
          locations: [...new Set(summaries.map((s) => s.policeStation).filter(Boolean))].slice(0, 5),
          districts: [...new Set(summaries.map((s) => s.district).filter(Boolean))].slice(0, 5),
          crimeTypes: [...new Set(summaries.map((s) => s.crimeType))],
          firstIncident: dates[0]?.split("T")[0] ?? null,
          lastIncident: lastIncident?.split("T")[0] ?? null,
          risk,
          firNumbers: c.fir_ids.slice(0, 10),
        }
      })

    return NextResponse.json({ patterns, corpusSize: firs.length })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

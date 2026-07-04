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
  noise_count?: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? undefined
  const algorithm = searchParams.get("algorithm") === "hdbscan" ? "hdbscan" : "dbscan"

  try {
    const { firs, byId } = await fetchCorpus({ district, limit: 300 })
    if (firs.length === 0) {
      return NextResponse.json({ clusters: [], noisePoints: 0, totalCases: 0 })
    }

    const result = await ml<ClusterResult>("clustering/mo-discover", {
      request: { fir_ids: firs.map((f) => f.fir_id), algorithm, min_samples: 3 },
      firs,
    })

    const clusters = (result.clusters ?? [])
      .filter((c) => c.size >= 2)
      .sort((a, b) => b.size - a.size)
      .map((c) => {
        const members = c.fir_ids
          .map((id) => byId.get(id))
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
        const summaries = members.map(caseSummary)
        const locations = [...new Set(summaries.map((s) => s.policeStation).filter(Boolean))]
        const districts = [...new Set(summaries.map((s) => s.district).filter(Boolean))]
        const dates = summaries.map((s) => s.date).filter(Boolean).sort()
        return {
          id: c.cluster_id,
          pattern: c.representative_mo,
          size: c.size,
          confidence: Math.round(c.confidence * 1000) / 10,
          crimeTypes: [...new Set(summaries.map((s) => s.crimeType))],
          locations: locations.slice(0, 5),
          districts: districts.slice(0, 5),
          firstIncident: dates[0]?.split("T")[0] ?? null,
          lastIncident: dates[dates.length - 1]?.split("T")[0] ?? null,
          sampleCases: summaries.slice(0, 3),
          firIds: c.fir_ids,
        }
      })

    return NextResponse.json({
      clusters,
      noisePoints: result.noise_count ?? 0,
      totalCases: firs.length,
      algorithm,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

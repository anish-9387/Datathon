import { NextResponse } from "next/server"
import { caseSummary, fetchCorpus, ml, MLServiceError } from "@/lib/ml"

interface DetectResult {
  results: Array<{
    fir_id: string
    anomaly_score: number
    is_anomaly: boolean
    explanation: string
  }>
  total_flagged: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? undefined
  const contamination = Math.min(
    Math.max(parseFloat(searchParams.get("contamination") || "0.08") || 0.08, 0.01),
    0.5
  )

  try {
    const { firs, byId } = await fetchCorpus({ district, limit: 300 })
    if (firs.length === 0) {
      return NextResponse.json({ anomalies: [], emerging: [], totalFlagged: 0 })
    }

    const [detection, emerging] = await Promise.all([
      ml<DetectResult>("anomaly/detect", {
        request: { fir_ids: firs.map((f) => f.fir_id), contamination },
        firs,
      }),
      ml<{ patterns: Array<Record<string, unknown>>; total: number }>(
        "anomaly/emerging",
        firs
      ),
    ])

    const anomalies = detection.results
      .filter((r) => r.is_anomaly)
      .sort((a, b) => b.anomaly_score - a.anomaly_score)
      .map((r, i) => {
        const c = byId.get(r.fir_id)
        const s = c ? caseSummary(c) : null
        return {
          id: `A-${String(i + 1).padStart(3, "0")}`,
          firNumber: r.fir_id,
          score: Math.round(r.anomaly_score * 100),
          explanation: r.explanation,
          type: s?.crimeType ?? null,
          district: s?.district ?? null,
          policeStation: s?.policeStation ?? null,
          date: s?.date?.split("T")[0] ?? null,
          description: s?.briefFacts?.slice(0, 200) ?? null,
          status: s?.status ?? null,
        }
      })

    return NextResponse.json({
      anomalies,
      emerging: emerging.patterns,
      totalFlagged: detection.total_flagged,
      corpusSize: firs.length,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

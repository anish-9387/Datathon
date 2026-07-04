import { NextResponse } from "next/server"
import { fetchCorpus, ml, MLServiceError } from "@/lib/ml"

interface NetworkResponse {
  nodes: Array<{ id: string; label: string; type: string; weight: number }>
  edges: Array<{ source: string; target: string; weight: number; relationship: string }>
  stats: Record<string, number>
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? undefined
  const crimeType = searchParams.get("type") ?? undefined
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "60", 10) || 60, 10),
    200
  )

  try {
    const { firs } = await fetchCorpus({ district, crimeType, limit, requireAccused: true })
    if (firs.length === 0) {
      return NextResponse.json({ nodes: [], edges: [], stats: { total_nodes: 0, total_edges: 0 } })
    }

    const network = await ml<NetworkResponse>("graph/criminal-network", {
      request: { fir_ids: firs.map((f) => f.fir_id) },
      firs,
    })

    return NextResponse.json({
      nodes: network.nodes,
      edges: network.edges.map((e) => ({ ...e, type: e.relationship })),
      stats: network.stats,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

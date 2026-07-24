import { NextResponse } from "next/server"
import { fetchCorpus, ml, MLServiceError } from "@/lib/ml"

interface NetworkNode {
  id: string
  label: string
  type: string
  weight: number
}

interface NetworkEdge {
  source: string
  target: string
  weight: number
  relationship: string
}

interface CriminalNetworkResult {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  stats: {
    total_nodes: number
    total_edges: number
    density: number
    connected_components: number
    avg_degree?: number
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? undefined

  try {
    const { firs } = await fetchCorpus({ district, limit: 300 })

    if (firs.length === 0) {
      return NextResponse.json({
        nodes: [],
        edges: [],
        stats: { total_nodes: 0, total_edges: 0, density: 0, connected_components: 0 },
      })
    }

    const graph = await ml<CriminalNetworkResult>("graph/criminal-network", {
      request: { fir_ids: firs.map((f) => f.fir_id) },
      firs,
    })

    return NextResponse.json({
      nodes: graph.nodes,
      edges: graph.edges,
      stats: graph.stats,
      corpusSize: firs.length,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

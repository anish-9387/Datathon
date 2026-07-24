import { NextResponse } from "next/server"
import { fetchCorpus, ml, MLServiceError } from "@/lib/ml"
import { getCriminals } from "@/lib/backend-data"

interface ScoreEntry {
  node_id: string
  label: string
  type: string
  pagerank_score?: number
  betweenness_score?: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? undefined
  const top = Math.min(Math.max(parseInt(searchParams.get("top") || "50", 10) || 50, 1), 200)

  try {
    const { firs } = await fetchCorpus({ district, limit: 300, requireAccused: true })
    if (firs.length === 0) {
      return NextResponse.json({ criminals: [] })
    }

    const [influence, centrality] = await Promise.all([
      ml<{ scores: ScoreEntry[] }>("graph/influence", firs),
      ml<{ scores: ScoreEntry[] }>("graph/centrality", firs),
    ])

    const betweennessById = new Map(
      centrality.scores.map((s) => [s.node_id, s.betweenness_score ?? 0])
    )

    const persons = influence.scores.filter((s) => s.type === "person")
    const maxPagerank = Math.max(...persons.map((p) => p.pagerank_score ?? 0), 1e-9)

    const data = await getCriminals()
    const criminals = persons.slice(0, top).map((p, i) => ({
      ...data.criminals[i % data.criminals.length],
      id: `C-${String(i + 1).padStart(3, "0")}`,
      name: p.label,
      influence: Math.round(((p.pagerank_score ?? 0) / maxPagerank) * 1000) / 10,
      pagerank: p.pagerank_score ?? 0,
      betweenness: Math.round((betweennessById.get(p.node_id) ?? 0) * 10000) / 10000,
    }))

    return NextResponse.json({ criminals, corpusSize: firs.length })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

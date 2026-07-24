import { NextResponse } from "next/server"
import { fetchCorpus, ml, MLServiceError } from "@/lib/ml"
import { getCriminals, type CriminalRecord } from "@/lib/backend-data"

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
      return NextResponse.json({ criminals: [], corpusSize: 0 })
    }

    // Network scores from the ML service + real criminal records from the DB.
    const [influence, centrality, records] = await Promise.all([
      ml<{ scores: ScoreEntry[] }>("graph/influence", firs),
      ml<{ scores: ScoreEntry[] }>("graph/centrality", firs),
      getCriminals(district).catch(() => ({ criminals: [] as CriminalRecord[], total: 0 })),
    ])

    const betweennessById = new Map(
      centrality.scores.map((s) => [s.node_id, s.betweenness_score ?? 0])
    )
    // DB criminal records keyed by name for enrichment.
    const recordByName = new Map(records.criminals.map((c) => [c.name, c]))

    // Live case count + latest incident per accused name, from the corpus.
    const liveCases = new Map<string, number>()
    const lastIncident = new Map<string, string>()
    for (const f of firs) {
      for (const name of f.accused_name.split(",").map((n) => n.trim()).filter(Boolean)) {
        liveCases.set(name, (liveCases.get(name) ?? 0) + 1)
        const d = f.date_time?.split("T")[0]
        if (d && (!lastIncident.has(name) || d > lastIncident.get(name)!)) {
          lastIncident.set(name, d)
        }
      }
    }

    const persons = influence.scores.filter((s) => s.type === "person")
    const maxPagerank = Math.max(...persons.map((p) => p.pagerank_score ?? 0), 1e-9)

    const criminals = persons.slice(0, top).map((p, i) => {
      const record = recordByName.get(p.label)
      const cases = liveCases.get(p.label) ?? record?.liveCases ?? 0
      return {
        id: record?.id ?? `C-${String(i + 1).padStart(3, "0")}`,
        name: p.label,
        // Network-derived scores always come from the live ML computation.
        influence: Math.round(((p.pagerank_score ?? 0) / maxPagerank) * 1000) / 10,
        pagerank: p.pagerank_score ?? 0,
        betweenness: Math.round((betweennessById.get(p.node_id) ?? 0) * 10000) / 10000,
        // Demographic / history fields from the DB record when available,
        // otherwise derived from the corpus — never fabricated.
        age: record?.age ?? 0,
        crimes: cases,
        repeat: record?.repeat ?? cases > 1,
        status: record?.status ?? "unknown",
        gang: record?.gang ?? "N/A",
        lastArrest: record?.lastArrest ?? "N/A",
        lastIncident: lastIncident.get(p.label) ?? record?.lastIncident ?? "N/A",
      }
    })

    return NextResponse.json({ criminals, corpusSize: firs.length })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

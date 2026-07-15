import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchCorpus, ml, MLServiceError } from "@/lib/ml"

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

    // Enrich with real case counts / ages / last-seen from the database.
    const names = persons.slice(0, top).map((p) => p.label)
    const accusedRows = await prisma.accused.findMany({
      where: { AccusedName: { in: names } },
      include: {
        caseMaster: {
          select: { CrimeRegisteredDate: true, IncidentFromDate: true },
        },
        arrestLinks: {
          include: {
            arrestSurrender: { select: { ArrestSurrenderDate: true } },
          },
        },
      },
    })
    const byName = new Map<string, typeof accusedRows>()
    for (const row of accusedRows) {
      if (!byName.has(row.AccusedName)) byName.set(row.AccusedName, [])
      byName.get(row.AccusedName)!.push(row)
    }

    const criminals = persons.slice(0, top).map((p, i) => {
      const rows = byName.get(p.label) ?? []
      const dates = rows
        .map((r) => r.caseMaster.IncidentFromDate ?? r.caseMaster.CrimeRegisteredDate)
        .filter(Boolean)
        .sort((a, b) => a!.getTime() - b!.getTime())
      const arrests = rows
        .flatMap((r) => r.arrestLinks.map((l) => l.arrestSurrender?.ArrestSurrenderDate))
        .filter((d): d is Date => Boolean(d))
        .sort((a, b) => a.getTime() - b.getTime())
      return {
        id: `C-${String(i + 1).padStart(3, "0")}`,
        name: p.label,
        age: rows.find((r) => r.AgeYear)?.AgeYear ?? null,
        crimes: rows.length,
        influence: Math.round(((p.pagerank_score ?? 0) / maxPagerank) * 1000) / 10,
        pagerank: p.pagerank_score ?? 0,
        betweenness: Math.round((betweennessById.get(p.node_id) ?? 0) * 10000) / 10000,
        repeat: rows.length > 1,
        status: dates.length
          ? Date.now() - dates[dates.length - 1]!.getTime() < 365 * 86400000
            ? "active"
            : "inactive"
          : "unknown",
        lastIncident: dates.length
          ? dates[dates.length - 1]!.toISOString().split("T")[0]
          : null,
        lastArrest: arrests.length
          ? arrests[arrests.length - 1].toISOString().split("T")[0]
          : null,
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

import { NextResponse } from "next/server"
import { caseSummary, fetchCorpus, ml, MLServiceError, type FIRInput } from "@/lib/ml"

interface GangResult {
  communities: Array<{
    gang_id: number
    members: Array<{ node_id: string; label: string; degree?: number }>
    size: number
    central_member: string
  }>
  total_gangs: number
  modularity_score: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? undefined

  try {
    const { firs, byId } = await fetchCorpus({ district, limit: 300, requireAccused: true })
    if (firs.length === 0) {
      return NextResponse.json({ gangs: [], modularity: 0, totalGangs: 0 })
    }

    const result = await ml<GangResult>("graph/gang-detection", {
      request: { fir_ids: firs.map((f) => f.fir_id) },
      firs,
    })

    // Map each accused name to the FIRs they appear in, to enrich communities.
    const nameToFirs = new Map<string, FIRInput[]>()
    for (const f of firs) {
      for (const name of f.accused_name.split(",").map((n) => n.trim()).filter(Boolean)) {
        if (!nameToFirs.has(name)) nameToFirs.set(name, [])
        nameToFirs.get(name)!.push(f)
      }
    }

    const gangs = result.communities.map((c) => {
      const memberNames = c.members.map((m) => m.label)
      const memberFirs = [
        ...new Map(
          memberNames
            .flatMap((n) => nameToFirs.get(n) ?? [])
            .map((f) => [f.fir_id, f])
        ).values(),
      ]
      const crimes = [...new Set(memberFirs.map((f) => f.crime_type).filter(Boolean))]
      const districtCounts = new Map<string, number>()
      for (const f of memberFirs) {
        districtCounts.set(f.district, (districtCounts.get(f.district) ?? 0) + 1)
      }
      const area =
        [...districtCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      const dates = memberFirs
        .map((f) => f.date_time)
        .filter((d): d is string => Boolean(d))
        .sort()
      const lastActive = dates[dates.length - 1] ?? null
      const active =
        lastActive !== null &&
        Date.now() - new Date(lastActive).getTime() < 365 * 86400000

      const leaderLabel =
        c.members.find((m) => m.node_id === c.central_member)?.label ?? c.central_member

      const sampleCases = memberFirs
        .slice(0, 3)
        .map((f) => byId.get(f.fir_id))
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .map(caseSummary)

      return {
        id: `G-${String(c.gang_id + 1).padStart(3, "0")}`,
        name: area ? `${area} Network ${c.gang_id + 1}` : `Network ${c.gang_id + 1}`,
        members: c.size,
        memberNames: memberNames.slice(0, 12),
        leader: leaderLabel,
        area,
        crimes: crimes.slice(0, 5),
        cases: memberFirs.length,
        formed: dates[0]?.split("T")[0] ?? null,
        lastActive: lastActive?.split("T")[0] ?? null,
        status: active ? "active" : "dormant",
        influence: Math.min(
          100,
          Math.round(
            (c.size * 10 + memberFirs.length * 3) /
              (result.communities[0] ? 1 : 1)
          )
        ),
        sampleCases,
      }
    })

    return NextResponse.json({
      gangs,
      totalGangs: result.total_gangs,
      modularity: result.modularity_score,
      corpusSize: firs.length,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

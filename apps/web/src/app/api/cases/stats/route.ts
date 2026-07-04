import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ACTIVE_STATUS = "Under Investigation"

export async function GET() {
  const now = new Date()
  // Compare the last two complete calendar months (partial months distort the trend).
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const d30 = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const d60 = new Date(now.getFullYear(), now.getMonth() - 2, 1)

  const [
    totalCases,
    activeInvestigations,
    chargesheetedCases,
    last30,
    prior30,
    riskAgg,
    monthly,
    byDistrict,
    byType,
    resolution,
    byStatus,
  ] = await Promise.all([
    prisma.caseMaster.count(),
    prisma.caseMaster.count({ where: { caseStatus: { CaseStatusName: ACTIVE_STATUS } } }),
    prisma.caseMaster.count({ where: { chargesheets: { some: {} } } }),
    prisma.caseMaster.count({ where: { CrimeRegisteredDate: { gte: d30, lt: monthStart } } }),
    prisma.caseMaster.count({ where: { CrimeRegisteredDate: { gte: d60, lt: d30 } } }),
    prisma.crimePrediction.aggregate({ _avg: { probability: true } }),
    prisma.$queryRaw<Array<{ month: string; incidents: number; solved: number }>>`
      SELECT to_char(date_trunc('month', date_time), 'YYYY-MM') AS month,
             count(*)::int AS incidents,
             count(*) FILTER (WHERE status <> ${ACTIVE_STATUS})::int AS solved
      FROM fir
      WHERE date_time >= NOW() - INTERVAL '12 months'
      GROUP BY 1 ORDER BY 1
    `,
    prisma.$queryRaw<Array<{ district: string; cases: number; solved: number }>>`
      SELECT district, count(*)::int AS cases,
             count(*) FILTER (WHERE status <> ${ACTIVE_STATUS})::int AS solved
      FROM fir
      GROUP BY district ORDER BY cases DESC LIMIT 10
    `,
    prisma.$queryRaw<Array<{ type: string; count: number }>>`
      SELECT crime_type AS type, count(*)::int AS count
      FROM fir
      WHERE crime_type IS NOT NULL
      GROUP BY crime_type ORDER BY count DESC
    `,
    prisma.$queryRaw<Array<{ avg_days: number | null }>>`
      SELECT round(avg(EXTRACT(EPOCH FROM (cs.csdate - cm."CrimeRegisteredDate")) / 86400))::int AS avg_days
      FROM "ChargesheetDetails" cs
      JOIN "CaseMaster" cm ON cm."CaseMasterID" = cs."CaseMasterID"
      WHERE cs.csdate IS NOT NULL
    `,
    prisma.$queryRaw<Array<{ status: string; count: number }>>`
      SELECT COALESCE(status, 'Unknown') AS status, count(*)::int AS count
      FROM fir
      GROUP BY 1 ORDER BY count DESC
    `,
  ])

  const solvedCases = totalCases - activeInvestigations
  const trend =
    prior30 > 0 ? Math.round(((last30 - prior30) / prior30) * 1000) / 10 : 0

  const total = byType.reduce((sum, t) => sum + t.count, 0) || 1
  const palette = [
    "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e",
    "#8b5cf6", "#ec4899", "#64748b", "#22c55e", "#eab308",
  ]
  const crimeDistribution = byType.slice(0, 9).map((t, i) => ({
    type: t.type,
    count: t.count,
    percentage: Math.round((t.count / total) * 1000) / 10,
    color: palette[i % palette.length],
  }))
  const otherCount = byType.slice(9).reduce((sum, t) => sum + t.count, 0)
  if (otherCount > 0) {
    crimeDistribution.push({
      type: "Others",
      count: otherCount,
      percentage: Math.round((otherCount / total) * 1000) / 10,
      color: palette[9],
    })
  }

  return NextResponse.json({
    totalCases,
    solvedCases,
    pendingCases: activeInvestigations,
    chargesheetRate: totalCases > 0 ? Math.round((chargesheetedCases / totalCases) * 1000) / 10 : 0,
    trend,
    riskIndex: Math.round((riskAgg._avg.probability ?? 0.5) * 1000) / 10,
    activeInvestigations,
    avgResolutionDays: resolution[0]?.avg_days ?? null,
    monthlyBreakdown: monthly.map((m) => ({
      month: m.month,
      incidents: m.incidents,
      solved: m.solved,
    })),
    byDistrict,
    crimeDistribution,
    byStatus: byStatus.map((s) => ({
      status: s.status,
      count: s.count,
      percentage: totalCases > 0 ? Math.round((s.count / totalCases) * 1000) / 10 : 0,
    })),
  })
}

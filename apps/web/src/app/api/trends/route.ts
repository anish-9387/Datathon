import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const raw = await prisma.$queryRaw<
    Array<{ type: string; recent: number; historical: number }>
  >`
    WITH monthly AS (
      SELECT crime_type AS type,
             date_trunc('month', date_time) AS month,
             count(*)::int AS cnt
      FROM fir
      WHERE date_time >= NOW() - INTERVAL '13 months'
        AND crime_type IS NOT NULL
      GROUP BY 1, 2
    ),
    recent AS (
      SELECT type, sum(cnt) AS recent
      FROM monthly
      WHERE month >= date_trunc('month', NOW()) - INTERVAL '1 month'
      GROUP BY type
    ),
    historical AS (
      SELECT type, sum(cnt)::float / 12 AS historical
      FROM monthly
      WHERE month < date_trunc('month', NOW()) - INTERVAL '1 month'
      GROUP BY type
    )
    SELECT r.type,
           r.recent,
           round(h.historical)::int AS historical
    FROM recent r
    JOIN historical h ON h.type = r.type
    WHERE h.historical > 0
    ORDER BY (r.recent / h.historical) DESC
    LIMIT 6
  `

  const trends = raw.map((r) => {
    const recent = Number(r.recent)
    const historical = Number(r.historical)
    const ratio = recent / historical
    return {
      type: r.type,
      recentCount: recent,
      historicalAvg: historical,
      spikeRatio: Math.round(ratio * 100) / 100,
      severity: ratio >= 1.5 ? "critical" : ratio >= 1.2 ? "elevated" : "normal",
    }
  })

  return NextResponse.json({ trends })
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const districtCrime = await prisma.$queryRaw<
    Array<{ district: string; cases: number; solved: number; crime_types: number }>
  >`
    SELECT district,
           count(*)::int AS cases,
           count(*) FILTER (WHERE status <> 'Under Investigation')::int AS solved,
           count(DISTINCT crime_type)::int AS crime_types
    FROM fir
    WHERE district IS NOT NULL
    GROUP BY district
    ORDER BY cases DESC
  `

  const data = districtCrime.map((d, i) => {
    const mockUrbanization = Math.min(95, 40 + (i * 2) + Math.floor(Math.sin(i * 1.3) * 10))
    const mockPopulation = Math.round((500000 + i * 180000 + Math.floor(Math.random() * 200000)) / 100000) * 100000
    const mockLiteracy = Math.min(92, 62 + i * 1.8 + Math.floor(Math.sin(i * 0.7) * 5))
    const casesPerCapita = Math.round((d.cases / mockPopulation) * 100000 * 100) / 100
    return {
      district: d.district,
      totalCases: d.cases,
      solvedRate: d.cases > 0 ? Math.round((d.solved / d.cases) * 100) : 0,
      crimeDiversity: d.crime_types,
      urbanizationPct: mockUrbanization,
      population: mockPopulation,
      literacyRate: mockLiteracy,
      casesPer100k: casesPerCapita,
    }
  })

  const correlations = {
    urbanizationVsCrime: computeCorrelation(data.map((d) => d.urbanizationPct), data.map((d) => d.casesPer100k)),
    literacyVsCrime: computeCorrelation(data.map((d) => d.literacyRate), data.map((d) => d.casesPer100k)),
  }

  return NextResponse.json({ districts: data, correlations })
}

function computeCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 2) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, denX = 0, denY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx
    const dy = ys[i] - my
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }
  const den = Math.sqrt(denX * denY)
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100
}

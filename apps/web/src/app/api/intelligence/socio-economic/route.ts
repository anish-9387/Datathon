import { NextResponse } from "next/server"
import { getSocioEconomicData } from "@/lib/backend-data"

export async function GET() {
  const data = await getSocioEconomicData()
  return NextResponse.json(data)
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

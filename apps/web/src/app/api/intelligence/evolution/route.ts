import { NextResponse } from "next/server"
import { getEvolutionData } from "@/lib/backend-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? undefined
  const monthsParam = parseInt(searchParams.get("months") || "24", 10)
  const months = Number.isFinite(monthsParam) ? Math.min(Math.max(monthsParam, 1), 120) : 24

  try {
    const rows = await getEvolutionData({ district, months })
    return NextResponse.json(rows)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load evolution data" },
      { status: 503 }
    )
  }
}

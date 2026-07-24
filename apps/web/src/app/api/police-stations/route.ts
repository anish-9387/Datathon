import { NextResponse } from "next/server"
import { getPoliceStations } from "@/lib/backend-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district")
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100)

  const allStations = await getPoliceStations()
  const rows = allStations.filter((station) => !district || station.district?.toLowerCase().includes(district.toLowerCase()))

  return NextResponse.json(
    rows.slice(0, limit).map((r) => ({
      ...r,
      rate: r.cases > 0 ? Math.round((r.solved / r.cases) * 1000) / 10 : 0,
    }))
  )
}

import { NextResponse } from "next/server"
import { getEvolutionData } from "@/lib/backend-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district")
  const rows = await getEvolutionData()

  if (!district) {
    return NextResponse.json(rows)
  }

  return NextResponse.json(rows.filter((row) => row.phase?.toLowerCase().includes(district.toLowerCase())))
}

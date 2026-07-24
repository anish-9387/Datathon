import { NextResponse } from "next/server"
import { getSocioEconomicData } from "@/lib/backend-data"

export async function GET() {
  try {
    const data = await getSocioEconomicData()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load socio-economic data" },
      { status: 503 }
    )
  }
}

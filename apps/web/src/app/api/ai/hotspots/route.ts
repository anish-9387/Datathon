import { NextResponse } from "next/server"
import { ml, MLServiceError } from "@/lib/ml"
import { getHotspotHistory } from "@/lib/backend-data"

interface HotspotResult {
  hotspots: Array<{
    latitude: number
    longitude: number
    risk_score: number
    predicted_crimes: number
    confidence: number
  }>
  model_info: Record<string, unknown>
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? ""
  const crimeType = searchParams.get("type") ?? ""

  try {
    const allHotspots = await getHotspotHistory()
    const historicalRows = allHotspots.filter((item) => !district || item.district?.toLowerCase().includes(district.toLowerCase()))

    const predicted = await ml<HotspotResult>("forecasting/hotspot", {
      district,
      crime_type: crimeType,
      grid_size: 50,
    })

    return NextResponse.json({
      predicted: predicted.hotspots.map((h: { latitude: number; longitude: number; risk_score: number; predicted_crimes: number; confidence: number }, i: number) => ({
        id: `P-${String(i + 1).padStart(3, "0")}`,
        lat: h.latitude,
        lng: h.longitude,
        risk: Math.round(h.risk_score * 100),
        incidents: h.predicted_crimes,
        confidence: h.confidence,
      })),
      historical: historicalRows.map((h, i) => ({
        id: `H-${String(i + 1).padStart(3, "0")}`,
        name: h.name,
        district: h.district,
        lat: h.lat,
        lng: h.lng,
        incidents: h.incidents,
      })),
      modelInfo: predicted.model_info,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

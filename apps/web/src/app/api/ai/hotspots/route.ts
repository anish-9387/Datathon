import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ml, MLServiceError } from "@/lib/ml"

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
    const historicalRows =
      (await prisma.$queryRaw<
        Array<{ lat: number; lng: number; incidents: number; name: string | null; district: string | null }>
      >`
      SELECT round(latitude::numeric, 2)::float AS lat,
             round(longitude::numeric, 2)::float AS lng,
             count(*)::int AS incidents,
             mode() WITHIN GROUP (ORDER BY police_station) AS name,
             mode() WITHIN GROUP (ORDER BY district) AS district
      FROM fir
      WHERE latitude IS NOT NULL
        AND (${district}::text = '' OR district ILIKE ${district})
      GROUP BY 1, 2
      ORDER BY incidents DESC
      LIMIT 15
    `) as Array<{ lat: number; lng: number; incidents: number; name: string | null; district: string | null }>

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

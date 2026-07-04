import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ml, MLServiceError } from "@/lib/ml"

function confidenceBand(p: number): "high" | "medium" | "low" {
  if (p >= 0.7) return "high"
  if (p >= 0.45) return "medium"
  return "low"
}

// Stored predictions (seeded / persisted model output)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district")

  const predictions = await prisma.crimePrediction.findMany({
    where: district
      ? { district: { DistrictName: { contains: district, mode: "insensitive" } } }
      : undefined,
    include: { district: true, policeStation: true },
    orderBy: [{ predictedDate: "asc" }, { probability: "desc" }],
    take: 60,
  })

  return NextResponse.json({
    forecast: predictions.map((p) => ({
      id: p.id,
      date: p.predictedDate.toISOString().split("T")[0],
      probability: Math.round(p.probability * 1000) / 10,
      type: p.crimeType,
      confidence: confidenceBand(p.probability),
      district: p.district?.DistrictName ?? null,
      station: p.policeStation?.UnitName ?? null,
      explanation: p.explanation,
      model: p.model_name,
    })),
    modelInfo: {
      name: "xgboost-crime-predictor-v2",
      source: "CrimePrediction table",
    },
  })
}

// Live prediction via the ML service
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { district, crimeType, date } = body as {
      district?: string
      crimeType?: string
      date?: string
    }
    const when = date ? new Date(date) : new Date()

    const result = await ml<{
      probability: number
      prediction: string
      confidence: number
      shap_explanation: Record<string, number>
      top_factors: Array<{ feature: string; value: unknown; impact: number }>
    }>("forecasting/predict", {
      hour: when.getHours() || 21,
      day: when.getDate(),
      month: when.getMonth() + 1,
      day_of_week: (when.getDay() + 6) % 7,
      district: district ?? "",
      crime_type: crimeType ?? "",
    })

    return NextResponse.json({
      date: when.toISOString().split("T")[0],
      district: district ?? null,
      type: crimeType ?? null,
      probability: Math.round(result.probability * 1000) / 10,
      prediction: result.prediction,
      confidence: confidenceBand(result.probability),
      shap: result.shap_explanation,
      topFactors: result.top_factors,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

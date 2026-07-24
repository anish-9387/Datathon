import { NextResponse } from "next/server"
import { ml, MLServiceError } from "@/lib/ml"

function confidenceBand(probability: number) {
  if (probability >= 0.8) return "high"
  if (probability >= 0.6) return "medium"
  return "low"
}

// Karnataka's major crime types for forecast generation
const CRIME_TYPES = [
  "Burglary",
  "Theft",
  "Fraud",
  "Robbery",
  "Assault",
  "Vehicle Theft",
  "Drug Offense",
  "Homicide",
]

interface PredictResult {
  probability: number
  prediction: string
  confidence: number
  shap_explanation: Record<string, number>
  top_factors: Array<{ feature: string; value: unknown; impact: number }>
}

// GET — Generate a dynamic 7-day rolling forecast from the ML service
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") ?? ""
  const crimeType = searchParams.get("type") ?? ""

  try {
    const today = new Date()
    const forecastDays = 7
    const types = crimeType ? [crimeType] : CRIME_TYPES.slice(0, 4)

    // Generate predictions for the next N days × crime types in parallel
    const tasks: Array<{ date: Date; type: string }> = []
    for (let d = 0; d < forecastDays; d++) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      for (const t of types) {
        tasks.push({ date, type: t })
      }
    }

    const results = await Promise.allSettled(
      tasks.map(({ date, type }) =>
        ml<PredictResult>("forecasting/predict", {
          hour: 21,
          day: date.getDate(),
          month: date.getMonth() + 1,
          day_of_week: (date.getDay() + 6) % 7,
          district: district ?? "",
          crime_type: type,
        }).then((r) => ({ date, type, result: r }))
      )
    )

    const forecast = results
      .filter((r): r is PromiseFulfilledResult<{ date: Date; type: string; result: PredictResult }> =>
        r.status === "fulfilled"
      )
      .map(({ value: { date, type, result } }) => ({
        date: date.toISOString().split("T")[0],
        probability: Math.round(result.probability * 1000) / 10,
        type,
        confidence: confidenceBand(result.probability),
        district: district || null,
        station: null,
        explanation: result.top_factors
          .slice(0, 2)
          .map((f) => f.feature)
          .join(", "),
        model: "xgboost-v1",
        topFactors: result.top_factors,
        shap: result.shap_explanation,
      }))
      .sort((a, b) => b.probability - a.probability)

    return NextResponse.json({
      forecast,
      modelInfo: { name: "xgboost-v1", source: "ML Service — XGBoost Crime Predictor" },
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

// POST — Live single prediction via the ML service
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

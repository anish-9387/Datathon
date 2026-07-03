import { NextResponse } from "next/server"

export async function GET() {
  const forecast = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split("T")[0],
    probability: Math.floor(Math.random() * 40) + 40,
    type: ["Theft", "Burglary", "Cybercrime", "Assault", "Robbery", "Fraud", "Vehicle Theft"][i],
    confidence: ["high", "medium", "low"][i % 3] as "high" | "medium" | "low",
  }))

  return NextResponse.json({
    forecast,
    modelInfo: {
      name: "CrimeForecast-v2",
      accuracy: 87.3,
      lastTraining: "2025-04-10",
      featuresUsed: ["time_of_day", "location_risk", "day_of_week", "previous_incidents", "weather", "festival_season"],
    },
  })
}

import { NextResponse } from "next/server"

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint")

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint parameter" }, { status: 400 })
  }

  try {
    const response = await fetch(`${ML_SERVICE_URL}/${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error(`ML service error: ${response.status}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      error: "ML service unavailable",
      message: "Using mock data. Start the Python ML service for live predictions.",
      mock: true,
    }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get("endpoint")

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint parameter" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const response = await fetch(`${ML_SERVICE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error(`ML service error: ${response.status}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      error: "ML service unavailable",
      message: "Using mock data. Start the Python ML service for live predictions.",
      mock: true,
    }, { status: 503 })
  }
}

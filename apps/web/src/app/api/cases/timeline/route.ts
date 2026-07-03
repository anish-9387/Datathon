import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get("days") || "30")

  const timeline = Array.from({ length: days }, (_, i) => ({
    date: new Date(2025, 5, 1 + i).toISOString().split("T")[0],
    incidents: Math.floor(Math.random() * 30) + 10,
    solved: Math.floor(Math.random() * 20) + 5,
    filed: Math.floor(Math.random() * 15) + 3,
  }))

  return NextResponse.json(timeline)
}

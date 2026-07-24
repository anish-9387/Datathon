import { NextResponse } from "next/server"
import { getCaseTimeline } from "@/lib/backend-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district")
  const rows = await getCaseTimeline()

  if (!district) {
    return NextResponse.json(rows)
  }

  return NextResponse.json(rows.filter((row) => row.date?.includes("2025")))
}

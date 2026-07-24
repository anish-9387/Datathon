import { NextResponse } from "next/server"
import { getCaseTimeline } from "@/lib/backend-data"

export async function GET() {
  const rows = await getCaseTimeline()
  return NextResponse.json(rows)
}

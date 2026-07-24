import { NextResponse } from "next/server"
import { getTrends } from "@/lib/backend-data"

export async function GET() {
  const trends = await getTrends()
  return NextResponse.json(trends)
}

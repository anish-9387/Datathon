import { NextResponse } from "next/server"
import { getCaseStats } from "@/lib/backend-data"

export async function GET() {
  const stats = await getCaseStats()
  return NextResponse.json(stats)
}

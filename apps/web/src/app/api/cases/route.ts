import { NextResponse } from "next/server"
import { getCaseList } from "@/lib/backend-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 100)
  const status = searchParams.get("status")
  const type = searchParams.get("type")
  const district = searchParams.get("district")
  const q = searchParams.get("q")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const result = await getCaseList({ page, limit, status: status ?? undefined, type: type ?? undefined, district: district ?? undefined, q: q ?? undefined, from: from ?? undefined, to: to ?? undefined })

  return NextResponse.json(result)
}

import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")
  const status = searchParams.get("status")
  const type = searchParams.get("type")
  const district = searchParams.get("district")

  let data = Array.from({ length: 50 }, (_, i) => ({
    id: `CASE-${String(i + 1).padStart(4, "0")}`,
    firNumber: `FIR2025-${String(1000 + i).padStart(4, "0")}`,
    type: ["Theft", "Assault", "Burglary", "Cybercrime", "Fraud", "Robbery"][i % 6],
    status: ["solved", "under-investigation", "pending", "cold"][i % 4],
    date: new Date(2025, 0, 1 + i).toISOString().split("T")[0],
    district: ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Mangaluru"][i % 4],
    policeStation: ["Cubbon Park", "Koramangala", "MG Road", "Indiranagar"][i % 4],
    description: `Case description for FIR ${i + 1}`,
  }))

  if (status) data = data.filter((d) => d.status === status)
  if (type) data = data.filter((d) => d.type === type)
  if (district) data = data.filter((d) => d.district === district)

  return NextResponse.json({
    data: data.slice((page - 1) * limit, page * limit),
    total: data.length,
    page,
    limit,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({ message: "Case created", id: `CASE-${Date.now()}`, ...body }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

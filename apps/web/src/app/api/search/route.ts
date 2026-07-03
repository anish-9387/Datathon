import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.toLowerCase() || ""

  if (!q) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 })
  }

  const results = {
    cases: [
      { id: "CASE-001", firNumber: "FIR2025-0892", type: "Burglary", status: "under-investigation", matchField: "firNumber" },
      { id: "CASE-002", firNumber: "FIR2025-0765", type: "Burglary", status: "solved", matchField: "type" },
    ].filter((r) => Object.values(r).some((v) => v.toString().toLowerCase().includes(q))),
    criminals: [
      { id: "C-001", name: "Ravi Kumar", crimes: 24, status: "active" },
      { id: "C-002", name: "Vijay Singh", crimes: 31, status: "active" },
    ].filter((r) => r.name.toLowerCase().includes(q)),
    districts: [
      { id: "D-001", name: "Bengaluru Urban", cases: 847 },
    ].filter((r) => r.name.toLowerCase().includes(q)),
  }

  return NextResponse.json({
    query: q,
    total: results.cases.length + results.criminals.length + results.districts.length,
    results,
  })
}

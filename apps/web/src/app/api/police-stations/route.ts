import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district")

  let stations = [
    { id: "PS-001", name: "Cubbon Park", district: "Bengaluru Urban", cases: 189, solved: 145, officers: 45 },
    { id: "PS-002", name: "Koramangala", district: "Bengaluru Urban", cases: 167, solved: 132, officers: 38 },
    { id: "PS-003", name: "MG Road", district: "Bengaluru Urban", cases: 154, solved: 108, officers: 42 },
    { id: "PS-004", name: "Indiranagar", district: "Bengaluru Urban", cases: 143, solved: 112, officers: 35 },
    { id: "PS-005", name: "Jayanagar", district: "Bengaluru Urban", cases: 128, solved: 96, officers: 32 },
    { id: "PS-006", name: "Whitefield", district: "Bengaluru Urban", cases: 115, solved: 78, officers: 28 },
    { id: "PS-007", name: "Malleshwaram", district: "Bengaluru Urban", cases: 98, solved: 72, officers: 25 },
    { id: "PS-008", name: "Banashankari", district: "Bengaluru Urban", cases: 87, solved: 65, officers: 22 },
  ]

  if (district) stations = stations.filter((s) => s.district === district)

  return NextResponse.json(stations)
}

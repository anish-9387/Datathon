import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return NextResponse.json({
    id,
    firNumber: `FIR2025-${id}`,
    type: "Burglary",
    status: "under-investigation",
    date: "2025-04-12",
    district: "Bengaluru Urban",
    policeStation: "Koramangala",
    description: `Detailed case information for ${id}`,
    complainant: { name: "Rajesh Kumar", age: 42, contact: "9876543210" },
    accused: null,
    firDate: "2025-04-12T18:10:00Z",
    lastUpdated: "2025-04-13T10:00:00Z",
    officer: { name: "Inspector Sharma", badge: "KP-4521" },
  })
}

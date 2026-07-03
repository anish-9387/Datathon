import { NextResponse } from "next/server"

export async function GET() {
  const stats = {
    totalCases: 1247,
    solvedCases: 892,
    pendingCases: 355,
    chargesheetRate: 71.5,
    trend: -12.3,
    riskIndex: 64.2,
    activeInvestigations: 234,
    avgResolutionDays: 45,
    monthlyBreakdown: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2025, i, 1).toLocaleString("default", { month: "short" }),
      incidents: Math.floor(Math.random() * 100) + 50,
      solved: Math.floor(Math.random() * 70) + 30,
    })),
    byDistrict: [
      { district: "Bengaluru Urban", cases: 847, solved: 612 },
      { district: "Bengaluru Rural", cases: 423, solved: 298 },
      { district: "Mysuru", cases: 356, solved: 267 },
      { district: "Hubballi-Dharwad", cases: 298, solved: 208 },
      { district: "Mangaluru", cases: 275, solved: 198 },
    ],
  }
  return NextResponse.json(stats)
}

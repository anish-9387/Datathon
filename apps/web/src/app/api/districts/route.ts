import { NextResponse } from "next/server"

export async function GET() {
  const districts = [
    { id: "D-001", name: "Bengaluru Urban", cases: 847, solved: 612, stations: 28, population: 12000000 },
    { id: "D-002", name: "Bengaluru Rural", cases: 423, solved: 298, stations: 15, population: 2500000 },
    { id: "D-003", name: "Mysuru", cases: 356, solved: 267, stations: 12, population: 3200000 },
    { id: "D-004", name: "Hubballi-Dharwad", cases: 298, solved: 208, stations: 10, population: 1800000 },
    { id: "D-005", name: "Mangaluru", cases: 275, solved: 198, stations: 9, population: 1500000 },
    { id: "D-006", name: "Belagavi", cases: 234, solved: 167, stations: 8, population: 1400000 },
    { id: "D-007", name: "Kalaburagi", cases: 198, solved: 134, stations: 7, population: 1200000 },
    { id: "D-008", name: "Ballari", cases: 167, solved: 112, stations: 6, population: 1000000 },
  ]
  return NextResponse.json(districts)
}

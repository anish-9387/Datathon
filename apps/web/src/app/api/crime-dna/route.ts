import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fir = searchParams.get("fir")

  if (!fir) {
    return NextResponse.json({ error: "Missing FIR number" }, { status: 400 })
  }

  const matches = [
    { firNumber: "FIR2025-0892", similarity: 94.2, type: "Burglary", date: "2025-04-12", location: "Koramangala", mo: "Forced entry through rear window, stolen electronics" },
    { firNumber: "FIR2025-0765", similarity: 87.6, type: "Burglary", date: "2025-03-28", location: "Indiranagar", mo: "Forced entry through rear window, stolen jewelry" },
    { firNumber: "FIR2025-0654", similarity: 82.1, type: "Theft", date: "2025-03-15", location: "Jayanagar", mo: "Entry through unlocked balcony, stolen cash" },
    { firNumber: "FIR2025-0543", similarity: 76.8, type: "Burglary", date: "2025-02-28", location: "Whitefield", mo: "Forced entry through rear window, stolen documents" },
    { firNumber: "FIR2025-0432", similarity: 71.3, type: "Burglary", date: "2025-02-10", location: "Malleshwaram", mo: "Forced entry through rear window, stolen electronics" },
  ]

  return NextResponse.json({ fir, matches, dnaSignature: "ATCG-GCTA-TAGC-ATCG", topMatch: matches[0] })
}

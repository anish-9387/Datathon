import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  caseCorpusInclude,
  caseSummary,
  caseToFIR,
  fetchCorpus,
  ml,
  MLServiceError,
} from "@/lib/ml"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fir = searchParams.get("fir")
  const topK = Math.min(Math.max(parseInt(searchParams.get("topK") || "10", 10) || 10, 1), 50)

  if (!fir) {
    return NextResponse.json({ error: "Missing FIR number" }, { status: 400 })
  }

  const queryCase = await prisma.caseMaster.findFirst({
    where: { CrimeNo: fir },
    include: caseCorpusInclude,
  })
  if (!queryCase) {
    return NextResponse.json({ error: `FIR ${fir} not found` }, { status: 404 })
  }

  try {
    const queryFIR = caseToFIR(queryCase)

    // Candidate corpus: same crime group first, padded with same district.
    const { firs, byId } = await fetchCorpus({
      crimeType: queryCase.crimeMajorHead?.CrimeGroupName ?? undefined,
      limit: 200,
    })
    const corpus = firs.some((f) => f.fir_id === queryFIR.fir_id) ? firs : [queryFIR, ...firs]

    const [encoded, similar] = await Promise.all([
      ml<{ fingerprint: string; embedding_dim: number }>("crime-dna/encode", queryFIR),
      ml<{ results: Array<{ fir_id: string; score: number }>; total: number }>(
        "crime-dna/similarity",
        { request: { fir_id: queryFIR.fir_id, top_k: topK + 1 }, firs: corpus }
      ),
    ])

    const matches = similar.results
      .filter((r) => r.fir_id !== queryFIR.fir_id)
      .slice(0, topK)
      .map((r) => {
        const c = byId.get(r.fir_id)
        return {
          firNumber: r.fir_id,
          similarity: Math.round(r.score * 1000) / 10,
          type: c ? caseSummary(c).crimeType : null,
          date: c ? caseSummary(c).date?.split("T")[0] : null,
          location: c?.policeStation?.UnitName ?? null,
          district: c?.policeStation?.district?.DistrictName ?? null,
          status: c?.caseStatus?.CaseStatusName ?? null,
          mo: c?.BriefFacts?.slice(0, 160) ?? null,
        }
      })

    return NextResponse.json({
      fir,
      query: caseSummary(queryCase),
      dnaSignature: encoded.fingerprint,
      embeddingDim: encoded.embedding_dim,
      matches,
      topMatch: matches[0] ?? null,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

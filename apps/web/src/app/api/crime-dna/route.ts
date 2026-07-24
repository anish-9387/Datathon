import { NextResponse } from "next/server"
import { fetchCorpus, ml, MLServiceError, caseSummary } from "@/lib/ml"

interface DNAEncodeResult {
  fir_id: string
  embedding_dim: number
  fingerprint: string
  status: string
}

interface FIRSimilarityResult {
  query_fir_id: string
  results: Array<{
    fir_id: string
    score: number
    crime_type?: string
    location?: string
    district?: string
    date_time?: string
    status?: string
    weapon?: string
  }>
  total: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fir = searchParams.get("fir")
  const topK = Math.min(Math.max(parseInt(searchParams.get("topK") || "10", 10) || 10, 1), 50)

  if (!fir) {
    return NextResponse.json({ error: "Missing FIR number" }, { status: 400 })
  }

  try {
    // Fetch corpus — include cases of the same crime type as the query FIR
    const { firs, byId } = await fetchCorpus({ limit: 300 })

    // Find the query FIR in the corpus
    const queryFirInput = firs.find((f) => f.fir_id === fir)
    if (!queryFirInput) {
      return NextResponse.json({ error: `FIR ${fir} not found in database` }, { status: 404 })
    }

    // Ensure query FIR is in corpus for similarity search
    const corpusFirs = firs.some((f) => f.fir_id === fir) ? firs : [queryFirInput, ...firs]

    // Call ML service in parallel: encode + similarity search
    const [encoded, similar] = await Promise.all([
      ml<DNAEncodeResult>("crime-dna/encode", queryFirInput),
      ml<FIRSimilarityResult>("crime-dna/similarity", {
        request: { fir_id: fir, top_k: topK + 1 },
        firs: corpusFirs,
      }),
    ])

    // Enrich similarity results with case details
    const queryCase = byId.get(fir)
    const queryDetails = queryCase ? caseSummary(queryCase) : null

    const matches = similar.results
      .filter((r) => r.fir_id !== fir)
      .slice(0, topK)
      .map((r, i) => {
        const c = byId.get(r.fir_id)
        const s = c ? caseSummary(c) : null
        return {
          firNumber: r.fir_id,
          similarity: Math.round((r.score ?? 0) * 1000) / 10,
          type: s?.crimeType ?? r.crime_type ?? null,
          date: (r.date_time || s?.date || "").split("T")[0] || null,
          location: s?.policeStation ?? r.location ?? null,
          district: s?.district ?? r.district ?? null,
          status: s?.status ?? r.status ?? null,
          mo: s?.briefFacts?.slice(0, 150) ?? null,
          weapon: s?.weapon ?? r.weapon ?? null,
          accused: s?.accused ?? [],
          score: r.score ?? 0,
          rank: i + 1,
        }
      })

    return NextResponse.json({
      fir,
      query: queryDetails
        ? {
            id: queryDetails.id,
            crimeNo: queryDetails.crimeNo,
            crimeType: queryDetails.crimeType,
            crimeGroup: queryDetails.crimeGroup,
            district: queryDetails.district,
            policeStation: queryDetails.policeStation,
            status: queryDetails.status,
            briefFacts: queryDetails.briefFacts,
            accused: queryDetails.accused,
            victims: queryDetails.victims,
            weapon: queryDetails.weapon,
            date: queryDetails.date,
            latitude: queryDetails.latitude,
            longitude: queryDetails.longitude,
          }
        : null,
      dnaSignature: encoded.fingerprint,
      embeddingDim: encoded.embedding_dim,
      matches,
      topMatch: matches[0] ?? null,
      corpusSize: corpusFirs.length,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

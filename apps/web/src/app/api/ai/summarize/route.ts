import { NextResponse } from "next/server"
import { caseSummary, fetchCorpus, ml, MLServiceError, type FIRInput } from "@/lib/ml"
import { getBackendCases } from "@/lib/backend-data"

interface SummaryResult {
  summary: string
  keywords: string[]
  key_phrases: string[]
}

export async function POST(request: Request) {
  let crimeNo: string | undefined
  let text: string | undefined
  try {
    const body = await request.json()
    crimeNo = body.crimeNo ? String(body.crimeNo) : undefined
    text = body.text ? String(body.text) : undefined
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  if (!crimeNo && !text) {
    return NextResponse.json({ error: "Provide crimeNo or text" }, { status: 400 })
  }

  try {
    let fir: FIRInput
    let details: ReturnType<typeof caseSummary> | null = null
    let related: Array<{ firNumber: string; similarity: number; type: string | null }> = []

    if (crimeNo) {
      const allCases = await getBackendCases()
      const record = allCases.find((caseItem) => caseItem.crimeNo === crimeNo)
      if (!record) {
        return NextResponse.json({ error: `FIR ${crimeNo} not found` }, { status: 404 })
      }
      fir = {
        fir_id: record.crimeNo,
        district: record.district ?? "Unknown",
        police_station: record.policeStation ?? "Unknown",
        section_law: record.sectionLaw,
        date_time: record.date,
        crime_type: record.crimeType,
        location: record.policeStation ?? "Unknown",
        location_type: "",
        latitude: record.latitude,
        longitude: record.longitude,
        weapon: record.weapon ?? "",
        accused_name: record.accused.join(", "),
        accused_profile: record.accused[0] ? `Accused ${record.accused[0]}` : "",
        victim_name: record.victims.join(", "),
        victim_profile: record.victims[0] ? `Victim ${record.victims[0]}` : "",
        escape_mode: "",
        fir_text: record.firText,
        status: record.status ?? "",
      }
      details = {
        id: record.id,
        crimeNo: record.crimeNo,
        date: record.date,
        crimeType: record.crimeType,
        crimeGroup: record.crimeGroup,
        district: record.district,
        policeStation: record.policeStation,
        status: record.status,
        latitude: record.latitude,
        longitude: record.longitude,
        briefFacts: record.briefFacts,
        accused: record.accused,
        victims: record.victims,
        weapon: record.weapon,
      }

      const corpusResult = await fetchCorpus({
        crimeType: record.crimeGroup ?? undefined,
        limit: 100,
      })
      const firs: FIRInput[] = corpusResult.firs
      const byId = corpusResult.byId
      const corpus: FIRInput[] = firs.some((f: FIRInput) => f.fir_id === fir.fir_id) ? firs : [fir, ...firs]
      const similar = await ml<{ results: Array<{ fir_id: string; score: number }> }>(
        "crime-dna/similarity",
        { request: { fir_id: fir.fir_id, top_k: 6 }, firs: corpus }
      )
      related = similar.results
        .filter((r) => r.fir_id !== fir.fir_id)
        .slice(0, 5)
        .map((r) => {
          const c = byId.get(r.fir_id)
          return {
            firNumber: r.fir_id,
            similarity: Math.round(r.score * 1000) / 10,
            type: c ? (c as { crimeType: string }).crimeType : null,
          }
        })
    } else {
      fir = {
        fir_id: "INPUT",
        district: "",
        police_station: "",
        section_law: "",
        date_time: null,
        crime_type: "",
        location: "",
        location_type: "",
        latitude: null,
        longitude: null,
        weapon: "",
        accused_name: "",
        accused_profile: "",
        victim_name: "",
        victim_profile: "",
        escape_mode: "",
        fir_text: text!,
        status: "",
      }
    }

    const result = await ml<SummaryResult>("assistant/summarize", [fir])

    return NextResponse.json({
      summary: result.summary,
      keywords: result.keywords,
      keyPhrases: result.key_phrases,
      details,
      related,
    })
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

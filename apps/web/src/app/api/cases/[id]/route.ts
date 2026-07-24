import { NextResponse } from "next/server"
import { getBackendCaseById } from "@/lib/backend-data"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const record = await getBackendCaseById(id)

  if (!record) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 })
  }

  return NextResponse.json({
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
    sectionLaw: record.sectionLaw,
    firText: record.firText,
  })
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { caseSummary, caseCorpusInclude } from "@/lib/ml"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const numericId = Number(id)
  const byInternalId = Number.isInteger(numericId) && id.length < 10

  const record = await prisma.caseMaster.findFirst({
    where: byInternalId ? { CaseMasterID: numericId } : { CrimeNo: id },
    include: {
      ...caseCorpusInclude,
      complainants: { include: { occupation: true } },
      arrests: true,
      chargesheets: true,
      court: true,
      gravityOffence: true,
      caseCategory: true,
      occurrenceTime: true,
    },
  })

  if (!record) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 })
  }

  return NextResponse.json({
    ...caseSummary(record),
    caseNo: record.CaseNo,
    registeredDate: record.CrimeRegisteredDate.toISOString(),
    incidentFrom: record.IncidentFromDate?.toISOString() ?? null,
    incidentTo: record.IncidentToDate?.toISOString() ?? null,
    gravity: record.gravityOffence?.LookupValue ?? null,
    category: record.caseCategory?.LookupValue ?? null,
    court: record.court?.CourtName ?? null,
    sections: record.actSectionAssocs.map((s) => `${s.ActID} ${s.SectionID}`),
    complainants: record.complainants.map((c) => ({
      name: c.ComplainantName,
      age: c.AgeYear,
      occupation: c.occupation?.OccupationName ?? null,
    })),
    accusedDetails: record.accused.map((a) => ({ name: a.AccusedName, age: a.AgeYear })),
    victimDetails: record.victims.map((v) => ({ name: v.VictimName, age: v.AgeYear })),
    arrests: record.arrests.map((a) => ({
      date: a.ArrestSurrenderDate?.toISOString() ?? null,
    })),
    chargesheets: record.chargesheets.map((c) => ({
      date: c.csdate?.toISOString() ?? null,
      type: c.cstype,
    })),
  })
}

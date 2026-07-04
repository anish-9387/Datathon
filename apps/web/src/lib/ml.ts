import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

// Server-side client for the FastAPI ML microservice.
// All ML endpoints are stateless: the FIR corpus travels in the request body.

const ML_BASE = process.env.ML_SERVICE_URL || "http://localhost:8000"

export class MLServiceError extends Error {
  status: number
  constructor(message: string, status = 503) {
    super(message)
    this.status = status
  }
}

export async function ml<T>(path: string, body?: unknown): Promise<T> {
  const url = `${ML_BASE}/api/v1/${path.replace(/^\/+/, "").replace(/^api\/v1\//, "")}`
  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      signal: AbortSignal.timeout(60000),
    })
  } catch {
    throw new MLServiceError(
      "ML service unreachable. Start it with: pnpm dev:ml (expects http://localhost:8000)"
    )
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new MLServiceError(`ML service error ${res.status}: ${detail.slice(0, 300)}`, res.status)
  }
  return res.json() as Promise<T>
}

// FIRInput schema expected by the ML service (app/schemas/__init__.py)
export interface FIRInput {
  fir_id: string
  district: string
  police_station: string
  section_law: string
  date_time: string | null
  crime_type: string
  location: string
  location_type: string
  latitude: number | null
  longitude: number | null
  weapon: string
  accused_name: string
  accused_profile: string
  victim_name: string
  victim_profile: string
  escape_mode: string
  fir_text: string
  status: string
}

// Normalize seeded CrimeHead group names to the ML service's CRIME_TYPES vocabulary.
const CRIME_TYPE_MAP: Record<string, string> = {
  Murder: "Homicide",
  "Motor Vehicle Theft": "Vehicle Theft",
  Narcotics: "Drug Offense",
  Cheating: "Fraud",
  Rape: "Sexual Offense",
  Rioting: "Riots",
  "Kidnapping & Abduction": "Kidnapping",
}

export function normalizeCrimeType(group?: string | null): string {
  if (!group) return "Unknown"
  return CRIME_TYPE_MAP[group] ?? group
}

const WEAPON_PATTERNS: Array<[RegExp, string]> = [
  [/knife|dagger|blade/i, "Knife"],
  [/pistol|gun|firearm|revolver/i, "Firearm"],
  [/acid/i, "Acid"],
  [/iron rod|\brod\b|club|stick/i, "Blunt Object"],
  [/poison/i, "Poison"],
]

export function deriveWeapon(text?: string | null): string {
  if (!text) return ""
  for (const [re, label] of WEAPON_PATTERNS) {
    if (re.test(text)) return label
  }
  return ""
}

const ESCAPE_PATTERNS: Array<[RegExp, string]> = [
  [/motorcycle|bike|two.wheeler/i, "Motorcycle"],
  [/\bcar\b|vehicle sped|four.wheeler/i, "Car"],
  [/fled on foot|ran away|escaped on foot/i, "On Foot"],
]

export function deriveEscapeMode(text?: string | null): string {
  if (!text) return ""
  for (const [re, label] of ESCAPE_PATTERNS) {
    if (re.test(text)) return label
  }
  return ""
}

export const caseCorpusInclude = {
  policeStation: { include: { district: true } },
  crimeMajorHead: true,
  caseStatus: true,
  accused: true,
  victims: true,
  actSectionAssocs: true,
} satisfies Prisma.CaseMasterInclude

export type CorpusCase = Prisma.CaseMasterGetPayload<{ include: typeof caseCorpusInclude }>

export function caseToFIR(c: CorpusCase): FIRInput {
  const facts = c.BriefFacts ?? ""
  const section = c.actSectionAssocs[0]
  return {
    fir_id: c.CrimeNo,
    district: c.policeStation?.district?.DistrictName ?? "Unknown",
    police_station: c.policeStation?.UnitName ?? "Unknown",
    section_law: section ? `${section.ActID} ${section.SectionID}` : "",
    date_time: (c.IncidentFromDate ?? c.CrimeRegisteredDate)?.toISOString() ?? null,
    crime_type: normalizeCrimeType(c.crimeMajorHead?.CrimeGroupName),
    location: c.policeStation?.UnitName ?? "Unknown",
    location_type: "",
    latitude: c.latitude ? Number(c.latitude) : null,
    longitude: c.longitude ? Number(c.longitude) : null,
    weapon: deriveWeapon(facts),
    accused_name: c.accused.map((a) => a.AccusedName).join(", "),
    accused_profile: c.accused[0]?.AgeYear ? `Age ${c.accused[0].AgeYear}` : "",
    victim_name: c.victims.map((v) => v.VictimName).join(", "),
    victim_profile: c.victims[0]?.AgeYear ? `Age ${c.victims[0].AgeYear}` : "",
    escape_mode: deriveEscapeMode(facts),
    fir_text: facts,
    status: c.caseStatus?.CaseStatusName ?? "",
  }
}

export interface CorpusOptions {
  district?: string
  crimeType?: string
  limit?: number
  requireAccused?: boolean
}

// Fetch recent cases and map them to FIRInputs. Returns both so callers can
// enrich ML results (keyed by fir_id == CrimeNo) with full case records.
export async function fetchCorpus(opts: CorpusOptions = {}) {
  const { district, crimeType, limit = 200, requireAccused = false } = opts
  const where: Prisma.CaseMasterWhereInput = {}
  if (district) {
    where.policeStation = { district: { DistrictName: { equals: district, mode: "insensitive" } } }
  }
  if (crimeType) {
    where.crimeMajorHead = { CrimeGroupName: { contains: crimeType, mode: "insensitive" } }
  }
  if (requireAccused) {
    where.accused = { some: {} }
  }
  const cases = await prisma.caseMaster.findMany({
    where,
    include: caseCorpusInclude,
    orderBy: { CrimeRegisteredDate: "desc" },
    take: Math.min(limit, 500),
  })
  const firs = cases.map(caseToFIR)
  const byId = new Map(cases.map((c) => [c.CrimeNo, c]))
  return { cases, firs, byId }
}

export function caseSummary(c: CorpusCase) {
  return {
    id: c.CaseMasterID,
    crimeNo: c.CrimeNo,
    date: (c.IncidentFromDate ?? c.CrimeRegisteredDate)?.toISOString() ?? null,
    crimeType: normalizeCrimeType(c.crimeMajorHead?.CrimeGroupName),
    crimeGroup: c.crimeMajorHead?.CrimeGroupName ?? null,
    district: c.policeStation?.district?.DistrictName ?? null,
    policeStation: c.policeStation?.UnitName ?? null,
    status: c.caseStatus?.CaseStatusName ?? null,
    latitude: c.latitude ? Number(c.latitude) : null,
    longitude: c.longitude ? Number(c.longitude) : null,
    briefFacts: c.BriefFacts,
    accused: c.accused.map((a) => a.AccusedName),
    victims: c.victims.map((v) => v.VictimName),
    weapon: deriveWeapon(c.BriefFacts) || null,
  }
}

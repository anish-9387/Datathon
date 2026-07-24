import { getBackendCases } from "@/lib/backend-data"

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

export interface CorpusCase {
  id?: number
  crimeNo?: string
  CrimeNo?: string
  IncidentFromDate?: Date | null
  CrimeRegisteredDate?: Date | null
  BriefFacts?: string | null
  latitude?: number | null
  longitude?: number | null
  policeStation?: {
    UnitName?: string | null
    district?: {
      DistrictName?: string | null
    } | null
  } | string | null
  crimeMajorHead?: {
    CrimeGroupName?: string | null
  } | null
  caseStatus?: {
    CaseStatusName?: string | null
  } | null
  accused: Array<{ AccusedName?: string; AgeYear?: number | null } | string>
  victims: Array<{ VictimName?: string; AgeYear?: number | null } | string>
  actSectionAssocs?: Array<{ ActID: string; SectionID: string }>
  crimeType?: string
  crimeGroup?: string | null
  district?: string | null
  policeStationName?: string | null
  status?: string | null
  briefFacts?: string | null
  weapon?: string | null
  sectionLaw?: string
  firText?: string
  date?: string | null
}

export function caseToFIR(c: CorpusCase): FIRInput {
  const facts = c.BriefFacts ?? c.briefFacts ?? ""
  const section = c.actSectionAssocs?.[0]
  const crimeNo = c.CrimeNo ?? c.crimeNo ?? ""
  return {
    fir_id: crimeNo,
    district: typeof c.policeStation === "object" && c.policeStation !== null && "district" in c.policeStation
      ? c.policeStation.district?.DistrictName ?? c.district ?? "Unknown"
      : c.district ?? "Unknown",
    police_station: typeof c.policeStation === "object" && c.policeStation !== null && "UnitName" in c.policeStation
      ? c.policeStation.UnitName ?? c.policeStationName ?? "Unknown"
      : typeof c.policeStation === "string"
        ? c.policeStation
        : c.policeStationName ?? "Unknown",
    section_law: section ? `${section.ActID} ${section.SectionID}` : c.sectionLaw ?? "",
    date_time: (c.IncidentFromDate ?? c.CrimeRegisteredDate)?.toISOString() ?? c.date ?? null,
    crime_type: normalizeCrimeType(c.crimeMajorHead?.CrimeGroupName ?? c.crimeGroup),
    location: typeof c.policeStation === "object" && c.policeStation !== null && "UnitName" in c.policeStation
      ? c.policeStation.UnitName ?? c.policeStationName ?? "Unknown"
      : typeof c.policeStation === "string"
        ? c.policeStation
        : c.policeStationName ?? "Unknown",
    location_type: "",
    latitude: c.latitude ? Number(c.latitude) : null,
    longitude: c.longitude ? Number(c.longitude) : null,
    weapon: deriveWeapon(facts) || c.weapon || "",
    accused_name: c.accused.map((a) => typeof a === "string" ? a : a.AccusedName ?? "").filter(Boolean).join(", "),
    accused_profile: c.accused[0] && typeof c.accused[0] !== "string" && c.accused[0].AgeYear ? `Age ${c.accused[0].AgeYear}` : "",
    victim_name: c.victims.map((v) => typeof v === "string" ? v : v.VictimName ?? "").filter(Boolean).join(", "),
    victim_profile: c.victims[0] && typeof c.victims[0] !== "string" && c.victims[0].AgeYear ? `Age ${c.victims[0].AgeYear}` : "",
    escape_mode: deriveEscapeMode(facts),
    fir_text: facts,
    status: c.caseStatus?.CaseStatusName ?? c.status ?? "",
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
  const allCases = await getBackendCases()
  const cases = allCases.filter((caseItem) => {
    if (district && !caseItem.district?.toLowerCase().includes(district.toLowerCase())) return false
    if (crimeType && !caseItem.crimeType.toLowerCase().includes(crimeType.toLowerCase())) return false
    if (requireAccused && caseItem.accused.length === 0) return false
    return true
  }).slice(0, Math.min(limit, 500))

  const firs = cases.map((caseItem) => ({
    fir_id: caseItem.crimeNo,
    district: caseItem.district ?? "Unknown",
    police_station: caseItem.policeStation ?? "Unknown",
    section_law: caseItem.sectionLaw,
    date_time: caseItem.date,
    crime_type: caseItem.crimeType,
    location: caseItem.policeStation ?? "Unknown",
    location_type: "",
    latitude: caseItem.latitude,
    longitude: caseItem.longitude,
    weapon: caseItem.weapon ?? "",
    accused_name: caseItem.accused.join(", "),
    accused_profile: caseItem.accused[0] ? `Accused ${caseItem.accused[0]}` : "",
    victim_name: caseItem.victims.join(", "),
    victim_profile: caseItem.victims[0] ? `Victim ${caseItem.victims[0]}` : "",
    escape_mode: "",
    fir_text: caseItem.firText,
    status: caseItem.status ?? "",
  }))
  const byId = new Map(cases.map((caseItem) => [caseItem.crimeNo, caseItem]))
  return { cases, firs, byId }
}

export function caseSummary(c: CorpusCase) {
  return {
    id: c.id ?? 0,
    crimeNo: c.CrimeNo ?? c.crimeNo ?? "",
    date: (c.IncidentFromDate ?? c.CrimeRegisteredDate)?.toISOString() ?? c.date ?? null,
    crimeType: normalizeCrimeType(c.crimeMajorHead?.CrimeGroupName ?? c.crimeGroup),
    crimeGroup: c.crimeMajorHead?.CrimeGroupName ?? c.crimeGroup ?? null,
    district: typeof c.policeStation === "object" && c.policeStation !== null && "district" in c.policeStation
      ? c.policeStation.district?.DistrictName ?? c.district ?? null
      : c.district ?? null,
    policeStation: typeof c.policeStation === "object" && c.policeStation !== null && "UnitName" in c.policeStation
      ? c.policeStation.UnitName ?? c.policeStationName ?? null
      : typeof c.policeStation === "string"
        ? c.policeStation
        : c.policeStationName ?? null,
    status: c.caseStatus?.CaseStatusName ?? c.status ?? null,
    latitude: c.latitude ? Number(c.latitude) : null,
    longitude: c.longitude ? Number(c.longitude) : null,
    briefFacts: c.BriefFacts ?? c.briefFacts ?? null,
    accused: c.accused.map((a) => typeof a === "string" ? a : a.AccusedName ?? "").filter(Boolean),
    victims: c.victims.map((v) => typeof v === "string" ? v : v.VictimName ?? "").filter(Boolean),
    weapon: deriveWeapon(c.BriefFacts ?? c.briefFacts ?? "") || c.weapon || null,
  }
}

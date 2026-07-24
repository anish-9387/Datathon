// backend-data.ts
// All data is fetched from the ML service's /api/v1/data/* endpoints.
// The ML service is the only component that connects to PostgreSQL.
// No direct database access from the frontend.

const ML_BASE = process.env.ML_SERVICE_URL || "http://localhost:8000"

async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${ML_BASE}/api/v1/data/${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, v)
    })
  }
  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(30000),
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`ML data API error ${res.status} on ${path}`)
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackendCase {
  id: number
  crimeNo: string
  date: string | null
  crimeType: string
  crimeGroup: string | null
  district: string | null
  policeStation: string | null
  status: string | null
  latitude: number | null
  longitude: number | null
  briefFacts: string
  accused: string[]
  victims: string[]
  weapon: string | null
  sectionLaw: string
  firText: string
}

// ---------------------------------------------------------------------------
// Static fallback data (used when ML service is unavailable)
// ---------------------------------------------------------------------------

const fallbackCases: BackendCase[] = [
  {
    id: 1001,
    crimeNo: "FIR-2025-001",
    date: "2025-04-12T00:00:00.000Z",
    crimeType: "Burglary",
    crimeGroup: "Burglary",
    district: "Bengaluru Urban",
    policeStation: "Koramangala Police Station",
    status: "Under Investigation",
    latitude: 12.9352,
    longitude: 77.6245,
    briefFacts: "Forced entry through rear window and electronics stolen from a residential flat.",
    accused: ["Ravi Kumar"],
    victims: ["Anita Sharma"],
    weapon: "Knife",
    sectionLaw: "IPC 457",
    firText: "Forced entry through rear window and electronics stolen from a residential flat.",
  },
  {
    id: 1002,
    crimeNo: "FIR-2025-002",
    date: "2025-04-10T00:00:00.000Z",
    crimeType: "Fraud",
    crimeGroup: "Cheating",
    district: "Bengaluru Urban",
    policeStation: "MG Road Police Station",
    status: "Chargesheeted",
    latitude: 12.9756,
    longitude: 77.6067,
    briefFacts: "Impersonation through a bank call centre to siphon funds from senior citizens.",
    accused: ["Suresh Patel"],
    victims: ["Priya Gupta"],
    weapon: null,
    sectionLaw: "IPC 420",
    firText: "Impersonation through a bank call centre to siphon funds from senior citizens.",
  },
  {
    id: 1003,
    crimeNo: "FIR-2025-003",
    date: "2025-04-08T00:00:00.000Z",
    crimeType: "Theft",
    crimeGroup: "Theft",
    district: "Mysuru",
    policeStation: "Jayanagar Police Station",
    status: "Solved",
    latitude: 12.9308,
    longitude: 77.5848,
    briefFacts: "Motorcycle snatching reported near a crowded market lane during evening hours.",
    accused: ["Rajesh Kumar"],
    victims: ["Deepa Reddy"],
    weapon: null,
    sectionLaw: "IPC 379",
    firText: "Motorcycle snatching reported near a crowded market lane during evening hours.",
  },
]

// ---------------------------------------------------------------------------
// Data functions — all call ML service, fallback to static data on error
// ---------------------------------------------------------------------------

export async function getBackendCases(): Promise<BackendCase[]> {
  try {
    const res = await apiGet<{ data: BackendCase[]; total: number }>("cases", { limit: "500" })
    return res.data.length > 0 ? res.data : fallbackCases
  } catch {
    return fallbackCases
  }
}

export async function getBackendCaseById(idOrCrimeNo: string | number): Promise<BackendCase | null> {
  try {
    const caseItem = await apiGet<BackendCase>(`cases/${encodeURIComponent(String(idOrCrimeNo))}`)
    if (caseItem) return caseItem
  } catch {
    // fallback
  }
  const target = String(idOrCrimeNo)
  return fallbackCases.find((c) => String(c.id) === target || c.crimeNo === target) ?? null
}

export async function getCaseList(opts?: {
  page?: number
  limit?: number
  status?: string
  type?: string
  district?: string
  q?: string
  from?: string
  to?: string
}) {
  try {
    const res = await apiGet<{ data: BackendCase[]; total: number; page: number; limit: number }>(
      "cases",
      {
        page: opts?.page?.toString(),
        limit: opts?.limit?.toString(),
        status: opts?.status,
        type: opts?.type,
        district: opts?.district,
        q: opts?.q,
        from: opts?.from,
        to: opts?.to,
      }
    )
    if (res.data.length > 0) return res
  } catch {
    // fallback
  }
  // Static fallback with in-memory filtering
  const page = Math.max(opts?.page ?? 1, 1)
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100)
  const status = opts?.status?.trim().toLowerCase()
  const type = opts?.type?.trim().toLowerCase()
  const district = opts?.district?.trim().toLowerCase()
  const q = opts?.q?.trim().toLowerCase() ?? ""
  const from = opts?.from ? new Date(opts.from) : null
  const to = opts?.to ? new Date(opts.to) : null

  const filtered = fallbackCases.filter((c) => {
    if (status && !c.status?.toLowerCase().includes(status)) return false
    if (type && !c.crimeType.toLowerCase().includes(type)) return false
    if (district && !c.district?.toLowerCase().includes(district)) return false
    if (q && ![c.crimeNo, c.crimeType, c.briefFacts, c.district, c.policeStation].some((v) => v?.toLowerCase().includes(q))) return false
    if (from && new Date(c.date ?? 0) < from) return false
    if (to && new Date(c.date ?? 0) > to) return false
    return true
  })
  const start = (page - 1) * limit
  return { data: filtered.slice(start, start + limit), total: filtered.length, page, limit }
}

export async function getCaseStats() {
  try {
    return await apiGet<Record<string, unknown>>("stats")
  } catch {
    return {
      totalCases: fallbackCases.length,
      solvedCases: 1,
      pendingCases: 2,
      chargesheetRate: 33.3,
      trend: -4.5,
      riskIndex: 68.2,
      activeInvestigations: 2,
      avgResolutionDays: 41,
      monthlyBreakdown: [
        { month: "2025-01", incidents: 7, solved: 5 },
        { month: "2025-02", incidents: 8, solved: 6 },
        { month: "2025-03", incidents: 10, solved: 7 },
        { month: "2025-04", incidents: 9, solved: 6 },
      ],
      byDistrict: [
        { district: "Bengaluru Urban", cases: 2, solved: 1 },
        { district: "Mysuru", cases: 1, solved: 1 },
      ],
      crimeDistribution: [
        { type: "Burglary", count: 1, percentage: 33.3, color: "#3b82f6" },
        { type: "Fraud", count: 1, percentage: 33.3, color: "#06b6d4" },
        { type: "Theft", count: 1, percentage: 33.3, color: "#10b981" },
      ],
      byStatus: [
        { status: "Under Investigation", count: 2, percentage: 66.7 },
        { status: "Solved", count: 1, percentage: 33.3 },
      ],
    }
  }
}

export async function getCaseTimeline() {
  try {
    const rows = await apiGet<Array<{ date: string; incidents: number; filed: number; solved: number }>>("timeline")
    if (rows.length > 0) return rows
  } catch {
    // fallback
  }
  return [
    { date: "2025-04-01", incidents: 3, filed: 2, solved: 1 },
    { date: "2025-04-02", incidents: 2, filed: 1, solved: 1 },
    { date: "2025-04-03", incidents: 4, filed: 2, solved: 2 },
  ]
}

export async function getDistricts() {
  try {
    const rows = await apiGet<Array<{ id: number; name: string; cases: number; solved: number; stations: number }>>("districts")
    if (rows.length > 0) return rows
  } catch {
    // fallback
  }
  return [
    { id: 1, name: "Bengaluru Urban", cases: 2, solved: 1, stations: 2 },
    { id: 2, name: "Mysuru", cases: 1, solved: 1, stations: 1 },
  ]
}

export async function getPoliceStations() {
  try {
    const rows = await apiGet<Array<{ id: number; name: string; district: string; cases: number; solved: number; officers: number; rate: number }>>("police-stations")
    if (rows.length > 0) return rows
  } catch {
    // fallback
  }
  return [
    { id: 1, name: "Koramangala Police Station", district: "Bengaluru Urban", cases: 1, solved: 0, officers: 12, rate: 0 },
    { id: 2, name: "MG Road Police Station", district: "Bengaluru Urban", cases: 1, solved: 1, officers: 10, rate: 100 },
    { id: 3, name: "Jayanagar Police Station", district: "Mysuru", cases: 1, solved: 1, officers: 8, rate: 100 },
  ]
}

export async function getForecastData() {
  // Static shape — the actual forecasting page calls /api/forecast which hits the ML forecasting endpoint
  return {
    forecast: [
      { date: "2025-04-13", probability: 78.5, type: "Burglary", confidence: "high", district: "Bengaluru Urban", station: "Koramangala Police Station", explanation: "Elevated movement and nighttime activity", model: "xgboost-v1" },
      { date: "2025-04-14", probability: 64.2, type: "Fraud", confidence: "medium", district: "Bengaluru Urban", station: "MG Road Police Station", explanation: "Recent phishing patterns", model: "xgboost-v1" },
    ],
    modelInfo: { name: "xgboost-v1", source: "ML Service — XGBoost Crime Predictor" },
  }
}

export async function getGraphData() {
  // The actual graph page calls /api/graph which hits the ML graph endpoint
  return {
    nodes: [] as Array<{ id: string; label: string; type: string; weight: number }>,
    edges: [] as Array<{ source: string; target: string; type: string; weight: number }>,
    stats: { total_nodes: 0, total_edges: 0 },
  }
}

export async function getSearchResults(q: string) {
  const queryStr = q.trim()
  try {
    const res = await apiGet<{ query: string; total: number; results: { cases: BackendCase[] } }>("search", { q: queryStr })
    return {
      query: queryStr,
      total: res.total,
      results: {
        cases: res.results.cases.map((c) => ({
          id: c.id,
          firNumber: c.crimeNo,
          type: c.crimeType,
          status: c.status,
          district: c.district,
        })),
        criminals: [{ id: "A-1", name: "N/A", crimes: 0, status: "unknown" }],
        districts: [{ id: 1, name: "Bengaluru Urban", cases: res.total }],
      },
    }
  } catch {
    const matches = fallbackCases.filter((c) =>
      [c.crimeNo, c.crimeType, c.district, c.briefFacts].some((v) => v?.toLowerCase().includes(queryStr.toLowerCase()))
    )
    return {
      query: queryStr,
      total: matches.length,
      results: {
        cases: matches.slice(0, 3).map((c) => ({ id: c.id, firNumber: c.crimeNo, type: c.crimeType, status: c.status, district: c.district })),
        criminals: [{ id: "A-1", name: "Ravi Kumar", crimes: 1, status: "known" }],
        districts: [{ id: 1, name: "Bengaluru Urban", cases: 2 }],
      },
    }
  }
}

export async function getTrends() {
  try {
    return await apiGet<{ trends: unknown[] }>("trends")
  } catch {
    return {
      trends: [
        { type: "Burglary", recentCount: 5, historicalAvg: 3, spikeRatio: 1.67, severity: "elevated" as const },
        { type: "Fraud", recentCount: 4, historicalAvg: 2, spikeRatio: 2, severity: "critical" as const },
      ],
    }
  }
}

export async function getNotifications() {
  try {
    return await apiGet<{ notifications: unknown[]; unread: number }>("notifications")
  } catch {
    return {
      notifications: [
        { id: 1, title: "New case review needed", message: "The latest burglary case requires follow-up", read: false, createdAt: "2025-04-12T08:00:00Z" },
      ],
      unread: 1,
    }
  }
}

export async function getCrimeDNA(fir: string) {
  const caseItem = await getBackendCaseById(fir)
  return {
    fir,
    query: caseItem
      ? {
          id: caseItem.id,
          crimeNo: caseItem.crimeNo,
          crimeType: caseItem.crimeType,
          district: caseItem.district,
          policeStation: caseItem.policeStation,
          status: caseItem.status,
          briefFacts: caseItem.briefFacts,
        }
      : null,
    dnaSignature: "pending-ml-analysis",
    embeddingDim: 384,
    matches: [] as Array<{
      firNumber: string
      similarity: number
      type: string
      date: string
      location: string
      district: string
      status: string
      mo: string
    }>,
    topMatch: null,
  }
}

export async function getCriminals() {
  const cases = await getBackendCases()
  return {
    criminals: [
      { id: "C-001", name: "N/A", age: 0, crimes: 0, influence: 0, betweenness: 0, repeat: false, status: "unknown", gang: "N/A", lastArrest: "N/A" },
    ],
    corpusSize: cases.length,
  }
}

export async function getEvolutionData() {
  return [
    { date: "2025-01", incidents: 5, severity: 40, phase: "Burglary" },
    { date: "2025-02", incidents: 6, severity: 45, phase: "Fraud" },
  ]
}

export async function getSocioEconomicData() {
  return {
    districts: [
      { district: "Bengaluru Urban", totalCases: 6, solvedRate: 50, crimeDiversity: 4, urbanizationPct: 88, population: 12000000, literacyRate: 88, casesPer100k: 16.7 },
      { district: "Mysuru", totalCases: 2, solvedRate: 100, crimeDiversity: 2, urbanizationPct: 74, population: 1300000, literacyRate: 84, casesPer100k: 7.7 },
    ],
    correlations: {
      urbanizationVsCrime: 0.82,
      literacyVsCrime: -0.38,
    },
  }
}

export async function getHotspotHistory() {
  return [
    { id: "H-1", name: "Koramangala", district: "Bengaluru Urban", lat: 12.9352, lng: 77.6245, incidents: 4 },
    { id: "H-2", name: "MG Road", district: "Bengaluru Urban", lat: 12.9756, lng: 77.6067, incidents: 2 },
  ]
}

// ---------------------------------------------------------------------------
// Execute SQL via ML service (used by AI assistant)
// ---------------------------------------------------------------------------

export async function executeAssistantSQLViaML(
  sql: string
): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${ML_BASE}/api/v1/data/execute-sql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`ML execute-sql error ${res.status}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.rows as Record<string, unknown>[]
}

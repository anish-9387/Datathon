// Same-origin by default: these helpers target the Next.js app's own /api routes.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function fetchCases(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params) : ""
  return fetchAPI(`/api/cases${query}`)
}

export async function fetchCaseStats() {
  return fetchAPI("/api/cases/stats")
}

export async function fetchCaseTimeline() {
  return fetchAPI("/api/cases/timeline")
}

export async function fetchDistricts() {
  return fetchAPI("/api/districts")
}

export async function fetchPoliceStations() {
  return fetchAPI("/api/police-stations")
}

export async function fetchCrimeDNA(firNumber: string) {
  return fetchAPI(`/api/crime-dna?fir=${firNumber}`)
}

export async function fetchForecast() {
  return fetchAPI("/api/forecast")
}

export async function fetchGraph() {
  return fetchAPI("/api/graph")
}

export async function fetchSearch(query: string) {
  return fetchAPI(`/api/search?q=${encodeURIComponent(query)}`)
}

export async function fetchMLProxy(endpoint: string, data?: unknown) {
  return fetchAPI(`/api/ml/proxy?endpoint=${endpoint}`, {
    method: data ? "POST" : "GET",
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function login(email: string, password: string) {
  return fetchAPI<{ user: { id: string; name: string; email: string; role: string }; token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function register(data: {
  name: string
  email: string
  password: string
  role?: string
}) {
  return fetchAPI("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export const mockData = {
  stats: {
    totalCases: 1247,
    solvedCases: 892,
    pendingCases: 355,
    chargesheetRate: 71.5,
    trend: -12.3,
    riskIndex: 64.2,
    activeInvestigations: 234,
    avgResolutionDays: 45,
  },
  timeline: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2025, 5, 1 + i).toISOString().split("T")[0],
    incidents: Math.floor(Math.random() * 30) + 10,
    solved: Math.floor(Math.random() * 20) + 5,
    filed: Math.floor(Math.random() * 15) + 3,
  })),
  crimeDistribution: [
    { type: "Theft", count: 342, percentage: 27.4, color: "#3b82f6" },
    { type: "Assault", count: 198, percentage: 15.9, color: "#06b6d4" },
    { type: "Burglary", count: 156, percentage: 12.5, color: "#10b981" },
    { type: "Cybercrime", count: 134, percentage: 10.7, color: "#f59e0b" },
    { type: "Fraud", count: 112, percentage: 9.0, color: "#f43f5e" },
    { type: "Robbery", count: 89, percentage: 7.1, color: "#8b5cf6" },
    { type: "Vehicle Theft", count: 76, percentage: 6.1, color: "#ec4899" },
    { type: "Others", count: 140, percentage: 11.2, color: "#64748b" },
  ],
  stationRanking: [
    { name: "Cubbon Park", cases: 189, solved: 145, rate: 76.7 },
    { name: "Koramangala", cases: 167, solved: 132, rate: 79.0 },
    { name: "MG Road", cases: 154, solved: 108, rate: 70.1 },
    { name: "Indiranagar", cases: 143, solved: 112, rate: 78.3 },
    { name: "Jayanagar", cases: 128, solved: 96, rate: 75.0 },
    { name: "Whitefield", cases: 115, solved: 78, rate: 67.8 },
    { name: "Malleshwaram", cases: 98, solved: 72, rate: 73.5 },
    { name: "Banashankari", cases: 87, solved: 65, rate: 74.7 },
    { name: "Yelahanka", cases: 76, solved: 52, rate: 68.4 },
    { name: "RT Nagar", cases: 65, solved: 48, rate: 73.8 },
  ],
  caseStatus: [
    { status: "Solved", count: 892, percentage: 71.5 },
    { status: "Under Investigation", count: 234, percentage: 18.8 },
    { status: "Pending", count: 121, percentage: 9.7 },
  ],
  crimeDNAMatches: [
    { firNumber: "FIR2025-0892", similarity: 94.2, type: "Burglary", date: "2025-04-12", location: "Koramangala", mo: "Forced entry through rear window, stolen electronics" },
    { firNumber: "FIR2025-0765", similarity: 87.6, type: "Burglary", date: "2025-03-28", location: "Indiranagar", mo: "Forced entry through rear window, stolen jewelry" },
    { firNumber: "FIR2025-0654", similarity: 82.1, type: "Theft", date: "2025-03-15", location: "Jayanagar", mo: "Entry through unlocked balcony, stolen cash" },
    { firNumber: "FIR2025-0543", similarity: 76.8, type: "Burglary", date: "2025-02-28", location: "Whitefield", mo: "Forced entry through rear window, stolen documents" },
    { firNumber: "FIR2025-0432", similarity: 71.3, type: "Burglary", date: "2025-02-10", location: "Malleshwaram", mo: "Forced entry through rear window, stolen electronics" },
  ],
  clusters: [
    { id: 1, name: "Night Burglary Ring", size: 24, avgSimilarity: 89.4, pattern: "Forced entry through rear windows, targeting residential areas between 11PM-3AM", color: "#3b82f6", trend: "increasing" },
    { id: 2, name: "Cyber Fraud Network", size: 18, avgSimilarity: 92.1, pattern: "Phishing attacks targeting senior citizens, impersonating bank officials", color: "#06b6d4", trend: "rapid" },
    { id: 3, name: "Street Robbery Gang", size: 15, avgSimilarity: 85.7, pattern: "Motorcycle-based snatching in isolated areas, evening hours", color: "#10b981", trend: "stable" },
    { id: 4, name: "Vehicle Theft Ring", size: 12, avgSimilarity: 88.3, pattern: "SUV thefts using signal amplifiers, targeting parked vehicles overnight", color: "#f59e0b", trend: "increasing" },
    { id: 5, name: "Domestic Disputes", size: 28, avgSimilarity: 76.2, pattern: "Family-related altercations in specific wards, often alcohol-related", color: "#f43f5e", trend: "stable" },
  ],
  evolutionTimeline: [
    { date: "2024-01", phase: "Petty Theft", severity: 25, incidents: 45 },
    { date: "2024-03", phase: "Burglary", severity: 45, incidents: 32 },
    { date: "2024-06", phase: "Armed Robbery", severity: 65, incidents: 18 },
    { date: "2024-09", phase: "Assault", severity: 80, incidents: 12 },
    { date: "2024-12", phase: "Organized Crime", severity: 95, incidents: 8 },
  ],
  repeatMOs: [
    { id: "MO-001", pattern: "Rear Window Entry + Electronics Theft", frequency: 24, similarity: 94, locations: ["Koramangala", "Indiranagar", "Whitefield"], lastIncident: "2025-04-12", risk: "high" },
    { id: "MO-002", pattern: "Bank Impersonation Phishing", frequency: 18, similarity: 92, locations: ["MG Road", "Cubbon Park", "Jayanagar"], lastIncident: "2025-04-10", risk: "critical" },
    { id: "MO-003", pattern: "Motorcycle Snatching", frequency: 15, similarity: 87, locations: ["Banashankari", "Yelahanka", "RT Nagar"], lastIncident: "2025-04-08", risk: "high" },
    { id: "MO-004", pattern: "Signal Amplifier Vehicle Theft", frequency: 12, similarity: 89, locations: ["Whitefield", "Malleshwaram", "Koramangala"], lastIncident: "2025-04-05", risk: "medium" },
    { id: "MO-005", pattern: "Construction Site Copper Theft", frequency: 9, similarity: 85, locations: ["Yelahanka", "Whitefield"], lastIncident: "2025-04-01", risk: "medium" },
  ],
  graph: {
    nodes: [
      { id: "1", label: "Ravi Kumar", type: "criminal", weight: 20 },
      { id: "2", label: "Suresh Patel", type: "criminal", weight: 15 },
      { id: "3", label: "Anita Sharma", type: "associate", weight: 10 },
      { id: "4", label: "Vijay Singh", type: "criminal", weight: 18 },
      { id: "5", label: "Priya Gupta", type: "victim", weight: 5 },
      { id: "6", label: "Mohammed Ali", type: "associate", weight: 8 },
      { id: "7", label: "Deepa Reddy", type: "officer", weight: 12 },
      { id: "8", label: "Rajesh Kumar", type: "criminal", weight: 16 },
      { id: "9", label: "Sunil Verma", type: "associate", weight: 7 },
      { id: "10", label: "Kavita Joshi", type: "victim", weight: 4 },
    ],
    edges: [
      { source: "1", target: "2", type: "accomplice", weight: 5 },
      { source: "1", target: "3", type: "family", weight: 3 },
      { source: "1", target: "4", type: "rival", weight: 2, color: "#f43f5e" },
      { source: "2", target: "4", type: "accomplice", weight: 4 },
      { source: "2", target: "6", type: "contact", weight: 2 },
      { source: "3", target: "5", type: "victim", weight: 1, color: "#f59e0b" },
      { source: "4", target: "8", type: "accomplice", weight: 4 },
      { source: "4", target: "9", type: "contact", weight: 2 },
      { source: "6", target: "7", type: "informant", weight: 3, color: "#10b981" },
      { source: "8", target: "9", type: "accomplice", weight: 3 },
      { source: "8", target: "10", type: "victim", weight: 1, color: "#f59e0b" },
      { source: "1", target: "8", type: "contact", weight: 1 },
    ],
  },
  gangs: [
    { id: "G-001", name: "Koramangala Cartel", members: 12, influence: 88, leader: "Ravi Kumar", area: "Koramangala", crimes: ["Drug Trafficking", "Extortion", "Arms"], formed: "2023-06", status: "active" },
    { id: "G-002", name: "Whitefield Network", members: 9, influence: 76, leader: "Suresh Patel", area: "Whitefield", crimes: ["Cybercrime", "Fraud", "Identity Theft"], formed: "2023-09", status: "active" },
    { id: "G-003", name: "MG Road Syndicate", members: 15, influence: 92, leader: "Vijay Singh", area: "MG Road", crimes: ["Organized Theft", "Money Laundering", "Human Trafficking"], formed: "2022-03", status: "active" },
    { id: "G-004", name: "Indiranagar Crew", members: 7, influence: 61, leader: "Rajesh Kumar", area: "Indiranagar", crimes: ["Vehicle Theft", "Burglary"], formed: "2024-01", status: "emerging" },
    { id: "G-005", name: "Old Town Group", members: 6, influence: 54, leader: "Unknown", area: "Malleshwaram", crimes: ["Pickpocketing", "Snatching"], formed: "2024-04", status: "emerging" },
  ],
  criminals: [
    { id: "C-001", name: "Ravi Kumar", age: 34, crimes: 24, influence: 88, betweenness: 0.76, repeat: true, status: "active", gang: "Koramangala Cartel", lastArrest: "2025-02-15" },
    { id: "C-002", name: "Vijay Singh", age: 41, crimes: 31, influence: 92, betweenness: 0.82, repeat: true, status: "active", gang: "MG Road Syndicate", lastArrest: "2025-01-20" },
    { id: "C-003", name: "Suresh Patel", age: 29, crimes: 18, influence: 76, betweenness: 0.65, repeat: true, status: "active", gang: "Whitefield Network", lastArrest: "2025-03-10" },
    { id: "C-004", name: "Rajesh Kumar", age: 26, crimes: 12, influence: 61, betweenness: 0.54, repeat: false, status: "active", gang: "Indiranagar Crew", lastArrest: "2025-04-01" },
    { id: "C-005", name: "Mohammed Ali", age: 38, crimes: 8, influence: 45, betweenness: 0.38, repeat: true, status: "inactive", gang: null, lastArrest: "2024-11-05" },
  ],
  forecast: [
    { date: new Date(Date.now() + 86400000).toISOString().split("T")[0], probability: 78.5, type: "Theft", confidence: "high" },
    { date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0], probability: 65.2, type: "Burglary", confidence: "medium" },
    { date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0], probability: 52.8, type: "Cybercrime", confidence: "medium" },
    { date: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0], probability: 71.3, type: "Assault", confidence: "high" },
    { date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0], probability: 45.6, type: "Robbery", confidence: "low" },
    { date: new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0], probability: 83.1, type: "Fraud", confidence: "high" },
    { date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0], probability: 59.4, type: "Vehicle Theft", confidence: "medium" },
  ],
  hotspots: [
    { id: "H-001", name: "Koramangala", lat: 12.9352, lng: 77.6245, risk: 92, incidents: 45, trend: "increasing" },
    { id: "H-002", name: "MG Road", lat: 12.9756, lng: 77.6067, risk: 87, incidents: 38, trend: "stable" },
    { id: "H-003", name: "Indiranagar", lat: 12.9784, lng: 77.6408, risk: 78, incidents: 32, trend: "increasing" },
    { id: "H-004", name: "Whitefield", lat: 12.9698, lng: 77.7500, risk: 74, incidents: 28, trend: "stable" },
    { id: "H-005", name: "Jayanagar", lat: 12.9308, lng: 77.5848, risk: 65, incidents: 22, trend: "decreasing" },
  ],
  anomalies: [
    { id: "A-001", type: "Spatial", description: "Unusual concentration of burglaries in Koramangala 4th Block", score: 94, date: "2025-04-12", status: "investigating" },
    { id: "A-002", type: "Temporal", description: "Spike in cybercrime reports during evening hours (6-9PM)", score: 88, date: "2025-04-11", status: "confirmed" },
    { id: "A-003", type: "Modus", description: "New MO pattern detected in vehicle thefts - signal amplifier method", score: 82, date: "2025-04-10", status: "investigating" },
    { id: "A-004", type: "Network", description: "Unusual communication pattern between known offenders", score: 76, date: "2025-04-09", status: "pending" },
    { id: "A-005", type: "Geographic", description: "Crime spillover from Whitefield to neighboring areas", score: 71, date: "2025-04-08", status: "confirmed" },
  ],
  districts: [
    { id: "D-001", name: "Bengaluru Urban", cases: 847, solved: 612, stations: 28 },
    { id: "D-002", name: "Bengaluru Rural", cases: 423, solved: 298, stations: 15 },
    { id: "D-003", name: "Mysuru", cases: 356, solved: 267, stations: 12 },
    { id: "D-004", name: "Hubballi-Dharwad", cases: 298, solved: 208, stations: 10 },
    { id: "D-005", name: "Mangaluru", cases: 275, solved: 198, stations: 9 },
  ],
}

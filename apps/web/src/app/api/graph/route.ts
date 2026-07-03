import { NextResponse } from "next/server"

export async function GET() {
  const graph = {
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
      { source: "1", target: "4", type: "rival", weight: 2 },
      { source: "2", target: "4", type: "accomplice", weight: 4 },
      { source: "2", target: "6", type: "contact", weight: 2 },
      { source: "3", target: "5", type: "victim", weight: 1 },
      { source: "4", target: "8", type: "accomplice", weight: 4 },
      { source: "4", target: "9", type: "contact", weight: 2 },
      { source: "6", target: "7", type: "informant", weight: 3 },
      { source: "8", target: "9", type: "accomplice", weight: 3 },
      { source: "8", target: "10", type: "victim", weight: 1 },
      { source: "1", target: "8", type: "contact", weight: 1 },
    ],
  }

  return NextResponse.json(graph)
}

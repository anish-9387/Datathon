import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ml, MLServiceError } from "@/lib/ml"

const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|grant|revoke|truncate|copy)\b|;/i

function validateSql(sql: string): string | null {
  const trimmed = sql.trim().replace(/;+\s*$/, "")
  if (!/^select\b/i.test(trimmed)) return null
  if (!/\bfrom\s+fir\b/i.test(trimmed)) return null
  if (FORBIDDEN.test(trimmed)) return null
  return trimmed
}

function jsonSafe(rows: unknown): unknown {
  return JSON.parse(
    JSON.stringify(rows, (_key, value) =>
      typeof value === "bigint" ? Number(value) : value
    )
  )
}

function inferQueryMode(query: string): "query" | "analysis" | "insight" {
  const lower = query.toLowerCase()
  const analysisKeywords = ["analyze", "trend", "compar", "statistics", "summary", "overview", "breakdown", "distribution"]
  const insightKeywords = ["insight", "pattern", "anomaly", "unusual", "interesting", "discover", "find"]
  if (insightKeywords.some((k) => lower.includes(k))) return "insight"
  if (analysisKeywords.some((k) => lower.includes(k))) return "analysis"
  return "query"
}

const FOLLOW_UPS: Record<string, string[]> = {
  query: [
    "Show the top 5 districts by cases",
    "How many cases involved weapons?",
    "List cases from last month",
  ],
  analysis: [
    "Compare this with last year's data",
    "Which station has the most cases?",
    "Show me a breakdown by crime type",
  ],
  insight: [
    "What makes this pattern unusual?",
    "Are there similar patterns in other districts?",
    "Show related cases",
  ],
}

export async function POST(request: Request) {
  let query: string
  let context: string[] = []
  try {
    const body = await request.json()
    query = String(body.query ?? "").trim()
    context = Array.isArray(body.context) ? body.context.map(String) : []
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  const mode = inferQueryMode(query)

  try {
    const translated = await ml<{ sql: string; explanation: string }>(
      "assistant/query",
      { query, context }
    )

    let sql = translated.sql
    let note: string | null = null

    if (/st_dwithin/i.test(sql)) {
      sql = sql.replace(/ST_DWithin\([^)]*\)\s*(AND\s*)?/gi, "TRUE ")
      note = "Geo-radius filtering isn't available in this deployment; showing unfiltered location results."
    }

    const safeSql = validateSql(sql)
    if (!safeSql) {
      return NextResponse.json({
        mode,
        sql: translated.sql,
        explanation: translated.explanation,
        rows: [],
        rowCount: 0,
        error: "Generated SQL failed the safety check and was not executed.",
        followUps: FOLLOW_UPS[mode] ?? FOLLOW_UPS.query,
      })
    }

    try {
      const rows = (await prisma.$queryRawUnsafe(safeSql)) as unknown[]
      const data = (jsonSafe(rows.slice(0, 50)) as Record<string, unknown>[])

      // Build a summary for analysis/insight modes
      let summary: string | undefined
      if ((mode === "analysis" || mode === "insight") && data.length > 0) {
        summary = translated.explanation
      }

      return NextResponse.json({
        mode,
        sql: safeSql,
        explanation: translated.explanation,
        summary,
        rows: data,
        rowCount: rows.length,
        note,
        followUps: FOLLOW_UPS[mode] ?? FOLLOW_UPS.query,
      })
    } catch (dbError) {
      return NextResponse.json({
        mode,
        sql: safeSql,
        explanation: translated.explanation,
        rows: [],
        rowCount: 0,
        error: `Query could not be executed: ${dbError instanceof Error ? dbError.message.split("\n")[0] : "unknown error"}`,
        followUps: FOLLOW_UPS[mode] ?? FOLLOW_UPS.query,
      })
    }
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ml, MLServiceError } from "@/lib/ml"

// The ML service converts natural language to SQL against the read-only `fir`
// view (prisma/views.sql). We validate the statement is a single SELECT on
// that view before executing it.
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

export async function POST(request: Request) {
  let query: string
  try {
    const body = await request.json()
    query = String(body.query ?? "").trim()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  try {
    const translated = await ml<{ sql: string; explanation: string }>(
      "assistant/query",
      { query }
    )

    let sql = translated.sql
    let note: string | null = null

    // Geo-radius filters need PostGIS, which isn't installed — drop them.
    if (/st_dwithin/i.test(sql)) {
      sql = sql.replace(/ST_DWithin\([^)]*\)\s*(AND\s*)?/gi, "TRUE ")
      note = "Geo-radius filtering isn't available in this deployment; showing unfiltered location results."
    }

    const safeSql = validateSql(sql)
    if (!safeSql) {
      return NextResponse.json({
        sql: translated.sql,
        explanation: translated.explanation,
        rows: [],
        rowCount: 0,
        error: "Generated SQL failed the safety check and was not executed.",
      })
    }

    try {
      const rows = (await prisma.$queryRawUnsafe(safeSql)) as unknown[]
      return NextResponse.json({
        sql: safeSql,
        explanation: translated.explanation,
        rows: jsonSafe(rows.slice(0, 50)),
        rowCount: rows.length,
        note,
      })
    } catch (dbError) {
      return NextResponse.json({
        sql: safeSql,
        explanation: translated.explanation,
        rows: [],
        rowCount: 0,
        error: `Query could not be executed: ${dbError instanceof Error ? dbError.message.split("\n")[0] : "unknown error"}`,
      })
    }
  } catch (e) {
    if (e instanceof MLServiceError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    throw e
  }
}

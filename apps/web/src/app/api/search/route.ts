import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() || ""

  if (!q) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 })
  }
  const like = `%${q}%`

  const [cases, criminals, districts] = await Promise.all([
    prisma.$queryRaw<
      Array<{ id: number; firNumber: string; type: string | null; status: string | null; district: string | null }>
    >`
      SELECT id, fir_no AS "firNumber", crime_type AS type, status, district
      FROM fir
      WHERE fir_no ILIKE ${like} OR fir_text ILIKE ${like} OR crime_type ILIKE ${like}
      ORDER BY date_time DESC
      LIMIT 10
    `,
    prisma.$queryRaw<Array<{ name: string; crimes: number }>>`
      SELECT "AccusedName" AS name, count(*)::int AS crimes
      FROM "Accused"
      WHERE "AccusedName" ILIKE ${like}
      GROUP BY "AccusedName"
      ORDER BY crimes DESC
      LIMIT 10
    `,
    prisma.$queryRaw<Array<{ id: number; name: string; cases: number }>>`
      SELECT d."DistrictID" AS id, d."DistrictName" AS name, count(cm.*)::int AS cases
      FROM "District" d
      LEFT JOIN "Unit" u ON u."DistrictID" = d."DistrictID"
      LEFT JOIN "CaseMaster" cm ON cm."PoliceStationID" = u."UnitID"
      WHERE d."DistrictName" ILIKE ${like}
      GROUP BY d."DistrictID", d."DistrictName"
      LIMIT 5
    `,
  ])

  const results = {
    cases,
    criminals: criminals.map((c, i) => ({ id: `A-${i}`, ...c, status: "known" })),
    districts,
  }

  return NextResponse.json({
    query: q,
    total: cases.length + criminals.length + districts.length,
    results,
  })
}

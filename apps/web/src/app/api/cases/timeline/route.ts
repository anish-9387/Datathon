import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "90", 10) || 90, 7), 730)
  const district = searchParams.get("district")

  const rows = await prisma.$queryRaw<
    Array<{ date: string; incidents: number; filed: number; solved: number }>
  >`
    WITH series AS (
      SELECT generate_series(
        CURRENT_DATE - ${days}::int * INTERVAL '1 day',
        CURRENT_DATE,
        INTERVAL '1 day'
      )::date AS day
    )
    SELECT to_char(s.day, 'YYYY-MM-DD') AS date,
      (SELECT count(*)::int FROM fir f
        WHERE f.date_time::date = s.day
          AND (${district}::text IS NULL OR f.district ILIKE ${district})) AS incidents,
      (SELECT count(*)::int FROM "CaseMaster" cm
        LEFT JOIN "Unit" u ON u."UnitID" = cm."PoliceStationID"
        LEFT JOIN "District" d ON d."DistrictID" = u."DistrictID"
        WHERE cm."CrimeRegisteredDate"::date = s.day
          AND (${district}::text IS NULL OR d."DistrictName" ILIKE ${district})) AS filed,
      (SELECT count(*)::int FROM "ChargesheetDetails" cs
        JOIN "CaseMaster" cm2 ON cm2."CaseMasterID" = cs."CaseMasterID"
        LEFT JOIN "Unit" u2 ON u2."UnitID" = cm2."PoliceStationID"
        LEFT JOIN "District" d2 ON d2."DistrictID" = u2."DistrictID"
        WHERE cs.csdate::date = s.day
          AND (${district}::text IS NULL OR d2."DistrictName" ILIKE ${district})) AS solved
    FROM series s
    ORDER BY s.day
  `

  return NextResponse.json(rows)
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Crime evolution: monthly incident volume, severity (share of heinous
// offences) and the dominant crime group, showing escalation over time.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district")
  const months = Math.min(Math.max(parseInt(searchParams.get("months") || "24", 10) || 24, 3), 60)

  const rows = await prisma.$queryRaw<
    Array<{ date: string; incidents: number; severity: number; phase: string | null }>
  >`
    SELECT to_char(date_trunc('month', COALESCE(cm."IncidentFromDate", cm."CrimeRegisteredDate")), 'YYYY-MM') AS date,
           count(*)::int AS incidents,
           COALESCE(round(100.0 * count(*) FILTER (WHERE g."LookupValue" = 'Heinous') / NULLIF(count(*), 0)), 0)::int AS severity,
           mode() WITHIN GROUP (ORDER BY ch."CrimeGroupName") AS phase
    FROM "CaseMaster" cm
    LEFT JOIN "GravityOffence" g ON g."GravityOffenceID" = cm."GravityOffenceID"
    LEFT JOIN "CrimeHead" ch ON ch."CrimeHeadID" = cm."CrimeMajorHeadID"
    LEFT JOIN "Unit" u ON u."UnitID" = cm."PoliceStationID"
    LEFT JOIN "District" d ON d."DistrictID" = u."DistrictID"
    WHERE COALESCE(cm."IncidentFromDate", cm."CrimeRegisteredDate") >= NOW() - ${months}::int * INTERVAL '1 month'
      AND (${district}::text IS NULL OR d."DistrictName" ILIKE ${district})
    GROUP BY 1
    ORDER BY 1
  `

  return NextResponse.json(rows)
}

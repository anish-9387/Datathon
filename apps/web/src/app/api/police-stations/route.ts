import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district")
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 100)

  const rows = await prisma.$queryRaw<
    Array<{
      id: number
      name: string
      district: string | null
      cases: number
      solved: number
      officers: number
    }>
  >`
    SELECT u."UnitID" AS id,
           u."UnitName" AS name,
           d."DistrictName" AS district,
           count(cm.*)::int AS cases,
           count(cm.*) FILTER (WHERE cs."CaseStatusName" <> 'Under Investigation')::int AS solved,
           (SELECT count(*)::int FROM "Employee" e WHERE e."UnitID" = u."UnitID") AS officers
    FROM "Unit" u
    LEFT JOIN "District" d ON d."DistrictID" = u."DistrictID"
    LEFT JOIN "CaseMaster" cm ON cm."PoliceStationID" = u."UnitID"
    LEFT JOIN "CaseStatusMaster" cs ON cs."CaseStatusID" = cm."CaseStatusID"
    WHERE (${district}::text IS NULL OR d."DistrictName" ILIKE ${district})
    GROUP BY u."UnitID", u."UnitName", d."DistrictName"
    HAVING count(cm.*) > 0
    ORDER BY cases DESC
    LIMIT ${limit}
  `

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      rate: r.cases > 0 ? Math.round((r.solved / r.cases) * 1000) / 10 : 0,
    }))
  )
}

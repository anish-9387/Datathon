import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const rows = await prisma.$queryRaw<
    Array<{
      id: number
      name: string
      cases: number
      solved: number
      stations: number
    }>
  >`
    SELECT d."DistrictID" AS id,
           d."DistrictName" AS name,
           count(cm.*)::int AS cases,
           count(cm.*) FILTER (WHERE cs."CaseStatusName" <> 'Under Investigation')::int AS solved,
           count(DISTINCT u."UnitID")::int AS stations
    FROM "District" d
    LEFT JOIN "Unit" u ON u."DistrictID" = d."DistrictID"
    LEFT JOIN "CaseMaster" cm ON cm."PoliceStationID" = u."UnitID"
    LEFT JOIN "CaseStatusMaster" cs ON cs."CaseStatusID" = cm."CaseStatusID"
    GROUP BY d."DistrictID", d."DistrictName"
    ORDER BY cases DESC
  `

  return NextResponse.json(rows)
}

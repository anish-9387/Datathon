import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { caseCorpusInclude, caseSummary } from "@/lib/ml"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 100)
  const status = searchParams.get("status")
  const type = searchParams.get("type")
  const district = searchParams.get("district")
  const q = searchParams.get("q")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const where: Prisma.CaseMasterWhereInput = {}
  if (status) where.caseStatus = { CaseStatusName: { contains: status, mode: "insensitive" } }
  if (type) where.crimeMajorHead = { CrimeGroupName: { contains: type, mode: "insensitive" } }
  if (district)
    where.policeStation = {
      district: { DistrictName: { contains: district, mode: "insensitive" } },
    }
  if (q)
    where.OR = [
      { CrimeNo: { contains: q, mode: "insensitive" } },
      { BriefFacts: { contains: q, mode: "insensitive" } },
    ]
  if (from || to)
    where.CrimeRegisteredDate = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }

  const [total, cases] = await Promise.all([
    prisma.caseMaster.count({ where }),
    prisma.caseMaster.findMany({
      where,
      include: caseCorpusInclude,
      orderBy: { CrimeRegisteredDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ data: cases.map(caseSummary), total, page, limit })
}

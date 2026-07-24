import { NextResponse } from "next/server"
import { getDistricts } from "@/lib/backend-data"

export async function GET() {
  const districts = await getDistricts()
  return NextResponse.json(districts)
}

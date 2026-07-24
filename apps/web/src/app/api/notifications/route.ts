import { NextResponse } from "next/server"
import { getNotifications } from "@/lib/backend-data"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [], unread: 0 })
  }

  const notifs = await getNotifications()
  return NextResponse.json(notifs)
}

export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}

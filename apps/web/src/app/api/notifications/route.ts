import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [], unread: 0 })
  }

  const userId = parseInt(session.user.id, 10)
  if (Number.isNaN(userId)) {
    return NextResponse.json({ notifications: [], unread: 0 })
  }

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ])

  return NextResponse.json({ notifications, unread })
}

export async function PATCH() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = parseInt(session.user.id, 10)
  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user" }, { status: 400 })
  }

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}

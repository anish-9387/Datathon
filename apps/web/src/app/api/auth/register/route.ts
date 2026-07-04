import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body as {
      name?: string
      email?: string
      password?: string
      role?: string
    }
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }
    const normalizedEmail = email.toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }
    const validRole =
      role && Object.values(Role).includes(role as Role) ? (role as Role) : Role.ANALYST
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role: validRole,
      },
      select: { id: true, name: true, email: true, role: true },
    })
    return NextResponse.json({ message: "User registered successfully", user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/dashboard", "/intelligence", "/ai"]
const authRoutes = ["/login"]

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const session = request.cookies.get("next-auth.session-token")?.value || request.cookies.get("__Secure-next-auth.session-token")?.value

  const isProtected = protectedRoutes.some((route) => path.startsWith(route))
  const isAuth = authRoutes.some((route) => path.startsWith(route))

  if (isProtected && !session && !path.startsWith("/api")) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuth && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

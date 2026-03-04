import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"
import { SignJWT } from "jose"

// Signs a credit delta so the client can send it to POST /api/credits
// The token is short-lived (30s) and contains the delta amount
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { delta } = body

    if (typeof delta !== "number" || delta === 0) {
      return NextResponse.json({ error: "Invalid delta" }, { status: 400 })
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret")
    const token = await new SignJWT({ delta, userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30s")
      .sign(secret)

    return NextResponse.json({ token })
  } catch (error) {
    console.error("Sign credits error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export async function GET(request: NextRequest) {
  const token = request.cookies.get("discord_session")?.value

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json({
      user: {
        id: payload.id,
        username: payload.username,
        discriminator: payload.discriminator,
        avatar: payload.avatar,
        global_name: payload.global_name,
      },
    })
  } catch {
    // Invalid or expired token
    const response = NextResponse.json({ user: null }, { status: 401 })
    response.cookies.delete("discord_session")
    return response
  }
}

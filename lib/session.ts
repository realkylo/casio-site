import { NextRequest } from "next/server"
import { jwtVerify } from "jose"

export interface SessionUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  global_name: string | null
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get("discord_session")?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return {
      id: payload.id as string,
      username: payload.username as string,
      discriminator: payload.discriminator as string,
      avatar: (payload.avatar as string) || null,
      global_name: (payload.global_name as string) || null,
    }
  } catch {
    return null
  }
}

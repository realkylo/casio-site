import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  const clientId = process.env.DISCORD_CLIENT_ID!
  const clientSecret = process.env.DISCORD_CLIENT_SECRET!
  const secret = process.env.NEXTAUTH_SECRET!

  // Build redirect_uri from the actual incoming request URL so it always matches
  // what Discord sent the user to (crucial for token exchange)
  const redirectUri = `${url.origin}/api/auth/callback`

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error("Discord token exchange failed:", err)
      return NextResponse.redirect(new URL("/?error=token_failed", request.url))
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Fetch user info from Discord
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/?error=user_fetch_failed", request.url))
    }

    const discordUser = await userRes.json()

    // Create a JWT session token
    const jwtSecret = new TextEncoder().encode(secret)
    const token = await new SignJWT({
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
      global_name: discordUser.global_name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(jwtSecret)

    // Set cookie and redirect to home
    const response = NextResponse.redirect(new URL("/", request.url))
    response.cookies.set("discord_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url))
  }
}

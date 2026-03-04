import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Discord client ID not configured" }, { status: 500 })
  }

  // Build the redirect URI dynamically
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  
  const redirectUri = `${baseUrl}/api/auth/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
  })

  return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`)
}

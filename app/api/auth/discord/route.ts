import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: "Discord client ID not configured" }, { status: 500 })
  }

  // Build the redirect URI from the actual request origin so it always matches
  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/auth/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify connections guilds.members.read guilds.channels.read guilds guilds.join gdm.join",
  })

  return NextResponse.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`)
}

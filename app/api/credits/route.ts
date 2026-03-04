import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getSessionUser } from "@/lib/session"
import { Long } from "mongodb"
import { jwtVerify } from "jose"

function discordIdToLong(id: string): Long {
  return Long.fromString(id)
}

// Shared secret for signing credit mutations from the server-side context
// This prevents direct API abuse — only our own code can issue signed updates
const CREDITS_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret"

async function verifyInternalToken(token: string): Promise<{ delta: number } | null> {
  try {
    const secret = new TextEncoder().encode(CREDITS_SECRET)
    const { payload } = await jwtVerify(token, secret)
    if (typeof payload.delta === "number") {
      return { delta: payload.delta }
    }
    return null
  } catch {
    return null
  }
}

// GET /api/credits - Get current user's credits
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("my_app_db")
    const collection = db.collection("users")
    const numericId = discordIdToLong(user.id)

    const doc = await collection.findOne({ _id: numericId as any })

    if (!doc) {
      await collection.insertOne({ _id: numericId as any, credits: 0 })
      return NextResponse.json({ credits: 0, discordId: user.id })
    }

    return NextResponse.json({ credits: doc.credits ?? 0, discordId: user.id })
  } catch (error) {
    console.error("Credits fetch error:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}

// POST /api/credits - Update credits using a signed token (prevents abuse)
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Verify the signed token to get the delta
    const verified = await verifyInternalToken(token)
    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 })
    }

    const { delta } = verified

    const client = await clientPromise
    const db = client.db("my_app_db")
    const collection = db.collection("users")
    const numericId = discordIdToLong(user.id)

    if (delta < 0) {
      // Subtracting — check balance first
      const doc = await collection.findOne({ _id: numericId as any })
      const current = doc?.credits ?? 0
      if (current < Math.abs(delta)) {
        return NextResponse.json({ error: "Insufficient credits", credits: current }, { status: 400 })
      }
    }

    const result = await collection.findOneAndUpdate(
      { _id: numericId as any },
      { $inc: { credits: delta } },
      { returnDocument: "after", upsert: true }
    )

    return NextResponse.json({ credits: result?.credits ?? 0 })
  } catch (error) {
    console.error("Credits update error:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}

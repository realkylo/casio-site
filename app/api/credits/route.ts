import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getSessionUser } from "@/lib/session"

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

    // Look up user by Discord ID (_id is the Discord user ID as a string)
    const doc = await collection.findOne({ _id: user.id as any })

    if (!doc) {
      // User exists in Discord but not in the database yet — create with default 0 credits
      await collection.insertOne({ _id: user.id as any, credits: 0 })
      return NextResponse.json({ credits: 0, discordId: user.id })
    }

    return NextResponse.json({ credits: doc.credits ?? 0, discordId: user.id })
  } catch (error) {
    console.error("Credits fetch error:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}

// POST /api/credits - Update credits (add or subtract)
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, amount } = body

    if (!action || typeof amount !== "number" || amount < 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("my_app_db")
    const collection = db.collection("users")

    if (action === "add") {
      const result = await collection.findOneAndUpdate(
        { _id: user.id as any },
        { $inc: { credits: amount } },
        { returnDocument: "after", upsert: true }
      )
      return NextResponse.json({ credits: result?.credits ?? 0 })
    }

    if (action === "subtract") {
      // First check they have enough
      const doc = await collection.findOne({ _id: user.id as any })
      const current = doc?.credits ?? 0
      if (current < amount) {
        return NextResponse.json({ error: "Insufficient credits", credits: current }, { status: 400 })
      }

      const result = await collection.findOneAndUpdate(
        { _id: user.id as any, credits: { $gte: amount } },
        { $inc: { credits: -amount } },
        { returnDocument: "after" }
      )

      if (!result) {
        return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
      }

      return NextResponse.json({ credits: result.credits ?? 0 })
    }

    if (action === "set") {
      const result = await collection.findOneAndUpdate(
        { _id: user.id as any },
        { $set: { credits: amount } },
        { returnDocument: "after", upsert: true }
      )
      return NextResponse.json({ credits: result?.credits ?? 0 })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Credits update error:", error)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }
}

"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Coins, Users, Plus, Trash2, Trophy, Percent, Swords, Volume2, VolumeX, Share2, ChevronLeft, Crown, Info, X } from "lucide-react"
import { useCredits } from "@/lib/credits-context"

// ── Sound Effects ──────────────────────────────────────────────────────────

class SoundManager {
  private ctx: AudioContext | null = null
  private muted = false

  private getCtx() {
    if (!this.ctx) this.ctx = new AudioContext()
    return this.ctx
  }

  setMuted(m: boolean) { this.muted = m }
  isMuted() { return this.muted }

  tick() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "square"
    osc.frequency.value = 800 + Math.random() * 400
    gain.gain.value = 0.04
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.04)
  }

  slowTick() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "triangle"
    osc.frequency.value = 400 + Math.random() * 200
    gain.gain.value = 0.06
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  }

  nearMiss() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.5)
    gain.gain.value = 0.08
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  }

  reveal() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(500, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.15)
    gain.gain.value = 0.1
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  }

  win() {
    if (this.muted) return
    const ctx = this.getCtx()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.value = 0.08
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4)
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.4)
    })
  }

  lose() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.6)
    gain.gain.value = 0.08
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  }

  tension() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 2)
    gain.gain.value = 0.04
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.8)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 2)
  }

  wheelTick() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.value = 1200 + Math.random() * 300
    gain.gain.value = 0.05
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.03)
  }

  countdownBeep() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.value = 0.1
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  }

  wobble() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.value = 300 + Math.random() * 100
    gain.gain.value = 0.03
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  switchItem() {
    if (this.muted) return
    const ctx = this.getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "triangle"
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.2)
    gain.gain.value = 0.07
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  }
}

const soundManager = typeof window !== "undefined" ? new SoundManager() : null

// ── Inline credit badge ───────────────────────────────────────────────────
function CreditBadge({ value, className = "" }: { value: string | number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Coins size={12} className="text-yellow-400 inline-block flex-shrink-0" />
      <span>{typeof value === "number" ? value.toLocaleString() : value}</span>
    </span>
  )
}

// ── Rarity color system ────────────────────────────────────────────────────

type ItemTier = "legendary" | "epic" | "rare" | "uncommon" | "common"

function getItemTier(prize: Prize, caseData: Case): ItemTier {
  const maxValue = Math.max(...caseData.prizes.map(p => p.value))
  const ratio = maxValue > 0 ? prize.value / maxValue : 0
  if (ratio >= 0.8) return "legendary"
  if (ratio >= 0.5) return "epic"
  if (ratio >= 0.3) return "rare"
  if (ratio >= 0.1) return "uncommon"
  return "common"
}

const TIER_COLORS: Record<ItemTier, { border: string; glow: string; bg: string }> = {
  legendary: { border: "#facc15", glow: "rgba(250, 204, 21, 0.4)", bg: "rgba(250, 204, 21, 0.08)" },
  epic:      { border: "#a855f7", glow: "rgba(168, 85, 247, 0.4)", bg: "rgba(168, 85, 247, 0.08)" },
  rare:      { border: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)", bg: "rgba(59, 130, 246, 0.08)" },
  uncommon:  { border: "#22c55e", glow: "rgba(34, 197, 94, 0.4)", bg: "rgba(34, 197, 94, 0.08)" },
  common:    { border: "#6b7280", glow: "rgba(107, 114, 128, 0.3)", bg: "rgba(107, 114, 128, 0.06)" },
}

// ── Case definitions ───────────────────────────────────────────────────────

type Rarity = "easy" | "medium" | "hard" | "extreme"

interface Prize {
  name: string
  value: number
  chance: number
  imageUrl: string
}

interface Case {
  id: string
  name: string
  price: number
  rarity: Rarity
  prizes: Prize[]
}

const CASES: Case[] = [
  {
    id: "starter", name: "GiftCard Box", price: 5, rarity: "easy",
    prizes: [
      { name: "Spam.me 20$",   value: 20,  chance: 40, imageUrl: "https://i.ibb.co/KcX4qGBd/2026-03-05-004211-removebg-preview.png" },
      { name: "Spam.me 75$",      value: 75, chance: 75, imageUrl: "https://i.ibb.co/hRywCV36/Gemini-Generated-Image-zg5og3zg5og3zg5o-removebg-preview.png" },
      { name: "Spam.me 50$",  value: 50, chance: 8,  imageUrl: "https://i.ibb.co/gL655Xkr/Gemini-Generated-Image-vca85vca85vca85v-removebg-preview.png" },
      { name: "Spam.me 25$",  value: 25, chance: 8,  imageUrl: "https://i.ibb.co/4nKNScB3/Gemini-Generated-Image-ncag5sncag5sncag-removebg-preview.png" },
      { name: "Refund",               value: 5,  chance: 2,  imageUrl: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=200&q=80" },
    ]
  },
  {
    id: "tech-basic", name: "ALL IN BTW", price: 200, rarity: "hard",
    prizes: [
      { name: "GO TO THE STREET",               value: 0,  chance: 99, imageUrl: "https://i.ibb.co/GfVyFHLZ/image2.png" },
      { name: "Sigma Car Of LIGMA",          value: 3000, chance: 1, imageUrl: "https://i.ibb.co/k2401Qpm/image.png"},
    ]
  },
  {
    id: "casual", name: "Electric Box", price: 300, rarity: "easy",
    prizes: [
      { name: "SMS PHONY",            value: 1000,  chance: 2.5, imageUrl: "https://i.ibb.co/gZ51M7ZZ/im555age.png" },
      { name: "MAGICAL LAPTOP",            value: 1500, chance: 2.5, imageUrl: "https://i.ibb.co/GQ2DbTRr/ima34234ge.png" },
    ]
  },
  {
    id: "electronics", name: "Electronics Box", price: 50, rarity: "medium",
    prizes: [
      { name: "USB-C Hub Pro",         value: 35, chance: 30, imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&q=80" },
      { name: "AirPods Gen 3",         value: 120, chance: 25, imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80" },
      { name: "iPad Mini Case",        value: 60, chance: 20, imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&q=80" },
      { name: "Samsung Galaxy Watch",  value: 180, chance: 15, imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80" },
      { name: "iPhone 14",             value: 700, chance: 7,  imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=80" },
      { name: "Nothing",              value: 0,  chance: 3,  imageUrl: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=200&q=80" },
    ]
  },
  {
    id: "gaming", name: "Gaming Box", price: 60, rarity: "medium",
    prizes: [
      { name: "Xbox Game Pass 3mo",    value: 30, chance: 30, imageUrl: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=200&q=80" },
      { name: "Gaming Headset",        value: 75, chance: 25, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80" },
      { name: "Mechanical Keyboard",   value: 120, chance: 20, imageUrl: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=200&q=80" },
      { name: "PS5 Controller",        value: 70, chance: 15, imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=200&q=80" },
      { name: "RTX 4060",              value: 400, chance: 7,  imageUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80" },
      { name: "Nothing",              value: 0,  chance: 3,  imageUrl: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=200&q=80" },
    ]
  },
  {
    id: "laptop", name: "Laptop Box", price: 200, rarity: "hard",
    prizes: [
      { name: "iPad 10th Gen",         value: 449, chance: 22, imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&q=80" },
      { name: "MacBook Air M1",        value: 900, chance: 15, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&q=80" },
      { name: "Dell XPS 13",           value: 1100, chance: 12, imageUrl: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=200&q=80" },
      { name: "MacBook Pro 14\"",      value: 1800, chance: 8,  imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&q=80" },
      { name: "MacBook Pro 16\" M3",   value: 2800, chance: 3,  imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&q=80" },
      { name: "Nothing",              value: 0,  chance: 40, imageUrl: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=200&q=80" },
    ]
  },
  {
    id: "rolex-box", name: "Rolex Box", price: 500, rarity: "extreme",
    prizes: [
      { name: "Rolex Oyster Perpetual", value: 5300, chance: 2.5, imageUrl: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=200&q=80" },
      { name: "Rolex Submariner",      value: 9000, chance: 1.5, imageUrl: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=200&q=80" },
      { name: "Rolex Datejust 36",     value: 7200, chance: 1,   imageUrl: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=200&q=80" },
      { name: "Nothing",              value: 0,  chance: 95, imageUrl: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=200&q=80" },
    ]
  },
  {
    id: "car-box", name: "Car Box", price: 1000, rarity: "extreme",
    prizes: [
      { name: "Tesla Model 3",         value: 42000, chance: 0.5, imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=200&q=80" },
      { name: "BMW 3 Series",          value: 48000, chance: 0.3, imageUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&q=80" },
      { name: "Mercedes A-Class",      value: 35000, chance: 0.8, imageUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=200&q=80" },
      { name: "Nothing",              value: 0,  chance: 98.4, imageUrl: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=200&q=80" },
    ]
  },
]

const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bg: string; border: string }> = {
  easy:    { label: "Easy",    color: "#22c55e", bg: "#14532d33", border: "#22c55e44" },
  medium:  { label: "Medium",  color: "#eab308", bg: "#71350833", border: "#eab30844" },
  hard:    { label: "Hard",    color: "#ef4444", bg: "#7f1d1d33", border: "#ef444444" },
  extreme: { label: "Extreme", color: "#a855f7", bg: "#581c8733", border: "#a855f744" },
}

// Added 3v3 format
const FORMATS = ["1v1", "1v1v1", "1v1v1v1", "2v2", "2v2v2", "3v3"] as const
type Format = typeof FORMATS[number]

function formatPlayerCount(f: Format): number {
  if (f === "1v1") return 2
  if (f === "2v2") return 4
  if (f === "1v1v1") return 3
  if (f === "1v1v1v1") return 4
  if (f === "2v2v2") return 6
  if (f === "3v3") return 6
  return 2
}

function formatTeamCount(f: Format): number {
  if (f === "2v2") return 2
  if (f === "2v2v2") return 3
  if (f === "3v3") return 2
  return formatPlayerCount(f)
}

function formatPlayersPerTeam(f: Format): number {
  if (f === "2v2") return 2
  if (f === "2v2v2") return 2
  if (f === "3v3") return 3
  return 1
}

function getTeamAssignment(f: Format, _playerCount: number): number[] {
  if (f === "2v2") return [0, 0, 1, 1]
  if (f === "2v2v2") return [0, 0, 1, 1, 2, 2]
  if (f === "3v3") return [0, 0, 0, 1, 1, 1]
  if (f === "1v1") return [0, 1]
  if (f === "1v1v1") return [0, 1, 2]
  if (f === "1v1v1v1") return [0, 1, 2, 3]
  return Array.from({ length: _playerCount }, (_, i) => i)
}

function isTeamFormat(f: Format): boolean {
  return f === "2v2" || f === "2v2v2" || f === "3v3"
}

const BOT_NAMES = ["BOT #1", "BOT #2", "BOT #3", "BOT #4", "BOT #5", "BOT #6", "BOT #7", "BOT #8", "BOT #9", "BOT #10", "BOT #11", "BOT #12", "BOT #13", "BOT #14", "BOT #15", "BOT #16", "BOT #17", "BOT #18", "BOT #19", "BOT #20"]

function isAllyPlayer(f: Format, idx: number): boolean {
  const teams = getTeamAssignment(f, formatPlayerCount(f))
  return teams[idx] === teams[0]
}

function openCase(c: Case): Prize {
  const roll = Math.random() * 100
  let cumulative = 0
  for (const p of c.prizes) {
    cumulative += p.chance
    if (roll <= cumulative) return p
  }
  return c.prizes[c.prizes.length - 1]
}

// Build a "scam strip" - expensive items near the landing zone for near-miss tension
// Also frequently makes the final position switch to an adjacent item
function buildSlotStrip(caseData: Case, finalPrize: Prize, length: number): { strip: Prize[]; actualLandIdx: number } {
  const strip: Prize[] = []
  const expensivePrizes = caseData.prizes.filter(p => p.value > finalPrize.value * 1.5 && p.value > 0)

  for (let i = 0; i < length; i++) {
    const roll = Math.random() * 100
    let cumulative = 0
    let picked = caseData.prizes[0]
    for (const p of caseData.prizes) {
      cumulative += p.chance
      if (roll <= cumulative) { picked = p; break }
    }
    strip.push(picked)
  }

  // Final prize lands at index length-3
  const finalIdx = length - 3
  strip[finalIdx] = finalPrize

  // Place expensive/tempting items right next to the landing zone
  if (expensivePrizes.length > 0) {
    strip[finalIdx - 1] = expensivePrizes[Math.floor(Math.random() * expensivePrizes.length)]
    strip[finalIdx + 1] = expensivePrizes[Math.floor(Math.random() * expensivePrizes.length)]
    if (finalIdx - 2 >= 0) {
      strip[finalIdx - 2] = expensivePrizes[Math.floor(Math.random() * expensivePrizes.length)]
    }
    if (finalIdx + 2 < length) {
      strip[finalIdx + 2] = expensivePrizes[Math.floor(Math.random() * expensivePrizes.length)]
    }
  }

  return { strip, actualLandIdx: finalIdx }
}

// ── Slot Machine Reel (Vertical, full-height column) ──────────────────────

const ITEM_HEIGHT = 110
const VISIBLE_ITEMS = 3
const STRIP_LENGTH = 50

function SlotReel({
  caseData,
  finalPrize,
  isSpinning,
  isRevealed,
  playerName,
  isAlly: allyFlag,
}: {
  caseData: Case
  finalPrize: Prize | null
  isSpinning: boolean
  isRevealed: boolean
  playerName: string
  isAlly: boolean
}) {
  const stripRef = useRef<Prize[]>([])
  const actualLandIdxRef = useRef(STRIP_LENGTH - 3)
  const [offset, setOffset] = useState(0)
  const animFrameRef = useRef<number>(0)
  const posRef = useRef(0)
  const startTimeRef = useRef(0)
  const tickCountRef = useRef(0)
  const [landed, setLanded] = useState(false)
  const [shownPrize, setShownPrize] = useState<Prize | null>(null)
  const [wobbleAmount, setWobbleAmount] = useState(0)
  const [switchFlash, setSwitchFlash] = useState(false)

  useEffect(() => {
    if (isSpinning && finalPrize && !isRevealed) {
      const { strip, actualLandIdx } = buildSlotStrip(caseData, finalPrize, STRIP_LENGTH)
      stripRef.current = strip
      actualLandIdxRef.current = actualLandIdx
      posRef.current = 0
      setOffset(0)
      setLanded(false)
      setShownPrize(null)
      setWobbleAmount(0)
      setSwitchFlash(false)

      startTimeRef.current = performance.now()
      tickCountRef.current = 0

      const targetPos = actualLandIdx * ITEM_HEIGHT
      const totalDuration = 5.5 // longer for more tension

      const animate = (now: number) => {
        const elapsed = (now - startTimeRef.current) / 1000

        if (elapsed < totalDuration) {
          const progress = elapsed / totalDuration

          let eased: number
          if (progress < 0.5) {
            // Fast phase
            eased = (progress / 0.5) * 0.7
          } else if (progress < 0.75) {
            // Slowing down phase
            const slowProgress = (progress - 0.5) / 0.25
            eased = 0.7 + slowProgress * 0.2
          } else {
            // Ultra slow wobble/crawl phase - most of the tension is here
            const crawlProgress = (progress - 0.75) / 0.25
            // Cubic ease-out for final crawl
            const crawlEased = 1 - Math.pow(1 - crawlProgress, 3)
            eased = 0.9 + crawlEased * 0.1

            // Wobble back and forth during crawl phase
            if (crawlProgress < 0.85) {
              const wobbleFreq = 3 + crawlProgress * 8
              const wobbleAmp = (1 - crawlProgress) * 12
              const wobble = Math.sin(crawlProgress * Math.PI * wobbleFreq) * wobbleAmp
              setWobbleAmount(wobble)
              if (Math.abs(wobble) > 6) {
                soundManager?.wobble()
              }
            } else {
              setWobbleAmount(0)
            }
          }

          const currentPos = eased * targetPos
          const currentItem = Math.floor(currentPos / ITEM_HEIGHT)

          if (currentItem > tickCountRef.current) {
            tickCountRef.current = currentItem
            if (progress < 0.5) {
              soundManager?.tick()
            } else if (progress < 0.75) {
              soundManager?.slowTick()
            } else {
              soundManager?.slowTick()
              // Near miss sounds when passing expensive items near the end
              const nearIdx = actualLandIdxRef.current
              if (Math.abs(currentItem - nearIdx) <= 3) {
                soundManager?.nearMiss()
              }
            }
          }

          posRef.current = currentPos
          setOffset(-currentPos)
          animFrameRef.current = requestAnimationFrame(animate)
        } else {
          // Final landing - sometimes "switch" to adjacent item for extra scam factor
          // (in ~60% of cases the item appears to slide one more position then back)
          const doFakeSwitch = Math.random() > 0.4
          if (doFakeSwitch) {
            // Briefly show one item above, then snap back
            const overshootPos = targetPos + ITEM_HEIGHT * 0.7
            posRef.current = overshootPos
            setOffset(-overshootPos)
            soundManager?.switchItem()
            setSwitchFlash(true)

            setTimeout(() => {
              posRef.current = targetPos
              setOffset(-targetPos)
              setSwitchFlash(false)
              setLanded(true)
              setShownPrize(finalPrize)
              setWobbleAmount(0)
              soundManager?.reveal()
            }, 350)
          } else {
            posRef.current = targetPos
            setOffset(-targetPos)
            setLanded(true)
            setShownPrize(finalPrize)
            setWobbleAmount(0)
            soundManager?.reveal()
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate)

      return () => {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isSpinning, finalPrize, isRevealed, caseData])

  useEffect(() => {
    if (isRevealed && finalPrize) {
      setShownPrize(finalPrize)
      setLanded(true)
    }
  }, [isRevealed, finalPrize])

  const strip = stripRef.current.length > 0 ? stripRef.current : caseData.prizes.slice(0, 5)
  const tier = landed && shownPrize ? getItemTier(shownPrize, caseData) : null
  const tierColor = tier ? TIER_COLORS[tier] : null

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {/* Player name */}
      <p className={`text-xs font-bold mb-2 truncate max-w-full ${allyFlag ? "text-emerald-400" : "text-red-400"}`}>
        {playerName}
      </p>

      {/* Slot window */}
      <div
        className="relative overflow-hidden rounded-xl w-full transition-all duration-300"
        style={{
          height: ITEM_HEIGHT * VISIBLE_ITEMS,
          border: `2px solid ${landed && tierColor ? tierColor.border : switchFlash ? "#ef4444" : allyFlag ? "#1a3a2e" : "#3a1a1e"}`,
          boxShadow: landed && tierColor
            ? `0 0 20px ${tierColor.glow}, inset 0 0 15px ${tierColor.bg}`
            : switchFlash
            ? "0 0 20px rgba(239, 68, 68, 0.4)"
            : isSpinning && !landed
            ? "0 0 15px rgba(139, 92, 246, 0.2), inset 0 0 15px rgba(139, 92, 246, 0.05)"
            : "none",
          background: "#0c0c1d",
        }}
      >
        {/* Center line indicator */}
        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: ITEM_HEIGHT - 1, height: ITEM_HEIGHT + 2 }}>
          <div className="w-full h-full" style={{ borderTop: "2px solid rgba(255,255,255,0.15)", borderBottom: "2px solid rgba(255,255,255,0.15)" }} />
        </div>

        {/* Top/bottom fade */}
        <div className="absolute top-0 left-0 right-0 h-10 z-10 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0c0c1d, transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-10 z-10 pointer-events-none" style={{ background: "linear-gradient(to top, #0c0c1d, transparent)" }} />

        {/* Strip */}
        <div
          className="absolute left-0 right-0"
          style={{
            transform: `translateY(${offset + ITEM_HEIGHT + wobbleAmount}px)`,
            transition: switchFlash ? "transform 0.3s cubic-bezier(0.2, 0, 0.4, 1)" : "none",
          }}
        >
          {strip.map((prize, i) => {
            const itemTier = getItemTier(prize, caseData)
            const itemTierColor = TIER_COLORS[itemTier]
            return (
              <div
                key={i}
                className="flex flex-col items-center justify-center px-2"
                style={{ height: ITEM_HEIGHT }}
              >
                <div
                  className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2"
                  style={{
                    borderColor: itemTierColor.border + "88",
                    background: itemTierColor.bg,
                  }}
                >
                  <img
                    src={prize.imageUrl}
                    alt={prize.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
                <p className="text-[9px] text-slate-500 truncate max-w-full mt-0.5 text-center">{prize.name}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Prize info below */}
      {landed && shownPrize && (
        <div
          className="mt-2 rounded-lg px-2 py-1.5 text-center w-full border"
          style={{
            borderColor: tierColor ? tierColor.border + "66" : "#2a2a3e",
            background: tierColor ? tierColor.bg : "#0f0f23",
          }}
        >
          <p className="text-[10px] text-slate-300 truncate font-medium">{shownPrize.name}</p>
          <p className="text-sm font-black" style={{ color: tierColor ? tierColor.border : "#fff" }}>
            <CreditBadge value={shownPrize.value.toFixed(2)} />
          </p>
        </div>
      )}
    </div>
  )
}

// ── Tiebreaker Wheel ─────────────────────────────────────────────────────

function TiebreakerWheel({
  teams,
  teamNames,
  battleValue,
  onResult,
}: {
  teams: number[]
  teamNames: string[][]
  battleValue: number
  onResult: (winnerIdx: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const rotationRef = useRef(0)
  const animRef = useRef<number>(0)

  const teamColors = ["#22c55e", "#ef4444", "#eab308", "#3b82f6", "#a855f7", "#f97316"]
  const uniqueTeams = [...new Set(teams)]

  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = center - 10
    const sliceAngle = (2 * Math.PI) / uniqueTeams.length

    ctx.clearRect(0, 0, size, size)

    ctx.beginPath()
    ctx.arc(center, center, radius + 4, 0, 2 * Math.PI)
    ctx.strokeStyle = spinning ? "rgba(139, 92, 246, 0.5)" : "rgba(255,255,255,0.1)"
    ctx.lineWidth = 3
    ctx.stroke()

    uniqueTeams.forEach((teamIdx, i) => {
      const startAngle = rotation + i * sliceAngle
      const endAngle = startAngle + sliceAngle

      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = teamColors[teamIdx % teamColors.length]
      ctx.fill()
      ctx.strokeStyle = "#0a0a1a"
      ctx.lineWidth = 3
      ctx.stroke()

      const midAngle = startAngle + sliceAngle / 2
      const textRadius = radius * 0.55
      const tx = center + Math.cos(midAngle) * textRadius
      const ty = center + Math.sin(midAngle) * textRadius
      ctx.save()
      ctx.translate(tx, ty)
      ctx.rotate(midAngle + Math.PI / 2)
      ctx.fillStyle = "#fff"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.shadowColor = "rgba(0,0,0,0.5)"
      ctx.shadowBlur = 4
      const label = teamNames[teamIdx]?.[0] || `Team ${teamIdx + 1}`
      ctx.fillText(label, 0, 0)
      ctx.shadowBlur = 0
      ctx.restore()
    })

    ctx.beginPath()
    ctx.arc(center, center, 25, 0, 2 * Math.PI)
    ctx.fillStyle = "#0f0f23"
    ctx.fill()
    ctx.strokeStyle = "#3a3a4e"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = "#fff"
    ctx.font = "bold 12px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("VS", center, center)

    ctx.beginPath()
    ctx.moveTo(center - 14, 2)
    ctx.lineTo(center + 14, 2)
    ctx.lineTo(center, 26)
    ctx.closePath()
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    ctx.strokeStyle = "#0a0a1a"
    ctx.lineWidth = 2
    ctx.stroke()
  }, [uniqueTeams, teamNames, teamColors, spinning])

  useEffect(() => {
    drawWheel(0)
  }, [drawWheel])

  const spin = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    setWinner(null)
    soundManager?.tension()

    const winIdx = uniqueTeams[Math.floor(Math.random() * uniqueTeams.length)]
    const sliceAngle = (2 * Math.PI) / uniqueTeams.length
    const winSliceIdx = uniqueTeams.indexOf(winIdx)
    const targetAngle = -(winSliceIdx * sliceAngle + sliceAngle / 2) - Math.PI / 2
    const totalRotation = Math.PI * 2 * 10 + targetAngle

    const startTime = performance.now()
    const duration = 6000
    let lastSlice = -1

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentRotation = eased * totalRotation

      const currentSlice = Math.floor((currentRotation % (Math.PI * 2)) / sliceAngle)
      if (currentSlice !== lastSlice) {
        lastSlice = currentSlice
        soundManager?.wheelTick()
      }

      rotationRef.current = currentRotation
      drawWheel(currentRotation)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        setWinner(winIdx)
        setTimeout(() => {
          onResult(winIdx)
        }, 2000)
      }
    }

    animRef.current = requestAnimationFrame(animate)
  }, [spinning, uniqueTeams, drawWheel, onResult])

  useEffect(() => {
    const timer = setTimeout(spin, 1200)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white tracking-tight">TIEBREAKER</h2>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-slate-400 text-sm">{"Teams are tied! Fighting for"}</span>
            <span className="text-emerald-400 font-black text-lg"><CreditBadge value={battleValue.toFixed(2)} /></span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Only the battle entry cost is at stake</p>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-6 rounded-full opacity-30 animate-pulse"
            style={{ background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)" }}
          />
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="rounded-full relative z-10"
            style={{
              boxShadow: spinning
                ? "0 0 60px rgba(139, 92, 246, 0.4), 0 0 120px rgba(139, 92, 246, 0.15)"
                : winner !== null
                ? `0 0 40px ${teamColors[winner % teamColors.length]}66`
                : "0 0 20px rgba(139, 92, 246, 0.2)",
            }}
          />
        </div>

        {winner !== null && (
          <div className="text-center" style={{ animation: "battleBounceIn 0.5s ease-out forwards" }}>
            <p className="text-4xl font-black" style={{ color: teamColors[winner % teamColors.length] }}>
              {teamNames[winner]?.[0] === "You" ? "Your Team" : teamNames[winner]?.[0] || `Team ${winner + 1}`} Wins!
            </p>
            <p className="text-emerald-400 text-xl font-bold mt-2">+<CreditBadge value={battleValue.toFixed(2)} /></p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Won Item Card ─────────────────────────────────────────────────────

function WonItemCard({ prize, caseData }: { prize: Prize; caseData: Case }) {
  const tier = getItemTier(prize, caseData)
  const tierColor = TIER_COLORS[tier]
  return (
    <div
      className="rounded-xl p-3 flex flex-col items-center gap-2 min-w-[120px] border"
      style={{
        background: "#111127",
        borderColor: tierColor.border + "44",
      }}
    >
      <div
        className="w-16 h-16 mx-auto rounded-lg overflow-hidden border"
        style={{ borderColor: tierColor.border + "44", background: tierColor.bg }}
      >
        <img
          src={prize.imageUrl}
          alt={prize.name}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
      </div>
      <div className="w-full text-center">
        <p className="text-xs text-slate-300 truncate font-medium">{prize.name}</p>
        <p className="text-sm font-black" style={{ color: tierColor.border }}>
          <CreditBadge value={prize.value.toFixed(2)} />
        </p>
      </div>
    </div>
  )
}

// ── Countdown overlay ─────────────────────────────────────────────────────

function CountdownOverlay({ count }: { count: number }) {
  useEffect(() => {
    soundManager?.countdownBeep()
  }, [count])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center">
        <div key={count} className="text-9xl font-black text-white animate-countPulse">
          {count}
        </div>
        <p className="text-slate-400 text-lg mt-4 font-medium tracking-wide">{"Get Ready..."}</p>
      </div>
    </div>
  )
}

// ── Case Info Modal ──────────────────────────────────────────────────────

function CaseInfoModal({ caseData, onClose }: { caseData: Case; onClose: () => void }) {
  const rc = RARITY_CONFIG[caseData.rarity]
  const sortedPrizes = [...caseData.prizes].sort((a, b) => b.value - a.value)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md mx-4 rounded-2xl border p-6"
        style={{ background: "#0f0f23", borderColor: rc.border }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div>
            <h3 className="text-lg font-black text-white">{caseData.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}>
                {rc.label}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Coins size={10} className="text-yellow-400" />
                {caseData.price} credits
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">Possible Prizes</p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {sortedPrizes.map((prize, i) => {
            const tier = getItemTier(prize, caseData)
            const tierColor = TIER_COLORS[tier]
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: tierColor.border + "33", background: tierColor.bg }}
              >
                <div
                  className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border"
                  style={{ borderColor: tierColor.border + "66" }}
                >
                  <img
                    src={prize.imageUrl}
                    alt={prize.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{prize.name}</p>
                  <p className="text-xs font-bold" style={{ color: tierColor.border }}>
                    <CreditBadge value={prize.value.toLocaleString()} />
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-white">{prize.chance}%</p>
                  <p className="text-[10px] text-slate-500">chance</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

type BattlePhase = "setup" | "select-cases" | "countdown" | "running" | "tiebreaker" | "done"

interface PlayerResult {
  name: string
  teamIndex: number
  prizes: Prize[]
  total: number
  isAlly: boolean
}

interface TeamResult {
  teamIndex: number
  playerNames: string[]
  prizes: Prize[]
  total: number
}

export default function BattlesPage() {
  const [phase, setPhase] = useState<BattlePhase>("setup")
  const [format, setFormat] = useState<Format>("2v2")
  const [selectedCases, setSelectedCases] = useState<Case[]>([])
  const [playerResults, setPlayerResults] = useState<PlayerResult[]>([])
  const [teamResults, setTeamResults] = useState<TeamResult[]>([])
  const [winnerTeam, setWinnerTeam] = useState<number | null>(null)
  const { credits, setCredits, isLoaded, trackWager } = useCredits()
  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all")
  const [countdown, setCountdown] = useState(0)
  const [animatingRound, setAnimatingRound] = useState(-1)
  const [roundSpinning, setRoundSpinning] = useState(false)
  const [roundRevealed, setRoundRevealed] = useState<boolean[]>([])
  const [allRoundPrizes, setAllRoundPrizes] = useState<Prize[][]>([])
  const [runningTotals, setRunningTotals] = useState<number[]>([])
  const [confirmedTotals, setConfirmedTotals] = useState<number[]>([])
  const [loanPercent, setLoanPercent] = useState(0)
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [muted, setMuted] = useState(false)
  const [showTiebreaker, setShowTiebreaker] = useState(false)
  const [tiedTeamData, setTiedTeamData] = useState<{ teams: number[]; teamNames: string[][]; battleValue: number } | null>(null)
  const pendingResolveRef = useRef<((winIdx: number) => void) | null>(null)
  const [inspectCase, setInspectCase] = useState<Case | null>(null)

  const playerCount = formatPlayerCount(format)
  const teamCount = formatTeamCount(format)
  const perTeam = formatPlayersPerTeam(format)
  const teams = getTeamAssignment(format, playerCount)

  const baseCost = selectedCases.reduce((sum, c) => sum + c.price, 0)
  const loanDiscount = loanPercent / 100
  const yourCost = Math.round(baseCost * (1 - loanDiscount) * 100) / 100
  const filteredCases = rarityFilter === "all" ? CASES : CASES.filter(c => c.rarity === rarityFilter)
  const totalBattleValue = baseCost * playerCount

  const stableNames = useMemo(() => {
    return Array.from({ length: playerCount }, (_, i) => {
      if (i === 0) return "You"
      return BOT_NAMES[i % BOT_NAMES.length]
    })
  }, [playerCount])

  const toggleMute = () => {
    const newMuted = !muted
    setMuted(newMuted)
    soundManager?.setMuted(newMuted)
  }

  const addCase = (c: Case) => {
    if (selectedCases.length >= 6) return
    setSelectedCases(prev => [...prev, c])
  }

  const removeCase = (idx: number) => {
    setSelectedCases(prev => prev.filter((_, i) => i !== idx))
  }

  // Group players by team for display
  const getTeamGroups = useCallback(() => {
    const groups: { teamIdx: number; playerIndices: number[] }[] = []
    const seen = new Set<number>()
    for (let i = 0; i < playerCount; i++) {
      const t = teams[i]
      if (!seen.has(t)) {
        seen.add(t)
        groups.push({ teamIdx: t, playerIndices: [] })
      }
      groups.find(g => g.teamIdx === t)?.playerIndices.push(i)
    }
    return groups
  }, [playerCount, teams])

  const startBattle = useCallback(async () => {
    if (selectedCases.length === 0) return
    if (credits < yourCost) return
    setCredits(c => c - yourCost)
    trackWager(yourCost)

    setPhase("countdown")
    setAllRoundPrizes([])
    setRoundRevealed(selectedCases.map(() => false))
    setAnimatingRound(-1)
    setRoundSpinning(false)
    setRunningTotals(Array(playerCount).fill(0))
    setConfirmedTotals(Array(playerCount).fill(0))
    setPlayerNames(stableNames)
    setShowTiebreaker(false)
    setTiedTeamData(null)

    for (let i = 3; i >= 1; i--) {
      setCountdown(i)
      await new Promise(res => setTimeout(res, 800))
    }
    setCountdown(0)
    setPhase("running")

    const players: PlayerResult[] = Array.from({ length: playerCount }, (_, i) => ({
      name: stableNames[i],
      teamIndex: teams[i],
      prizes: [],
      total: 0,
      isAlly: isAllyPlayer(format, i),
    }))

    const collectedPrizes: Prize[][] = []

    for (let r = 0; r < selectedCases.length; r++) {
      const roundPrizes: Prize[] = []
      for (let p = 0; p < playerCount; p++) {
        const prize = openCase(selectedCases[r])
        players[p].prizes.push(prize)
        players[p].total += prize.value
        roundPrizes.push(prize)
      }
      collectedPrizes.push(roundPrizes)

      setRunningTotals(players.map(p => p.total))
      setAnimatingRound(r)
      setAllRoundPrizes([...collectedPrizes])
      setRoundSpinning(true)

      // Wait for slot animation (longer for wobble + possible switch)
      await new Promise(res => setTimeout(res, 6500))

      setRoundRevealed(prev => {
        const next = [...prev]
        next[r] = true
        return next
      })
      setRoundSpinning(false)
      // Update confirmed totals only after round is revealed
      setConfirmedTotals(players.map(p => p.total))

      await new Promise(res => setTimeout(res, 1200))
    }

    // Build team results
    const teamMap = new Map<number, TeamResult>()
    for (const p of players) {
      if (!teamMap.has(p.teamIndex)) {
        teamMap.set(p.teamIndex, { teamIndex: p.teamIndex, playerNames: [], prizes: [], total: 0 })
      }
      const t = teamMap.get(p.teamIndex)!
      t.playerNames.push(p.name)
      t.prizes.push(...p.prizes)
      t.total += p.total
    }
    const teamArr = Array.from(teamMap.values())

    setPlayerResults(players)
    setTeamResults(teamArr)

    // Check for tie - fight over BATTLE VALUE (entry cost), not item value
    const maxTeamTotal = Math.max(...teamArr.map(t => t.total))
    const tiedTeams = teamArr.filter(t => t.total === maxTeamTotal)

    if (tiedTeams.length > 1) {
      // TIEBREAKER! Teams fight over the total battle value (entry cost only)
      const tiedTeamIndices = tiedTeams.map(t => t.teamIndex)
      const tiedTeamNamesArr: string[][] = []
      for (const t of tiedTeams) {
        tiedTeamNamesArr[t.teamIndex] = t.playerNames
      }

      setTiedTeamData({
        teams: tiedTeamIndices,
        teamNames: tiedTeamNamesArr,
        battleValue: totalBattleValue, // fight over the battle entry value
      })
      setPhase("tiebreaker")
      setShowTiebreaker(true)

      const tiebreakerWinner = await new Promise<number>((resolve) => {
        pendingResolveRef.current = resolve
      })

      setShowTiebreaker(false)
      setWinnerTeam(tiebreakerWinner)
      setPhase("done")

      const yourTeam = teams[0]
      const youWon = tiebreakerWinner === yourTeam

      if (youWon) {
        soundManager?.win()
        const yourShare = isTeamFormat(format)
          ? Math.floor((totalBattleValue * (1 - loanDiscount)) / perTeam)
          : Math.floor(totalBattleValue * (1 - loanDiscount))
        setCredits(c => c + yourShare)
      } else {
        soundManager?.lose()
      }
    } else {
      const winTeamIdx = teamArr.find(t => t.total === maxTeamTotal)!.teamIndex
      setWinnerTeam(winTeamIdx)
      setPhase("done")

      const yourTeam = teams[0]
      const youWon = winTeamIdx === yourTeam

      if (youWon) {
        soundManager?.win()
        const totalPool = baseCost * playerCount
        const yourShare = isTeamFormat(format)
          ? Math.floor((totalPool * (1 - loanDiscount)) / perTeam)
          : Math.floor(totalPool * (1 - loanDiscount))
        setCredits(c => c + yourShare)
      } else {
        soundManager?.lose()
      }
    }
  }, [selectedCases, playerCount, credits, yourCost, baseCost, format, loanPercent, loanDiscount, teams, perTeam, stableNames, totalBattleValue])

  const handleTiebreakerResult = useCallback((winIdx: number) => {
    if (pendingResolveRef.current) {
      pendingResolveRef.current(winIdx)
      pendingResolveRef.current = null
    }
  }, [])

  const reset = () => {
    setPhase("setup")
    setSelectedCases([])
    setPlayerResults([])
    setTeamResults([])
    setWinnerTeam(null)
    setAllRoundPrizes([])
    setRoundRevealed([])
    setAnimatingRound(-1)
    setRoundSpinning(false)
    setRunningTotals([])
    setConfirmedTotals([])
    setPlayerNames([])
    setShowTiebreaker(false)
    setTiedTeamData(null)
  }

  const yourTeamIdx = teams[0]
  const displayNames = playerNames.length > 0 ? playerNames : stableNames
  const teamGroups = getTeamGroups()

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {inspectCase && <CaseInfoModal caseData={inspectCase} onClose={() => setInspectCase(null)} />}
      {phase === "countdown" && countdown > 0 && <CountdownOverlay count={countdown} />}

      {showTiebreaker && tiedTeamData && (
        <TiebreakerWheel
          teams={tiedTeamData.teams}
          teamNames={tiedTeamData.teamNames}
          battleValue={tiedTeamData.battleValue}
          onResult={handleTiebreakerResult}
        />
      )}

      {/* ── RUNNING / DONE PHASE ── */}
      {(phase === "running" || phase === "done" || phase === "tiebreaker") && (
        <div className="flex flex-col min-h-screen">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1a1a2e]">
            <button onClick={reset} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
              <ChevronLeft size={16} />
              Back
            </button>
            <p className="text-sm text-slate-400 font-medium">
              Round {Math.min(animatingRound + 1, selectedCases.length)} of {selectedCases.length}
            </p>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a3e] flex items-center justify-center text-slate-400 hover:text-white">
                <Share2 size={14} />
              </button>
              <button
                onClick={toggleMute}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                  muted ? "bg-red-900/30 border-red-500/40 text-red-400" : "bg-[#1a1a2e] border-[#2a2a3e] text-slate-400 hover:text-white"
                }`}
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          </div>

          {/* Battle Info Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#0f0f23] border-b border-[#1a1a2e]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-slate-300 font-bold">
                <Users size={14} className="text-slate-500" />
                {format.replace(/v/g, " x ")}
              </div>
              {isTeamFormat(format) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 font-bold">TEAM</span>
              )}
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-400">
                {"Battle Value: "}<span className="text-white font-bold"><CreditBadge value={totalBattleValue.toFixed(2)} /></span>
              </p>
            </div>
          </div>

          {/* Main Slot Area */}
          <div className="relative flex-1 overflow-auto">
            {/* Background glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-96 h-96 rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)" }} />
            </div>

            {/* Slot Reels - Your team on left, enemy team on right */}
            <div className="relative z-10 px-3 sm:px-6 py-6">
              <div className="flex items-stretch max-w-6xl mx-auto">
                {teamGroups.map((group, gi) => {
                  const isAllyTeam = group.teamIdx === yourTeamIdx
                  return (
                    <div key={group.teamIdx} className="flex flex-1 min-w-0" style={{ position: "relative" }}>
                      {/* Team reels */}
                      <div className="flex gap-2 sm:gap-3 flex-1 px-1 sm:px-2">
                        {group.playerIndices.map((pi) => {
                          const hasPrizes = animatingRound >= 0 && allRoundPrizes[animatingRound]
                          const prize = hasPrizes ? allRoundPrizes[animatingRound][pi] : null
                          const isActive = roundSpinning
                          const revealed = animatingRound >= 0 && roundRevealed[animatingRound]

                          return (
                            <SlotReel
                              key={pi}
                              caseData={selectedCases[Math.min(Math.max(animatingRound, 0), selectedCases.length - 1)] || selectedCases[0]}
                              finalPrize={prize}
                              isSpinning={isActive}
                              isRevealed={revealed}
                              playerName={displayNames[pi]}
                              isAlly={isAllyTeam}
                            />
                          )
                        })}
                      </div>

                      {/* Divider between teams */}
                      {gi < teamGroups.length - 1 && (
                        <div className="flex flex-col items-center justify-center mx-1 sm:mx-3">
                          <div className="w-px h-full bg-gradient-to-b from-transparent via-slate-600 to-transparent" />
                          <div className="absolute top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[#1a1a2e] border border-[#2a2a3e] text-xs font-black text-slate-400">
                            VS
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Team Values - Updates after each round completes */}
            <div className="px-3 sm:px-6 py-3">
              <div className={`grid gap-3 max-w-6xl mx-auto ${
                teamCount === 2 ? "grid-cols-2" : teamCount === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
              }`}>
                {teamGroups.map((group) => {
                  const isAllyTeam = group.teamIdx === yourTeamIdx
                  const teamTotal = group.playerIndices.reduce((sum, pi) => sum + (confirmedTotals[pi] || 0), 0)
                  const teamPlayerNames = group.playerIndices.map(pi => displayNames[pi]).join(" & ")
                  return (
                    <div
                      key={group.teamIdx}
                      className="rounded-xl py-3 px-4 text-center border"
                      style={{
                        background: isAllyTeam ? "rgba(34, 197, 94, 0.05)" : "rgba(239, 68, 68, 0.05)",
                        borderColor: isAllyTeam ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                      }}
                    >
                      <p className={`text-[10px] font-bold mb-0.5 ${isAllyTeam ? "text-emerald-500" : "text-red-500"}`}>
                        {teamPlayerNames}
                      </p>
                      <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">{"TEAM VALUE : "}</span>
                      <span className="text-base font-black text-white"><CreditBadge value={teamTotal.toFixed(2)} /></span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Won Items - Only show after game is done */}
            {phase === "done" && (
            <div className="px-3 sm:px-6 pb-6">
              <div className="max-w-6xl mx-auto">
                <div className={`grid gap-4 ${teamCount === 2 ? "grid-cols-2" : teamCount === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
                  {teamGroups.map((group) => {
                    const isAllyTeam = group.teamIdx === yourTeamIdx
                    const teamPrizes = allRoundPrizes
                      .flatMap(roundPrizes => group.playerIndices.map(pi => roundPrizes[pi]))
                      .filter(Boolean)

                    return (
                      <div key={group.teamIdx}>
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: isAllyTeam ? "#22c55e" : "#ef4444" }}
                          />
                          <p className={`text-xs font-bold ${isAllyTeam ? "text-emerald-400" : "text-red-400"}`}>
                            {group.playerIndices.map(pi => displayNames[pi]).join(" & ")}
                          </p>
                        </div>
                        {teamPrizes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {teamPrizes.map((prize, i) => (
                              <WonItemCard
                                key={i}
                                prize={prize}
                                caseData={selectedCases[0]}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-[#2a2a3e] p-4 text-center text-xs text-slate-600">
                            No items yet
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            )}

            {/* Winner Celebration Overlay */}
            {phase === "done" && winnerTeam !== null && (
              <div className="px-4 sm:px-6 pb-6">
                <div
                  className={`max-w-6xl mx-auto rounded-2xl p-6 sm:p-8 text-center border relative overflow-hidden ${
                    winnerTeam === yourTeamIdx
                      ? "border-emerald-500/40 bg-emerald-900/20"
                      : "border-red-500/40 bg-red-900/20"
                  }`}
                  style={{ animation: "battleBounceIn 0.4s ease-out forwards" }}
                >
                  {/* Background glow */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: winnerTeam === yourTeamIdx
                        ? "radial-gradient(circle at 50% 30%, rgba(34, 197, 94, 0.15) 0%, transparent 70%)"
                        : "radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.15) 0%, transparent 70%)",
                    }}
                  />

                  {/* Winner avatars with crown */}
                  <div className="relative flex items-center justify-center gap-4 mb-4">
                    {(() => {
                      const winnerGroup = teamGroups.find(g => g.teamIdx === winnerTeam)
                      if (!winnerGroup) return null
                      return winnerGroup.playerIndices.map((pi, idx) => (
                        <div key={pi} className="relative flex flex-col items-center">
                          {/* Crown */}
                          <Crown
                            size={28}
                            className="text-yellow-400 mb-1 drop-shadow-lg"
                            style={{
                              filter: "drop-shadow(0 0 8px rgba(250, 204, 21, 0.5))",
                              animation: "battleBounceIn 0.5s ease-out forwards",
                              animationDelay: `${idx * 0.1}s`,
                            }}
                          />
                          {/* Circular avatar */}
                          <div
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 flex items-center justify-center text-xl font-black"
                            style={{
                              borderColor: winnerTeam === yourTeamIdx ? "#22c55e" : "#ef4444",
                              borderWidth: "3px",
                              background: winnerTeam === yourTeamIdx
                                ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05))"
                                : "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))",
                              boxShadow: winnerTeam === yourTeamIdx
                                ? "0 0 20px rgba(34, 197, 94, 0.3)"
                                : "0 0 20px rgba(239, 68, 68, 0.3)",
                              color: winnerTeam === yourTeamIdx ? "#4ade80" : "#f87171",
                            }}
                          >
                            {displayNames[pi]?.[0] || "?"}
                          </div>
                          <p className={`text-xs font-bold mt-1.5 ${winnerTeam === yourTeamIdx ? "text-emerald-400" : "text-red-400"}`}>
                            {displayNames[pi]}
                          </p>
                        </div>
                      ))
                    })()}
                  </div>

                  <Trophy size={32} className="mx-auto text-yellow-400 mb-2" style={{ filter: "drop-shadow(0 0 12px rgba(250, 204, 21, 0.5))" }} />

                  <p className="text-3xl sm:text-4xl font-black relative" style={{ color: winnerTeam === yourTeamIdx ? "#4ade80" : "#f87171" }}>
                    {winnerTeam === yourTeamIdx
                      ? (isTeamFormat(format) ? "Your Team Won!" : "You Won!")
                      : (isTeamFormat(format) ? "Enemy Team Wins!" : `${playerResults.find(p => p.teamIndex === winnerTeam)?.name || "Opponent"} Wins!`)
                    }
                  </p>
                  <p className="text-slate-400 mt-2 text-sm relative">
                    {winnerTeam === yourTeamIdx
                      ? (() => {
                        const totalPool = baseCost * playerCount
                        const yourShare = isTeamFormat(format)
                          ? Math.floor((totalPool * (1 - loanDiscount)) / perTeam)
                          : Math.floor(totalPool * (1 - loanDiscount))
                        return (
                          <span className="inline-flex items-center gap-1 flex-wrap justify-center">
                            +<CreditBadge value={yourShare.toLocaleString()} /> credits
                            {loanPercent > 0 && <span className="text-amber-400 ml-1">({loanPercent}% went to loan)</span>}
                            {isTeamFormat(format) && <span className="ml-1">(split {perTeam} ways)</span>}
                          </span>
                        )
                      })()
                      : <span className="inline-flex items-center gap-1">Lost <CreditBadge value={yourCost.toLocaleString()} /> credits</span>
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Final Scoreboard */}
            {phase === "done" && teamResults.length > 0 && (
              <div className="px-4 sm:px-6 pb-6">
                <div className="max-w-6xl mx-auto rounded-xl border border-[#1a1a2e] bg-[#0f0f23] p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">Final Scoreboard</p>
                  <div className="space-y-2">
                    {[...teamResults].sort((a, b) => b.total - a.total).map((t, i) => {
                      const isYourTeam = t.teamIndex === yourTeamIdx
                      const isWin = t.teamIndex === winnerTeam
                      return (
                        <div
                          key={t.teamIndex}
                          className={`rounded-lg px-4 py-3 flex items-center gap-3 ${
                            isWin ? "bg-yellow-900/20 border border-yellow-500/30" : "bg-[#1a1a2e] border border-[#2a2a3e]"
                          }`}
                        >
                          <span className="text-slate-400 text-sm w-4">{i + 1}</span>
                          {isWin && <Trophy size={16} className="text-yellow-400" />}
                          <span className={`font-bold flex-1 ${isYourTeam ? "text-emerald-400" : "text-red-400"}`}>
                            {t.playerNames.join(", ")}
                          </span>
                          <span className="font-black text-lg text-white"><CreditBadge value={t.total.toLocaleString()} /></span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="px-4 sm:px-6 pb-8">
                <button
                  onClick={reset}
                  className="w-full max-w-6xl mx-auto block rounded-xl bg-[#1a1a2e] hover:bg-[#2a2a3e] border border-[#2a2a3e] active:scale-95 py-3.5 font-black text-lg text-white transition-all"
                >
                  New Battle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SETUP PHASE ── */}
      {(phase === "setup" || phase === "select-cases") && (
        <>
          <div className="pointer-events-none fixed inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_#1a0d2e_0%,_#0a0a1a_70%)]" />
          </div>

          <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </Link>

            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Case Battles</h1>
                <p className="text-slate-400 text-sm mt-1">Choose your cases, pick a format, and battle.</p>
              </div>
              <div className="rounded-xl border border-[#2a2a3e] bg-[#0f0f23] px-4 py-2 flex items-center gap-2">
                <Coins size={14} className="text-yellow-400" />
                <span className="font-bold text-white text-sm">{isLoaded ? credits.toLocaleString() : "Loading..."}</span>
                <span className="text-xs text-slate-400">credits</span>
              </div>
            </div>

            {/* Format selector - matching reference image with 3v3 */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">Battle Format</p>
              <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-[#0a0a18] border border-[#1a1a2e]">
                {FORMATS.map(f => {
                  const isTeam = isTeamFormat(f)
                  const isSelected = format === f
                  return (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all border flex items-center gap-2 ${
                        isSelected
                          ? "bg-emerald-900/50 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-900/20"
                          : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#1a1a2e]"
                      }`}
                    >
                      {isTeam && <Users size={14} />}
                      <span className="font-black">{f}</span>
                      <span className="text-xs opacity-60">{formatPlayerCount(f)}p</span>
                      {isTeam && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-500/20 font-bold">TEAM</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Loan slider */}
            <div className="mb-6 rounded-xl border border-[#2a2a3e] bg-[#0f0f23] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Percent size={14} className="text-amber-400" />
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Loan</p>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Take a loan to reduce your cost. In return, your winnings will be reduced by the same percentage.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={75}
                    step={1}
                    value={loanPercent}
                    onChange={e => setLoanPercent(Number(e.target.value))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-amber-500"
                    style={{
                      background: `linear-gradient(to right, #f59e0b ${loanPercent / 75 * 100}%, #1e293b ${loanPercent / 75 * 100}%)`,
                    }}
                  />
                  <div className="min-w-[64px] text-right">
                    <span className="text-lg font-black text-amber-400">{loanPercent}%</span>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {[0, 10, 25, 50, 75].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setLoanPercent(pct)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all border ${
                        loanPercent === pct
                          ? "bg-amber-700/40 border-amber-500/60 text-amber-300"
                          : "bg-[#0f0f23] border-[#2a2a3e] text-slate-400 hover:text-white"
                      }`}
                    >
                      {pct === 0 ? "None" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected cases */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  {"Selected Cases ("}{selectedCases.length}{"/6)"}
                </p>
                {selectedCases.length > 0 && (
                  <span className="text-sm text-slate-400">
                    {"Your cost: "}<span className="text-white font-bold"><CreditBadge value={yourCost.toLocaleString()} /></span>
                    {loanPercent > 0 && (
                      <span className="text-amber-400 ml-1 text-xs">({loanPercent}% loan)</span>
                    )}
                  </span>
                )}
              </div>

              {selectedCases.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-[#2a2a3e] p-6 text-center text-slate-500 text-sm">
                  No cases selected. Add cases from the list below.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCases.map((c, i) => {
                    const rc = RARITY_CONFIG[c.rarity]
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: rc.border, background: rc.bg }}>
                        <span className="text-sm font-bold" style={{ color: rc.color }}>{c.name}</span>
                        <div className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5">
                          <Coins size={10} className="text-yellow-400" />
                          <span className="text-xs font-semibold text-white">{c.price}</span>
                        </div>
                        <button onClick={() => removeCase(i)} className="text-slate-500 hover:text-red-400 transition-colors ml-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedCases.length > 0 && (
                <button
                  onClick={startBattle}
                  disabled={credits < yourCost}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 py-3.5 font-black text-lg text-white transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed mb-6"
                >
                  <Swords size={20} className="inline mr-2" />
                  {"Start Battle - "}<CreditBadge value={yourCost.toLocaleString()} />
                </button>
              )}
            </div>

            {/* Case browser */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{"Browse Cases ("}{filteredCases.length}{")"}</p>
                <div className="flex gap-1.5">
                  {(["all", "easy", "medium", "hard", "extreme"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setRarityFilter(r)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                        rarityFilter === r
                          ? r === "all" ? "bg-[#1a1a2e] border-[#3a3a4e] text-white" : ""
                          : "bg-[#0f0f23] border-[#2a2a3e] text-slate-400 hover:text-white"
                      }`}
                      style={rarityFilter === r && r !== "all" ? {
                        background: RARITY_CONFIG[r].bg,
                        borderColor: RARITY_CONFIG[r].border,
                        color: RARITY_CONFIG[r].color,
                      } : {}}
                    >
                      {r === "all" ? "All" : RARITY_CONFIG[r].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredCases.map(c => {
                  const rc = RARITY_CONFIG[c.rarity]
                  const topPrize = [...c.prizes].sort((a, b) => b.value - a.value)[0]
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                      style={{ borderColor: rc.border, background: rc.bg }}
                      onClick={() => addCase(c)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-black text-white text-sm">{c.name}</p>
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ color: rc.color, background: rc.bg, border: `1px solid ${rc.border}` }}>
                            {rc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setInspectCase(c) }}
                            className="w-7 h-7 rounded-lg border flex items-center justify-center text-slate-400 hover:text-white transition-all hover:border-slate-400"
                            style={{ borderColor: rc.border, background: rc.bg }}
                            title="View prizes"
                          >
                            <Info size={14} />
                          </button>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5">
                              <Coins size={14} className="text-yellow-400" />
                              <span className="text-sm font-bold text-white">{c.price}</span>
                              <span className="text-xs text-slate-400 font-medium">credits</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src={topPrize.imageUrl}
                          alt={topPrize.name}
                          className="w-12 h-12 rounded-lg object-cover"
                          crossOrigin="anonymous"
                        />
                        <div>
                          <p className="text-xs text-slate-400">Top prize</p>
                          <p className="text-sm font-bold text-white leading-tight">{topPrize.name}</p>
                          <p className="text-xs text-emerald-400"><CreditBadge value={topPrize.value.toLocaleString()} /> - {topPrize.chance}%</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {c.prizes.slice(0, 4).map(p => (
                          <div key={p.name} className="flex items-center gap-1">
                            <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${p.chance}%`, color: rc.color }} />
                            </div>
                            <span className="text-xs text-slate-500 w-8 text-right">{p.chance}%</span>
                          </div>
                        ))}
                      </div>

                      <button
                        className="w-full mt-3 rounded-lg py-1.5 text-xs font-black transition-all flex items-center justify-center gap-1"
                        style={{ background: rc.color + "22", color: rc.color, border: `1px solid ${rc.color}44` }}
                      >
                        <Plus size={12} />
                        Add to Battle
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes battleBounceIn {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes countPulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-countPulse {
          animation: countPulse 0.6s ease-out;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #0a0a1a;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          border: 2px solid #0a0a1a;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
      `}</style>
    </div>
  )
}

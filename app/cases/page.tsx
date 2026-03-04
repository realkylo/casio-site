"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Coins, Volume2, VolumeX, X } from "lucide-react"
import { useCredits } from "@/lib/credits-context"

// ── Types ─────────────────────────────────────────────────────────────────

interface Prize {
  name: string
  value: number
  chance: number
  imageUrl: string
}

interface CaseData {
  id: string
  name: string
  price: number
  imageUrl?: string
  tag?: string
  tagColor?: string
  prizes: Prize[]
}

// ── Case definitions ──────────────────────────────────────────────────────

const CASES: CaseData[] = [
  {
    id: "starter",
    name: "GiftCard Box",
    price: 5,
    tag: "Hot",
    tagColor: "#7c3aed",
    prizes: [
      { name: "Spam.me 20$", value: 20, chance: 40, imageUrl: "https://i.ibb.co/KcX4qGBd/2026-03-05-004211-removebg-preview.png" },
      { name: "Spam.me 75$", value: 75, chance: 75, imageUrl: "https://i.ibb.co/hRywCV36/Gemini-Generated-Image-zg5og3zg5og3zg5o-removebg-preview.png" },
      { name: "Spam.me 50$", value: 50, chance: 8, imageUrl: "https://i.ibb.co/gL655Xkr/Gemini-Generated-Image-vca85vca85vca85v-removebg-preview.png" },
      { name: "Spam.me 25$", value: 25, chance: 8, imageUrl: "https://i.ibb.co/4nKNScB3/Gemini-Generated-Image-ncag5sncag5sncag-removebg-preview.png" },
      { name: "Refund", value: 5, chance: 2, imageUrl: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=200&q=80" },
    ],
  },
  {
    id: "all-in",
    name: "ALL IN BTW",
    price: 200,
    tag: "Hot",
    tagColor: "#dc2626",
    prizes: [
      { name: "GO TO THE STREET", value: 0, chance: 99, imageUrl: "https://i.ibb.co/GfVyFHLZ/image2.png" },
      { name: "Sigma Car Of LIGMA", value: 3000, chance: 1, imageUrl: "https://i.ibb.co/k2401Qpm/image.png" },
    ],
  },
  {
    id: "electric",
    name: "Electric Box",
    price: 300,
    tag: "Hot",
    tagColor: "#2563eb",
    prizes: [
      { name: "SMS PHONY", value: 1000, chance: 2.5, imageUrl: "https://i.ibb.co/gZ51M7ZZ/im555age.png" },
      { name: "MAGICAL LAPTOP", value: 1500, chance: 2.5, imageUrl: "https://i.ibb.co/GQ2DbTRr/ima34234ge.png" },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function openCase(c: CaseData): Prize {
  const roll = Math.random() * 100
  let cumulative = 0
  for (const p of c.prizes) {
    cumulative += p.chance
    if (roll <= cumulative) return p
  }
  return c.prizes[c.prizes.length - 1]
}

function buildStrip(caseData: CaseData, finalPrize: Prize, length: number): Prize[] {
  const strip: Prize[] = []
  for (let i = 0; i < length; i++) {
    const roll = Math.random() * 100
    let cumulative = 0
    let picked = caseData.prizes[0]
    for (const p of caseData.prizes) {
      cumulative += p.chance
      if (roll <= cumulative) {
        picked = p
        break
      }
    }
    strip.push(picked)
  }
  const landIdx = length - 4
  strip[landIdx] = finalPrize
  return strip
}

const ITEM_W = 120
const STRIP_LEN = 40

// ── Case Card ─────────────────────────────────────────────────────────────

function CaseCard({
  caseData,
  onOpen,
}: {
  caseData: CaseData
  onOpen: (c: CaseData) => void
}) {
  // Use the highest-value prize image as the case hero
  const bestPrize = caseData.prizes.reduce((a, b) => (b.value > a.value ? b : a), caseData.prizes[0])

  return (
    <div className="group flex flex-col items-center gap-3 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1">
      {/* Case image area */}
      <div className="relative w-full aspect-square flex items-center justify-center">
        <img
          src={bestPrize.imageUrl}
          alt={caseData.name}
          className="max-w-[85%] max-h-[85%] object-contain drop-shadow-[0_0_24px_rgba(124,58,237,0.35)] transition-transform duration-300 group-hover:scale-110"
          crossOrigin="anonymous"
        />
        {/* Tag badge */}
        {caseData.tag && (
          <span
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: caseData.tagColor || "#7c3aed" }}
          >
            {caseData.tag}
          </span>
        )}
      </div>

      {/* Name */}
      <p className="text-sm font-bold text-white text-center leading-tight">{caseData.name}</p>

      {/* Price */}
      <p className="flex items-center gap-1 text-sm font-bold" style={{ color: caseData.tagColor || "#a78bfa" }}>
        <Coins size={14} className="text-yellow-400" />
        {caseData.price}
      </p>

      {/* Open button */}
      <button
        onClick={() => onOpen(caseData)}
        className="w-full rounded-lg py-2 text-sm font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-95"
        style={{ backgroundColor: caseData.tagColor || "#7c3aed" }}
      >
        Open Case
      </button>
    </div>
  )
}

// ── Case Opening Modal ────────────────────────────────────────────────────

function CaseOpeningModal({
  caseData,
  onClose,
}: {
  caseData: CaseData
  onClose: () => void
}) {
  const { credits, setCredits, isLoaded, trackWager } = useCredits()
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle")
  const [strip, setStrip] = useState<Prize[]>([])
  const [offset, setOffset] = useState(0)
  const [wonPrize, setWonPrize] = useState<Prize | null>(null)
  const animRef = useRef<number>(0)
  const startRef = useRef(0)

  const spin = useCallback(() => {
    if (phase === "spinning") return
    if (credits < caseData.price) return

    setCredits((c) => c - caseData.price)
    trackWager(caseData.price)

    const prize = openCase(caseData)
    const s = buildStrip(caseData, prize, STRIP_LEN)
    setStrip(s)
    setWonPrize(prize)
    setPhase("spinning")
    setOffset(0)

    const landIdx = STRIP_LEN - 4
    const targetOffset = landIdx * ITEM_W - (ITEM_W * 2.5) // center the winner
    const duration = 4500

    startRef.current = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)

      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentOffset = eased * targetOffset

      setOffset(currentOffset)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setOffset(targetOffset)
        setTimeout(() => {
          setPhase("result")
          if (prize.value > 0) {
            setCredits((c) => c + prize.value)
          }
        }, 300)
      }
    }

    animRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animRef.current)
  }, [phase, credits, caseData, setCredits, trackWager])

  const reset = () => {
    setPhase("idle")
    setWonPrize(null)
    setStrip([])
    setOffset(0)
  }

  const canAfford = credits >= caseData.price

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 rounded-2xl border border-white/10 bg-[#0d0d1f] p-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-bold text-white">{caseData.name}</h2>
          <span className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1 text-sm font-bold text-white">
            <Coins size={14} className="text-yellow-400" />
            {caseData.price}
          </span>
        </div>

        {/* Spinner reel */}
        <div className="relative overflow-hidden rounded-xl bg-black/60 border border-white/10 mb-6" style={{ height: 140 }}>
          {/* Center indicator */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[120px] z-20 pointer-events-none border-x-2 border-yellow-400/60">
            <div className="absolute inset-0 bg-yellow-400/5" />
          </div>

          {/* Left/right fades */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/90 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/90 to-transparent z-10 pointer-events-none" />

          {/* Strip */}
          {strip.length > 0 && (
            <div
              className="absolute top-0 bottom-0 flex items-center"
              style={{
                transform: `translateX(-${offset}px)`,
              }}
            >
              {strip.map((prize, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-1"
                  style={{ width: ITEM_W }}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                    <img
                      src={prize.imageUrl}
                      alt={prize.name}
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 truncate max-w-[100px] text-center">{prize.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* Idle state */}
          {strip.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Press Open to spin
            </div>
          )}
        </div>

        {/* Result display */}
        {phase === "result" && wonPrize && (
          <div
            className={`mb-6 rounded-xl p-4 text-center border ${
              wonPrize.value > 0
                ? "border-green-500/30 bg-green-900/20"
                : "border-red-500/30 bg-red-900/20"
            }`}
            style={{ animation: "caseReveal 0.4s ease-out" }}
          >
            <div className="w-20 h-20 mx-auto mb-3 rounded-lg overflow-hidden border border-white/20 bg-white/5">
              <img
                src={wonPrize.imageUrl}
                alt={wonPrize.name}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <p className="text-lg font-bold text-white">{wonPrize.name}</p>
            {wonPrize.value > 0 ? (
              <p className="text-green-400 font-bold text-xl flex items-center justify-center gap-1 mt-1">
                +<Coins size={16} className="text-yellow-400" />
                {wonPrize.value.toLocaleString()}
              </p>
            ) : (
              <p className="text-red-400 font-bold text-sm mt-1">Better luck next time</p>
            )}
          </div>
        )}

        {/* Prize table */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Possible Items</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {caseData.prizes.map((prize, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-black/30 border border-white/5 px-3 py-2">
                <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
                  <img
                    src={prize.imageUrl}
                    alt={prize.name}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-300 truncate font-medium">{prize.name}</p>
                  <p className="text-[11px] font-bold text-yellow-400 flex items-center gap-0.5">
                    <Coins size={10} /> {prize.value}
                  </p>
                  <p className="text-[9px] text-slate-500">{prize.chance}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {phase === "result" ? (
            <>
              <button
                onClick={reset}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white bg-white/10 border border-white/10 hover:bg-white/15 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white bg-white/10 border border-white/10 hover:bg-white/15 transition-all"
              >
                Close
              </button>
            </>
          ) : (
            <button
              onClick={spin}
              disabled={phase === "spinning" || !canAfford || !isLoaded}
              className="flex-1 rounded-xl py-3 font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: phase === "spinning" ? "#334155" : caseData.tagColor || "#7c3aed" }}
            >
              {phase === "spinning" ? (
                "Opening..."
              ) : !canAfford ? (
                "Not enough credits"
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Open Case - <Coins size={14} className="text-yellow-300" /> {caseData.price}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes caseReveal {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function CasesPage() {
  const { credits, isLoaded } = useCredits()
  const [activeCase, setActiveCase] = useState<CaseData | null>(null)
  const [muted, setMuted] = useState(false)

  return (
    <div className="min-h-screen bg-[#060610] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_#1a0d2e_0%,_#060610_70%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Cases</h1>
            <p className="text-slate-400 text-sm mt-1">Open cases for a chance at rare prizes.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 flex items-center gap-2">
              <Coins size={14} className="text-yellow-400" />
              <span className="font-bold text-white text-sm">
                {isLoaded ? credits.toLocaleString() : "..."}
              </span>
            </div>
            <button
              onClick={() => setMuted((m) => !m)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-400 hover:text-white transition-colors"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* Case grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CASES.map((c) => (
            <CaseCard key={c.id} caseData={c} onOpen={setActiveCase} />
          ))}
        </div>
      </div>

      {/* Case opening modal */}
      {activeCase && (
        <CaseOpeningModal
          caseData={activeCase}
          onClose={() => setActiveCase(null)}
        />
      )}
    </div>
  )
}

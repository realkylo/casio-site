"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Coins, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react"
import { useCredits } from "@/lib/credits-context"

// ─── Symbols ────────────────────────────────────────────────────────────────

interface SlotSymbol {
  id: string
  name: string
  imageUrl: string
  value: number
  weight: number
}

const SYMBOLS: SlotSymbol[] = [
  { id: "cherry",   name: "Cherry",   imageUrl: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=100&q=80", value: 2,    weight: 30 },
  { id: "lemon",    name: "Lemon",    imageUrl: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=100&q=80", value: 3,    weight: 25 },
  { id: "orange",   name: "Orange",   imageUrl: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=100&q=80", value: 5,    weight: 20 },
  { id: "grape",    name: "Grape",    imageUrl: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=100&q=80", value: 8,    weight: 12 },
  { id: "bell",     name: "Bell",     imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=100&q=80", value: 15,   weight: 7 },
  { id: "diamond",  name: "Diamond",  imageUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=100&q=80", value: 30,   weight: 4 },
  { id: "seven",    name: "Lucky 7",  imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=100&q=80", value: 77,   weight: 1.5 },
  { id: "jackpot",  name: "Jackpot",  imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100&q=80", value: 200,  weight: 0.5 },
]

function pickSymbol(): SlotSymbol {
  const totalWeight = SYMBOLS.reduce((s, sym) => s + sym.weight, 0)
  const roll = Math.random() * totalWeight
  let cumulative = 0
  for (const sym of SYMBOLS) {
    cumulative += sym.weight
    if (roll <= cumulative) return sym
  }
  return SYMBOLS[0]
}

// ─── BET LEVELS ─────────────────────────────────────────────────────────────

const BET_LEVELS = [1, 2, 5, 10, 25, 50, 100]

// ─── Reel component ─────────────────────────────────────────────────────────

const ITEM_HEIGHT = 100
const VISIBLE_ITEMS = 3
const FAKE_COUNT = 25

function Reel({
  finalSymbol,
  isSpinning,
  isRevealed,
  delayMs,
}: {
  finalSymbol: SlotSymbol | null
  isSpinning: boolean
  isRevealed: boolean
  delayMs: number
}) {
  const [fakeItems] = useState(() =>
    Array.from({ length: FAKE_COUNT }, () => pickSymbol())
  )
  
  const allItems = finalSymbol ? [...fakeItems, finalSymbol] : fakeItems
  const finalIdx = allItems.length - 1
  const visibleHeight = ITEM_HEIGHT * VISIBLE_ITEMS
  const targetOffset = finalIdx * ITEM_HEIGHT - visibleHeight / 2 + ITEM_HEIGHT / 2

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-black/60 border border-white/10"
      style={{ height: visibleHeight, width: "100%" }}
    >
      {/* Center selection band */}
      <div
        className="absolute inset-x-0 z-10 pointer-events-none border-y-2 border-yellow-400/60"
        style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
      >
        <div className="absolute inset-0 bg-yellow-400/5" />
      </div>

      {/* Top/bottom fade */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/90 to-transparent z-[5] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/90 to-transparent z-[5] pointer-events-none" />

      {/* Vertical reel */}
      <div
        className="flex flex-col"
        style={{
          transform: isSpinning || isRevealed
            ? `translateY(-${targetOffset}px)`
            : "translateY(0px)",
          transitionDuration: isSpinning ? `${3.0 + delayMs / 1000}s` : isRevealed ? "0s" : "0s",
          transitionTimingFunction: "cubic-bezier(0.08, 0.82, 0.17, 1)",
          transitionProperty: "transform",
        }}
      >
        {allItems.map((sym, i) => {
          const isFinal = i === finalIdx && isRevealed
          return (
            <div
              key={i}
              className="flex items-center justify-center flex-shrink-0"
              style={{ height: ITEM_HEIGHT }}
            >
              <div className={`relative flex flex-col items-center gap-1 transition-all ${
                isFinal ? "scale-110" : ""
              }`}>
                <img
                  src={sym.imageUrl}
                  alt={sym.name}
                  className={`w-16 h-16 rounded-xl object-cover ${
                    isFinal
                      ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/40"
                      : "opacity-50 saturate-50"
                  }`}
                  crossOrigin="anonymous"
                />
                {isFinal && (
                  <span className="text-[10px] font-black text-yellow-300">{sym.name}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function SlotsPage() {
  const { credits, setCredits, isLoaded, trackWager } = useCredits()
  const [bet, setBet] = useState(5)
  const [spinning, setSpinning] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol] | null>(null)
  const [lastWin, setLastWin] = useState<number | null>(null)
  const [history, setHistory] = useState<{ bet: number; win: number; symbols: string[] }[]>([])
  const [muted, setMuted] = useState(false)
  const spinKey = useRef(0)

  const calculateWin = (r: [SlotSymbol, SlotSymbol, SlotSymbol]): number => {
    // 3 of a kind = value * bet
    if (r[0].id === r[1].id && r[1].id === r[2].id) {
      return r[0].value * bet
    }
    // 2 of a kind = small win
    if (r[0].id === r[1].id || r[1].id === r[2].id || r[0].id === r[2].id) {
      const pair = r[0].id === r[1].id ? r[0] : r[1].id === r[2].id ? r[1] : r[0]
      return Math.floor(pair.value * bet * 0.3)
    }
    return 0
  }

  const spin = useCallback(() => {
    if (spinning) return
    if (credits < bet) return

    spinKey.current += 1
    setCredits(c => c - bet)
    trackWager(bet)
    setLastWin(null)
    setRevealed(false)

    const result: [SlotSymbol, SlotSymbol, SlotSymbol] = [
      pickSymbol(),
      pickSymbol(),
      pickSymbol(),
    ]
    setReels(result)
    setSpinning(true)

    // Longest reel spins for ~4s
    const longestDuration = 3000 + 600 + 100
    setTimeout(() => {
      setSpinning(false)
      setRevealed(true)

      const win = calculateWin(result)
      setLastWin(win)
      if (win > 0) {
        setCredits(c => c + win)
      }
      setHistory(prev => [
        { bet, win, symbols: result.map(r => r.name) },
        ...prev.slice(0, 19),
      ])
    }, longestDuration)
  }, [spinning, credits, bet])

  const isWin = lastWin !== null && lastWin > 0
  const isJackpot = reels && revealed && reels[0].id === reels[1].id && reels[1].id === reels[2].id

  return (
    <div className="min-h-screen bg-[#060610] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_#1a1a0d_0%,_#060610_70%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Slot Machine</h1>
            <p className="text-slate-400 text-sm mt-1">Match symbols to win big. Three of a kind pays full multiplier.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 flex items-center gap-2">
              <Coins size={14} className="text-yellow-400" />
              <span className="font-bold text-white text-sm">{isLoaded ? credits.toLocaleString() : "Loading..."}</span>
            </div>
            <button
              onClick={() => setMuted(m => !m)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-400 hover:text-white transition-colors"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* Machine frame */}
        <div className={`rounded-2xl border-2 p-6 transition-all ${
          isJackpot
            ? "border-yellow-400/60 bg-yellow-900/10 shadow-2xl shadow-yellow-400/20"
            : isWin
            ? "border-green-500/40 bg-green-900/10 shadow-xl shadow-green-500/10"
            : "border-white/10 bg-white/[0.03]"
        }`}>
          {/* Paytable */}
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Paytable</p>
            <div className="grid grid-cols-4 gap-2">
              {SYMBOLS.map(sym => (
                <div key={sym.id} className="flex items-center gap-2 rounded-lg bg-black/30 px-2 py-1.5">
                  <img
                    src={sym.imageUrl}
                    alt={sym.name}
                    className="w-6 h-6 rounded object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 truncate">{sym.name}</p>
                    <p className="text-[10px] font-black text-yellow-400">x{sym.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Three reels */}
          <div key={spinKey.current} className="grid grid-cols-3 gap-3 mb-6">
            <Reel
              finalSymbol={reels ? reels[0] : null}
              isSpinning={spinning}
              isRevealed={revealed}
              delayMs={0}
            />
            <Reel
              finalSymbol={reels ? reels[1] : null}
              isSpinning={spinning}
              isRevealed={revealed}
              delayMs={300}
            />
            <Reel
              finalSymbol={reels ? reels[2] : null}
              isSpinning={spinning}
              isRevealed={revealed}
              delayMs={600}
            />
          </div>

          {/* Win display */}
          {revealed && lastWin !== null && (
            <div
              className={`text-center mb-6 rounded-xl py-3 ${
                isJackpot
                  ? "bg-yellow-500/20 border border-yellow-400/40"
                  : isWin
                  ? "bg-green-900/20 border border-green-500/30"
                  : "bg-white/5 border border-white/10"
              }`}
              style={{ animation: "slotBounceIn 0.4s ease-out" }}
            >
              {isJackpot ? (
                <>
                  <p className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-2">
                    <Trophy size={24} />
                    JACKPOT! +${lastWin.toLocaleString()}
                    <Trophy size={24} />
                  </p>
                  <p className="text-xs text-yellow-400/70 mt-1">Triple {reels![0].name}!</p>
                </>
              ) : isWin ? (
                <p className="text-xl font-black text-green-400">
                  WIN +${lastWin.toLocaleString()}
                </p>
              ) : (
                <p className="text-sm font-bold text-slate-500">No match - try again!</p>
              )}
            </div>
          )}

          {/* Bet selector */}
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Bet Amount</p>
            <div className="flex flex-wrap gap-2">
              {BET_LEVELS.map(b => (
                <button
                  key={b}
                  onClick={() => !spinning && setBet(b)}
                  disabled={spinning}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                    bet === b
                      ? "bg-yellow-700/40 border-yellow-500/60 text-yellow-300"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  } disabled:opacity-40`}
                >
                  ${b}
                </button>
              ))}
            </div>
          </div>

          {/* Spin button */}
          <button
            onClick={spin}
            disabled={spinning || credits < bet}
            className={`w-full rounded-xl py-4 font-black text-xl text-white transition-all shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              spinning
                ? "bg-slate-700 cursor-wait"
                : "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/25"
            }`}
          >
            {spinning ? (
              <span className="flex items-center justify-center gap-2">
                <RotateCcw size={20} className="animate-spin" />
                Spinning...
              </span>
            ) : (
              <span>SPIN - ${bet}</span>
            )}
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Recent Spins</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    h.win > 0 ? "bg-green-900/10 border border-green-500/10" : "bg-white/[0.02]"
                  }`}
                >
                  <span className="text-slate-500 text-xs w-16">Bet ${h.bet}</span>
                  <span className="text-slate-400 text-xs flex-1 truncate">{h.symbols.join(" | ")}</span>
                  <span className={`font-bold text-xs ${h.win > 0 ? "text-green-400" : "text-red-400"}`}>
                    {h.win > 0 ? `+$${h.win}` : `-$${h.bet}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slotBounceIn {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

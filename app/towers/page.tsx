"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Coins, TrendingUp } from "lucide-react"
import { useCredits } from "@/lib/credits-context"

// --- Types ---
type CellState = "hidden" | "safe" | "bomb"
type GamePhase = "idle" | "loading" | "playing" | "won" | "lost" | "cashout"

interface Row {
  cells: CellState[]
  safePick: number
  bombIndices: Set<number>
}

// Easy:   4 cols, 1 bomb → 3 safe choices
// Medium: 3 cols, 1 bomb → 2 safe choices
// Hard:   3 cols, 2 bombs → 1 safe choice
// Expert: 4 cols, 3 bombs → 1 safe choice
const DIFFICULTIES = [
  { label: "Easy",   rows: 8,  cols: 4, bombs: 1, multipliers: [1.10, 1.22, 1.36, 1.52, 1.72, 1.97, 2.28, 2.70] },
  { label: "Medium", rows: 8,  cols: 3, bombs: 1, multipliers: [1.20, 1.44, 1.73, 2.07, 2.49, 2.99, 3.59, 4.30] },
  { label: "Hard",   rows: 6,  cols: 3, bombs: 2, multipliers: [1.50, 2.20, 3.30, 5.00, 7.50, 12.0] },
  { label: "Expert", rows: 5,  cols: 4, bombs: 3, multipliers: [1.80, 3.20, 5.80, 10.5, 19.0] },
]

function generateRows(rows: number, cols: number, bombs: number): Row[] {
  return Array.from({ length: rows }, () => {
    // Place bombs randomly, remaining slots are safe
    const indices = Array.from({ length: cols }, (_, i) => i)
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const bombIndices = new Set(indices.slice(0, bombs))
    const cells: CellState[] = Array(cols).fill("hidden")
    // safePick = first non-bomb index
    const safePick = indices[bombs]
    return { cells, safePick, bombIndices }
  })
}

// Web Audio — scary tense beep
function playTenseSound(ctx: AudioContext, type: "tick" | "boom" | "win" | "cashout") {
  const t = ctx.currentTime
  if (type === "tick") {
    // Low rumble + high ping
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    const gain2 = ctx.createGain()
    osc1.type = "sawtooth"
    osc1.frequency.setValueAtTime(55, t)
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.18)
    gain1.gain.setValueAtTime(0.18, t)
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc1.connect(gain1); gain1.connect(ctx.destination)
    osc1.start(t); osc1.stop(t + 0.18)

    osc2.type = "sine"
    osc2.frequency.setValueAtTime(900, t)
    osc2.frequency.exponentialRampToValueAtTime(600, t + 0.12)
    gain2.gain.setValueAtTime(0.12, t)
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
    osc2.connect(gain2); gain2.connect(ctx.destination)
    osc2.start(t); osc2.stop(t + 0.12)
  } else if (type === "boom") {
    // Explosion
    const bufferSize = ctx.sampleRate * 0.6
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(1.2, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"; filter.frequency.value = 300
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    src.start(t)
    // Low boom
    const osc = ctx.createOscillator()
    const g2 = ctx.createGain()
    osc.type = "sine"; osc.frequency.setValueAtTime(80, t); osc.frequency.exponentialRampToValueAtTime(20, t + 0.5)
    g2.gain.setValueAtTime(0.8, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    osc.connect(g2); g2.connect(ctx.destination)
    osc.start(t); osc.stop(t + 0.5)
  } else if (type === "win") {
    [0, 0.12, 0.24].forEach((delay, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = [520, 660, 800][i]
      gain.gain.setValueAtTime(0.2, t + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.18)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(t + delay); osc.stop(t + delay + 0.18)
    })
  } else if (type === "cashout") {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(400, t)
    osc.frequency.linearRampToValueAtTime(800, t + 0.3)
    gain.gain.setValueAtTime(0.25, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + 0.35)
  }
}

export default function TowersGame() {
  const [difficulty, setDifficulty] = useState(1)
  const [bet, setBet] = useState("100")
  const { credits, setCredits, isLoaded, trackWager } = useCredits()
  const [phase, setPhase] = useState<GamePhase>("idle")
  const [rows, setRows] = useState<Row[]>([])
  const [currentRow, setCurrentRow] = useState(0)
  const [loadingCell, setLoadingCell] = useState<number | null>(null)
  const [shakeScreen, setShakeScreen] = useState(false)
  const [flash, setFlash] = useState<"red" | "green" | null>(null)
  const [winnings, setWinnings] = useState(0)
  const audioCtx = useRef<AudioContext | null>(null)

  const diff = DIFFICULTIES[difficulty]
  const betNum = Math.max(1, parseInt(bet) || 0)
  const currentMultiplier = phase === "playing" || phase === "cashout" ? diff.multipliers[Math.max(0, currentRow - 1)] ?? 1 : 1
  const potentialWin = Math.floor(betNum * (diff.multipliers[currentRow] ?? diff.multipliers[diff.multipliers.length - 1]))

  function getAudio() {
    if (!audioCtx.current) audioCtx.current = new AudioContext()
    return audioCtx.current
  }

  const startGame = useCallback(() => {
    const parsed = parseInt(bet) || 0
    if (parsed < 1 || parsed > credits) return
    setCredits(c => c - parsed)
    trackWager(parsed)
    setRows(generateRows(diff.rows, diff.cols, diff.bombs))
    setCurrentRow(0)
    setWinnings(0)
    setPhase("playing")
    setFlash(null)
  }, [bet, credits, diff])

  const pickCell = useCallback(async (rowIdx: number, colIdx: number) => {
    if (phase !== "playing") return
    if (rowIdx !== currentRow) return
    if (loadingCell !== null) return

    const ctx = getAudio()
    setLoadingCell(colIdx)

    // Tense loading: 3 escalating ticks
    playTenseSound(ctx, "tick")
    await new Promise(r => setTimeout(r, 320))
    playTenseSound(ctx, "tick")
    await new Promise(r => setTimeout(r, 280))
    playTenseSound(ctx, "tick")
    await new Promise(r => setTimeout(r, 260))

    const row = rows[rowIdx]
    const isSafe = !row.bombIndices.has(colIdx)

    setRows(prev => {
      const next = prev.map((r, i) => {
        if (i !== rowIdx) return r
        const cells = [...r.cells]
        cells[colIdx] = isSafe ? "safe" : "bomb"
        return { ...r, cells }
      })
      return next
    })
    setLoadingCell(null)

    if (isSafe) {
      playTenseSound(ctx, "win")
      setFlash("green")
      setTimeout(() => setFlash(null), 300)
      const nextRow = currentRow + 1
      if (nextRow >= diff.rows) {
        // Cleared all rows
        const won = Math.floor(betNum * diff.multipliers[diff.rows - 1])
        setWinnings(won)
        setCredits(c => c + won)
        setPhase("won")
      } else {
        setCurrentRow(nextRow)
      }
    } else {
      playTenseSound(ctx, "boom")
      setFlash("red")
      // Reveal entire row (all bombs + safe)
      setRows(prev =>
        prev.map((r, i) => {
          if (i !== rowIdx) return r
          const cells = r.cells.map((_, ci) => (r.bombIndices.has(ci) ? "bomb" : "safe")) as CellState[]
          return { ...r, cells }
        })
      )
      setShakeScreen(true)
      setTimeout(() => { setShakeScreen(false); setFlash(null) }, 600)
      setPhase("lost")
    }
  }, [phase, currentRow, rows, loadingCell, betNum, diff])

  const cashout = useCallback(() => {
    if (phase !== "playing" || currentRow === 0) return
    const ctx = getAudio()
    playTenseSound(ctx, "cashout")
    const won = Math.floor(betNum * diff.multipliers[currentRow - 1])
    setWinnings(won)
    setCredits(c => c + won)
    setPhase("cashout")
    setFlash("green")
    setTimeout(() => setFlash(null), 400)
  }, [phase, currentRow, betNum, diff])

  const reset = useCallback(() => {
    setPhase("idle")
    setRows([])
    setCurrentRow(0)
    setLoadingCell(null)
    setFlash(null)
  }, [])

  // Screen flash overlay color
  const flashBg = flash === "red" ? "bg-red-500/20" : flash === "green" ? "bg-green-500/15" : ""

  return (
    <div className={`min-h-screen bg-[#060610] text-white relative overflow-hidden transition-transform ${shakeScreen ? "animate-shake" : ""}`}>
      {/* Flash overlay */}
      {flash && (
        <div className={`pointer-events-none fixed inset-0 z-50 ${flashBg} transition-opacity duration-200`} />
      )}

      {/* Dark atmospheric bg */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_#1a0a2e_0%,_#060610_70%)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_60px,rgba(255,255,255,0.015)_61px)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT — Controls */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-5">
            {/* Credits */}
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-2">
              <Coins size={16} className="text-yellow-400" />
              <span className="text-sm text-slate-300 font-medium">Balance</span>
              <span className="ml-auto font-bold text-white">{isLoaded ? credits.toLocaleString() : "Loading..."}</span>
            </div>

            {/* Difficulty */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Difficulty</p>
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTIES.map((d, i) => (
                  <button
                    key={d.label}
                    disabled={phase === "playing"}
                    onClick={() => setDifficulty(i)}
                    className={`rounded-lg py-2 text-sm font-bold transition-all ${
                      difficulty === i
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bet */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Bet Amount</p>
              <input
                type="number"
                value={bet}
                disabled={phase === "playing"}
                onChange={e => setBet(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-white font-bold text-lg focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-40"
                min={1}
                max={credits}
              />
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 100, 500].map(v => (
                  <button
                    key={v}
                    disabled={phase === "playing"}
                    onClick={() => setBet(String(v))}
                    className="rounded-md bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 py-1.5 transition-all disabled:opacity-40"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Multiplier */}
            {(phase === "playing" || phase === "cashout") && currentRow > 0 && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-900/20 p-4 flex items-center gap-3">
                <TrendingUp size={18} className="text-purple-400" />
                <div>
                  <p className="text-xs text-slate-400">Current multiplier</p>
                  <p className="text-xl font-black text-purple-300">{currentMultiplier}x</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-slate-400">Value</p>
                  <p className="text-lg font-bold text-green-400">+{Math.floor(betNum * currentMultiplier).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Next row potential */}
            {phase === "playing" && currentRow < diff.rows && (
              <div className="rounded-xl border border-yellow-500/20 bg-yellow-900/10 px-4 py-3 text-center">
                <p className="text-xs text-slate-400 mb-0.5">Next win</p>
                <p className="text-2xl font-black text-yellow-300">{diff.multipliers[currentRow]}x</p>
                <p className="text-sm text-slate-400">{potentialWin.toLocaleString()} credits</p>
              </div>
            )}

            {/* Action buttons */}
            {phase === "idle" && (
              <button
                onClick={startGame}
                disabled={parseInt(bet) < 1 || parseInt(bet) > credits}
                className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 py-3.5 font-black text-lg text-white transition-all shadow-xl shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start Game
              </button>
            )}

            {phase === "playing" && currentRow > 0 && (
              <button
                onClick={cashout}
                className="w-full rounded-xl border border-green-500/50 bg-green-900/30 hover:bg-green-800/40 active:scale-95 py-3.5 font-black text-lg text-green-300 transition-all shadow-xl shadow-green-500/10 animate-pulse-slow"
              >
                Cashout — {Math.floor(betNum * diff.multipliers[currentRow - 1]).toLocaleString()} credits
              </button>
            )}

            {(phase === "won" || phase === "lost" || phase === "cashout") && (
              <button
                onClick={reset}
                className="w-full rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 py-3.5 font-black text-lg text-white transition-all"
              >
                Play Again
              </button>
            )}
          </div>

          {/* RIGHT — Tower Grid */}
          <div className="flex-1 w-full">
            {/* Result banner */}
            {phase === "won" && (
              <div className="mb-6 rounded-xl border border-green-500/40 bg-green-900/20 p-5 text-center animate-bounce-in">
                <p className="text-3xl font-black text-green-300">YOU WON!</p>
                <p className="text-xl text-green-400 font-bold mt-1">+{winnings.toLocaleString()} credits</p>
              </div>
            )}
            {phase === "cashout" && (
              <div className="mb-6 rounded-xl border border-yellow-500/40 bg-yellow-900/20 p-5 text-center animate-bounce-in">
                <p className="text-2xl font-black text-yellow-300">Cashed Out!</p>
                <p className="text-xl text-yellow-400 font-bold mt-1">+{winnings.toLocaleString()} credits ({currentMultiplier}x)</p>
              </div>
            )}
            {phase === "lost" && (
              <div className="mb-6 rounded-xl border border-red-500/40 bg-red-900/20 p-5 text-center animate-bounce-in">
                <p className="text-3xl font-black text-red-400">BOOM! You Lost</p>
                <p className="text-slate-400 mt-1">-{betNum.toLocaleString()} credits</p>
              </div>
            )}

            {/* Grid */}
            {(phase === "playing" || phase === "won" || phase === "lost" || phase === "cashout") && (
              <div className="flex flex-col-reverse gap-2">
                {rows.map((row, rowIdx) => {
                  const isActive = rowIdx === currentRow && phase === "playing"
                  const isPast = rowIdx < currentRow
                  const isFuture = rowIdx > currentRow

                  return (
                    <div key={rowIdx} className={`flex gap-2 items-center transition-all duration-300 ${isFuture && phase === "playing" ? "opacity-40 scale-95" : "opacity-100 scale-100"}`}>
                      {/* Row multiplier label */}
                      <div className="w-14 text-right flex-shrink-0">
                        <span className={`text-xs font-bold ${isActive ? "text-yellow-300" : isPast ? "text-green-400" : "text-slate-500"}`}>
                          {diff.multipliers[rowIdx]}x
                        </span>
                      </div>

                      {/* Cells */}
                      {row.cells.map((cell, colIdx) => {
                        const isLoading = isActive && loadingCell === colIdx
                        const isHiddenActive = isActive && cell === "hidden"

                        return (
                          <button
                            key={colIdx}
                            disabled={!isHiddenActive}
                            onClick={() => pickCell(rowIdx, colIdx)}
                            className={`
                              relative flex-1 h-14 rounded-xl border-2 font-black text-sm transition-all duration-150
                              ${cell === "hidden" && isActive
                                ? "border-purple-500/60 bg-purple-900/30 hover:bg-purple-700/50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95 cursor-pointer"
                                : cell === "hidden"
                                ? "border-slate-700/40 bg-slate-800/20 cursor-default"
                                : cell === "safe"
                                ? "border-green-500/60 bg-green-900/30 cursor-default"
                                : "border-red-500/60 bg-red-900/30 cursor-default"
                              }
                              ${isLoading ? "animate-cell-pulse border-yellow-400 bg-yellow-900/30" : ""}
                            `}
                          >
                            {isLoading && (
                              <span className="flex items-center justify-center gap-0.5">
                                {[0, 1, 2].map(i => (
                                  <span
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce"
                                    style={{ animationDelay: `${i * 0.12}s` }}
                                  />
                                ))}
                              </span>
                            )}
                            {!isLoading && cell === "safe" && (
                              <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto text-green-400" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                            {!isLoading && cell === "bomb" && (
                              <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto text-red-400" fill="currentColor">
                                <circle cx="12" cy="13" r="7" />
                                <rect x="11" y="3" width="2" height="4" rx="1" />
                                <path d="M15 5 l2 -2" stroke="white" strokeWidth="1.5" fill="none" />
                              </svg>
                            )}
                            {!isLoading && cell === "hidden" && isActive && (
                              <span className="text-purple-400/60 text-xs">?</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}

            {phase === "idle" && (
              <div className="flex flex-col items-center justify-center h-72 gap-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <svg viewBox="0 0 64 64" fill="none" className="w-20 h-20 text-purple-500/40" xmlns="http://www.w3.org/2000/svg">
                  <rect x="22" y="16" width="20" height="40" rx="1" fill="currentColor" opacity="0.85" />
                  <rect x="20" y="10" width="6" height="8" rx="1" fill="currentColor" opacity="0.9" />
                  <rect x="29" y="8" width="6" height="10" rx="1" fill="currentColor" />
                  <rect x="38" y="10" width="6" height="8" rx="1" fill="currentColor" opacity="0.9" />
                  <rect x="28" y="42" width="8" height="14" rx="4" fill="#060610" opacity="0.7" />
                  <rect x="10" y="28" width="13" height="28" rx="1" fill="currentColor" opacity="0.6" />
                  <rect x="41" y="28" width="13" height="28" rx="1" fill="currentColor" opacity="0.6" />
                </svg>
                <p className="text-slate-500 text-sm font-medium">Set your bet and start climbing</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px) rotate(-1deg); }
          30% { transform: translateX(8px) rotate(1deg); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.55s ease-in-out; }

        @keyframes bounce-in {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.35s ease-out forwards; }

        @keyframes cell-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(234,179,8,0); }
          50% { box-shadow: 0 0 18px 4px rgba(234,179,8,0.35); }
        }
        .animate-cell-pulse { animation: cell-pulse 0.5s ease-in-out infinite; }

        @keyframes pulse-slow {
          0%,100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
        .animate-pulse-slow { animation: pulse-slow 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

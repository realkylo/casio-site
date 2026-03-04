"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Coins, TrendingUp, RotateCcw } from "lucide-react"
import { useCredits } from "@/lib/credits-context"

// Player win chances — all set below 50% so house always has edge
// x1.5: fair value = 66.7%, we show 40% → heavy house edge
// x2:   fair value = 50%,   we show 40%
// x3:   fair value = 33.3%, we show 30%
// x5:   fair value = 20%,   we show 17%
// x10:  fair value = 10%,   we show 8%
// x25:  fair value = 4%,    we show 3%
// x50:  fair value = 2%,    we show 1.5%
// x100: fair value = 1%,    we show 0.8%
const MULTIPLIERS = [
  { value: 1.5,  label: "x1.5",  chance: 40,   color: "#22c55e" },
  { value: 2,    label: "x2",    chance: 40,   color: "#84cc16" },
  { value: 3,    label: "x3",    chance: 30,   color: "#eab308" },
  { value: 5,    label: "x5",    chance: 17,   color: "#f97316" },
  { value: 10,   label: "x10",   chance: 8,    color: "#ef4444" },
  { value: 25,   label: "x25",   chance: 3,    color: "#dc2626" },
  { value: 50,   label: "x50",   chance: 1.5,  color: "#991b1b" },
  { value: 100,  label: "x100",  chance: 0.8,  color: "#7f1d1d" },
]

// Build wheel segments: green arc = win chance, red arc = loss
// Wheel has 360 degrees total. Green = chance%, Red = rest
function buildSegments(chance: number) {
  const greenDeg = (chance / 100) * 360
  const redDeg = 360 - greenDeg
  return { greenDeg, redDeg }
}

function playUpgradeSound(ctx: AudioContext, type: "spin" | "win" | "lose") {
  const t = ctx.currentTime
  if (type === "spin") {
    // Whirring tick sound
    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = "square"
      osc.frequency.value = 80 + i * 30
      g.gain.setValueAtTime(0, t + i * 0.06)
      g.gain.linearRampToValueAtTime(0.06, t + i * 0.06 + 0.02)
      g.gain.linearRampToValueAtTime(0, t + i * 0.06 + 0.05)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.06)
    }
  } else if (type === "win") {
    [0, 0.1, 0.2, 0.32].forEach((d, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = [440, 554, 659, 880][i]
      g.gain.setValueAtTime(0.22, t + d)
      g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.25)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(t + d); osc.stop(t + d + 0.25)
    })
  } else {
    const bufSize = ctx.sampleRate * 0.5
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.9, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    const f = ctx.createBiquadFilter()
    f.type = "lowpass"; f.frequency.value = 250
    src.connect(f); f.connect(g); g.connect(ctx.destination)
    src.start(t)
  }
}

type Phase = "idle" | "spinning" | "won" | "lost"

export default function UpgradePage() {
  const { credits, setCredits, isLoaded, trackWager } = useCredits()
  const [bet, setBet] = useState("100")
  const [selectedIdx, setSelectedIdx] = useState(1) // x2 default
  const [phase, setPhase] = useState<Phase>("idle")
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<"win" | "lose" | null>(null)
  const [flash, setFlash] = useState<"green" | "red" | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const startAngleRef = useRef(0)
  const targetAngleRef = useRef(0)
  const startTimeRef = useRef(0)
  const durationRef = useRef(3000)
  const wonRef = useRef(false)

  const mult = MULTIPLIERS[selectedIdx]
  const betNum = Math.max(1, parseInt(bet) || 0)
  const { greenDeg, redDeg } = buildSegments(mult.chance)

  function getAudio() {
    if (!audioCtx.current) audioCtx.current = new AudioContext()
    return audioCtx.current
  }

  // Draw wheel on canvas
  const drawWheel = useCallback((angle: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const r = cx - 8
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const toRad = (d: number) => (d * Math.PI) / 180
    const greenStart = toRad(angle - 90)
    const greenEnd = toRad(angle - 90 + greenDeg)

    // Red arc (loss)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, greenEnd, greenStart + toRad(360))
    ctx.closePath()
    ctx.fillStyle = "#7f1d1d"
    ctx.fill()

    // Green arc (win)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, greenStart, greenEnd)
    ctx.closePath()
    const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r)
    grad.addColorStop(0, "#4ade80")
    grad.addColorStop(1, "#16a34a")
    ctx.fillStyle = grad
    ctx.fill()

    // Inner circle (logo area)
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2)
    ctx.fillStyle = "#0a0a1a"
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.08)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Rim
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(255,255,255,0.12)"
    ctx.lineWidth = 3
    ctx.stroke()

    // Divider line between green and red
    const drawLine = (deg: number) => {
      const rad = toRad(angle - 90 + deg)
      ctx.beginPath()
      ctx.moveTo(cx + r * 0.42 * Math.cos(rad), cy + r * 0.42 * Math.sin(rad))
      ctx.lineTo(cx + r * Math.cos(rad), cy + r * Math.sin(rad))
      ctx.strokeStyle = "rgba(255,255,255,0.25)"
      ctx.lineWidth = 2
      ctx.stroke()
    }
    drawLine(0)
    drawLine(greenDeg)

    // Chance label inside green
    const midGreenRad = toRad(angle - 90 + greenDeg / 2)
    const labelR = r * 0.72
    ctx.save()
    ctx.translate(cx + labelR * Math.cos(midGreenRad), cy + labelR * Math.sin(midGreenRad))
    ctx.rotate(midGreenRad + Math.PI / 2)
    ctx.fillStyle = "white"
    ctx.font = `bold ${Math.floor(r * 0.11)}px Inter, sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    if (greenDeg > 40) ctx.fillText(`${mult.chance}%`, 0, 0)
    ctx.restore()
  }, [greenDeg, mult.chance])

  // Pointer triangle at top
  // The "win zone" = top of wheel (angle 0 deg from top = -90 from x-axis)
  // We rotate so green starts at top

  useEffect(() => {
    drawWheel(rotation)
  }, [rotation, drawWheel, selectedIdx])

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

  const animateSpin = useCallback(() => {
    const now = performance.now()
    const elapsed = now - startTimeRef.current
    const progress = Math.min(elapsed / durationRef.current, 1)
    const eased = easeOut(progress)
    const currentAngle = startAngleRef.current + (targetAngleRef.current - startAngleRef.current) * eased
    setRotation(currentAngle)
    drawWheel(currentAngle)

    if (progress < 1) {
      animRef.current = requestAnimationFrame(animateSpin)
    } else {
      // Use pre-decided outcome — never re-evaluate geometry
      const won = wonRef.current
      const ctx2 = getAudio()
      if (won) {
        playUpgradeSound(ctx2, "win")
        const winAmount = Math.floor(betNum * mult.value)
        setCredits(c => c + winAmount)
        setResult("win")
        setFlash("green")
        setTimeout(() => setFlash(null), 600)
        setPhase("won")
      } else {
        playUpgradeSound(ctx2, "lose")
        setResult("lose")
        setFlash("red")
        setTimeout(() => setFlash(null), 600)
        setPhase("lost")
      }
    }
  }, [drawWheel, betNum, mult, greenDeg])

  const spin = useCallback(() => {
    if (phase !== "idle") return
    const parsed = parseInt(bet) || 0
    if (parsed < 1 || parsed > credits) return
    setCredits(c => c - parsed)
    trackWager(parsed)
    const ctx2 = getAudio()
    playUpgradeSound(ctx2, "spin")

    // Decide outcome before animation — stored in ref so animateSpin reads it reliably
    const won = Math.random() * 100 < mult.chance
    wonRef.current = won

    // Spin 4-6 full rotations + land in correct zone
    const fullSpins = (4 + Math.floor(Math.random() * 3)) * 360
    // If win: land in center of green arc (top = 270 canvas deg)
    // If lose: land in center of red arc
    let landOffset: number
    if (won) {
      // Green starts at top (270), so land anywhere in greenDeg range - pick center
      landOffset = greenDeg / 2
    } else {
      // Red is from greenDeg to 360 on the wheel
      landOffset = greenDeg + (redDeg / 2)
    }
    // We want pointer (at canvas 270) to be at landOffset inside the wheel
    // currentAngle so that: (270 - targetAngle) % 360 === landOffset
    // targetAngle = 270 - landOffset + jitter
    const jitter = (Math.random() - 0.5) * (won ? greenDeg * 0.5 : redDeg * 0.4)
    const targetLand = 270 - landOffset - jitter
    const target = rotation + fullSpins + ((targetLand - rotation % 360) + 360) % 360

    startAngleRef.current = rotation
    targetAngleRef.current = target
    startTimeRef.current = performance.now()
    durationRef.current = 3200 + Math.random() * 600

    setPhase("spinning")
    setResult(null)
    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(animateSpin)
  }, [phase, bet, credits, rotation, mult, greenDeg, redDeg, animateSpin])

  const reset = useCallback(() => {
    setPhase("idle")
    setResult(null)
    setFlash(null)
  }, [])

  const redDegActual = 360 - greenDeg

  return (
    <div className="min-h-screen bg-[#060610] text-white relative overflow-hidden">
      {/* Flash overlay */}
      {flash && (
        <div className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-300 ${flash === "green" ? "bg-green-500/15" : "bg-red-500/20"}`} />
      )}

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_#0d1a3a_0%,_#060610_70%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Upgrade</h1>
        <p className="text-slate-400 text-sm mb-8">Spin the wheel. Win or lose it all.</p>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT — Controls */}
          <div className="w-full lg:w-72 flex-shrink-0 space-y-5">
            {/* Credits */}
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-2">
              <Coins size={16} className="text-yellow-400" />
              <span className="text-sm text-slate-300 font-medium">Balance</span>
              <span className="ml-auto font-bold text-white">{isLoaded ? credits.toLocaleString() : "Loading..."}</span>
            </div>

            {/* Bet */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Bet Amount</p>
              <input
                type="number"
                value={bet}
                disabled={phase === "spinning"}
                onChange={e => setBet(e.target.value)}
                className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2.5 text-white font-bold text-lg focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-40"
                min={1}
                max={credits}
              />
              <div className="grid grid-cols-4 gap-1.5">
                {[25, 50, 100, 500].map(v => (
                  <button key={v} disabled={phase === "spinning"} onClick={() => setBet(String(v))}
                    className="rounded-md bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 py-1.5 transition-all disabled:opacity-40">
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Multiplier selector */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Target Multiplier</p>
              <div className="grid grid-cols-2 gap-2">
                {MULTIPLIERS.map((m, i) => (
                  <button
                    key={m.label}
                    disabled={phase === "spinning"}
                    onClick={() => { setSelectedIdx(i); setPhase("idle"); setResult(null) }}
                    className={`rounded-lg py-2.5 text-sm font-bold transition-all border ${
                      selectedIdx === i
                        ? "border-transparent text-white shadow-lg"
                        : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    style={selectedIdx === i ? { backgroundColor: m.color + "33", borderColor: m.color + "99", color: m.color } : {}}
                  >
                    {m.label}
                    <span className="block text-xs opacity-70">{m.chance}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Potential win */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-900/10 px-4 py-3 flex items-center gap-3">
              <TrendingUp size={16} className="text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">If you win</p>
                <p className="text-xl font-black text-blue-300">{Math.floor(betNum * mult.value).toLocaleString()}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">Win chance</p>
                <p className="text-lg font-bold" style={{ color: mult.color }}>{mult.chance}%</p>
              </div>
            </div>

            {/* Action */}
            {(phase === "idle" || phase === "won" || phase === "lost") && (
              <button
                onClick={phase === "idle" ? spin : reset}
                disabled={phase === "idle" && (betNum < 1 || betNum > credits)}
                className="w-full rounded-xl py-3.5 font-black text-lg text-white transition-all shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={phase === "idle"
                  ? { backgroundColor: mult.color, boxShadow: `0 8px 24px ${mult.color}40` }
                  : { backgroundColor: "#334155" }}
              >
                {phase === "idle" ? `Upgrade ${mult.label}` : <span className="flex items-center justify-center gap-2"><RotateCcw size={18} /> Play Again</span>}
              </button>
            )}

            {phase === "spinning" && (
              <div className="w-full rounded-xl py-3.5 font-black text-lg text-center text-slate-400 border border-white/10 bg-white/5 animate-pulse">
                Spinning...
              </div>
            )}
          </div>

          {/* RIGHT — Wheel */}
          <div className="flex-1 flex flex-col items-center gap-6">
            {/* Result banner */}
            {result === "win" && (
              <div className="w-full rounded-xl border border-green-500/40 bg-green-900/20 p-5 text-center" style={{ animation: "bounceIn 0.35s ease-out forwards" }}>
                <p className="text-3xl font-black text-green-300">WIN!</p>
                <p className="text-xl font-bold text-green-400">+{Math.floor(betNum * mult.value).toLocaleString()} credits ({mult.label})</p>
              </div>
            )}
            {result === "lose" && (
              <div className="w-full rounded-xl border border-red-500/40 bg-red-900/20 p-5 text-center" style={{ animation: "bounceIn 0.35s ease-out forwards" }}>
                <p className="text-3xl font-black text-red-400">LOST</p>
                <p className="text-slate-400">-{betNum.toLocaleString()} credits</p>
              </div>
            )}

            {/* Wheel container */}
            <div className="relative flex items-center justify-center">
              {/* Pointer at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 pointer-events-none">
                <svg width="24" height="28" viewBox="0 0 24 28">
                  <polygon points="12,28 0,0 24,0" fill="white" opacity="0.9" />
                </svg>
              </div>

              {/* Canvas wheel */}
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={320}
                  className="rounded-full"
                  style={{ filter: phase === "spinning" ? "drop-shadow(0 0 24px rgba(255,255,255,0.15))" : "none" }}
                />
                {/* Center logo overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[134px] h-[134px] rounded-full bg-[#0a0a1a] flex items-center justify-center overflow-hidden border border-white/10">
                    <Image
                      src="/spamme-logo.png"
                      alt="SPAM.ME"
                      width={110}
                      height={110}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span className="text-sm text-slate-400">Win — {mult.chance}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-800" />
                <span className="text-sm text-slate-400">Lose — {(100 - mult.chance).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounceIn {
          0% { transform: scale(0.85); opacity: 0; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

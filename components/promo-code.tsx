"use client"

import { useState } from "react"
import { Gift, Check, X, Loader2, Lock } from "lucide-react"
import { useCredits } from "@/lib/credits-context"

export default function PromoCode() {
  const { redeemPromo, wagerRemaining, canWithdraw } = useCredits()
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleRedeem = async () => {
    if (!code.trim()) return
    setStatus("loading")

    // Small delay for UX feedback
    await new Promise((r) => setTimeout(r, 600))

    const result = redeemPromo(code)
    if (result.success) {
      setStatus("success")
      setMessage(result.message)
      setCode("")
      setTimeout(() => {
        setStatus("idle")
        setMessage("")
      }, 5000)
    } else {
      setStatus("error")
      setMessage(result.message)
      setTimeout(() => {
        setStatus("idle")
        setMessage("")
      }, 3000)
    }
  }

  return (
    <div className="w-full rounded-2xl border border-[#2a2a3a] bg-gradient-to-b from-[#161625] to-[#0d0d1a] p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Gift size={20} className="text-yellow-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Promo Code</h3>
          <p className="text-xs text-slate-400">Redeem a code for free credits</p>
        </div>
      </div>

      {/* Input + Button */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
          placeholder="Enter code..."
          disabled={status === "loading" || status === "success"}
          className="flex-1 rounded-lg border border-[#2a2a3a] bg-[#0a0a14] px-3.5 py-2.5 text-sm font-mono font-semibold text-white placeholder:text-slate-500 outline-none transition-all focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 disabled:opacity-50 tracking-wider"
          maxLength={20}
          aria-label="Promo code input"
        />
        <button
          onClick={handleRedeem}
          disabled={!code.trim() || status === "loading" || status === "success"}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          style={{
            backgroundColor: status === "success" ? "#22c55e" : "#eab308",
            color: status === "success" ? "#fff" : "#0a0a14",
          }}
          aria-label="Redeem promo code"
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : status === "success" ? (
            <Check size={16} />
          ) : (
            "Redeem"
          )}
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
            status === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : status === "error"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : ""
          }`}
        >
          {status === "success" ? (
            <Check size={14} className="flex-shrink-0 mt-0.5" />
          ) : (
            <X size={14} className="flex-shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{message}</span>
        </div>
      )}

      {/* Wager requirement bar */}
      {wagerRemaining > 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={12} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">
              Wager Requirement
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(0, Math.min(100, ((1 - wagerRemaining / (wagerRemaining + 1)) * 100)))}%`,
                background: "linear-gradient(90deg, #eab308, #f59e0b)",
              }}
            />
          </div>
          <p className="text-xs text-amber-400/70 mt-1.5">
            Wager <span className="font-bold text-amber-300">{wagerRemaining.toLocaleString()}</span> more credits to unlock withdrawals
          </p>
        </div>
      )}

      {/* Withdrawal unlocked */}
      {canWithdraw && wagerRemaining === 0 && status !== "success" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-green-400/70">
          <Check size={12} />
          <span>No wager requirements active</span>
        </div>
      )}
    </div>
  )
}

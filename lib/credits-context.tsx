"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface CreditsContextType {
  credits: number
  setCredits: React.Dispatch<React.SetStateAction<number>>
  addCredits: (amount: number) => void
  subtractCredits: (amount: number) => boolean
  isLoaded: boolean
  // Promo / wager tracking
  wagerRemaining: number
  redeemPromo: (code: string) => { success: boolean; message: string }
  trackWager: (amount: number) => void
  usedCodes: string[]
  canWithdraw: boolean
}

const CreditsContext = createContext<CreditsContextType | null>(null)

const STORAGE_KEY = "spam_me_credits"
const WAGER_KEY = "spam_me_wager_remaining"
const USED_CODES_KEY = "spam_me_used_codes"
const DEFAULT_CREDITS = 1250

// Valid promo codes: code -> { credits, wagerMultiplier }
const PROMO_CODES: Record<string, { credits: number; wagerMultiplier: number }> = {
  "FREE100": { credits: 100, wagerMultiplier: 3 },
  "WELCOME50": { credits: 50, wagerMultiplier: 2 },
  "BONUS200": { credits: 200, wagerMultiplier: 5 },
}

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCreditsInternal] = useState<number>(DEFAULT_CREDITS)
  const [isLoaded, setIsLoaded] = useState(false)
  const [wagerRemaining, setWagerRemainingInternal] = useState<number>(0)
  const [usedCodes, setUsedCodesInternal] = useState<string[]>([])

  // Hydrate from sessionStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        const parsed = Number(stored)
        if (!isNaN(parsed)) {
          setCreditsInternal(parsed)
        }
      }
      const wagerStored = sessionStorage.getItem(WAGER_KEY)
      if (wagerStored !== null) {
        const parsed = Number(wagerStored)
        if (!isNaN(parsed)) {
          setWagerRemainingInternal(parsed)
        }
      }
      const codesStored = sessionStorage.getItem(USED_CODES_KEY)
      if (codesStored) {
        setUsedCodesInternal(JSON.parse(codesStored))
      }
    } catch {}
    setIsLoaded(true)
  }, [])

  const setCredits: React.Dispatch<React.SetStateAction<number>> = useCallback((action) => {
    setCreditsInternal((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      try {
        sessionStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }, [])

  const setWagerRemaining = useCallback((action: React.SetStateAction<number>) => {
    setWagerRemainingInternal((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      const clamped = Math.max(0, next)
      try {
        sessionStorage.setItem(WAGER_KEY, String(clamped))
      } catch {}
      return clamped
    })
  }, [])

  const setUsedCodes = useCallback((action: React.SetStateAction<string[]>) => {
    setUsedCodesInternal((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      try {
        sessionStorage.setItem(USED_CODES_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const addCredits = useCallback((amount: number) => {
    setCredits((c) => c + amount)
  }, [setCredits])

  const subtractCredits = useCallback((amount: number) => {
    let success = false
    setCredits((c) => {
      if (c >= amount) {
        success = true
        return c - amount
      }
      return c
    })
    return success
  }, [setCredits])

  const redeemPromo = useCallback((code: string): { success: boolean; message: string } => {
    const upper = code.trim().toUpperCase()
    const promo = PROMO_CODES[upper]
    if (!promo) {
      return { success: false, message: "Invalid promo code" }
    }
    if (usedCodes.includes(upper)) {
      return { success: false, message: "This code has already been used" }
    }
    // Add credits
    setCredits((c) => c + promo.credits)
    // Add wager requirement
    const wagerReq = promo.credits * promo.wagerMultiplier
    setWagerRemaining((w) => w + wagerReq)
    // Mark code as used
    setUsedCodes((codes) => [...codes, upper])
    return {
      success: true,
      message: `+${promo.credits} credits added! You must wager ${wagerReq} credits before withdrawing.`,
    }
  }, [usedCodes, setCredits, setWagerRemaining, setUsedCodes])

  const trackWager = useCallback((amount: number) => {
    if (wagerRemaining > 0) {
      setWagerRemaining((w) => w - amount)
    }
  }, [wagerRemaining, setWagerRemaining])

  const canWithdraw = wagerRemaining <= 0

  return (
    <CreditsContext.Provider
      value={{
        credits,
        setCredits,
        addCredits,
        subtractCredits,
        isLoaded,
        wagerRemaining,
        redeemPromo,
        trackWager,
        usedCodes,
        canWithdraw,
      }}
    >
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const ctx = useContext(CreditsContext)
  if (!ctx) throw new Error("useCredits must be used within a CreditsProvider")
  return ctx
}

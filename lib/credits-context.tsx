"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"

interface CreditsContextType {
  credits: number
  setCredits: React.Dispatch<React.SetStateAction<number>>
  addCredits: (amount: number) => void
  subtractCredits: (amount: number) => boolean
  isLoaded: boolean
  refreshCredits: () => Promise<void>
  // Promo / wager tracking
  wagerRemaining: number
  redeemPromo: (code: string) => { success: boolean; message: string }
  trackWager: (amount: number) => void
  usedCodes: string[]
  canWithdraw: boolean
}

const CreditsContext = createContext<CreditsContextType | null>(null)

const WAGER_KEY = "spam_me_wager_remaining"
const USED_CODES_KEY = "spam_me_used_codes"

// Valid promo codes: code -> { credits, wagerMultiplier }
const PROMO_CODES: Record<string, { credits: number; wagerMultiplier: number }> = {
  "FREE100": { credits: 100, wagerMultiplier: 3 },
  "WELCOME50": { credits: 50, wagerMultiplier: 2 },
  "BONUS200": { credits: 200, wagerMultiplier: 5 },
}

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const [credits, setCreditsRaw] = useState<number>(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [wagerRemaining, setWagerRemainingInternal] = useState<number>(0)
  const [usedCodes, setUsedCodesInternal] = useState<string[]>([])
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestCreditsRef = useRef<number>(0)

  // Keep ref in sync
  useEffect(() => {
    latestCreditsRef.current = credits
  }, [credits])

  // Track the last synced value so we only sync actual changes
  const lastSyncedRef = useRef<number>(0)

  // Signed sync to MongoDB — computes delta from last synced value, signs it server-side,
  // then applies it. This prevents clients from setting arbitrary credit amounts.
  const syncToDb = useCallback(() => {
    if (!user) return
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(async () => {
      const current = latestCreditsRef.current
      const delta = current - lastSyncedRef.current
      if (delta === 0) return
      try {
        // Step 1: Get a signed token for this delta
        const signRes = await fetch("/api/credits/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delta }),
        })
        if (!signRes.ok) return
        const { token } = await signRes.json()

        // Step 2: Apply the signed delta
        const res = await fetch("/api/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        if (res.ok) {
          lastSyncedRef.current = current
        }
      } catch {
        // silently fail
      }
    }, 800)
  }, [user])

  // Wrapped setCredits that also triggers a DB sync
  const setCredits: React.Dispatch<React.SetStateAction<number>> = useCallback(
    (action) => {
      setCreditsRaw((prev) => {
        const next = typeof action === "function" ? action(prev) : action
        return next
      })
      syncToDb()
    },
    [syncToDb]
  )

  // Fetch credits from MongoDB when user is authenticated
  const refreshCredits = useCallback(async () => {
    if (!user) {
      setCreditsRaw(0)
      setIsLoaded(true)
      return
    }

    try {
      const res = await fetch("/api/credits")
      if (res.ok) {
        const data = await res.json()
        const val = data.credits ?? 0
        setCreditsRaw(val)
        lastSyncedRef.current = val
      }
    } catch {
      // silently fail
    } finally {
      setIsLoaded(true)
    }
  }, [user])

  // Fetch credits when auth state changes
  useEffect(() => {
    if (!authLoading) {
      refreshCredits()
    }
  }, [authLoading, refreshCredits])

  // Flush pending sync on page unload (best-effort — use visibilitychange for better reliability)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && user) {
        // Trigger immediate sync (clear the debounce timer and sync now)
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
        const current = latestCreditsRef.current
        const delta = current - lastSyncedRef.current
        if (delta === 0) return
        // Use sendBeacon with a simple request — server will handle via signed delta
        // Since we can't do async signing in beforeunload, we send a sync request via fetch keepalive
        fetch("/api/credits/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delta }),
          keepalive: true,
        }).then(res => res.json()).then(({ token }) => {
          fetch("/api/credits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
            keepalive: true,
          })
        }).catch(() => {})
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [user])

  // Hydrate wager/promo from sessionStorage
  useEffect(() => {
    try {
      const wagerStored = sessionStorage.getItem(WAGER_KEY)
      if (wagerStored !== null) {
        const parsed = Number(wagerStored)
        if (!isNaN(parsed)) setWagerRemainingInternal(parsed)
      }
      const codesStored = sessionStorage.getItem(USED_CODES_KEY)
      if (codesStored) setUsedCodesInternal(JSON.parse(codesStored))
    } catch {}
  }, [])

  const setWagerRemaining = useCallback((action: React.SetStateAction<number>) => {
    setWagerRemainingInternal((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      const clamped = Math.max(0, next)
      try { sessionStorage.setItem(WAGER_KEY, String(clamped)) } catch {}
      return clamped
    })
  }, [])

  const setUsedCodes = useCallback((action: React.SetStateAction<string[]>) => {
    setUsedCodesInternal((prev) => {
      const next = typeof action === "function" ? action(prev) : action
      try { sessionStorage.setItem(USED_CODES_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const addCredits = useCallback((amount: number) => {
    setCredits((c) => c + amount)
  }, [setCredits])

  const subtractCredits = useCallback((amount: number): boolean => {
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
    if (!promo) return { success: false, message: "Invalid promo code" }
    if (usedCodes.includes(upper)) return { success: false, message: "This code has already been used" }
    if (!user) return { success: false, message: "Please log in with Discord first" }

    addCredits(promo.credits)

    const wagerReq = promo.credits * promo.wagerMultiplier
    setWagerRemaining((w) => w + wagerReq)
    setUsedCodes((codes) => [...codes, upper])
    return {
      success: true,
      message: `+${promo.credits} credits added! You must wager ${wagerReq} credits before withdrawing.`,
    }
  }, [usedCodes, user, addCredits, setWagerRemaining, setUsedCodes])

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
        refreshCredits,
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

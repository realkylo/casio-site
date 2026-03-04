"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Coins, RotateCcw } from "lucide-react"
import { useCredits } from "@/lib/credits-context"

// ─── Card types ──────────────────────────────────────────────────────────────

type Suit = "spades" | "hearts" | "diamonds" | "clubs"
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"

interface Card {
  suit: Suit
  rank: Rank
  faceDown?: boolean
}

// ─── Deck helpers ────────────────────────────────────────────────────────────

function buildDeck(): Card[] {
  const suits: Suit[] = ["spades", "hearts", "diamonds", "clubs"]
  const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  const deck: Card[] = []
  for (const suit of suits)
    for (const rank of ranks)
      deck.push({ suit, rank })
  // Shuffle 6 decks
  const sixDecks = Array(6).fill(deck).flat()
  for (let i = sixDecks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sixDecks[i], sixDecks[j]] = [sixDecks[j], sixDecks[i]]
  }
  return sixDecks
}

function cardValue(rank: Rank): number {
  if (rank === "A") return 11
  if (["J", "Q", "K"].includes(rank)) return 10
  return parseInt(rank)
}

function handValue(cards: Card[]): number {
  const visible = cards.filter(c => !c.faceDown)
  let total = visible.reduce((s, c) => s + cardValue(c.rank), 0)
  let aces = visible.filter(c => c.rank === "A").length
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

function fullHandValue(cards: Card[]): number {
  let total = cards.reduce((s, c) => s + cardValue(c.rank), 0)
  let aces = cards.filter(c => c.rank === "A").length
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && fullHandValue(cards) === 21
}

// ─── Suit SVG symbols ────────────────────────────────────────────────────────

function SuitSymbol({ suit, size = 14 }: { suit: Suit; size?: number }) {
  const color = suit === "hearts" || suit === "diamonds" ? "#dc2626" : "#1e293b"
  if (suit === "spades") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2 C12 2 3 9 3 15 C3 18.3 5.7 21 9 21 C9 21 8 21.5 7 23 L17 23 C16 21.5 15 21 15 21 C18.3 21 21 18.3 21 15 C21 9 12 2 12 2Z" />
    </svg>
  )
  if (suit === "hearts") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 21 C12 21 3 14 3 8.5 C3 5.4 5.4 3 8.5 3 C10.2 3 11.7 3.8 12 5 C12.3 3.8 13.8 3 15.5 3 C18.6 3 21 5.4 21 8.5 C21 14 12 21 12 21Z" />
    </svg>
  )
  if (suit === "diamonds") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2 L22 12 L12 22 L2 12 Z" />
    </svg>
  )
  // clubs
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="12" cy="8" r="4" />
      <circle cx="7" cy="14" r="4" />
      <circle cx="17" cy="14" r="4" />
      <rect x="10" y="16" width="4" height="6" />
    </svg>
  )
}

// ─── Playing Card component ──────────────────────────────────────────────────

function PlayingCard({ card, small = false }: { card: Card; small?: boolean }) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds"
  const w = small ? 56 : 72
  const h = small ? 80 : 104

  if (card.faceDown) {
    return (
      <div
        className="rounded-lg flex-shrink-0 select-none shadow-xl"
        style={{
          width: w, height: h,
          background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)",
          border: "2px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <div
          className="w-full h-full rounded-md"
          style={{
            background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 8px)",
          }}
        />
      </div>
    )
  }

  const suitSize = small ? 11 : 14
  const rankSize = small ? "text-xs" : "text-sm"
  const centerSize = small ? 22 : 30

  return (
    <div
      className="rounded-lg flex-shrink-0 select-none relative shadow-xl flex flex-col justify-between"
      style={{
        width: w, height: h,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "2px solid rgba(0,0,0,0.12)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.8) inset",
        padding: small ? "3px" : "5px",
        color: isRed ? "#dc2626" : "#0f172a",
      }}
    >
      {/* Top-left */}
      <div className="flex flex-col items-start leading-none">
        <span className={`font-black leading-none ${rankSize}`} style={{ fontSize: small ? 11 : 14 }}>{card.rank}</span>
        <SuitSymbol suit={card.suit} size={suitSize} />
      </div>

      {/* Center symbol */}
      <div className="flex items-center justify-center">
        <SuitSymbol suit={card.suit} size={centerSize} />
      </div>

      {/* Bottom-right (rotated) */}
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className={`font-black leading-none ${rankSize}`} style={{ fontSize: small ? 11 : 14 }}>{card.rank}</span>
        <SuitSymbol suit={card.suit} size={suitSize} />
      </div>
    </div>
  )
}

// ─── Audio ───────────────────────────────────────────────────────────────────

function playBJSound(ctx: AudioContext, type: "deal" | "hit" | "win" | "lose" | "push" | "blackjack") {
  const t = ctx.currentTime
  if (type === "deal" || type === "hit") {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(type === "deal" ? 440 : 520, t)
    osc.frequency.exponentialRampToValueAtTime(type === "deal" ? 350 : 400, t + 0.08)
    g.gain.setValueAtTime(0.15, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
    osc.connect(g); g.connect(ctx.destination)
    osc.start(t); osc.stop(t + 0.1)
  } else if (type === "win") {
    [0, 0.1, 0.2].forEach((d, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = [523, 659, 784][i]
      g.gain.setValueAtTime(0.2, t + d)
      g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.25)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(t + d); osc.stop(t + d + 0.3)
    })
  } else if (type === "blackjack") {
    [0, 0.08, 0.16, 0.28].forEach((d, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = [523, 659, 784, 1047][i]
      g.gain.setValueAtTime(0.22, t + d)
      g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.3)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(t + d); osc.stop(t + d + 0.35)
    })
  } else if (type === "lose") {
    [0, 0.12].forEach((d, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = "sawtooth"
      osc.frequency.value = [220, 180][i]
      g.gain.setValueAtTime(0.18, t + d)
      g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.22)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(t + d); osc.stop(t + d + 0.25)
    })
  } else if (type === "push") {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = 440
    g.gain.setValueAtTime(0.15, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
    osc.connect(g); g.connect(ctx.destination)
    osc.start(t); osc.stop(t + 0.35)
  }
}

// ─── Game state types ─────────────────────────────────────────────────────────

type GamePhase = "idle" | "betting" | "player" | "dealer" | "done"
type Outcome = "win" | "blackjack" | "lose" | "push" | "bust" | null

export default function BlackjackPage() {
  const { credits, setCredits, isLoaded, trackWager } = useCredits()
  const [bet, setBet] = useState(50)
  const [tempBet, setTempBet] = useState("50")
  const [phase, setPhase] = useState<GamePhase>("idle")
  const [deck, setDeck] = useState<Card[]>([])
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [splitHands, setSplitHands] = useState<Card[][] | null>(null)
  const [activeHand, setActiveHand] = useState(0)
  const [outcome, setOutcome] = useState<Outcome>(null)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [dealerRevealed, setDealerRevealed] = useState(false)
  // Only show flash overlay after game has started to prevent initial green screen
  const [gameStarted, setGameStarted] = useState(false)
  const [flash, setFlash] = useState<"green" | "red" | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const deckRef = useRef<Card[]>([])

  function getAudio() {
    if (!audioCtx.current) audioCtx.current = new AudioContext()
    return audioCtx.current
  }

  function draw(d: Card[]): [Card, Card[]] {
    const [card, ...rest] = d
    return [card, rest]
  }

  const deal = useCallback(async () => {
    const parsed = parseInt(tempBet) || 0
    if (parsed < 1 || parsed > credits) return
    setBet(parsed)
    setCredits(c => c - parsed)
    trackWager(parsed)
    setOutcome(null)
    setOutcomes([])
    setSplitHands(null)
    setActiveHand(0)
    setDealerRevealed(false)
    setFlash(null)
    setGameStarted(true)

    const freshDeck = buildDeck()
    const ctx2 = getAudio()

    // Deal 4 cards: P1, D1, P2, D2(facedown)
    let d = freshDeck
    let p1: Card, d1: Card, p2: Card, d2: Card
    ;[p1, d] = draw(d)
    ;[d1, d] = draw(d)
    ;[p2, d] = draw(d)
    ;[d2, d] = draw(d)
    d2 = { ...d2, faceDown: true }

    deckRef.current = d
    setDeck(d)

    // Animate deal with delays
    setPlayerHand([p1])
    setDealerHand([d1])
    playBJSound(ctx2, "deal")
    await new Promise(r => setTimeout(r, 250))
    setPlayerHand([p1, p2])
    setDealerHand([d1, d2])
    playBJSound(ctx2, "deal")

    const playerCards = [p1, p2]
    const dealerCards = [d1, d2]

    // Check natural blackjack
    if (isBlackjack(playerCards)) {
      playBJSound(ctx2, "blackjack")
      await new Promise(r => setTimeout(r, 400))
      // Reveal dealer
      const revealed = [d1, { ...d2, faceDown: false }]
      setDealerHand(revealed)
      setDealerRevealed(true)

      if (isBlackjack(dealerCards)) {
        setOutcome("push")
        setCredits(c => c + parsed)
        playBJSound(ctx2, "push")
      } else {
        setOutcome("blackjack")
        setCredits(c => c + Math.floor(parsed * 2.5))
        setFlash("green")
        setTimeout(() => setFlash(null), 600)
      }
      setPhase("done")
      return
    }

    setPhase("player")
  }, [tempBet, credits])

  const hit = useCallback(async () => {
    if (phase !== "player") return
    const ctx2 = getAudio()
    const d = deckRef.current

    let currentHands = splitHands ? splitHands : [playerHand]
    const [newCard, remaining] = draw(d)
    playBJSound(ctx2, "hit")
    deckRef.current = remaining
    setDeck(remaining)

    currentHands = currentHands.map((h, i) => i === activeHand ? [...h, newCard] : h)

    if (splitHands) {
      setSplitHands(currentHands)
    } else {
      setPlayerHand(currentHands[0])
    }

    const newVal = fullHandValue(currentHands[activeHand])
    if (newVal > 21) {
      // Bust this hand
      if (splitHands && activeHand === 0) {
        setActiveHand(1)
      } else {
        // All hands done — go to dealer
        await dealerPlay(currentHands, remaining)
      }
    }
  }, [phase, playerHand, splitHands, activeHand, dealerHand])

  const stand = useCallback(async () => {
    if (phase !== "player") return
    if (splitHands && activeHand === 0) {
      setActiveHand(1)
      return
    }
    const currentHands = splitHands ? splitHands : [playerHand]
    await dealerPlay(currentHands, deckRef.current)
  }, [phase, playerHand, splitHands, activeHand])

  const dealerPlay = useCallback(async (playerHands: Card[][], remainingDeck: Card[]) => {
    setPhase("dealer")
    const ctx2 = getAudio()
    let d = remainingDeck

    // Reveal hole card
    const revealed = dealerHand.map(c => ({ ...c, faceDown: false }))
    setDealerHand(revealed)
    setDealerRevealed(true)
    await new Promise(r => setTimeout(r, 500))

    let currentDealer = revealed
    // Dealer draws to 17+
    while (fullHandValue(currentDealer) < 17) {
      const [newCard, remaining] = draw(d)
      d = remaining
      currentDealer = [...currentDealer, newCard]
      playBJSound(ctx2, "deal")
      setDealerHand([...currentDealer])
      await new Promise(r => setTimeout(r, 500))
    }

    const dealerVal = fullHandValue(currentDealer)
    const newOutcomes: Outcome[] = []
    let totalWin = 0

    for (const hand of playerHands) {
      const pVal = fullHandValue(hand)
      let o: Outcome
      if (pVal > 21) {
        o = "bust"
      } else if (dealerVal > 21 || pVal > dealerVal) {
        o = "win"
        totalWin += bet * 2
      } else if (pVal === dealerVal) {
        o = "push"
        totalWin += bet
      } else {
        o = "lose"
      }
      newOutcomes.push(o)
    }

    setOutcomes(newOutcomes)
    setOutcome(newOutcomes[0])
    if (totalWin > 0) setCredits(c => c + totalWin)

    const anyWin = newOutcomes.some(o => o === "win" || o === "blackjack")
    const allLose = newOutcomes.every(o => o === "lose" || o === "bust")
    if (anyWin) { playBJSound(ctx2, "win"); setFlash("green"); setTimeout(() => setFlash(null), 600) }
    else if (allLose) { playBJSound(ctx2, "lose"); setFlash("red"); setTimeout(() => setFlash(null), 600) }
    else playBJSound(ctx2, "push")

    setPhase("done")
  }, [dealerHand, bet])

  const doubleDown = useCallback(async () => {
    if (phase !== "player") return
    if (credits < bet) return
    setCredits(c => c - bet)
    trackWager(bet)
    setBet(b => b * 2)
    const ctx2 = getAudio()
    const [newCard, remaining] = draw(deckRef.current)
    playBJSound(ctx2, "hit")
    deckRef.current = remaining
    const newHand = [...playerHand, newCard]
    setPlayerHand(newHand)
    await new Promise(r => setTimeout(r, 300))
    await dealerPlay([newHand], remaining)
  }, [phase, credits, bet, playerHand, dealerPlay])

  const splitHand = useCallback(() => {
    if (phase !== "player") return
    if (playerHand.length !== 2) return
    if (cardValue(playerHand[0].rank) !== cardValue(playerHand[1].rank)) return
    if (credits < bet) return
    setCredits(c => c - bet)
    trackWager(bet)
    setSplitHands([[playerHand[0]], [playerHand[1]]])
    setActiveHand(0)
  }, [phase, playerHand, credits, bet])

  const resetGame = () => {
    setPhase("idle")
    setPlayerHand([])
    setDealerHand([])
    setSplitHands(null)
    setActiveHand(0)
    setOutcome(null)
    setOutcomes([])
    setFlash(null)
    setDealerRevealed(false)
  }

  const pv = splitHands ? fullHandValue(splitHands[activeHand]) : fullHandValue(playerHand)
  const dv = dealerRevealed ? fullHandValue(dealerHand) : handValue(dealerHand)

  const canSplit = phase === "player" && !splitHands && playerHand.length === 2
    && cardValue(playerHand[0].rank) === cardValue(playerHand[1].rank) && credits >= bet
  const canDouble = phase === "player" && !splitHands && playerHand.length === 2 && credits >= bet

  const outcomeLabel: Record<NonNullable<Outcome>, { text: string; color: string }> = {
    win:       { text: "You Win!", color: "#4ade80" },
    blackjack: { text: "Blackjack!", color: "#fbbf24" },
    lose:      { text: "Dealer Wins", color: "#f87171" },
    push:      { text: "Push — Tie", color: "#94a3b8" },
    bust:      { text: "Bust!", color: "#f87171" },
  }

  const currentHands = splitHands ?? (playerHand.length > 0 ? [playerHand] : [])

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "#0a2212" }}>
      {/* Felt table texture */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 50% 50%, #0f3d1e 0%, #071a0d 100%)",
        }} />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 24px)",
        }} />
      </div>

      {/* Flash overlay */}
      {flash && (
        <div className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-300 ${flash === "green" ? "bg-green-500/15" : "bg-red-500/20"}`} />
      )}

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-green-300/60 hover:text-green-200 text-sm font-medium transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Blackjack</h1>
          <div className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-black/30 px-3 py-1.5">
            <Coins size={14} className="text-yellow-400" />
            <span className="font-bold text-white text-sm">{isLoaded ? credits.toLocaleString() : "Loading..."}</span>
          </div>
        </div>

        {/* Table arc decoration */}
        <div className="relative mb-4">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
        </div>

        {/* Dealer area */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-bold text-green-300/70 uppercase tracking-widest">Dealer</span>
            {dealerHand.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-black/40 text-sm font-black text-white border border-white/10">
                {dealerRevealed ? dv : `${dv} + ?`}
              </span>
            )}
            {dealerRevealed && dv > 21 && (
              <span className="text-red-400 font-bold text-sm">BUST!</span>
            )}
          </div>
          <div className="flex gap-2 min-h-[108px] items-end">
            {dealerHand.map((card, i) => (
              <div key={i} className="transition-all" style={{ animation: `slideDown 0.3s ease-out ${i * 0.1}s both` }}>
                <PlayingCard card={card} />
              </div>
            ))}
            {dealerHand.length === 0 && (
              <div className="w-[72px] h-[104px] rounded-lg border-2 border-dashed border-green-700/30 opacity-40" />
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-green-600/20 to-transparent my-4" />

        {/* Player hands */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-bold text-green-300/70 uppercase tracking-widest">You</span>
            {currentHands.map((hand, i) => (
              <span key={i} className={`px-2 py-0.5 rounded text-sm font-black border ${
                splitHands && i === activeHand
                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                  : "bg-black/40 text-white border-white/10"
              }`}>
                {fullHandValue(hand)}{fullHandValue(hand) > 21 ? " BUST" : ""}
              </span>
            ))}
          </div>

          {splitHands ? (
            <div className="flex gap-6">
              {splitHands.map((hand, hi) => (
                <div key={hi} className={`flex gap-2 p-3 rounded-xl border transition-all ${
                  hi === activeHand && phase === "player"
                    ? "border-yellow-500/50 bg-yellow-900/10"
                    : "border-transparent"
                }`}>
                  {hand.map((card, ci) => (
                    <div key={ci} style={{ animation: `slideUp 0.3s ease-out both` }}>
                      <PlayingCard card={card} />
                    </div>
                  ))}
                  {outcomes[hi] && (
                    <div className="flex items-center ml-2">
                      <span className="font-black text-sm" style={{ color: outcomeLabel[outcomes[hi]!].color }}>
                        {outcomeLabel[outcomes[hi]!].text}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 min-h-[108px] items-end">
              {playerHand.map((card, i) => (
                <div key={i} style={{ animation: `slideUp 0.3s ease-out ${i * 0.1}s both` }}>
                  <PlayingCard card={card} />
                </div>
              ))}
              {playerHand.length === 0 && (
                <div className="w-[72px] h-[104px] rounded-lg border-2 border-dashed border-green-700/30 opacity-40" />
              )}
            </div>
          )}
        </div>

        {/* Result banner */}
        {phase === "done" && outcome && !splitHands && (
          <div className="mb-5 rounded-xl p-4 text-center border"
            style={{
              borderColor: outcomeLabel[outcome].color + "44",
              background: outcomeLabel[outcome].color + "15",
              animation: "bounceIn 0.35s ease-out forwards",
            }}
          >
            <p className="text-2xl font-black" style={{ color: outcomeLabel[outcome].color }}>
              {outcomeLabel[outcome].text}
            </p>
            {(outcome === "win" || outcome === "blackjack") && (
              <p className="text-sm text-green-400/80 mt-1">
                +{outcome === "blackjack" ? Math.floor(bet * 1.5) : bet} credits
              </p>
            )}
          </div>
        )}

        {/* Bet & Controls */}
        <div className="rounded-xl border border-green-900/40 bg-black/30 p-4">
          {phase === "idle" || phase === "done" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest text-green-300/50 font-semibold mb-1.5">Bet</p>
                  <input
                    type="number"
                    value={tempBet}
                    onChange={e => setTempBet(e.target.value)}
                    className="w-full rounded-lg bg-black/40 border border-green-900/40 px-3 py-2 text-white font-bold text-lg focus:outline-none focus:border-green-500 transition-colors"
                    min={1}
                    max={credits}
                  />
                </div>
                <div className="flex gap-1.5 mt-5">
                  {[10, 25, 50, 100, 500].map(v => (
                    <button key={v} onClick={() => setTempBet(String(v))}
                      className="rounded-lg bg-green-900/30 hover:bg-green-800/40 border border-green-800/40 text-green-300 text-xs font-bold px-2 py-1.5 transition-all">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={phase === "idle" ? deal : () => { resetGame(); setTimeout(deal, 50) }}
                disabled={(parseInt(tempBet) || 0) < 1 || (parseInt(tempBet) || 0) > credits}
                className="w-full rounded-xl py-3.5 font-black text-lg text-white transition-all shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#166534", boxShadow: "0 4px 20px rgba(22,101,52,0.5)" }}
              >
                {phase === "done" ? <span className="flex items-center justify-center gap-2"><RotateCcw size={18} /> Deal Again</span> : "Deal"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={hit}
                disabled={phase !== "player"}
                className="flex-1 rounded-xl py-3 font-black text-base text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: "#166534", boxShadow: "0 2px 12px rgba(22,101,52,0.4)" }}
              >
                Hit
              </button>
              <button
                onClick={stand}
                disabled={phase !== "player"}
                className="flex-1 rounded-xl py-3 font-black text-base text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: "#991b1b", boxShadow: "0 2px 12px rgba(153,27,27,0.4)" }}
              >
                Stand
              </button>
              {canDouble && (
                <button
                  onClick={doubleDown}
                  disabled={phase !== "player"}
                  className="flex-1 rounded-xl py-3 font-black text-base text-white transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: "#1e40af", boxShadow: "0 2px 12px rgba(30,64,175,0.4)" }}
                >
                  Double
                </button>
              )}
              {canSplit && (
                <button
                  onClick={splitHand}
                  className="flex-1 rounded-xl py-3 font-black text-base text-white transition-all active:scale-95"
                  style={{ background: "#92400e", boxShadow: "0 2px 12px rgba(146,64,14,0.4)" }}
                >
                  Split
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bet display during play */}
        {phase !== "idle" && (
          <div className="mt-3 text-center">
            <span className="text-sm text-green-300/50">Current bet: </span>
            <span className="text-sm font-bold text-yellow-400">{bet.toLocaleString()} credits</span>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounceIn {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

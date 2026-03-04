"use client"

import Link from "next/link"

const modes = [
  {
    label: "Battles",
    href: "/battles",
    description: "Fight head-to-head in intense PvP combat",
    color: "from-red-900/40 to-red-800/10",
    border: "border-red-700/40 hover:border-red-500/70",
    glow: "hover:shadow-red-500/20",
    iconColor: "text-red-400",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
        {/* Left sword */}
        <g transform="rotate(-35, 32, 32)">
          <rect x="30" y="6" width="4" height="36" rx="2" fill="currentColor" opacity="0.9" />
          <polygon points="32,2 29,10 35,10" fill="currentColor" />
          <rect x="24" y="38" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
          <rect x="29" y="41" width="6" height="10" rx="1.5" fill="currentColor" opacity="0.6" />
        </g>
        {/* Right sword (mirrored) */}
        <g transform="rotate(35, 32, 32) scale(-1,1) translate(-64,0)">
          <rect x="30" y="6" width="4" height="36" rx="2" fill="currentColor" opacity="0.9" />
          <polygon points="32,2 29,10 35,10" fill="currentColor" />
          <rect x="24" y="38" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
          <rect x="29" y="41" width="6" height="10" rx="1.5" fill="currentColor" opacity="0.6" />
        </g>
      </svg>
    ),
  },
  {
    label: "Towers",
    href: "/towers",
    description: "Build and defend your ultimate tower",
    color: "from-blue-900/40 to-blue-800/10",
    border: "border-blue-700/40 hover:border-blue-500/70",
    glow: "hover:shadow-blue-500/20",
    iconColor: "text-blue-400",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
        {/* Main tower */}
        <rect x="22" y="16" width="20" height="40" rx="1" fill="currentColor" opacity="0.85" />
        {/* Tower top battlements */}
        <rect x="20" y="10" width="6" height="8" rx="1" fill="currentColor" opacity="0.9" />
        <rect x="29" y="8" width="6" height="10" rx="1" fill="currentColor" />
        <rect x="38" y="10" width="6" height="8" rx="1" fill="currentColor" opacity="0.9" />
        {/* Door */}
        <rect x="28" y="42" width="8" height="14" rx="4" fill="#0d0d1a" opacity="0.7" />
        {/* Windows */}
        <rect x="26" y="24" width="5" height="6" rx="1" fill="#0d0d1a" opacity="0.6" />
        <rect x="33" y="24" width="5" height="6" rx="1" fill="#0d0d1a" opacity="0.6" />
        <rect x="26" y="34" width="5" height="5" rx="1" fill="#0d0d1a" opacity="0.5" />
        <rect x="33" y="34" width="5" height="5" rx="1" fill="#0d0d1a" opacity="0.5" />
        {/* Side towers */}
        <rect x="10" y="28" width="13" height="28" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="8" y="23" width="5" height="7" rx="1" fill="currentColor" opacity="0.65" />
        <rect x="14" y="21" width="5" height="9" rx="1" fill="currentColor" opacity="0.65" />
        <rect x="41" y="28" width="13" height="28" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="51" y="23" width="5" height="7" rx="1" fill="currentColor" opacity="0.65" />
        <rect x="45" y="21" width="5" height="9" rx="1" fill="currentColor" opacity="0.65" />
      </svg>
    ),
  },
  {
    label: "Blackjack",
    href: "/blackjack",
    description: "Beat the dealer. Hit 21 and win big",
    color: "from-emerald-900/40 to-emerald-800/10",
    border: "border-emerald-700/40 hover:border-emerald-500/70",
    glow: "hover:shadow-emerald-500/20",
    iconColor: "text-emerald-400",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
        {/* Back card */}
        <rect x="22" y="12" width="32" height="44" rx="4" fill="#1e3a2f" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        {/* Front card */}
        <rect x="10" y="16" width="32" height="44" rx="4" fill="#f8fafc" stroke="currentColor" strokeWidth="1.5" />
        {/* Suit top-left */}
        <text x="15" y="30" fontFamily="serif" fontSize="11" fill="#dc2626" fontWeight="bold">A</text>
        <text x="15" y="41" fontFamily="serif" fontSize="9" fill="#dc2626">♠</text>
        {/* Center spade */}
        <text x="22" y="44" fontFamily="serif" fontSize="18" fill="#1e293b" textAnchor="middle">♠</text>
        {/* Bottom-right (rotated) */}
        <text x="36" y="54" fontFamily="serif" fontSize="11" fill="#dc2626" fontWeight="bold" transform="rotate(180, 36, 54)">A</text>
        <text x="36" y="43" fontFamily="serif" fontSize="9" fill="#dc2626" transform="rotate(180, 36, 43)">♠</text>
      </svg>
    ),
  },
  {
    label: "Upgrade",
    href: "/upgrade",
    description: "Gamble your items for a chance at rare upgrades",
    color: "from-amber-900/40 to-amber-800/10",
    border: "border-amber-700/40 hover:border-amber-500/70",
    glow: "hover:shadow-amber-500/20",
    iconColor: "text-amber-400",
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
        {/* Center up arrow */}
        <polygon points="32,6 44,26 36,26 36,58 28,58 28,26 20,26" fill="currentColor" opacity="0.9" />
        {/* Left arrow */}
        <polygon points="12,18 21,32 17,32 17,52 7,52 7,32 3,32" fill="currentColor" opacity="0.55" />
        {/* Right arrow */}
        <polygon points="52,18 61,32 57,32 57,52 47,52 47,32 43,32" fill="currentColor" opacity="0.55" />
        {/* Sparkle dots */}
        <circle cx="32" cy="4" r="2" fill="currentColor" opacity="0.5" />
        <circle cx="24" cy="8" r="1.5" fill="currentColor" opacity="0.35" />
        <circle cx="40" cy="8" r="1.5" fill="currentColor" opacity="0.35" />
      </svg>
    ),
  },
]

export default function GameModes() {
  return (
    <section className="flex flex-col items-center gap-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight text-balance">
          Choose Your Mode
        </h1>
        <p className="text-slate-400 text-lg text-pretty max-w-lg mx-auto">
          Pick a game, place your bets, and rise to the top.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
        {modes.map(({ label, href, description, color, border, glow, iconColor, icon }) => (
          <Link
            key={label}
            href={href}
            className={`
              group flex flex-col items-center gap-5 rounded-2xl border p-8
              bg-gradient-to-b ${color} ${border}
              shadow-xl ${glow} hover:shadow-2xl
              transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02]
              cursor-pointer
            `}
          >
            <div className={`${iconColor} transition-transform duration-300 group-hover:scale-110`}>
              {icon}
            </div>
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-wide">{label}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
            <span className={`mt-auto text-xs font-semibold uppercase tracking-widest ${iconColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
              Play Now &rarr;
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

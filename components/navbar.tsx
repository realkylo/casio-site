"use client"

import Link from "next/link"
import Image from "next/image"
import { Coins, Home, Menu, X, Swords, TowerControl, Spade, TrendingUp } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useCredits } from "@/lib/credits-context"

const navLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Battles", href: "/battles", icon: Swords },
  { label: "Towers", href: "/towers", icon: TowerControl },
  { label: "Blackjack", href: "/blackjack", icon: Spade },
  { label: "Upgrade", href: "/upgrade", icon: TrendingUp },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { credits: userCredits, isLoaded } = useCredits()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2a2a3a] bg-[#0d0d1a]/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* LEFT — Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/spamme-logo.png"
            alt="SPAM.ME"
            width={52}
            height={52}
            className="object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* CENTER — Nav Links (desktop) */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <Link
                href={href}
                className="relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-300 rounded-lg transition-all hover:text-white hover:bg-white/5"
              >
                <Icon size={16} className="opacity-70" />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* RIGHT — Credits + Discord Login */}
        <div className="hidden md:flex items-center gap-3">
          {/* Credits badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5">
            <Coins size={14} className="text-yellow-400" />
            <span className="text-sm font-semibold text-white">
              {isLoaded ? userCredits.toLocaleString() : "Loading..."}
            </span>
            <span className="text-xs text-slate-400 font-medium">credits</span>
          </div>

          {/* Discord Login Button */}
          <button
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-[#5865F2]/25"
            style={{ backgroundColor: "#5865F2" }}
            aria-label="Login with Discord"
          >
            <Image
              src="/discord-logo.jpg"
              alt="Discord"
              width={20}
              height={20}
              className="rounded-sm object-cover"
            />
            <span>Login</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#2a2a3a] bg-[#0d0d1a] px-4 py-4 space-y-2">
          {navLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={16} className="opacity-70" />
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#2a2a3a] flex flex-col gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 w-fit">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-sm font-semibold text-white">
                {isLoaded ? userCredits.toLocaleString() : "Loading..."}
              </span>
              <span className="text-xs text-slate-400 font-medium">credits</span>
            </div>
            <button
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white w-fit"
              style={{ backgroundColor: "#5865F2" }}
            >
              <Image
                src="/discord-logo.jpg"
                alt="Discord"
                width={20}
                height={20}
                className="rounded-sm object-cover"
              />
              <span>Login</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

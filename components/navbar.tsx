"use client"

import Link from "next/link"
import Image from "next/image"
import { Coins, Home, Menu, X, Swords, TowerControl, Spade, TrendingUp, LogOut } from "lucide-react"
import { useState } from "react"
import { useCredits } from "@/lib/credits-context"
import { useAuth } from "@/lib/auth-context"

const navLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Battles", href: "/battles", icon: Swords },
  { label: "Towers", href: "/towers", icon: TowerControl },
  { label: "Blackjack", href: "/blackjack", icon: Spade },
  { label: "Upgrade", href: "/upgrade", icon: TrendingUp },
]

function getAvatarUrl(userId: string, avatar: string | null) {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=64`
  }
  // Default Discord avatar
  const index = (BigInt(userId) >> BigInt(22)) % BigInt(6)
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { credits: userCredits, isLoaded } = useCredits()
  const { user, isLoading: authLoading, login, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2a2a3a] bg-[#0d0d1a]/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* LEFT -- Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/spamme-logo.png"
            alt="SPAM.ME"
            width={52}
            height={52}
            className="object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* CENTER -- Nav Links (desktop) */}
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

        {/* RIGHT -- Credits + Auth */}
        <div className="hidden md:flex items-center gap-3">
          {/* Credits badge - only show when logged in */}
          {user && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-sm font-semibold text-white">
                {isLoaded ? userCredits.toLocaleString() : "..."}
              </span>
              <span className="text-xs text-slate-400 font-medium">credits</span>
            </div>
          )}

          {/* Auth section */}
          {authLoading ? (
            <div className="h-9 w-24 rounded-lg bg-white/5 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 transition-all hover:bg-white/10"
              >
                <img
                  src={getAvatarUrl(user.id, user.avatar)}
                  alt={user.global_name || user.username}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-white max-w-[100px] truncate">
                  {user.global_name || user.username}
                </span>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-[#2a2a3a] bg-[#161625] shadow-2xl shadow-black/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#2a2a3a]">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.global_name || user.username}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        Discord ID: {user.id}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Coins size={12} className="text-yellow-400" />
                        <span className="text-xs font-semibold text-yellow-300">
                          {isLoaded ? userCredits.toLocaleString() : "..."} credits
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setShowUserMenu(false)
                        await logout()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={14} />
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={login}
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
          )}
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
            {user && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 w-fit">
                <Coins size={14} className="text-yellow-400" />
                <span className="text-sm font-semibold text-white">
                  {isLoaded ? userCredits.toLocaleString() : "..."}
                </span>
                <span className="text-xs text-slate-400 font-medium">credits</span>
              </div>
            )}

            {authLoading ? (
              <div className="h-9 w-24 rounded-lg bg-white/5 animate-pulse" />
            ) : user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={getAvatarUrl(user.id, user.avatar)}
                    alt={user.global_name || user.username}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium text-white">
                    {user.global_name || user.username}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    setMobileOpen(false)
                    await logout()
                  }}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false)
                  login()
                }}
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
            )}
          </div>
        </div>
      )}
    </header>
  )
}

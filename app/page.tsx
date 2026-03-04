import Navbar from "@/components/navbar"
import GameModes from "@/components/game-modes"
import PromoCode from "@/components/promo-code"

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0d0d1a]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <GameModes />
        <section className="mt-16 flex justify-center">
          <div className="w-full max-w-md">
            <PromoCode />
          </div>
        </section>
      </main>
    </div>
  )
}

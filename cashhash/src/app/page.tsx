import Link from "next/link";

export default function Home() {
  return (
    <div className="relative">
      {/* background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* hero */}
      <section className="py-10 md:py-16">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> On Hedera • Secure with HashPack
          </div>
          <h1 className="mt-4 text-4xl md:text-6xl font-semibold leading-tight">
            Unlock <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">$2.5T</span> real‑world trade liquidity
          </h1>
          <p className="mt-4 text-white/70 max-w-2xl">
            CashHash adalah marketplace receivable financing di atas Hedera. Supplier mengunggah invoice, investor mendanai, dan settlement terjadi saat buyer membayar — semua tercatat transparan.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link href="/invoices" className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600">Launch App</Link>
            <a href="#how-it-works" className="px-4 py-2 rounded border border-white/10 hover:border-white/20">How it works</a>
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded border border-white/10 bg-white/5 p-4">
          <div className="text-2xl font-semibold">$2.5T+</div>
          <div className="text-xs text-white/60">Trade finance gap</div>
        </div>
        <div className="rounded border border-white/10 bg-white/5 p-4">
          <div className="text-2xl font-semibold">Minutes</div>
          <div className="text-xs text-white/60">Listing → Funding</div>
        </div>
        <div className="rounded border border-white/10 bg-white/5 p-4">
          <div className="text-2xl font-semibold">On‑chain</div>
          <div className="text-xs text-white/60">Events & audit trail</div>
        </div>
        <div className="rounded border border-white/10 bg-white/5 p-4">
          <div className="text-2xl font-semibold">HashPack</div>
          <div className="text-xs text-white/60">Secure wallet connect</div>
        </div>
      </section>

      {/* how it works */}
      <section id="how-it-works" className="mt-12 space-y-6">
        <h2 className="text-2xl md:text-3xl font-semibold">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded border border-white/10 bg-white/5 p-4">
            <div className="text-xl">1. Supplier</div>
            <p className="text-sm text-white/70">Unggah invoice (PDF) dan detail. Sistem menerbitkan listing.</p>
          </div>
          <div className="rounded border border-white/10 bg-white/5 p-4">
            <div className="text-xl">2. Tokenize</div>
            <p className="text-sm text-white/70">Invoice ditokenisasi (FT/units). Siap untuk didanai investor.</p>
          </div>
          <div className="rounded border border-white/10 bg-white/5 p-4">
            <div className="text-xl">3. Invest</div>
            <p className="text-sm text-white/70">Investor connect HashPack, pilih amount, konfirmasi transaksi.</p>
          </div>
          <div className="rounded border border-white/10 bg-white/5 p-4">
            <div className="text-xl">4. Settle</div>
            <p className="text-sm text-white/70">Saat buyer membayar, dana didistribusikan ke investor otomatis.</p>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="mt-12 space-y-6">
        <h2 className="text-2xl md:text-3xl font-semibold">Why CashHash</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded border border-white/10 bg-white/5 p-6">
            <div className="font-medium mb-1">Tokenized Invoices</div>
            <p className="text-sm text-white/70">Representasi on‑chain memudahkan fractional investment & settlement.</p>
          </div>
          <div className="rounded border border-white/10 bg-white/5 p-6">
            <div className="font-medium mb-1">Instant Liquidity</div>
            <p className="text-sm text-white/70">Listing → investasi dalam hitungan menit, bukan minggu.</p>
          </div>
          <div className="rounded border border-white/10 bg-white/5 p-6">
            <div className="font-medium mb-1">Auditable Events</div>
            <p className="text-sm text-white/70">Semua perubahan terekam sebagai event agar mudah diaudit.</p>
          </div>
        </div>
      </section>

      {/* cta */}
      <section className="mt-12">
        <div className="rounded-xl border border-white/10 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xl font-semibold">Siap mulai membiayai real‑world trade?</div>
              <div className="text-sm text-white/70">Unggah invoice pertama Anda atau jelajahi peluang investasi.</div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/invoices" className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600">Go to Invoices</Link>
              <Link href="/events" className="px-4 py-2 rounded border border-white/10 hover:border-white/20">View Events</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

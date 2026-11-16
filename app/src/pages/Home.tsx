import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader, ErrorNote, ModeTabs, SectionTitle, ShareSheet, Shell, Spinner } from '../components/ui'
import { api, inr, walletBalance } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import { MODE_LABEL, type Product } from '../lib/types'

const GRID_TITLE = { pre_school: 'Pre-School Kits', pro_school: 'Pro-School Courses', school: 'School Programs' } as const

export default function Home() {
  const { mode, profile, settings } = useSession()
  const [products, loading, , err] = useLoad(() => api.listProducts(), [])
  const [orders] = useLoad(() => api.listMyOrders(), [])
  const [wallet] = useLoad(() => api.listWallet(), [])
  const [share, setShare] = useState<Product | null>(null)

  const list = (products ?? []).filter((p) => p.mode === mode && p.active)
  const featured = list.filter((p) => p.is_featured)
  const paid = (orders ?? []).filter((o) => o.status === 'paid')
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const thisMonth = paid.filter((o) => new Date(o.created_at) >= monthStart).reduce((s, o) => s + Number(o.commission_amount), 0)
  const kitNeeded = mode === 'pre_school' && settings.require_partner_kit && profile?.kit_status !== 'paid'

  return (
    <Shell>
      <AppHeader page={`Dashboard • ${MODE_LABEL[mode]}`}>
        <ModeTabs noun="products" />
      </AppHeader>

      <main className="space-y-5 p-4">
        <ErrorNote msg={err} />

        {kitNeeded && (
          <section className="rounded-3xl border border-red-200 bg-gradient-to-b from-red-100 to-red-50 p-4">
            <div className="mb-1 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-500 text-lg text-white">⚠️</span>
              <h2 className="text-lg font-extrabold">{profile?.kit_status === 'pending' ? 'Kit Payment Under Review' : 'Kit Purchase Pending'}</h2>
            </div>
            <p className="mb-3 text-sm text-slate-600">Pay → Delivery → Start selling Pre-School kits</p>
            <div className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">Partner Kit Required</p>
                <p className="text-sm text-slate-500">One-time {inr(settings.partner_kit_price)} — demo kit for showing parents. Needed only for Pre-School products.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip">Mode: PRE</span>
                  <span className="chip">Status: {profile?.kit_status === 'pending' ? 'Under review' : 'Pending'}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Link to="/kit" className="btn-primary">{profile?.kit_status === 'pending' ? 'Details' : 'Pay Now'}</Link>
                <Link to="/kit" className="btn-soft">Check status</Link>
              </div>
            </div>
          </section>
        )}

        {featured.length > 0 && <Carousel items={featured} onShare={setShare} />}

        <section className="card p-4">
          <SectionTitle icon="💰" title="Your Earnings Snapshot" sub="Sales • Wallet • Points (quick view)" />
          <div className="grid grid-cols-3 gap-2.5">
            <Stat icon="📈" label="Total Sales" value={inr(paid.reduce((s, o) => s + Number(o.amount), 0))} to="/orders" />
            <Stat icon="🗓️" label="This Month" value={inr(thisMonth)} hint="commission" to="/wallet" />
            <Stat icon="👛" label="My Wallet" value={inr(walletBalance(wallet ?? []))} to="/wallet" />
          </div>
        </section>

        <section className="card p-4">
          <SectionTitle icon={mode === 'pre_school' ? '🧸' : mode === 'pro_school' ? '💼' : '🏫'} title={GRID_TITLE[mode]} sub="Share your link & earn the commission shown" />
          {loading ? <Spinner /> : (
            <div className="grid grid-cols-2 gap-3">
              {list.map((p) => <ProductCard key={p.id} p={p} onShare={() => setShare(p)} locked={kitNeeded && p.requires_partner_kit} />)}
            </div>
          )}
          {!loading && list.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No products in this section yet.</p>}
        </section>

        <p className="px-2 text-center text-xs text-slate-400">You earn only from sales made through your own link. Commission % is fixed per product and shown before you share.</p>
      </main>
      <ShareSheet product={share} onClose={() => setShare(null)} />
    </Shell>
  )
}

function Stat({ icon, label, value, hint, to }: { icon: string; label: string; value: string; hint?: string; to: string }) {
  return (
    <Link to={to} className="rounded-2xl border border-slate-200 bg-white p-3 transition active:scale-[0.98]">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100">{icon}</span>
      <p className="mt-2 text-xs font-bold text-slate-500">{label}</p>
      <p className="text-base font-extrabold">{value}</p>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </Link>
  )
}

export function ProductCard({ p, onShare, locked }: { p: Product; onShare: () => void; locked?: boolean }) {
  return (
    <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-3.5">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-3xl">{p.emoji}</div>
      <h3 className="text-[15px] font-extrabold leading-snug">{p.title}</h3>
      {p.duration && <p className="text-xs text-slate-500">Duration: {p.duration}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="chip">{inr(p.price)}{p.billing === 'monthly' ? '/mo' : ''}</span>
        <span className="chip !border-emerald-200 !bg-emerald-50 !text-emerald-700">Earn {p.commission_pct}%</span>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
        {locked ? <Link to="/kit" className="btn-soft !px-2 text-xs">🔒 Kit</Link>
          : <button className="btn-primary !px-2" onClick={onShare}>Share</button>}
        <Link to={`/product/${p.slug}`} className="btn-soft !px-2">Open</Link>
      </div>
    </div>
  )
}

function Carousel({ items, onShare }: { items: Product[]; onShare: (p: Product) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  return (
    <section className="card p-4">
      <SectionTitle icon="⭐" title="Start Selling Now" sub="Top products • Tap & share to earn today" />
      <div ref={ref} className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1"
        onScroll={(e) => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / (el.clientWidth * 0.88))) }}>
        {items.map((p) => (
          <div key={p.id} className={`relative flex min-h-[11.5rem] w-[88%] shrink-0 snap-center flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br ${p.banner_gradient ?? 'from-navy-900 to-navy-600'} p-5 text-white`}>
            <span className="absolute right-4 top-3 text-5xl opacity-90 drop-shadow-lg">{p.emoji}</span>
            <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <p className="relative pr-14 pt-10 text-xs font-semibold uppercase tracking-wider text-gold-300">Earn {p.commission_pct}% per sale</p>
            <h3 className="relative line-clamp-2 font-display text-xl font-extrabold leading-tight">{p.title}</h3>
            <p className="relative line-clamp-1 text-sm text-white/80">{p.subtitle}</p>
            <button className="btn-gold relative mt-3 self-start !py-2" onClick={() => onShare(p)}>Start Your Earning →</button>
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((p, i) => <span key={p.id} className={`h-2 rounded-full transition-all ${i === idx ? 'w-5 bg-[var(--accent-to)]' : 'w-2 bg-slate-300'}`} />)}
        </div>
      )}
    </section>
  )
}

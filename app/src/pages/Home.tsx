import { useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandHeader, ErrorNote, PartnerIdChip, ShareSheet, Shell } from '../components/ui'
import { IconArrowRight, IconBolt, IconCart, IconCapFill, IconChart, IconHand, IconSearch, IconShare, IconStar, IconUsers, IconWallet, Trophy } from '../components/icons'
import { api, inr, walletBalance } from '../lib/api'
import { useCan, useLoad, useSession } from '../lib/session'
import type { Product } from '../lib/types'
import { LeaderboardCard } from './Leaderboard'
import { VideoStrip } from '../components/Videos'

export default function Home() {
  const { profile, settings } = useSession()
  const can = useCan()
  const nav = useNavigate()
  const [products, , , err] = useLoad(() => api.listProducts(), [])
  const [orders] = useLoad(() => api.listMyOrders(), [])
  const [wallet] = useLoad(() => api.listWallet(), [])
  const [share, setShare] = useState<Product | null>(null)
  const [q, setQ] = useState('')

  const list = (products ?? []).filter((p) => p.active)
  const featured = list.filter((p) => p.is_featured)
  const banners = featured.length ? featured : list.slice(0, 3)
  const paid = (orders ?? []).filter((o) => o.status === 'paid')
  const totalSales = paid.reduce((s, o) => s + Number(o.amount), 0)
  const upgrade = profile?.role === 'associate'
  const firstName = (profile?.full_name || 'Partner').split(' ')[0]

  return (
    <Shell>
      <BrandHeader />

      <main className="relative -mt-10 space-y-4 px-4">
        {/* greeting + search */}
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-white via-white to-[#eaf0ff] p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
          <div className="flex items-center">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-lg font-semibold text-slate-800">Hello <IconHand size={20} className="text-amber-400" /></p>
              <p className="truncate font-display text-[30px] font-extrabold leading-tight text-[#0f1b4d]">{firstName}</p>
              <div className="mt-2"><PartnerIdChip /></div>
            </div>
            <Trophy className="-my-2 -mr-3 h-[104px] w-[124px] shrink-0" />
          </div>
          <form className="mt-4" role="search" onSubmit={(e) => { e.preventDefault(); nav(`/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`) }}>
            <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-[inset_0_1px_3px_rgba(15,23,42,0.06)]">
              <IconSearch size={22} className="text-slate-700" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses, products, brands..." aria-label="Search"
                className="w-full bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-500" />
            </label>
          </form>
        </section>

        <ErrorNote msg={err} />

        {upgrade && (
          <Link to="/kit" className="flex items-center gap-3 rounded-[24px] border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-[#e2b84a] to-[#c08a2a] text-xl text-white">⭐</span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold text-slate-900">{profile?.kit_status === 'pending' ? 'Partner payment under review' : 'Become a Partner'}</span>
              <span className="block text-sm text-slate-600">One-time {inr(settings.partner_kit_price)} • build your own team + partner kit</span>
            </span>
            <span className="rounded-full bg-[#c08a2a] px-3 py-1.5 text-xs font-bold text-white">{profile?.kit_status === 'pending' ? 'Details' : 'Join'}</span>
          </Link>
        )}

        {banners.length > 0 && <Carousel items={banners} onShare={setShare} />}

        {/* earnings snapshot */}
        <section className="rounded-[26px] bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
          <div className="mb-3.5 flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500"><IconHand size={22} /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[16.5px] font-extrabold leading-tight text-[#0f1b4d]">Your Earnings Snapshot</h2>
              <p className="text-[13px] text-slate-600">Real-time performance</p>
            </div>
            <Link to="/wallet" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[#c9d5f7] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#2347c9]">View Details <IconArrowRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat tone="green" icon={<IconChart size={18} />} label="Total Sales" value={inr(totalSales)} to="/orders" />
            <Stat tone="blue" icon={<IconWallet size={18} />} label="Wallet Balance" value={inr(walletBalance(wallet ?? []))} to="/wallet" />
            <Stat tone="purple" icon={<IconStar size={18} />} label="Reward Points" value={(profile?.points ?? 0).toLocaleString('en-IN')} to="/wallet" />
          </div>
        </section>

        {/* quick actions */}
        <section className="rounded-[26px] bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
          <div className="mb-3.5 flex items-center gap-3">
            <IconBolt size={34} className="text-amber-400" />
            <div>
              <h2 className="text-[19px] font-extrabold leading-tight text-[#0f1b4d]">Quick Actions</h2>
              <p className="text-sm text-slate-600">Do more, earn more</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            <Action to="/products" label="Start Selling" icon={<IconCart size={30} />} cls="from-violet-100 to-violet-50 text-violet-600" />
            <Action to="/products" label="Share Products" icon={<IconShare size={30} />} cls="from-sky-100 to-sky-50 text-[#2b6be0]" />
            {can('learn') && <Action to="/learn" label="My Courses" icon={<IconCapFill size={32} />} cls="from-orange-100 to-amber-50 text-orange-500" />}
            {can('team') && <Action to="/team" label="My Team" icon={<IconUsers size={30} />} cls="from-emerald-100 to-emerald-50 text-emerald-600" />}
          </div>
        </section>

        <VideoStrip />

        {can('leaderboard') && <LeaderboardCard />}

        {can('posters') && <Link to="/posters" className="flex items-center gap-3 rounded-[26px] bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-pink-50 text-2xl">🖼️</span>
          <span className="min-w-0 flex-1"><b className="block text-[16.5px] text-[#0f1b4d]">Ready-to-Share Posters</b><span className="text-[13px] text-slate-600">Posters with your name, number &amp; code</span></span>
          <IconArrowRight size={20} className="text-slate-500" />
        </Link>}

        <p className="px-2 pb-2 text-center text-xs text-slate-400">You earn only from sales made through your own link. Commission % is fixed per product and shown before you share.</p>
      </main>
      <ShareSheet product={share} onClose={() => setShare(null)} />
    </Shell>
  )
}

const TONES = {
  green: { box: 'bg-gradient-to-br from-emerald-50 to-white', icon: 'text-emerald-600' },
  blue: { box: 'bg-gradient-to-br from-sky-50 to-white', icon: 'text-sky-500' },
  purple: { box: 'bg-gradient-to-br from-violet-50 to-white', icon: 'text-violet-500' },
} as const

function Stat({ tone, icon, label, value, to }: { tone: keyof typeof TONES; icon: ReactNode; label: string; value: string; to: string }) {
  const t = TONES[tone]
  return (
    <Link to={to} className={`rounded-2xl border border-slate-100 p-2.5 transition active:scale-[0.98] ${t.box}`}>
      <span className="flex items-center gap-1.5">
        <span className={`shrink-0 ${t.icon}`}>{icon}</span>
        <span className="text-[11px] font-medium leading-tight text-slate-700">{label}</span>
      </span>
      <span className="mt-1 block truncate text-[17px] font-extrabold leading-tight text-[#0f1b4d]">{value}</span>
    </Link>
  )
}

function Action({ to, label, icon, cls }: { to: string; label: string; icon: ReactNode; cls: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5 text-center transition active:scale-95">
      <span className={`grid h-[60px] w-full place-items-center rounded-2xl bg-gradient-to-b ${cls}`}>{icon}</span>
      <span className="text-[12.5px] font-bold leading-tight text-slate-900">{label}</span>
    </Link>
  )
}

/** Splits a title so the last word can be highlighted in gold. */
function splitTitle(t: string) {
  const i = t.lastIndexOf(' ')
  return i > 0 ? [t.slice(0, i + 1), t.slice(i + 1)] : ['', t]
}

function Carousel({ items, onShare }: { items: Product[]; onShare: (p: Product) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [idx, setIdx] = useState(0)
  return (
    <section>
      <div ref={ref} className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto"
        onScroll={(e) => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / el.clientWidth)) }}>
        {items.map((p) => {
          const [head, tail] = splitTitle(p.title)
          return (
            <div key={p.id} className="relative flex min-h-[200px] w-full shrink-0 snap-center flex-col overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1b36a8] via-[#2245c4] to-[#3a5fe0] p-5 text-white">
              <span className="pointer-events-none absolute -bottom-10 right-2 h-32 w-40 rounded-[50%] bg-[#4c6ff0]/50" />
              <span className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/[0.06]" />
              <span className="pointer-events-none absolute bottom-6 right-3 text-[64px] leading-none drop-shadow-[0_8px_12px_rgba(0,0,0,0.35)]">{p.emoji}</span>
              <span className="relative self-start rounded-full bg-gradient-to-r from-gold-300 to-gold-400 px-3 py-1 text-[13px] font-extrabold uppercase tracking-wide text-[#14246b]">Earn {p.commission_pct}% per sale</span>
              <h3 className="relative mt-3 line-clamp-3 pr-14 font-display text-[20px] font-extrabold leading-[1.2]">
                {head}<span className="text-gold-300">{tail}</span>
              </h3>
              {p.subtitle && <p className="relative mt-1 line-clamp-2 pr-24 text-[13px] text-white/90">{p.subtitle}</p>}
              <button className="relative mt-auto inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-[#ffd75e] to-[#f5b82e] px-5 py-2.5 text-[15px] font-extrabold text-[#14246b] shadow-[0_6px_14px_rgba(245,184,46,0.4)] active:scale-95"
                style={{ marginTop: '1rem' }} onClick={() => onShare(p)}>
                Start Your Earning <IconArrowRight size={18} />
              </button>
            </div>
          )
        })}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((p, i) => (
            <button key={p.id} aria-label={`Show slide ${i + 1}`}
              onClick={() => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' })}
              className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-[#2347c9]' : 'w-2 bg-[#c9d3ee]'}`} />
          ))}
        </div>
      )}
    </section>
  )
}

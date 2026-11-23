import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ErrorNote, ShareSheet, Shell, Spinner, SubHeader } from '../components/ui'
import { IconSearch } from '../components/icons'
import { api, inr, partnerLink } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import type { Product } from '../lib/types'

type Cat = 'packages' | 'subscription' | 'ecommerce'
const CATS: { id: Cat; label: string; icon: string; idle: string }[] = [
  { id: 'packages', label: 'Educational Packages', icon: '🦄', idle: 'from-[#efe4ff] to-[#e3e9ff]' },
  { id: 'subscription', label: 'Subscription', icon: '🎓', idle: 'from-[#e3ebff] to-[#d6e2ff]' },
  { id: 'ecommerce', label: 'E-Commerce', icon: '📗', idle: 'from-[#d4f3ef] to-[#bfe9e3]' },
]

/** Monthly billing = Subscription, physical goods = E-Commerce, everything else = Educational Packages. */
export function categoryOf(p: Product): Cat {
  if (p.billing === 'monthly') return 'subscription'
  if (p.is_physical) return 'ecommerce'
  return 'packages'
}

export default function Products() {
  const { profile, settings } = useSession()
  const [qs, setQs] = useSearchParams()
  const q = qs.get('q') ?? ''
  const cat = (qs.get('cat') as Cat | null) ?? 'packages'
  const [products, loading, , err] = useLoad(() => api.listProducts(), [])
  const [share, setShare] = useState<Product | null>(null)
  const term = q.trim().toLowerCase()
  const all = (products ?? []).filter((p) => p.active)
  const list = term
    ? all.filter((p) => [p.title, p.subtitle, p.best_for, p.description].some((v) => v?.toLowerCase().includes(term)))
    : all.filter((p) => categoryOf(p) === cat)
  const kitLocked = (p: Product) => p.mode === 'pre_school' && p.requires_partner_kit && settings.require_partner_kit && profile?.kit_status !== 'paid'
  const setParam = (k: string, v: string) => { const n = new URLSearchParams(qs); v ? n.set(k, v) : n.delete(k); setQs(n, { replace: true }) }

  return (
    <Shell>
      <SubHeader title="Products" eyebrow={term ? `Results for “${q}”` : CATS.find((c) => c.id === cat)?.label} />
      <main className="space-y-4 p-4">
        <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <IconSearch size={22} className="text-slate-700" />
          <input value={q} onChange={(e) => setParam('q', e.target.value)}
            placeholder="Search courses, products, brands..." aria-label="Search products"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-slate-500" />
        </label>
        {!term && (
          <div className="grid grid-cols-3 gap-3">
            {CATS.map((c) => {
              const on = c.id === cat
              return (
                <button key={c.id} onClick={() => setParam('cat', c.id)} aria-pressed={on}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-[22px] bg-gradient-to-br px-1 py-3 text-center text-[13.5px] font-extrabold leading-tight transition active:scale-[0.97] ${on
                    ? 'from-[#2f5be6] to-[#1b3fc2] text-white shadow-[0_8px_22px_rgba(35,71,201,0.45)]'
                    : `${c.idle} text-slate-900 shadow-[0_4px_14px_rgba(15,23,42,0.06)]`}`}>
                  <span className={`grid h-12 w-12 place-items-center rounded-full text-2xl ${on ? 'bg-white/20' : 'bg-white/70'}`}>{c.icon}</span>
                  {c.label}
                </button>
              )
            })}
          </div>
        )}
        <ErrorNote msg={err} />
        {loading ? <Spinner /> : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => <ProductCard key={p.id} p={p} onShare={() => setShare(p)} locked={kitLocked(p)} />)}
          </div>
        )}
        {!loading && list.length === 0 && <p className="py-10 text-center text-sm text-slate-500">{term ? 'No products match your search.' : 'No products in this section yet.'}</p>}
      </main>
      <ShareSheet product={share} onClose={() => setShare(null)} />
    </Shell>
  )
}

export function ProductCard({ p, onShare, locked }: { p: Product; onShare: () => void; locked?: boolean }) {
  const { profile } = useSession()
  const mrp = Number(p.mrp ?? 0)
  const off = mrp > p.price ? Math.round((1 - p.price / mrp) * 100) : 0
  const buy = profile ? partnerLink(p.slug, profile.referral_code) : `/p/${p.slug}`
  return (
    <div className="relative flex flex-col rounded-[24px] border border-slate-100 bg-white p-3 shadow-[0_6px_20px_rgba(15,23,42,0.07)]">
      {off > 0 && <span className="absolute -right-1 -top-1 z-10 rotate-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 px-2.5 py-1 text-center text-[13px] font-black leading-none text-white shadow-md">⚡{off}%<br />OFF</span>}
      <Link to={`/product/${p.slug}`} className="block">
        <div className="mb-2 grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-sky-50 text-3xl">
          {p.image_url ? <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : p.emoji}
        </div>
        <h3 className="text-[15px] font-extrabold leading-snug text-[#0f1b4d]">{p.title}</h3>
        {p.duration && <p className="text-xs text-slate-500">Duration: {p.duration}</p>}
      </Link>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="chip !font-extrabold">{inr(p.price)}{p.billing === 'monthly' ? '/mo' : ''}</span>
        {mrp > p.price && <span className="self-center text-xs text-slate-400 line-through">{inr(mrp)}</span>}
        <span className="chip !border-emerald-200 !bg-emerald-50 !text-emerald-700">✨ Earn {p.commission_pct}%</span>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
        <a href={buy} className="btn bg-gradient-to-b from-[#e2b84a] to-[#c08a2a] !px-1 text-[13px] text-white shadow-[0_6px_14px_rgba(192,138,42,0.35)]">Buy Now</a>
        {locked ? <Link to="/kit" className="btn-outline !px-1 text-[12px]">🔒 Kit</Link>
          : <button className="btn-outline !border-[#1b3fc2] !px-1 text-[12px] !text-[#1b3fc2]" onClick={onShare}>→ Share Now</button>}
      </div>
    </div>
  )
}

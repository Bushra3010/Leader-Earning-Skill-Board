import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ErrorNote, ModeTabs, ShareSheet, Shell, Spinner, SubHeader } from '../components/ui'
import { IconSearch } from '../components/icons'
import { api, inr } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import { MODE_LABEL, type Product } from '../lib/types'

export default function Products() {
  const { mode, profile, settings } = useSession()
  const [qs, setQs] = useSearchParams()
  const q = qs.get('q') ?? ''
  const [products, loading, , err] = useLoad(() => api.listProducts(), [])
  const [share, setShare] = useState<Product | null>(null)
  const kitNeeded = mode === 'pre_school' && settings.require_partner_kit && profile?.kit_status !== 'paid'
  const term = q.trim().toLowerCase()
  const all = (products ?? []).filter((p) => p.active)
  // When searching, look across every section; otherwise show the selected section.
  const list = term
    ? all.filter((p) => [p.title, p.subtitle, p.best_for, p.description].some((v) => v?.toLowerCase().includes(term)))
    : all.filter((p) => p.mode === mode)

  return (
    <Shell>
      <SubHeader title="Products" eyebrow={term ? `Results for “${q}”` : MODE_LABEL[mode]} />
      <main className="space-y-4 p-4">
        <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <IconSearch size={22} className="text-slate-700" />
          <input value={q} onChange={(e) => setQs(e.target.value ? { q: e.target.value } : {}, { replace: true })}
            placeholder="Search courses, products, brands..." aria-label="Search products"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-slate-500" />
        </label>
        {!term && <ModeTabs />}
        <ErrorNote msg={err} />
        {loading ? <Spinner /> : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => <ProductCard key={p.id} p={p} onShare={() => setShare(p)} locked={kitNeeded && p.mode === 'pre_school' && p.requires_partner_kit} />)}
          </div>
        )}
        {!loading && list.length === 0 && <p className="py-10 text-center text-sm text-slate-500">{term ? 'No products match your search.' : 'No products in this section yet.'}</p>}
      </main>
      <ShareSheet product={share} onClose={() => setShare(null)} />
    </Shell>
  )
}

export function ProductCard({ p, onShare, locked }: { p: Product; onShare: () => void; locked?: boolean }) {
  return (
    <div className="flex flex-col rounded-[24px] border border-slate-100 bg-white p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.06)]">
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


import { useState } from 'react'
import { Link } from 'react-router-dom'
import { copyText, shareMessage, Shell, Spinner, SubHeader } from '../components/ui'
import { api, inr, partnerLink } from '../lib/api'
import { useLoad, useSession } from '../lib/session'

type Tab = 'all' | 'about' | 'how_to_sell'

export default function Learn() {
  const { profile, toast } = useSession()
  const [products, loading] = useLoad(() => api.listProducts(), [])
  const [lessons] = useLoad(() => api.listLessons(), [])
  const [tab, setTab] = useState<Tab>('all')
  const [sel, setSel] = useState<string | null>(null)
  const list = (products ?? []).filter((p) => p.active)
  const p = list.find((x) => x.slug === sel) ?? list.find((x) => x.is_featured) ?? list[0]
  const lessonList = (lessons ?? []).filter((l) => tab === 'all' || l.category === tab || (tab === 'how_to_sell' && l.category === 'branding'))

  return (
    <Shell>
      <SubHeader eyebrow="Beginner" title="Learn & Grow" />
      <main className="space-y-5 p-4">
        <section className="relative overflow-hidden rounded-3xl bg-navy-900 p-6 text-white">
          <span className="absolute -right-6 -top-6 h-36 w-36 rounded-full bg-gold-500/20" />
          <span className="absolute right-5 top-6 text-6xl">🧑‍🏫</span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">Beginner</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold">Learn &amp; Grow</h2>
          <p className="text-white/80">your earnings by 10X</p>
        </section>

        <div className="grid grid-cols-3 gap-1 rounded-3xl border border-slate-200 bg-white p-1.5">
          {([['all', 'All'], ['about', 'About Product'], ['how_to_sell', 'How to Sell']] as [Tab, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-2xl px-2 py-3 text-sm font-bold ${tab === k ? 'bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white' : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>

        {tab !== 'how_to_sell' && (
          <>
            <div>
              <h3 className="mb-2 text-lg font-extrabold">Choose Product</h3>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                {list.map((x) => (
                  <button key={x.id} onClick={() => setSel(x.slug)} className={`flex shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2.5 text-sm font-bold ${p?.id === x.id ? 'border-[var(--accent-to)] ring-2 ring-[var(--accent-ring)]' : 'border-slate-200'}`}>
                    <span>{x.emoji}</span>{x.title.length > 24 ? x.title.slice(0, 22) + '…' : x.title}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <Spinner /> : p && (
              <>
                <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold">Product Snapshot</h3><Link to={`/product/${p.slug}`} className="text-sm font-bold text-[var(--accent-text)]">See All →</Link></div>
                <section className="card flex items-center gap-4 p-4">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-slate-200 text-4xl">{p.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold leading-tight">{p.title}</p>
                    <p className="text-sm text-slate-500">{p.subtitle}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="chip">💳 {inr(p.price)}{p.billing === 'monthly' ? ' / month' : ''}</span>
                      <span className="chip !border-emerald-200 !bg-emerald-50 !text-emerald-700">💰 {p.billing === 'monthly' ? 'Repeat income' : `Earn ${p.commission_pct}%`}</span>
                    </div>
                  </div>
                </section>
                <section className="grid grid-cols-2 gap-3">
                  <Box label="Best For" value={p.best_for ?? '—'} />
                  <Box label="Pricing" value={`${inr(p.price)}${p.billing === 'monthly' ? ' / month' : ''}`} />
                  <Box label={p.billing === 'monthly' ? 'Repeat Income' : 'Your Earning'} value={p.billing === 'monthly'
                    ? `${p.commission_pct}% every month the customer stays subscribed.`
                    : `${p.commission_pct}% = ${inr(p.price * p.commission_pct / 100)} per sale.`} />
                  <Box label="Best Flow" value="Pitch → Demo → Follow-up → Close" />
                </section>
                {p.pitch && (
                  <section className="card p-5">
                    <h3 className="text-xl font-extrabold">Selling Pitch (Copy-Paste)</h3>
                    <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">“{p.pitch}”</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button className="btn-primary" onClick={async () => { await copyText(p.pitch!); toast('Pitch copied') }}>Copy pitch</button>
                      <a className="btn-soft" target="_blank" rel="noreferrer"
                        href={`https://wa.me/?text=${encodeURIComponent(profile ? shareMessage(p, partnerLink(p.slug, profile.referral_code)) : p.pitch)}`}>Send on WhatsApp</a>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}

        {lessonList.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-lg font-extrabold">{tab === 'about' ? 'Know the program' : 'Training'}</h3>
            {lessonList.map((l, i) => (
              <details key={l.id} className="card group p-4" open={i === 0 && tab === 'how_to_sell'}>
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-text)]">{i + 1}</span>
                  <span className="flex-1 font-bold">{l.title}</span>
                  <span className="chip capitalize">{l.category === 'branding' ? 'Branding' : l.level}</span>
                </summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{l.body}</p>
              </details>
            ))}
          </section>
        )}
      </main>
    </Shell>
  )
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-extrabold leading-snug">{value}</p>
    </div>
  )
}

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { copyText, ShareSheet, Shell, Spinner, SubHeader } from '../components/ui'
import { api, inr, partnerLink } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import { CAT_LABEL, categoryOf } from '../lib/category'
import { VideoStrip } from '../components/Videos'

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const { profile, toast } = useSession()
  const [p, loading] = useLoad(() => api.getProduct(slug), [slug])
  const [share, setShare] = useState(false)
  if (loading) return <Shell><SubHeader title="Product" /><Spinner /></Shell>
  if (!p) return <Shell><SubHeader title="Not found" /><p className="p-6 text-center text-slate-500">This product is not available.</p></Shell>
  const earn = Math.round(p.price * p.commission_pct / 100)
  return (
    <Shell>
      <SubHeader eyebrow={CAT_LABEL[categoryOf(p)]} title={p.title} />
      <main className="space-y-4 p-4">
        <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${p.banner_gradient ?? 'from-navy-900 to-navy-600'} p-5 text-white`}>
          <span className="absolute right-4 top-4 text-6xl">{p.emoji}</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">{CAT_LABEL[categoryOf(p)]}</p>
          <h2 className="mt-1 max-w-[75%] font-display text-2xl font-extrabold leading-tight">{p.title}</h2>
          <p className="mt-1 text-sm text-white/80">{p.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">{inr(p.price)}{p.billing === 'monthly' ? ' / month' : ''}</span>
            {p.duration && <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-bold">⏱ {p.duration}</span>}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Info label="Your commission" value={`${p.commission_pct}% = ${inr(earn)}`} accent />
          <Info label="Pricing" value={`${inr(p.price)}${p.billing === 'monthly' ? ' / month' : ''}`} />
          <Info label="Best for" value={p.best_for ?? '—'} />
          <Info label="Paid when" value={p.billing === 'monthly' ? 'Each paid month' : 'Buyer payment confirmed'} />
        </section>

        {p.description && <section className="card p-4"><h3 className="mb-1 font-extrabold">About</h3><p className="text-sm leading-relaxed text-slate-600">{p.description}</p></section>}

        {p.features.length > 0 && (
          <section className="card p-4">
            <h3 className="mb-2 font-extrabold">What the buyer gets</h3>
            <ul className="space-y-2">{p.features.map((f) => <li key={f} className="flex gap-2 text-sm"><span className="text-emerald-600">✓</span>{f}</li>)}</ul>
          </section>
        )}

        {p.pitch && (
          <section className="card p-4">
            <h3 className="mb-2 font-extrabold">Selling pitch (copy-paste)</h3>
            <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">“{p.pitch}”</p>
            <button className="btn-soft mt-3 w-full" onClick={async () => { await copyText(p.pitch!); toast('Pitch copied') }}>Copy pitch</button>
          </section>
        )}

        <div className="sticky bottom-24 grid grid-cols-2 gap-3">
          <button className="btn-outline !py-3.5" onClick={async () => { if (profile) { await copyText(partnerLink(p.slug, profile.referral_code)); toast('Link copied') } }}>Copy link</button>
          <button className="btn-primary !py-3.5" onClick={() => setShare(true)}>Share & Earn</button>
        </div>
        <VideoStrip productId={p.id} title="Demo videos" sub="Watch, then show your customer" />
      </main>
      <ShareSheet product={share ? p : null} onClose={() => setShare(false)} />
    </Shell>
  )
}

function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 ${accent ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-1 font-extrabold leading-snug ${accent ? 'text-emerald-700' : ''}`}>{value}</p>
    </div>
  )
}

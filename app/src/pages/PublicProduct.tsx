import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ErrorNote, Spinner } from '../components/ui'
import { api, inr } from '../lib/api'
import { useLoad } from '../lib/session'
import { CAT_LABEL, categoryOf } from '../lib/category'

// Page a buyer opens from a partner's shared link: /p/:slug?ref=CODE
export default function PublicProduct() {
  const { slug = '' } = useParams()
  const [qs] = useSearchParams()
  const ref = (qs.get('ref') ?? '').toUpperCase()
  const [p, loading] = useLoad(() => api.getProduct(slug), [slug])
  const [partner] = useLoad(() => (ref ? api.partnerNameForCode(ref) : Promise.resolve(null)), [ref])
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })

  return (
    <div className="mode-pre_school min-h-screen bg-slate-100">
      <div className="mx-auto max-w-md bg-white pb-10 min-h-screen">
        <header className="flex items-center gap-3 bg-navy-900 px-4 py-3 text-white">
          <img src="/logo.jpeg" alt="" className="h-10 w-10 rounded-full ring-2 ring-gold-400" />
          <div><p className="font-display font-extrabold leading-tight">Leaders Earning &amp; Skill Board</p><p className="text-xs text-gold-300">Empower • Educate • Elevate</p></div>
        </header>
        {loading ? <Spinner /> : !p || !p.active ? <p className="p-8 text-center text-slate-500">This product is not available.</p> : done ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">✅</div>
            <h1 className="text-2xl font-extrabold">Request received!</h1>
            <p className="mt-2 text-slate-600">Your order ID is <b>{done}</b>. Our team will contact you on WhatsApp/phone shortly to complete payment{p.is_physical ? ' and delivery' : ' and enrollment'}.</p>
            <p className="mt-4 text-xs text-slate-400">Keep this order ID for reference.</p>
          </div>
        ) : (
          <main className="space-y-5 p-4">
            <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${p.banner_gradient ?? 'from-navy-900 to-navy-600'} p-5 text-white`}>
              <span className="absolute right-4 top-4 text-6xl">{p.emoji}</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">{CAT_LABEL[categoryOf(p)]}</p>
              <h1 className="mt-1 max-w-[75%] font-display text-2xl font-extrabold leading-tight">{p.title}</h1>
              <p className="mt-1 text-sm text-white/80">{p.subtitle}</p>
              <p className="mt-4 text-3xl font-extrabold">{inr(p.price)}<span className="text-base font-semibold text-white/70">{p.billing === 'monthly' ? ' / month' : ''}</span></p>
              {p.duration && <p className="text-sm text-white/80">⏱ {p.duration}</p>}
            </section>
            {partner && <p className="rounded-2xl bg-gold-50 px-4 py-3 text-sm text-gold-700">Recommended by <b>{partner}</b></p>}
            {p.description && <p className="text-[15px] leading-relaxed text-slate-700">{p.description}</p>}
            {p.features.length > 0 && <ul className="space-y-2">{p.features.map((x) => <li key={x} className="flex gap-2 text-sm"><span className="text-emerald-600">✓</span>{x}</li>)}</ul>}
            <section className="card p-4">
              <h2 className="mb-3 text-lg font-extrabold">{p.is_physical ? 'Order now' : 'Enroll now'}</h2>
              <form className="space-y-3" onSubmit={async (e) => {
                e.preventDefault(); setBusy(true); setErr(null)
                try { setDone(await api.createOrder({ slug: p.slug, ref, ...f })) }
                catch (er) { setErr(er instanceof Error ? er.message : 'Something went wrong') } finally { setBusy(false) }
              }}>
                <div><label className="label" htmlFor="bn">Full name</label><input id="bn" className="input" required value={f.name} onChange={set('name')} /></div>
                <div><label className="label" htmlFor="bp">Mobile (WhatsApp)</label><input id="bp" className="input" required inputMode="tel" placeholder="+91" value={f.phone} onChange={set('phone')} /></div>
                <div><label className="label" htmlFor="be">Email (optional)</label><input id="be" className="input" type="email" value={f.email} onChange={set('email')} /></div>
                {p.is_physical && <div><label className="label" htmlFor="ba">Delivery address</label><textarea id="ba" className="input min-h-[80px]" required value={f.address} onChange={set('address')} /></div>}
                <ErrorNote msg={err} />
                <button className="btn-primary w-full !py-3.5" disabled={busy}>{busy ? 'Submitting…' : `Continue — ${inr(p.price)}`}</button>
                <p className="text-center text-xs text-slate-400">By continuing you agree to our <Link to="/privacy" className="underline">privacy policy</Link>. Your details are used only for this order.</p>
              </form>
            </section>
          </main>
        )}
      </div>
    </div>
  )
}

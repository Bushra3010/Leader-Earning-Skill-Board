import { useState } from 'react'
import { ErrorNote, Shell, SubHeader } from '../components/ui'
import { api, inr } from '../lib/api'
import { useSession } from '../lib/session'

export default function PartnerKit() {
  const { profile, settings, refresh, toast } = useSession()
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  if (!profile) return null
  const steps = [
    { k: 'not_paid', t: 'Pay the partner fee', d: `One-time ${inr(settings.partner_kit_price)}` },
    { k: 'pending', t: 'Payment verification', d: 'Our team confirms within 24–48 hours' },
    { k: 'paid', t: 'You are a Partner', d: 'Team features unlocked + partner kit sent' },
  ]
  const cur = steps.findIndex((s) => s.k === profile.kit_status)
  return (
    <Shell>
      <SubHeader eyebrow={profile.role === 'associate' ? 'Associate → Partner' : 'Partner'} title="Become a Partner" />
      <main className="space-y-4 p-4">
        <section className="card p-5">
          <h2 className="text-lg font-extrabold">Associate or Partner?</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-slate-200 p-3">
              <p className="font-extrabold">Associate</p><p className="text-xs text-slate-500">Free</p>
              <ul className="mt-2 space-y-1 text-slate-600"><li>✓ Sell & share products</li><li>✓ Earn commission on your own sales</li><li className="text-slate-400">✕ No team</li></ul>
            </div>
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-3">
              <p className="font-extrabold">Partner</p><p className="text-xs text-slate-500">One-time {inr(settings.partner_kit_price)}</p>
              <ul className="mt-2 space-y-1 text-slate-600"><li>✓ Everything in Associate</li><li>✓ Build your own team</li><li>✓ Partner kit for demos</li></ul>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Everyone earns only from sales made through their own link. The fee is shown upfront and is paid once.</p>
        </section>
        <section className="card p-5">
          <h3 className="mb-3 font-extrabold">Status</h3>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={s.k} className="flex gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${i < cur || profile.kit_status === 'paid' ? 'bg-emerald-500 text-white' : i === cur ? 'bg-[var(--accent-to)] text-white' : 'bg-slate-200 text-slate-500'}`}>{i < cur || profile.kit_status === 'paid' ? '✓' : i + 1}</span>
                <div><p className="font-bold">{s.t}</p><p className="text-sm text-slate-500">{s.d}</p></div>
              </li>
            ))}
          </ol>
        </section>
        {profile.kit_status === 'not_paid' && (
          <section className="card p-5">
            <h3 className="font-extrabold">Pay now</h3>
            <p className="mb-3 text-sm text-slate-600">Pay {inr(settings.partner_kit_price)} to our official UPI / bank account{settings.whatsapp_number ? ` (ask on WhatsApp ${settings.whatsapp_number})` : ''}, then enter the UPI transaction ID below.</p>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault(); setBusy(true); setErr(null)
              try { await api.requestPartnerKit(ref.trim()); await refresh(); toast('Submitted for verification') }
              catch (er) { setErr(er instanceof Error ? er.message : 'Failed') } finally { setBusy(false) }
            }}>
              <input className="input" required minLength={6} placeholder="UPI transaction / UTR number" value={ref} onChange={(e) => setRef(e.target.value)} />
              <ErrorNote msg={err} />
              <button className="btn-primary w-full" disabled={busy}>{busy ? 'Submitting…' : 'Submit payment reference'}</button>
            </form>
          </section>
        )}
      </main>
    </Shell>
  )
}

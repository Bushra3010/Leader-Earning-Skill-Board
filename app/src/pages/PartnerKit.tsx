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
    { k: 'not_paid', t: 'Pay for kit', d: `One-time ${inr(settings.partner_kit_price)}` },
    { k: 'pending', t: 'Payment verification', d: 'Our team confirms within 24–48 hours' },
    { k: 'paid', t: 'Kit delivered — start selling', d: 'Pre-School products unlocked' },
  ]
  const cur = steps.findIndex((s) => s.k === profile.kit_status)
  return (
    <Shell>
      <SubHeader eyebrow="Pre-School" title="Partner Kit" />
      <main className="space-y-4 p-4">
        <section className="card p-5">
          <h2 className="text-lg font-extrabold">What is the Partner Kit?</h2>
          <p className="mt-1 text-sm text-slate-600">A sample set of Pre-School products you can show to parents during demos. It costs a one-time <b>{inr(settings.partner_kit_price)}</b>.
            {settings.require_partner_kit ? ' It is needed only to sell Pre-School kits.' : ' It is optional.'} Pro-School and School products never need a kit.</p>
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

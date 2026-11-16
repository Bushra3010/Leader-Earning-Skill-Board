import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AppHeader, ErrorNote, Sheet, Shell, SosSheet } from '../components/ui'
import { api, inr } from '../lib/api'
import { resetDemo } from '../lib/demo'
import { useLoad, useSession } from '../lib/session'
import { MODE_LABEL, type Profile as P } from '../lib/types'

export default function Profile() {
  const { profile, refresh, toast } = useSession()
  const nav = useNavigate()
  const [qs] = useSearchParams()
  const [sheet, setSheet] = useState<null | 'details' | 'payout' | 'rates'>(qs.get('edit') === 'payout' ? 'payout' : null)
  const [sos, setSos] = useState(false)
  if (!profile) return null
  const kyc = { not_submitted: 'Not submitted', submitted: 'Under review', verified: 'Verified ✓', rejected: 'Rejected — resubmit' }[profile.kyc_status]

  return (
    <Shell>
      <AppHeader page="Profile" showGreeting={false} />
      <main className="space-y-4 p-4">
        <section className="card flex items-center gap-4 p-5">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-navy-700 to-navy-500 text-2xl font-bold text-gold-300">{profile.full_name.slice(0, 1).toUpperCase() || '?'}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-extrabold">{profile.full_name}</p>
            <p className="truncate text-sm text-slate-500">{profile.email}</p>
            <p className="text-sm text-slate-500">{profile.phone} {profile.city && `• ${profile.city}`}</p>
          </div>
        </section>

        <section className="card divide-y divide-slate-100">
          <Row icon="👛" label="My Wallet & payouts" to="/wallet" />
          <Row icon="✏️" label="Edit personal details" onClick={() => setSheet('details')} />
          <Row icon="🏦" label="Payout & KYC details" hint={kyc} onClick={() => setSheet('payout')} />
          <Row icon="📊" label="Commission rates" onClick={() => setSheet('rates')} />
          {profile.kit_status !== 'paid' && <Row icon="📦" label="Partner kit (Pre-School)" hint={profile.kit_status === 'pending' ? 'Under review' : 'Optional'} to="/kit" />}
          <Row icon="🆘" label="Help & support" onClick={() => setSos(true)} />
          <Row icon="🔒" label="Privacy policy" to="/privacy" />
          {profile.role === 'admin' && <Row icon="🛠️" label="Admin panel" to="/admin" />}
        </section>

        <button className="btn-outline w-full !py-3 text-red-600" onClick={async () => { await api.signOut(); await refresh(); nav('/login') }}>Log out</button>
        {api.isDemo && <button className="w-full text-center text-xs text-slate-400 underline" onClick={() => { resetDemo(); window.location.href = '/login' }}>Reset demo data</button>}
        <p className="text-center text-xs text-slate-400">Leaders Earning and Skill Board • v1.0</p>
      </main>

      <DetailsSheet open={sheet === 'details'} profile={profile} onClose={() => setSheet(null)} onSaved={async () => { await refresh(); toast('Saved'); setSheet(null) }} />
      <PayoutSheet open={sheet === 'payout'} profile={profile} onClose={() => setSheet(null)} onSaved={async () => { await refresh(); toast('Payout details saved'); setSheet(null) }} />
      <RatesSheet open={sheet === 'rates'} onClose={() => setSheet(null)} />
      <SosSheet open={sos} onClose={() => setSos(false)} />
    </Shell>
  )
}

function Row({ icon, label, hint, to, onClick }: { icon: string; label: string; hint?: string; to?: string; onClick?: () => void }) {
  const inner = (<><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100">{icon}</span><span className="flex-1 text-left font-semibold">{label}</span>{hint && <span className="text-xs text-slate-500">{hint}</span>}<span className="text-slate-400">›</span></>)
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 active:bg-slate-50'
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button className={cls} onClick={onClick}>{inner}</button>
}

function useForm<T extends object>(init: T, open: boolean) {
  const [f, setF] = useState(init)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) setF(init) }, [open])
  return [f, (k: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })] as const
}

function DetailsSheet({ open, profile, onClose, onSaved }: { open: boolean; profile: P; onClose: () => void; onSaved: () => void }) {
  const [f, set] = useForm({ full_name: profile.full_name, phone: profile.phone ?? '', city: profile.city ?? '' }, open)
  const [err, setErr] = useState<string | null>(null)
  return (
    <Sheet open={open} onClose={onClose} title="Personal details">
      <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); try { await api.updateProfile(f); onSaved() } catch (er) { setErr(er instanceof Error ? er.message : 'Failed') } }}>
        <div><label className="label">Full name</label><input className="input" required value={f.full_name} onChange={set('full_name')} /></div>
        <div><label className="label">Mobile</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
        <div><label className="label">City</label><input className="input" value={f.city} onChange={set('city')} /></div>
        <ErrorNote msg={err} />
        <button className="btn-primary w-full">Save</button>
      </form>
    </Sheet>
  )
}

function PayoutSheet({ open, profile, onClose, onSaved }: { open: boolean; profile: P; onClose: () => void; onSaved: () => void }) {
  const [f, set] = useForm({
    upi_id: profile.upi_id ?? '', bank_account_name: profile.bank_account_name ?? '', bank_account_number: profile.bank_account_number ?? '',
    bank_ifsc: profile.bank_ifsc ?? '', pan_number: profile.pan_number ?? '',
  }, open)
  const [err, setErr] = useState<string | null>(null)
  return (
    <Sheet open={open} onClose={onClose} title="Payout & KYC">
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setErr(null)
        if (f.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(f.pan_number.toUpperCase())) return setErr('PAN format looks wrong (e.g. ABCDE1234F)')
        if (f.bank_ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.bank_ifsc.toUpperCase())) return setErr('IFSC format looks wrong (e.g. SBIN0001234)')
        const clean = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim() ? (k === 'pan_number' || k === 'bank_ifsc' ? v.trim().toUpperCase() : v.trim()) : null]))
        try { await api.updateProfile({ ...clean, kyc_status: f.pan_number ? 'submitted' : profile.kyc_status } as Partial<P>); onSaved() }
        catch (er) { setErr(er instanceof Error ? er.message : 'Failed') }
      }}>
        <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Used only to send your commission. PAN is needed for TDS as per Indian tax rules. We never ask for your card number, PIN or OTP.</p>
        <div><label className="label">UPI ID</label><input className="input" placeholder="name@upi" value={f.upi_id} onChange={set('upi_id')} /></div>
        <p className="text-center text-xs font-semibold text-slate-400">— or bank account —</p>
        <div><label className="label">Account holder name</label><input className="input" value={f.bank_account_name} onChange={set('bank_account_name')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Account number</label><input className="input" inputMode="numeric" value={f.bank_account_number} onChange={set('bank_account_number')} /></div>
          <div><label className="label">IFSC</label><input className="input uppercase" value={f.bank_ifsc} onChange={set('bank_ifsc')} /></div>
        </div>
        <div><label className="label">PAN (for KYC)</label><input className="input uppercase" value={f.pan_number} onChange={set('pan_number')} /></div>
        <ErrorNote msg={err} />
        <button className="btn-primary w-full">Save</button>
      </form>
    </Sheet>
  )
}

function RatesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [products] = useLoad(() => api.listProducts(), [open])
  return (
    <Sheet open={open} onClose={onClose} title="Commission rates">
      <p className="mb-3 text-sm text-slate-500">Exact commission for every product — no hidden slabs.</p>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-2.5">Product</th><th className="p-2.5 text-right">Price</th><th className="p-2.5 text-right">You earn</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {(products ?? []).filter((p) => p.active).map((p) => (
              <tr key={p.id}><td className="p-2.5"><p className="font-semibold leading-tight">{p.title}</p><p className="text-xs text-slate-400">{MODE_LABEL[p.mode]}</p></td>
                <td className="p-2.5 text-right">{inr(p.price)}{p.billing === 'monthly' ? '/mo' : ''}</td>
                <td className="p-2.5 text-right font-bold text-emerald-700">{p.commission_pct}%<br /><span className="text-xs font-normal">{inr(p.price * p.commission_pct / 100)}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sheet>
  )
}

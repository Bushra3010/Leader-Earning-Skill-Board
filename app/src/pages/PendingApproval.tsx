import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { ErrorNote, SosSheet } from '../components/ui'
import { api } from '../lib/api'
import { useSession } from '../lib/session'

/** Shown to every non-admin member whose account isn't approved yet. They must complete their details first. */
export default function PendingApproval() {
  const { profile, settings, refresh, toast } = useSession()
  const nav = useNavigate()
  const [f, setF] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '', city: profile?.city ?? '' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [help, setHelp] = useState(false)
  if (!profile) return null
  const complete = !!(profile.full_name.trim() && (profile.phone ?? '').replace(/\D/g, '').length >= 10 && (profile.city ?? '').trim())
  const wa = settings.whatsapp_number.replace(/\D/g, '')
  const rejected = profile.approval_status === 'rejected'
  const logout = async () => { await api.signOut(); await refresh(); nav('/login') }

  if (!complete) return (
    <AuthLayout title="Complete your details" sub="We need these before your account can be approved.">
      <form className="space-y-3.5" onSubmit={async (e) => {
        e.preventDefault(); setErr(null)
        if (f.phone.replace(/\D/g, '').length < 10) return setErr('Enter a valid 10-digit mobile number')
        setBusy(true)
        try { await api.updateProfile({ full_name: f.full_name.trim(), phone: f.phone.trim(), city: f.city.trim() }); await refresh(); toast('Details saved') }
        catch (er) { setErr(er instanceof Error ? er.message : 'Failed') } finally { setBusy(false) }
      }}>
        <div><label className="label" htmlFor="n">Full name</label><input id="n" className="input" required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
        <div><label className="label" htmlFor="ph">Mobile</label><input id="ph" className="input" inputMode="tel" required placeholder="+91" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="label" htmlFor="c">City</label><input id="c" className="input" required value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
        <ErrorNote msg={err} />
        <button className="btn-primary w-full !py-3.5" disabled={busy}>{busy ? 'Saving…' : 'Save & continue'}</button>
      </form>
      <div className="mt-4 flex justify-center gap-5 text-sm">
        <button className="text-[#2347c9] underline" onClick={() => setHelp(true)}>Help & Support</button>
        <button className="text-slate-500 underline" onClick={logout}>Log out</button>
      </div>
      <SosSheet open={help} onClose={() => setHelp(false)} topic="Account approval" />
    </AuthLayout>
  )

  return (
    <AuthLayout title={rejected ? 'Account not approved' : 'Waiting for approval'} sub={rejected ? 'Please contact us if you think this is a mistake.' : 'Our team will check your details and approve your account soon.'}>
      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <p><b>Name:</b> {profile.full_name}</p>
        <p><b>Mobile:</b> {profile.phone}</p>
        <p><b>City:</b> {profile.city}</p>
        <p><b>Member ID:</b> {profile.referral_code}</p>
      </div>
      <div className="mt-4 grid gap-3">
        {wa && <a className="btn bg-[#25D366] text-white" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello, please approve my Leaders account. Member ID: ${profile.referral_code}, Name: ${profile.full_name}`)}`} target="_blank" rel="noreferrer">💬 Message us on WhatsApp</a>}
        <div className="grid grid-cols-2 gap-3">
          {!rejected && <button className="btn-soft" onClick={async () => { await refresh(); toast('Checked — still waiting') }}>⟳ Check again</button>}
          <button className={`btn-primary ${rejected ? 'col-span-2' : ''}`} onClick={() => setHelp(true)}>🆘 Help & Support</button>
        </div>
        <button className="btn-outline" onClick={logout}>Log out</button>
      </div>
      <SosSheet open={help} onClose={() => setHelp(false)} topic="Account approval" />
    </AuthLayout>
  )
}

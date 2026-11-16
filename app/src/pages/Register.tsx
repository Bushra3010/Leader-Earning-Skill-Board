import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { ErrorNote } from '../components/ui'
import { api } from '../lib/api'
import { useSession } from '../lib/session'

export default function Register() {
  const { userId, refresh } = useSession()
  const nav = useNavigate()
  const [qs] = useSearchParams()
  const [f, setF] = useState({ full_name: '', phone: '', city: '', email: '', password: '', ref_code: qs.get('ref') ?? '' })
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  if (userId) return <Navigate to="/" replace />
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  if (sent) return (
    <AuthLayout title="Check your email" sub="One last step">
      <p className="text-sm text-slate-600">We sent a confirmation link to <b>{f.email}</b>. Open it, then come back and log in.</p>
      <Link to="/login" className="btn-primary mt-5 w-full">Go to login</Link>
    </AuthLayout>
  )

  return (
    <AuthLayout title="Become a partner" sub="Free to join. You earn only when someone buys through your link.">
      <form className="space-y-3.5" onSubmit={async (e) => {
        e.preventDefault(); setErr(null)
        if (f.phone.replace(/\D/g, '').length < 10) return setErr('Enter a valid 10-digit mobile number')
        if (f.password.length < 8) return setErr('Password must be at least 8 characters')
        if (!agree) return setErr('Please accept the partner terms')
        setBusy(true)
        try {
          const r = await api.signUp(f)
          if (r.needsConfirmation) setSent(true)
          else { await refresh(); nav('/', { replace: true }) }
        } catch (er) { setErr(er instanceof Error ? er.message : 'Sign-up failed') } finally { setBusy(false) }
      }}>
        <div><label className="label" htmlFor="n">Full name</label><input id="n" className="input" required value={f.full_name} onChange={set('full_name')} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="ph">Mobile</label><input id="ph" className="input" inputMode="tel" required placeholder="+91" value={f.phone} onChange={set('phone')} /></div>
          <div><label className="label" htmlFor="c">City</label><input id="c" className="input" value={f.city} onChange={set('city')} /></div>
        </div>
        <div><label className="label" htmlFor="em">Email</label><input id="em" className="input" type="email" required autoComplete="email" value={f.email} onChange={set('email')} /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" className="input" type="password" required autoComplete="new-password" value={f.password} onChange={set('password')} /></div>
        <div><label className="label" htmlFor="rc">Referral code (optional)</label><input id="rc" className="input uppercase" value={f.ref_code} onChange={set('ref_code')} /></div>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I agree to the partner terms and <Link to="/privacy" className="font-semibold text-navy-600 underline">privacy policy</Link>. I will share buyer details only for completing their order.</span>
        </label>
        <ErrorNote msg={err} />
        <button className="btn-primary w-full !py-3.5" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">Already a partner? <Link to="/login" className="font-bold text-navy-600">Login</Link></p>
    </AuthLayout>
  )
}

import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { ErrorNote } from '../components/ui'
import { api } from '../lib/api'
import { useSession } from '../lib/session'

export default function Login() {
  const { userId, refresh, toast } = useSession()
  const nav = useNavigate()
  const loc = useLocation() as { state?: { from?: string } }
  const [email, setEmail] = useState(api.isDemo ? 'demo@leaders.app' : '')
  const [password, setPassword] = useState(api.isDemo ? 'demo1234' : '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState(false)
  if (userId) return <Navigate to={loc.state?.from ?? '/'} replace />

  return (
    <AuthLayout title="Partner login" sub="Share products. Earn commission. Build your digital income.">
      {api.isDemo && (
        <div className="mb-4 rounded-2xl border border-gold-300 bg-gold-50 px-4 py-3 text-xs text-gold-700">
          <b>Demo mode</b> — Supabase is not connected yet, so data is saved only in this browser. Demo login is pre-filled.
        </div>
      )}
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr(null); setUnconfirmed(false)
        try { await api.signIn(email, password); await refresh(); nav(loc.state?.from ?? '/', { replace: true }) }
        catch (er) {
          const msg = er instanceof Error ? er.message : 'Login failed'
          if (msg === 'EMAIL_NOT_CONFIRMED') { setUnconfirmed(true); setErr('Please confirm your email first. Open the link we sent to ' + email.trim() + ', then log in.') }
          else setErr(msg)
        } finally { setBusy(false) }
      }}>
        <div><label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <ErrorNote msg={err} />
        {unconfirmed && (
          <button type="button" className="w-full text-center text-sm font-semibold text-navy-600 underline" onClick={async () => {
            try { await api.resendConfirmation(email); toast('Confirmation email sent again. Check inbox and spam.') } catch (er) { setErr(er instanceof Error ? er.message : 'Failed') }
          }}>Resend confirmation email</button>
        )}
        <button className="btn-primary w-full !py-3.5" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        <button type="button" className="w-full text-center text-sm font-semibold text-navy-600" onClick={async () => {
          if (!email) { setErr('Enter your email first'); return }
          try { await api.resetPassword(email); toast('Password reset link sent to your email') } catch (er) { setErr(er instanceof Error ? er.message : 'Failed') }
        }}>Forgot password?</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">New partner? <Link to="/register" className="font-bold text-navy-600">Create free account</Link></p>
      <p className="mt-3 text-center text-xs text-slate-400"><Link to="/privacy" className="underline">Privacy policy</Link></p>
    </AuthLayout>
  )
}

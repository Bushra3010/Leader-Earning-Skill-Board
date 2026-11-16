import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, ErrorNote, Sheet, Shell, Spinner, SubHeader } from '../components/ui'
import { api, fmtDate, inr, walletBalance } from '../lib/api'
import { useLoad, useSession } from '../lib/session'

export default function Wallet() {
  const { profile, settings, toast, refresh } = useSession()
  const [tx, loading, reload] = useLoad(() => api.listWallet(), [])
  const [wd, , reloadWd] = useLoad(() => api.listWithdrawals(), [])
  const [open, setOpen] = useState(false)
  const [amt, setAmt] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const bal = walletBalance(tx ?? [])
  const earned = (tx ?? []).filter((t) => t.kind === 'commission').reduce((s, t) => s + Number(t.amount), 0)
  const hasPayout = Boolean(profile?.upi_id || profile?.bank_account_number)

  return (
    <Shell>
      <SubHeader eyebrow="Earnings" title="My Wallet" />
      <main className="space-y-4 p-4">
        <section className="rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-600 p-5 text-white">
          <p className="text-sm text-white/70">Available balance</p>
          <p className="font-display text-4xl font-extrabold">{inr(bal)}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <span>Lifetime earned <b className="text-gold-300">{inr(earned)}</b></span>
            <span>Points <b className="text-gold-300">🪙 {profile?.points ?? 0}</b></span>
          </div>
          <button className="btn-gold mt-4 w-full" onClick={() => { setErr(null); setAmt(String(Math.floor(bal))); setOpen(true) }}>Withdraw to bank / UPI</button>
        </section>

        <section className="card space-y-1 p-4 text-sm">
          <h3 className="mb-1 font-extrabold">Payout rules</h3>
          <p>• Minimum withdrawal: <b>{inr(settings.min_withdrawal)}</b></p>
          <p>• Payout schedule: <b>{settings.payout_days}</b></p>
          <p>• Commission is added when the buyer’s payment is confirmed, and reversed if the order is cancelled or refunded.</p>
          <p>• Points: +10 for every paid sale.</p>
        </section>

        {(wd?.length ?? 0) > 0 && (
          <section className="card p-4">
            <h3 className="mb-2 font-extrabold">Withdrawal requests</h3>
            <ul className="divide-y divide-slate-100">
              {wd!.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{fmtDate(w.created_at)} • {w.method.toUpperCase()}</span>
                  <span className="flex items-center gap-2"><b>{inr(w.amount)}</b><span className="chip capitalize">{w.status}</span></span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card p-4">
          <h3 className="mb-2 font-extrabold">Transactions</h3>
          {loading ? <Spinner /> : !tx?.length ? <Empty icon="👛" title="No transactions yet" text="Your commissions will show here." /> : (
            <ul className="divide-y divide-slate-100">
              {tx.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${t.amount >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>{t.kind === 'commission' ? '💰' : t.kind === 'withdrawal' ? '🏦' : '↩️'}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{t.note ?? t.kind}</p><p className="text-xs text-slate-500">{fmtDate(t.created_at)}</p></div>
                  <span className={`font-extrabold ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{t.amount >= 0 ? '+' : '−'}{inr(Math.abs(t.amount))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Sheet open={open} onClose={() => setOpen(false)} title="Withdraw">
        {!hasPayout ? (
          <div className="space-y-3 text-sm">
            <p>Add your UPI ID or bank account first so we know where to send money.</p>
            <Link to="/profile?edit=payout" className="btn-primary w-full">Add payout details</Link>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true); setErr(null)
            try { await api.requestWithdrawal(Number(amt)); toast('Withdrawal requested'); setOpen(false); reload(); reloadWd(); refresh() }
            catch (er) { setErr(er instanceof Error ? er.message : 'Failed') } finally { setBusy(false) }
          }}>
            <p className="text-sm text-slate-600">Sending to: <b>{profile?.upi_id ?? `A/c ••••${profile?.bank_account_number?.slice(-4)}`}</b></p>
            <label className="label" htmlFor="amt">Amount (₹)</label>
            <input id="amt" className="input" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, ''))} />
            <p className="text-xs text-slate-500">Balance {inr(bal)} • Minimum {inr(settings.min_withdrawal)}</p>
            <ErrorNote msg={err} />
            <button className="btn-primary w-full" disabled={busy || !amt}>{busy ? 'Requesting…' : 'Request withdrawal'}</button>
          </form>
        )}
      </Sheet>
    </Shell>
  )
}

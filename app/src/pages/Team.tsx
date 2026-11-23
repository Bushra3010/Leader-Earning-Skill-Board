import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader, copyText, Empty, ErrorNote, Shell, Spinner } from '../components/ui'
import { api, fmtDate, inr, PUBLIC_URL } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import { Avatar } from './Leaderboard'

type Filter = 'all' | 'active' | 'new'
const DAY = 86400000

export default function Team() {
  const { profile, toast } = useSession()
  const [team, loading, , err] = useLoad(() => api.listTeam(), [])
  const [stats, , , statsErr] = useLoad(() => api.teamStats(), [])
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const invite = `${PUBLIC_URL}/register?ref=${profile?.referral_code ?? ''}`
  const msg = `Main Leaders Earning & Skill Board par education products share karke kamata/kamati hoon. Joining free hai — tum bhi join karo: ${invite}`

  const term = applied.trim().toLowerCase()
  const members = (team ?? [])
    .filter((m) => filter === 'all'
      || (filter === 'active' && !!m.last_sale_at && Date.now() - new Date(m.last_sale_at).getTime() <= 30 * DAY)
      || (filter === 'new' && Date.now() - new Date(m.created_at).getTime() <= 30 * DAY))
    .filter((m) => !term || [m.full_name, m.city ?? ''].some((v) => v.toLowerCase().includes(term)))

  return (
    <Shell>
      <AppHeader page="Team / Downline" />
      <main className="space-y-4 p-4">
        <p className="-mt-1 px-1 text-sm font-semibold text-slate-500">Build your team → track their sales</p>
        <ErrorNote msg={err} />

        <section className="rounded-[26px] bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-extrabold text-[#0f1b4d]">Invite Your Team</h2>
              <p className="text-[13px] text-slate-600">Share your link — friends join free as partners under your code</p>
            </div>
            {'share' in navigator && (
              <button className="shrink-0 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold" onClick={() => navigator.share({ title: 'Join Leaders', text: msg }).catch(() => {})}>📤<br />Share</button>
            )}
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-500">Your code <b className="font-mono text-sm text-slate-900">{profile?.referral_code}</b></p>
            <p className="mt-1.5 break-all rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">{invite}</p>
            <div className="mt-2.5 flex gap-2">
              <button className="btn-soft !px-4 !py-2 text-sm" onClick={async () => { await copyText(invite); toast('Invite link copied') }}>📋 Copy</button>
              <a className="btn bg-[#25D366] !px-4 !py-2 text-sm text-white" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </div>
          <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Tip: WhatsApp pe send karo → link open → signup ✅</p>
        </section>

        <section className="rounded-[26px] bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-start justify-between">
            <div><h2 className="text-[17px] font-extrabold text-[#0f1b4d]">This Month Snapshot</h2><p className="text-[13px] text-slate-600">Direct + downline activity</p></div>
            <span className="text-sm font-semibold text-slate-600">{stats?.downline ?? team?.length ?? 0} members</span>
          </div>
          <ErrorNote msg={statsErr} />
          <div className="grid grid-cols-2 gap-2.5">
            <Tile icon="👤" label="Direct" value={String(stats?.direct ?? team?.length ?? 0)} sub="Joined under you" />
            <Tile icon="🌳" label="Downline" value={String(stats?.downline ?? '—')} sub="All levels" />
            <Tile icon="🧾" label="Orders" value={String(stats?.orders_month ?? '—')} sub="This month" />
            <Tile icon="₹" label="Sales" value={stats ? inr(stats.sales_month) : '—'} sub="Paid this month" />
            <Tile icon="🕒" label="Last Order" value={stats?.last_order ? fmtDate(stats.last_order) : '—'} sub="Across team" />
            <Link to="/leaderboard" className="block"><Tile icon="🏆" label="Leaderboard" value="Open" sub="See top partners" /></Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">Each partner earns only from sales made through their own link — there is no income from recruiting.</p>
        </section>

        <section className="rounded-[26px] bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
          <h2 className="text-[17px] font-extrabold text-[#0f1b4d]">My Team</h2>
          <p className="mb-3 text-[13px] text-slate-600">People who joined with your code</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(q) }}>
            <input className="input" placeholder="Search name / city" value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) setApplied('') }} />
            <button className="btn-primary shrink-0 !px-5">Search</button>
          </form>
          <div className="mt-3 flex gap-2">
            {([['all', 'All'], ['active', 'Active'], ['new', 'New']] as [Filter, string][]).map(([f, l]) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${filter === f ? 'bg-[#2347c9] text-white' : 'bg-slate-100 text-slate-700'}`}>{l}</button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Active = made a sale in the last 30 days • New = joined in the last 30 days</p>
          <div className="mt-2">
            {loading ? <Spinner /> : !members.length ? <Empty icon="👥" title="No members found" text={team?.length ? 'Try a different search or filter.' : 'Partners who join with your code will appear here.'} /> : (
              <ul className="divide-y divide-slate-100">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <Avatar name={m.full_name} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{m.full_name}</p>
                      <p className="text-xs text-slate-500">{m.city || '—'} • joined {fmtDate(m.created_at)}</p>
                    </div>
                    <span className="text-right text-xs text-slate-500"><b className="block text-base text-slate-900">{m.paid_sales}</b>sales</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </Shell>
  )
}

function Tile({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="h-full rounded-2xl border border-slate-200 p-3">
      <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-base font-bold">{icon}</span><span className="text-sm font-bold text-slate-700">{label}</span></div>
      <p className="mt-2 truncate text-xl font-extrabold">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Empty, ErrorNote, Shell, Spinner, SubHeader } from '../components/ui'
import { api, inr } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import type { LeaderRow } from '../lib/types'

export default function Leaderboard() {
  const { profile } = useSession()
  const [scope, setScope] = useState<'city' | 'india'>('india')
  const [rows, loading, reload, err] = useLoad(() => api.leaderboard(scope), [scope])
  const list = rows ?? []
  const me = list.find((r) => r.is_me)
  const others = list.filter((r) => !r.is_me || r.sales > 0)
  const noCity = scope === 'city' && !profile?.city

  return (
    <Shell>
      <SubHeader eyebrow="This month" title="Live Leaderboard" right={<button className="icon-btn" onClick={reload} aria-label="Refresh">⟳</button>} />
      <main className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-sm">
          {(['city', 'india'] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} aria-pressed={scope === s}
              className={`rounded-xl py-2.5 text-sm font-bold ${scope === s ? 'bg-[#e8eeff] text-[#2347c9]' : 'text-slate-600'}`}>
              {s === 'city' ? 'My City' : 'All over India'}
            </button>
          ))}
        </div>
        <ErrorNote msg={err} />
        {noCity ? (
          <Empty icon="📍" title="Add your city first" text="Set your city in Profile → Edit personal details to see your city's leaderboard." />
        ) : loading ? <Spinner /> : (
          <>
            {me && (
              <p className="text-center text-sm font-semibold text-slate-600">
                You are #{me.rank}{scope === 'city' && profile?.city ? ` in ${profile.city}` : ' in India'} • Business {inr(me.sales)}
              </p>
            )}
            {others.length >= 1 && (others[0].sales > 0 || others[0].pinned) && <Podium rows={others.filter((r) => r.sales > 0 || r.pinned).slice(0, 3)} />}
            {me && <MeRow r={me} />}
            <section className="overflow-hidden rounded-[22px] bg-white shadow-sm">
              <div className="grid grid-cols-[56px_1fr_auto] bg-[#0f1b4d] px-4 py-3 text-sm font-bold text-white"><span>Rank</span><span>Partner</span><span>Business</span></div>
              {others.filter((r) => r.sales > 0 || r.pinned).length === 0
                ? <p className="py-8 text-center text-sm font-semibold text-slate-500">No sales yet this month — be the first!</p>
                : others.filter((r) => r.sales > 0 || r.pinned).map((r) => (
                  <div key={r.partner_id} className={`grid grid-cols-[56px_1fr_auto] items-center border-t border-slate-100 px-4 py-3 ${r.is_me ? 'bg-emerald-50' : ''}`}>
                    <span className="text-lg font-extrabold text-slate-700">{r.rank}</span>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={r.full_name} />
                      <span className="min-w-0"><b className="block truncate">{r.full_name}</b><span className="block truncate text-xs text-slate-500">{r.city || '—'}{r.pinned && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">⭐ Featured</span>}</span></span>
                    </span>
                    <span className="text-sm font-bold text-slate-700">{inr(r.sales)}</span>
                  </div>
                ))}
            </section>
          </>
        )}
        <p className="px-2 text-center text-xs text-slate-400">Ranked by paid sales through each member's own link this calendar month. ⭐ Featured members are placed by the team.</p>
      </main>
    </Shell>
  )
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const ini = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  return <span className="grid shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600" style={{ width: size, height: size }}>{ini}</span>
}

function MeRow({ r }: { r: LeaderRow }) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3">
      <span className="text-xs font-semibold text-slate-500">Rank<b className="block text-xl text-slate-900">{r.rank}</b></span>
      <Avatar name={r.full_name} size={40} />
      <span className="min-w-0 flex-1"><b className="block truncate">{r.full_name} (you)</b><span className="text-xs text-slate-500">{r.city || '—'} • {inr(r.sales)} business</span></span>
    </div>
  )
}

/** Top-3 podium: 2nd, 1st, 3rd. */
export function Podium({ rows }: { rows: LeaderRow[] }) {
  const order = [rows[1], rows[0], rows[2]]
  const label = ['2nd', '1st', '3rd']
  return (
    <div className="grid grid-cols-3 items-end gap-2 rounded-[22px] bg-white p-3 shadow-sm">
      {order.map((r, i) => r ? (
        <div key={r.partner_id} className={`flex flex-col items-center rounded-2xl border border-slate-100 px-1 py-2 text-center ${i === 1 ? 'pb-4' : ''}`}>
          <span className="text-xs font-bold text-slate-500">{label[i]}</span>
          <span className={`mt-1 rounded-full p-[3px] ${i === 1 ? 'bg-gradient-to-br from-gold-300 to-gold-600' : 'bg-slate-200'}`}>
            <span className="block rounded-full bg-white"><Avatar name={r.full_name} size={i === 1 ? 64 : 50} /></span>
          </span>
          <b className="mt-1.5 line-clamp-2 text-[12.5px] leading-tight">{r.full_name}</b>
          <span className="text-[11px] font-semibold uppercase text-slate-500">{r.city || '—'}</span>
          {r.pinned && <span className="mt-0.5 text-[10px] font-bold text-amber-600">⭐ Featured</span>}
        </div>
      ) : <span key={i} />)}
    </div>
  )
}

/** Compact card for Home: podium + link to the full page. */
export function LeaderboardCard() {
  const [rows] = useLoad(() => api.leaderboard('india').catch(() => [] as LeaderRow[]), [])
  const top = (rows ?? []).filter((r) => r.sales > 0 || r.pinned).slice(0, 3)
  return (
    <section className="rounded-[26px] bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <div><h2 className="text-[17px] font-extrabold text-[#0f1b4d]">Live Leaderboard</h2><p className="text-[13px] text-slate-600">Top performers of this month</p></div>
        <Link to="/leaderboard" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800">See Full</Link>
      </div>
      {top.length ? <Podium rows={top} /> : <p className="py-4 text-center text-sm text-slate-500">No sales yet this month — be the first on the board!</p>}
    </section>
  )
}

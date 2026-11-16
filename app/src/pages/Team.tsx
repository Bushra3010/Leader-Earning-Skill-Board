import { AppHeader, copyText, Empty, ErrorNote, Shell, Spinner } from '../components/ui'
import { api, fmtDate, PUBLIC_URL } from '../lib/api'
import { useLoad, useSession } from '../lib/session'

export default function Team() {
  const { profile, toast } = useSession()
  const [team, loading, , err] = useLoad(() => api.listTeam(), [])
  const invite = `${PUBLIC_URL}/register?ref=${profile?.referral_code ?? ''}`
  const msg = `Main Leaders Earning & Skill Board par education products share karke kamata/kamati hoon. Joining free hai — tum bhi join karo: ${invite}`
  return (
    <Shell>
      <AppHeader page="Team" />
      <main className="space-y-4 p-4">
        <ErrorNote msg={err} />
        <section className="rounded-3xl bg-gradient-to-br from-navy-900 to-navy-600 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">Invite friends</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">Grow together</h2>
          <p className="mt-1 text-sm text-white/80">Invite friends to become partners. Each partner earns only from their own sales — joining is always free, no one pays to join.</p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 p-3">
            <span className="text-sm text-white/70">Your code</span>
            <span className="font-mono text-lg font-bold tracking-wider text-gold-300">{profile?.referral_code}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <a className="btn bg-[#25D366] text-white" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">Invite on WhatsApp</a>
            <button className="btn-gold" onClick={async () => { await copyText(invite); toast('Invite link copied') }}>Copy invite link</button>
          </div>
        </section>

        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">My team</h2>
            <span className="chip">{team?.length ?? 0} partners</span>
          </div>
          {loading ? <Spinner /> : !team?.length ? <Empty icon="👥" title="No team members yet" text="Partners who join with your code will appear here." /> : (
            <ul className="divide-y divide-slate-100">
              {team.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent-soft)] font-bold text-[var(--accent-text)]">{m.full_name.slice(0, 1).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{m.full_name}</p>
                    <p className="text-xs text-slate-500">{m.city || '—'} • joined {fmtDate(m.created_at)}</p>
                  </div>
                  <span className="text-right text-xs text-slate-500"><b className="block text-base text-slate-900">{m.paid_sales}</b>sales</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </Shell>
  )
}

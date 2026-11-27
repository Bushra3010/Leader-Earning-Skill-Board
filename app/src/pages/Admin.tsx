import { useEffect, useState } from 'react'
import { Empty, ErrorNote, Sheet, Shell, Spinner, SubHeader } from '../components/ui'
import { api, fmtDate, inr } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import { DEFAULT_ROLE_FEATURES, FEATURES, memberCan, ROLE_LABEL, type DeliveryStatus, type DemoVideo, type Feature, type MemberStat, type OrderStatus, type Product, type Profile, type Role, type Settings } from '../lib/types'
import { CAT_LABEL, categoryOf } from '../lib/category'

type Tab = 'members' | 'support' | 'orders' | 'payouts' | 'products' | 'videos' | 'broadcast' | 'settings'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('members')
  return (
    <Shell>
      <SubHeader eyebrow="Admin" title="Control panel" />
      <div className="no-scrollbar sticky top-[69px] z-20 flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2.5">
        {(['members', 'support', 'orders', 'payouts', 'products', 'videos', 'broadcast', 'settings'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === t ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600'}`}>{t}</button>
        ))}
      </div>
      <main className="space-y-3 p-4">
        {tab === 'orders' && <OrdersAdmin />}
        {tab === 'payouts' && <PayoutsAdmin />}
        {tab === 'members' && <MembersAdmin />}
        {tab === 'support' && <SupportAdmin />}
        {tab === 'videos' && <VideosAdmin />}
        {tab === 'products' && <ProductsAdmin />}
        {tab === 'broadcast' && <BroadcastAdmin />}
        {tab === 'settings' && <SettingsAdmin />}
      </main>
    </Shell>
  )
}

function OrdersAdmin() {
  const { toast } = useSession()
  const [list, loading, reload, err] = useLoad(() => api.adminListOrders(), [])
  const [q, setQ] = useState('')
  const upd = async (id: string, patch: { status?: OrderStatus; delivery?: DeliveryStatus }) => {
    try { await api.adminUpdateOrder(id, patch); toast('Updated'); reload() } catch (e) { toast(e instanceof Error ? e.message : 'Failed') }
  }
  const s = q.toLowerCase()
  const shown = (list ?? []).filter((o) => !s || [o.buyer_name, o.buyer_phone, o.order_code, o.products?.title ?? '', o.profiles?.referral_code ?? ''].some((v) => v.toLowerCase().includes(s)))
  return (
    <>
      <ErrorNote msg={err} />
      <input className="input" placeholder="Search name, phone, order id, partner code…" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="text-xs text-slate-500">Mark an order <b>paid</b> once payment is received — commission is credited to the partner automatically.</p>
      {loading ? <Spinner /> : !shown.length ? <Empty icon="🧾" title="No orders" /> : shown.map((o) => (
        <div key={o.id} className="card space-y-2 p-4">
          <div className="flex justify-between gap-2">
            <div className="min-w-0"><p className="font-bold">{o.buyer_name} <span className="font-normal text-slate-500">• {o.buyer_phone}</span></p>
              <p className="truncate text-sm text-slate-600">{o.products?.title}</p>
              <p className="text-xs text-slate-500">{o.order_code} • {fmtDate(o.created_at)} • Partner: {o.profiles ? `${o.profiles.full_name} (${o.profiles.referral_code})` : 'Direct'}</p>
              {o.buyer_address && <p className="text-xs text-slate-500">📍 {o.buyer_address}</p>}</div>
            <p className="shrink-0 text-right font-extrabold">{inr(o.amount)}{o.commission_amount > 0 && <span className="block text-xs font-semibold text-emerald-700">comm. {inr(o.commission_amount)}</span>}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="input !py-2 text-sm" value={o.status} onChange={(e) => upd(o.id, { status: e.target.value as OrderStatus })}>
              {['pending', 'paid', 'cancelled', 'halted', 'failed', 'refunded'].map((x) => <option key={x}>{x}</option>)}
            </select>
            <select className="input !py-2 text-sm" value={o.delivery} onChange={(e) => upd(o.id, { delivery: e.target.value as DeliveryStatus })}>
              {['not_applicable', 'pending', 'shipped', 'delivered'].map((x) => <option key={x} value={x}>{x === 'not_applicable' ? 'no delivery' : x}</option>)}
            </select>
          </div>
        </div>
      ))}
    </>
  )
}

function PayoutsAdmin() {
  const { toast } = useSession()
  const [list, loading, reload, err] = useLoad(() => api.adminListWithdrawals(), [])
  const upd = async (id: string, st: 'approved' | 'paid' | 'rejected') => {
    const note = st === 'rejected' ? window.prompt('Reason for rejection?') ?? '' : undefined
    try { await api.adminUpdateWithdrawal(id, st, note); toast('Updated'); reload() } catch (e) { toast(e instanceof Error ? e.message : 'Failed') }
  }
  return (
    <>
      <ErrorNote msg={err} />
      {loading ? <Spinner /> : !list?.length ? <Empty icon="🏦" title="No withdrawal requests" /> : list.map((w) => (
        <div key={w.id} className="card p-4">
          <div className="flex justify-between"><p className="font-bold">{w.profiles?.full_name}</p><p className="font-extrabold">{inr(w.amount)}</p></div>
          <p className="text-sm text-slate-600">{w.profiles?.upi_id ? `UPI: ${w.profiles.upi_id}` : `A/c ${w.profiles?.bank_account_number} • ${w.profiles?.bank_ifsc}`}</p>
          <p className="text-xs text-slate-500">{fmtDate(w.created_at)} • <span className="capitalize">{w.status}</span>{w.admin_note && ` • ${w.admin_note}`}</p>
          {(w.status === 'requested' || w.status === 'approved') && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {w.status === 'requested' && <button className="btn-soft !px-2" onClick={() => upd(w.id, 'approved')}>Approve</button>}
              <button className="btn-primary !px-2" onClick={() => upd(w.id, 'paid')}>Mark paid</button>
              <button className="btn-outline !px-2 text-red-600" onClick={() => upd(w.id, 'rejected')}>Reject</button>
            </div>
          )}
        </div>
      ))}
    </>
  )
}

function VideosAdmin() {
  const { toast } = useSession()
  const [list, loading, reload, err] = useLoad(() => api.listVideos(), [])
  const [products] = useLoad(() => api.listProducts(), [])
  const [edit, setEdit] = useState<Partial<DemoVideo> | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [formErr, setFormErr] = useState<string | null>(null)
  const pname = (id: string | null) => (products ?? []).find((p) => p.id === id)?.title.trim()
  return (
    <>
      <ErrorNote msg={err} />
      <button className="btn-gold w-full" onClick={() => { setFormErr(null); setEdit({ title: '', video_url: '', product_id: null, active: true, sort_order: (list?.length ?? 0) }) }}>+ Add demo video</button>
      <p className="text-xs text-slate-500">Short 30–60 sec videos (phone recordings are fine). They show on Home under “Videos To Help You Start”, and on the linked product's page.</p>
      {loading ? <Spinner /> : !list?.length ? <Empty icon="🎬" title="No videos yet" text="Add your first demo video." /> : list.map((v) => (
        <div key={v.id} className="card flex items-center gap-3 p-3">
          <video src={`${v.video_url}#t=0.5`} preload="metadata" muted playsInline className="h-20 w-14 shrink-0 rounded-xl bg-slate-900 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{v.title}</p>
            <p className="truncate text-xs text-slate-500">{pname(v.product_id) ?? 'Not linked to a product'}{!v.active && ' • hidden'}</p>
          </div>
          <button className="icon-btn" aria-label={`Edit ${v.title}`} onClick={() => { setFormErr(null); setEdit(v) }}>✏️</button>
        </div>
      ))}
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit video' : 'Add demo video'}>
        {edit && (
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault(); setFormErr(null)
            if (!edit.title?.trim()) return setFormErr('Add a title')
            if (!edit.video_url) return setFormErr('Upload a video first')
            try { await api.adminSaveVideo({ ...edit, title: edit.title.trim(), video_url: edit.video_url } as DemoVideo); toast('Video saved'); setEdit(null); reload() }
            catch (er) { setFormErr(er instanceof Error ? er.message : 'Failed') }
          }}>
            {edit.video_url
              ? <video src={edit.video_url} controls playsInline className="max-h-72 w-full rounded-2xl bg-black" />
              : <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">No video yet</div>}
            <label className={`btn-primary w-full cursor-pointer ${busy ? 'opacity-60' : ''}`}>
              {busy ?? (edit.video_url ? 'Replace video' : '🎬 Upload video (MP4, under 50 MB)')}
              <input type="file" accept="video/*" className="hidden" disabled={!!busy} onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = ''
                if (!f) return
                if (f.size > 50 * 1024 * 1024) return setFormErr('Video must be under 50 MB — a 30–60 sec clip usually is')
                setBusy('Uploading… keep this screen open'); setFormErr(null)
                try { const url = await api.adminUploadVideo(f); setEdit((cur) => cur && { ...cur, video_url: url, title: cur.title || f.name.replace(/\.[^.]+$/, '') }) }
                catch (er) { setFormErr(er instanceof Error ? er.message : 'Upload failed') } finally { setBusy(null) }
              }} />
            </label>
            <label className="label">Title<input className="input mt-1" placeholder="e.g. Memory Kit Demo" value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
            <label className="label">Linked product (optional)
              <select className="input mt-1" value={edit.product_id ?? ''} onChange={(e) => setEdit({ ...edit, product_id: e.target.value || null })}>
                <option value="">None</option>
                {(products ?? []).map((p) => <option key={p.id} value={p.id}>{p.title.trim()}</option>)}
              </select></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="label">Order<input className="input mt-1" inputMode="numeric" value={edit.sort_order ?? 0} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></label>
              <label className="mt-6 flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-sm font-semibold"><input type="checkbox" checked={edit.active ?? true} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />Visible</label>
            </div>
            <ErrorNote msg={formErr} />
            <button className="btn-gold w-full" disabled={!!busy}>Save video</button>
            {edit.id && <button type="button" className="btn-outline w-full text-red-600" onClick={async () => {
              if (!window.confirm('Delete this video from the app?')) return
              try { await api.adminDeleteVideo(edit.id!); toast('Deleted'); setEdit(null); reload() } catch (er) { setFormErr(er instanceof Error ? er.message : 'Failed') }
            }}>Delete video</button>}
          </form>
        )}
      </Sheet>
    </>
  )
}

function SupportAdmin() {
  const { toast, settings } = useSession()
  const [list, loading, reload, err] = useLoad(() => api.adminListTickets(), [])
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const all = list ?? []
  const shown = all.filter((t) => filter === 'all' || t.status === filter)
  const save = async (id: string, patch: { status?: 'open' | 'closed'; admin_reply?: string | null }, msg: string) => {
    try { await api.adminUpdateTicket(id, patch); toast(msg); reload() } catch (e) { toast(e instanceof Error ? e.message : 'Failed') }
  }
  const noContacts = !settings.support_phone && !settings.support_email && !settings.whatsapp_number
  return (
    <>
      <ErrorNote msg={err} />
      {noContacts && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Add your support phone, email and WhatsApp in <b>Settings</b> so members can also call or message you directly.</p>}
      <div className="flex gap-2">
        {([['open', `Open (${all.filter((t) => t.status === 'open').length})`], ['closed', 'Closed'], ['all', 'All']] as const).map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${filter === f ? 'bg-navy-800 text-white' : 'bg-white text-slate-600 shadow-sm'}`}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner /> : !shown.length ? <Empty icon="💬" title={filter === 'open' ? 'No open requests' : 'No requests'} /> : shown.map((t) => {
        const phone = (t.profiles?.phone ?? '').replace(/\D/g, '')
        const draft = drafts[t.id] ?? t.admin_reply ?? ''
        return (
          <div key={t.id} className={`card space-y-2 p-4 ${t.status === 'open' && !t.admin_reply ? 'ring-2 ring-amber-200' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold">{t.subject}</p>
                <p className="truncate text-xs text-slate-500">{t.profiles?.full_name ?? '—'} • {t.profiles?.referral_code} • {t.profiles?.phone || 'no phone'}{t.profiles?.approval_status && t.profiles.approval_status !== 'approved' ? ` • ${t.profiles.approval_status}` : ''}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">{fmtDate(t.created_at)}</span>
            </div>
            <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{t.message}</p>
            <textarea className="input min-h-[70px] text-sm" placeholder="Write a reply — the member sees it in Help & Support" value={draft} onChange={(e) => setDrafts({ ...drafts, [t.id]: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-primary !py-2 text-sm" disabled={!draft.trim() || draft === (t.admin_reply ?? '')} onClick={() => save(t.id, { admin_reply: draft.trim() }, 'Reply sent')}>Send reply</button>
              {t.status === 'open'
                ? <button className="btn-soft !py-2 text-sm" onClick={() => save(t.id, { status: 'closed' }, 'Closed')}>✓ Close</button>
                : <button className="btn-soft !py-2 text-sm" onClick={() => save(t.id, { status: 'open' }, 'Reopened')}>Reopen</button>}
            </div>
            {phone.length >= 10 && (
              <div className="grid grid-cols-2 gap-2">
                <a className="btn-outline !py-2 text-sm" href={`tel:${t.profiles?.phone}`}>📞 Call</a>
                <a className="btn bg-[#25D366] !py-2 text-sm text-white" href={`https://wa.me/${phone.length === 10 ? '91' + phone : phone}?text=${encodeURIComponent(`Hello ${t.profiles?.full_name ?? ''}, this is Leaders support about: ${t.subject}`)}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

type MemberFilter = 'all' | 'pending' | 'partner' | 'associate' | 'admin'

function MembersAdmin() {
  const { toast, profile: me } = useSession()
  const [list, loading, reload, err] = useLoad(() => api.adminListMembers(), [])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<MemberFilter>('all')
  const [open, setOpen] = useState<string | null>(null)
  const upd = async (id: string, patch: Partial<Profile>, msg = 'Updated') => {
    try { await api.adminUpdatePartner(id, patch); toast(msg); reload() } catch (e) { toast(e instanceof Error ? e.message : 'Failed') }
  }
  const all = list ?? []
  const pending = all.filter((m) => m.approval_status === 'pending' && m.role !== 'admin')
  const t = q.trim().toLowerCase()
  const shown = all
    .filter((m) => filter === 'all' || (filter === 'pending' ? m.approval_status === 'pending' && m.role !== 'admin' : m.role === filter))
    .filter((m) => !t || [m.full_name, m.phone ?? '', m.email ?? '', m.referral_code, m.city ?? ''].some((v) => v.toLowerCase().includes(t)))
  const total = (k: 'incentive_earned' | 'paid_out' | 'pending_payout' | 'wallet_balance') => all.reduce((a, m) => a + m[k], 0)

  const csv = () => {
    const head = ['Name', 'Type', 'Approval', 'Member ID', 'Phone', 'Email', 'City', 'Referred by', 'Team size', 'Paid orders', 'Sales', 'Incentive earned', 'Paid out', 'Pending payout', 'Balance', 'Joined']
    const rows = shown.map((m) => [m.full_name, ROLE_LABEL[m.role], m.approval_status, m.referral_code, m.phone ?? '', m.email ?? '', m.city ?? '',
      m.upline_name ? `${m.upline_name} (${m.upline_code})` : '', m.team_size, m.paid_orders, m.sales_amount, m.incentive_earned, m.paid_out, m.pending_payout, m.wallet_balance, m.created_at.slice(0, 10)])
    const text = [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv' }))
    a.download = `members-incentive-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  return (
    <>
      <ErrorNote msg={err} />
      <div className="grid grid-cols-2 gap-2">
        <Sum label="Members" value={String(all.length)} sub={`${all.filter((m) => m.role === 'partner').length} partners • ${all.filter((m) => m.role === 'associate').length} associates`} />
        <Sum label="Waiting approval" value={String(pending.length)} sub="New sign-ups" tone={pending.length ? 'amber' : undefined} onClick={() => setFilter('pending')} />
        <Sum label="Incentive earned" value={inr(total('incentive_earned'))} sub="All members, all time" />
        <Sum label="Paid out" value={inr(total('paid_out'))} sub={`${inr(total('pending_payout'))} requested • ${inr(total('wallet_balance'))} in wallets`} />
      </div>
      <input className="input" placeholder="Search name, phone, email, member ID, city…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {([['all', 'All'], ['pending', `Pending (${pending.length})`], ['partner', 'Partners'], ['associate', 'Associates'], ['admin', 'Admins']] as [MemberFilter, string][]).map(([f, l]) => (
          <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold ${filter === f ? 'bg-navy-800 text-white' : 'bg-white text-slate-600 shadow-sm'}`}>{l}</button>
        ))}
        <button onClick={csv} className="ml-auto shrink-0 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-slate-700 shadow-sm">⬇ CSV</button>
      </div>
      {loading ? <Spinner /> : !shown.length ? <Empty icon="👥" title="No members found" /> : shown.map((m) => (
        <div key={m.id} className={`card p-4 ${m.approval_status === 'pending' && m.role !== 'admin' ? 'ring-2 ring-amber-300' : ''}`}>
          <button className="flex w-full items-start justify-between gap-2 text-left" onClick={() => setOpen(open === m.id ? null : m.id)}>
            <div className="min-w-0">
              <p className="font-bold">{m.full_name || '—'} <span className="chip ml-1">{ROLE_LABEL[m.role]}</span>
                {m.approval_status !== 'approved' && m.role !== 'admin' && <span className={`chip ml-1 ${m.approval_status === 'pending' ? '!border-amber-200 !bg-amber-50 !text-amber-700' : '!border-red-200 !bg-red-50 !text-red-700'}`}>{m.approval_status}</span>}
                {m.leaderboard_pin && <span className="chip ml-1 !border-amber-200 !bg-amber-50 !text-amber-700">⭐ #{m.leaderboard_pin}</span>}</p>
              <p className="truncate text-xs text-slate-500">{m.referral_code} • {m.phone || 'no phone'} • {m.city || 'no city'}</p>
              {m.upline_name && <p className="truncate text-xs text-slate-500">Referred by {m.upline_name} ({m.upline_code})</p>}
            </div>
            <span className="shrink-0 text-right"><b className="block text-emerald-700">{inr(m.incentive_earned)}</b><span className="text-[11px] text-slate-500">incentive</span></span>
          </button>
          {m.approval_status === 'pending' && m.role !== 'admin' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn-primary !py-2 text-sm" onClick={() => upd(m.id, { approval_status: 'approved' }, 'Approved')}>✓ Approve</button>
              <button className="btn-outline !py-2 text-sm text-red-600" onClick={() => upd(m.id, { approval_status: 'rejected' }, 'Rejected')}>Reject</button>
            </div>
          )}
          {open === m.id && (
            <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <Mini label="Team" value={String(m.team_size)} /><Mini label="Paid orders" value={String(m.paid_orders)} /><Mini label="Sales" value={inr(m.sales_amount)} />
                <Mini label="Paid out" value={inr(m.paid_out)} /><Mini label="Requested" value={inr(m.pending_payout)} /><Mini label="Balance" value={inr(m.wallet_balance)} />
              </div>
              <p className="text-xs text-slate-500">{m.email} • joined {fmtDate(m.created_at)}</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-slate-500">Member type
                  <select className="input mt-1 !py-2 text-sm" value={m.role} disabled={m.id === me?.id} onChange={(e) => upd(m.id, { role: e.target.value as Role })}>
                    {(['associate', 'partner', 'admin'] as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select></label>
                <label className="text-xs font-semibold text-slate-500">Approval
                  <select className="input mt-1 !py-2 text-sm" value={m.approval_status} onChange={(e) => upd(m.id, { approval_status: e.target.value as MemberStat['approval_status'] })}>
                    <option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option>
                  </select></label>
                <label className="text-xs font-semibold text-slate-500">Partner fee (₹ kit)
                  <select className="input mt-1 !py-2 text-sm" value={m.kit_status} onChange={(e) => upd(m.id, { kit_status: e.target.value as MemberStat['kit_status'] })}>
                    <option value="not_paid">not paid</option><option value="pending">pending review</option><option value="paid">paid → Partner</option>
                  </select></label>
                <label className="text-xs font-semibold text-slate-500">KYC
                  <select className="input mt-1 !py-2 text-sm" value={m.kyc_status} onChange={(e) => upd(m.id, { kyc_status: e.target.value as MemberStat['kyc_status'] })}>
                    {['not_submitted', 'submitted', 'verified', 'rejected'].map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}
                  </select></label>
                <label className="col-span-2 text-xs font-semibold text-slate-500">Leaderboard position (overrides sales)
                  <select className="input mt-1 !py-2 text-sm" value={m.leaderboard_pin ?? ''} onChange={(e) => upd(m.id, { leaderboard_pin: e.target.value ? Number(e.target.value) : null }, e.target.value ? `Pinned at #${e.target.value}` : 'Pin removed')}>
                    <option value="">By sales (not pinned)</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Pin at #{n}</option>)}
                  </select></label>
              </div>
              <MemberMenus m={m} onSave={(o, msg) => upd(m.id, { feature_overrides: o }, msg)} />
            </div>
          )}
        </div>
      ))}
      <p className="px-1 text-center text-xs text-slate-400">Tap a member for details. Incentive = commission credited for their own paid sales (after reversals).</p>
    </>
  )
}

/** Per-member menu switches. Ticks start from the member type's settings; changing one makes it custom for this member. */
function MemberMenus({ m, onSave }: { m: MemberStat; onSave: (o: Partial<Record<Feature, boolean>>, msg: string) => void }) {
  const { settings } = useSession()
  if (m.role === 'admin') return <p className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-500">Admins always see every menu.</p>
  const rf = { ...DEFAULT_ROLE_FEATURES, ...settings.role_features }
  const o = m.feature_overrides ?? {}
  const custom = Object.keys(o).length > 0
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-bold">Menus for this member {custom && <span className="chip ml-1 !border-violet-200 !bg-violet-50 !text-violet-700">custom</span>}</p>
        {custom && <button className="text-xs font-semibold text-[#2347c9] underline" onClick={() => onSave({}, `Reset to ${ROLE_LABEL[m.role]} settings`)}>Reset</button>}
      </div>
      <p className="mb-2 text-[11px] text-slate-500">Starts from the {ROLE_LABEL[m.role]} settings. Tick or untick to change it just for {m.full_name || 'this member'}.</p>
      <ul className="divide-y divide-slate-100">
        {FEATURES.map((f) => {
          const on = memberCan(m, f.id, rf)
          const typeDefault = (rf[m.role as 'partner' | 'associate'] ?? []).includes(f.id)
          return (
            <li key={f.id} className="flex items-center gap-3 py-2">
              <span className="flex-1 text-sm">{f.label}{typeof o[f.id] === 'boolean' && <span className="ml-1 text-[11px] text-violet-600">(changed)</span>}</span>
              <input type="checkbox" className="h-5 w-5" aria-label={`${f.label} for ${m.full_name}`} checked={on} onChange={(e) => {
                const next = { ...o }
                if (e.target.checked === typeDefault) delete next[f.id]; else next[f.id] = e.target.checked
                onSave(next, `${f.label}: ${e.target.checked ? 'on' : 'off'} for ${m.full_name || 'member'}`)
              }} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Sum({ label, value, sub, tone, onClick }: { label: string; value: string; sub: string; tone?: 'amber'; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick} className={`rounded-2xl p-3 text-left shadow-sm ${tone === 'amber' ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-white'}`}>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="truncate text-lg font-extrabold">{value}</p>
      <p className="truncate text-[11px] text-slate-500">{sub}</p>
    </button>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-2"><p className="truncate font-bold text-slate-900">{value}</p><p className="text-slate-500">{label}</p></div>
}

const EMPTY: Partial<Product> = { mode: 'pro_school', title: '', slug: '', subtitle: '', emoji: '📘', price: 0, billing: 'one_time', duration: '', commission_pct: 10,
  best_for: '', description: '', features: [], pitch: '', is_physical: false, is_featured: false, requires_partner_kit: false, active: true }

function ProductsAdmin() {
  const { toast } = useSession()
  const [list, loading, reload] = useLoad(() => api.listProducts(), [])
  const [edit, setEdit] = useState<Partial<Product> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setEdit((e) => ({ ...e!, [k]: v }))
  return (
    <>
      <button className="btn-primary w-full" onClick={() => { setErr(null); setEdit({ ...EMPTY }) }}>+ Add product</button>
      {loading ? <Spinner /> : list?.map((p) => (
        <button key={p.id} className="card flex w-full items-center gap-3 p-3 text-left" onClick={() => { setErr(null); setEdit(p) }}>
          <span className="text-2xl">{p.emoji}</span>
          <div className="min-w-0 flex-1"><p className="truncate font-bold">{p.title}</p><p className="text-xs text-slate-500">{CAT_LABEL[categoryOf(p)]} • {inr(p.price)} • {p.commission_pct}%{!p.active && ' • hidden'}</p></div>
          <span className="text-slate-400">✏️</span>
        </button>
      ))}
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit product' : 'New product'}>
        {edit && (
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault(); setErr(null)
            const slug = (edit.slug || edit.title || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            if (!slug) return setErr('Title is required')
            try { await api.adminSaveProduct({ ...edit, title: (edit.title ?? '').trim(), subtitle: edit.subtitle?.trim() ?? null, duration: edit.duration?.trim() ?? null, slug }); toast('Saved'); setEdit(null); reload() } catch (er) { setErr(er instanceof Error ? er.message : 'Failed') }
          }}>
            <div className="grid grid-cols-[64px_1fr] gap-2"><input className="input text-center text-xl" value={edit.emoji} onChange={(e) => set('emoji', e.target.value)} /><input className="input" placeholder="Title" required value={edit.title} onChange={(e) => set('title', e.target.value)} /></div>
            <input className="input" placeholder="Subtitle" value={edit.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <select className="input" value={edit.billing} onChange={(e) => set('billing', e.target.value as Product['billing'])}><option value="one_time">One-time</option><option value="monthly">Monthly</option></select>
              <span className="self-center text-xs text-slate-500">Shows under <b>{CAT_LABEL[categoryOf({ billing: edit.billing ?? 'one_time', is_physical: !!edit.is_physical })]}</b><br />(monthly = Subscription, needs delivery = E-Commerce)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs font-semibold text-slate-500">Price ₹<input className="input mt-1" inputMode="numeric" value={edit.price} onChange={(e) => set('price', Number(e.target.value.replace(/\D/g, '')))} /></label>
              <label className="text-xs font-semibold text-slate-500">Commission %<input className="input mt-1" inputMode="decimal" value={edit.commission_pct} onChange={(e) => set('commission_pct', Number(e.target.value) || 0)} /></label>
              <label className="text-xs font-semibold text-slate-500">Duration<input className="input mt-1" value={edit.duration ?? ''} onChange={(e) => set('duration', e.target.value)} /></label>
            </div>
            <PictureField url={edit.image_url ?? null} slug={edit.slug || (edit.title ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')} onChange={(u) => set('image_url', u)} />
            <div className="grid grid-cols-1 gap-2">
              <label className="text-xs font-semibold text-slate-500">MRP ₹ (optional — shows a % OFF badge when higher than price)<input className="input mt-1" inputMode="numeric" value={edit.mrp ?? ''} onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); set('mrp', v ? Number(v) : null) }} /></label>
            </div>
            <input className="input" placeholder="Best for" value={edit.best_for ?? ''} onChange={(e) => set('best_for', e.target.value)} />
            <textarea className="input min-h-[70px]" placeholder="Description" value={edit.description ?? ''} onChange={(e) => set('description', e.target.value)} />
            <textarea className="input min-h-[70px]" placeholder="Features (one per line)" value={(edit.features ?? []).join('\n')} onChange={(e) => set('features', e.target.value.split('\n').filter(Boolean))} />
            <textarea className="input min-h-[70px]" placeholder="Copy-paste selling pitch" value={edit.pitch ?? ''} onChange={(e) => set('pitch', e.target.value)} />
            <div className="grid grid-cols-2 gap-2 text-sm">
              {([['active', 'Visible'], ['is_featured', 'Featured banner'], ['is_physical', 'Needs delivery'], ['requires_partner_kit', 'Needs partner kit']] as [keyof Product, string][]).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5"><input type="checkbox" checked={Boolean(edit[k])} onChange={(e) => set(k, e.target.checked as never)} />{l}</label>
              ))}
            </div>
            <ErrorNote msg={err} />
            <button className="btn-primary w-full">Save product</button>
          </form>
        )}
      </Sheet>
    </>
  )
}

function BroadcastAdmin() {
  const { toast } = useSession()
  const [t, setT] = useState('')
  const [b, setB] = useState('')
  return (
    <form className="card space-y-3 p-4" onSubmit={async (e) => {
      e.preventDefault()
      try { await api.adminBroadcast(t, b); toast('Sent to all partners'); setT(''); setB('') } catch (er) { toast(er instanceof Error ? er.message : 'Failed') }
    }}>
      <h3 className="font-extrabold">Send notification to all partners</h3>
      <input className="input" placeholder="Title" required value={t} onChange={(e) => setT(e.target.value)} />
      <textarea className="input min-h-[100px]" placeholder="Message" value={b} onChange={(e) => setB(e.target.value)} />
      <button className="btn-primary w-full">Send</button>
    </form>
  )
}

function SettingsAdmin() {
  const { settings, refresh, toast } = useSession()
  const [s, setS] = useState<Settings>(settings)
  useEffect(() => setS(settings), [settings])
  const txt = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: e.target.value })
  return (
    <form className="card space-y-3 p-4" onSubmit={async (e) => {
      e.preventDefault()
      try { await api.adminSaveSettings({ ...s, min_withdrawal: Number(s.min_withdrawal), partner_kit_price: Number(s.partner_kit_price) }); await refresh(); toast('Settings saved') }
      catch (er) { toast(er instanceof Error ? er.message : 'Failed') }
    }}>
      <h3 className="font-extrabold">App settings</h3>
      <label className="label">Minimum withdrawal (₹)<input className="input mt-1" inputMode="numeric" value={s.min_withdrawal} onChange={txt('min_withdrawal')} /></label>
      <label className="label">Payout schedule<input className="input mt-1" value={s.payout_days} onChange={txt('payout_days')} /></label>
      <label className="label">Partner fee / kit price (₹)<input className="input mt-1" inputMode="numeric" value={s.partner_kit_price} onChange={txt('partner_kit_price')} /></label>
      <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-semibold"><input type="checkbox" checked={s.require_partner_kit} onChange={(e) => setS({ ...s, require_partner_kit: e.target.checked })} />Lock products marked “Needs partner kit” until the partner fee is paid</label>
      <RoleFeaturesField value={s.role_features} onChange={(v) => setS({ ...s, role_features: v })} />
      <label className="label">Support phone<input className="input mt-1" value={s.support_phone} onChange={txt('support_phone')} /></label>
      <label className="label">Support email<input className="input mt-1" value={s.support_email} onChange={txt('support_email')} /></label>
      <label className="label">WhatsApp number<input className="input mt-1" value={s.whatsapp_number} onChange={txt('whatsapp_number')} /></label>
      <button className="btn-primary w-full">Save settings</button>
    </form>
  )
}

/** Product picture: upload from phone/computer (e.g. a CorelDRAW export), preview, replace or remove. */
function PictureField({ url, slug, onChange }: { url: string | null; slug: string; onChange: (u: string | null) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <p className="text-xs font-semibold text-slate-500">Product picture</p>
      <p className="mb-2 text-[11px] text-slate-400">Shown on posters, product cards and WhatsApp previews. Best size: 1600 × 700 px (wide), PNG or JPG, under 5 MB.</p>
      {url ? <img src={url} alt="Product picture" className="mb-2 aspect-[16/7] w-full rounded-xl border border-slate-100 bg-slate-50 object-contain" />
        : <div className="mb-2 grid aspect-[16/7] w-full place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">No picture — the emoji is used</div>}
      <div className="flex gap-2">
        <label className={`btn-primary flex-1 cursor-pointer !py-2 text-sm ${busy ? 'opacity-60' : ''}`}>
          {busy ? 'Uploading…' : url ? 'Replace picture' : '📷 Upload picture'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy} onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = ''
            if (!f) return
            if (f.size > 5 * 1024 * 1024) return setErr('Picture must be under 5 MB')
            setBusy(true); setErr(null)
            try { onChange(await api.adminUploadProductImage(f, slug)) } catch (er) { setErr(er instanceof Error ? er.message : 'Upload failed') } finally { setBusy(false) }
          }} />
        </label>
        {url && <button type="button" className="btn-soft !py-2 text-sm" onClick={() => onChange(null)}>Remove</button>}
      </div>
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      <p className="mt-2 text-[11px] text-slate-400">Press Save below after uploading.</p>
    </div>
  )
}

/** Tick which menus each member type sees. Admins always see everything. */
function RoleFeaturesField({ value, onChange }: { value: Settings['role_features']; onChange: (v: Settings['role_features']) => void }) {
  const toggle = (role: 'partner' | 'associate', f: Feature) => {
    const cur = value[role] ?? []
    onChange({ ...value, [role]: cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f] })
  }
  return (
    <div className="rounded-2xl border border-slate-200 p-3">
      <p className="font-bold">Menus by member type</p>
      <p className="mb-2 text-xs text-slate-500">Products, Orders, Wallet and Profile are always on. Admins see everything.</p>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">Menu</th><th className="w-20 text-center">Partner</th><th className="w-20 text-center">Associate</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {FEATURES.map((f) => (
            <tr key={f.id}><td className="py-2">{f.label}</td>
              {(['partner', 'associate'] as const).map((r) => (
                <td key={r} className="text-center"><input type="checkbox" className="h-5 w-5" aria-label={`${f.label} for ${r}`} checked={(value[r] ?? []).includes(f.id)} onChange={() => toggle(r, f.id)} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

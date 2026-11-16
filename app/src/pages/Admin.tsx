import { useEffect, useState } from 'react'
import { Empty, ErrorNote, Sheet, Shell, Spinner, SubHeader } from '../components/ui'
import { api, fmtDate, inr } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import { MODE_LABEL, type DeliveryStatus, type Mode, type OrderStatus, type Product, type Settings } from '../lib/types'

type Tab = 'orders' | 'payouts' | 'partners' | 'products' | 'broadcast' | 'settings'

export default function Admin() {
  const [tab, setTab] = useState<Tab>('orders')
  return (
    <Shell>
      <SubHeader eyebrow="Admin" title="Control panel" />
      <div className="no-scrollbar sticky top-[69px] z-20 flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2.5">
        {(['orders', 'payouts', 'partners', 'products', 'broadcast', 'settings'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === t ? 'bg-navy-800 text-white' : 'bg-slate-100 text-slate-600'}`}>{t}</button>
        ))}
      </div>
      <main className="space-y-3 p-4">
        {tab === 'orders' && <OrdersAdmin />}
        {tab === 'payouts' && <PayoutsAdmin />}
        {tab === 'partners' && <PartnersAdmin />}
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

function PartnersAdmin() {
  const { toast } = useSession()
  const [list, loading, reload, err] = useLoad(() => api.adminListPartners(), [])
  const upd = async (id: string, patch: Parameters<typeof api.adminUpdatePartner>[1]) => {
    try { await api.adminUpdatePartner(id, patch); toast('Updated'); reload() } catch (e) { toast(e instanceof Error ? e.message : 'Failed') }
  }
  return (
    <>
      <ErrorNote msg={err} />
      {loading ? <Spinner /> : list?.map((p) => (
        <div key={p.id} className="card p-4">
          <div className="flex justify-between gap-2">
            <div className="min-w-0"><p className="font-bold">{p.full_name || '—'} {p.role === 'admin' && <span className="chip ml-1">admin</span>}</p>
              <p className="truncate text-xs text-slate-500">{p.email} • {p.phone} • {p.referral_code}</p>
              <p className="text-xs text-slate-500">PAN: {p.pan_number ?? '—'} • UPI: {p.upi_id ?? '—'}</p></div>
            <span className="text-xs text-slate-400">{fmtDate(p.created_at)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-slate-500">Kit
              <select className="input mt-1 !py-2 text-sm" value={p.kit_status} onChange={(e) => upd(p.id, { kit_status: e.target.value as typeof p.kit_status })}>
                <option value="not_paid">not paid</option><option value="pending">pending review</option><option value="paid">paid</option>
              </select></label>
            <label className="text-xs font-semibold text-slate-500">KYC
              <select className="input mt-1 !py-2 text-sm" value={p.kyc_status} onChange={(e) => upd(p.id, { kyc_status: e.target.value as typeof p.kyc_status })}>
                {['not_submitted', 'submitted', 'verified', 'rejected'].map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}
              </select></label>
          </div>
        </div>
      ))}
    </>
  )
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
          <div className="min-w-0 flex-1"><p className="truncate font-bold">{p.title}</p><p className="text-xs text-slate-500">{MODE_LABEL[p.mode]} • {inr(p.price)} • {p.commission_pct}%{!p.active && ' • hidden'}</p></div>
          <span className="text-slate-400">✏️</span>
        </button>
      ))}
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit product' : 'New product'}>
        {edit && (
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault(); setErr(null)
            const slug = (edit.slug || edit.title || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            if (!slug) return setErr('Title is required')
            try { await api.adminSaveProduct({ ...edit, slug }); toast('Saved'); setEdit(null); reload() } catch (er) { setErr(er instanceof Error ? er.message : 'Failed') }
          }}>
            <div className="grid grid-cols-[64px_1fr] gap-2"><input className="input text-center text-xl" value={edit.emoji} onChange={(e) => set('emoji', e.target.value)} /><input className="input" placeholder="Title" required value={edit.title} onChange={(e) => set('title', e.target.value)} /></div>
            <input className="input" placeholder="Subtitle" value={edit.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <select className="input" value={edit.mode} onChange={(e) => set('mode', e.target.value as Mode)}>{(['pre_school', 'pro_school', 'school'] as Mode[]).map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}</select>
              <select className="input" value={edit.billing} onChange={(e) => set('billing', e.target.value as Product['billing'])}><option value="one_time">One-time</option><option value="monthly">Monthly</option></select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs font-semibold text-slate-500">Price ₹<input className="input mt-1" inputMode="numeric" value={edit.price} onChange={(e) => set('price', Number(e.target.value.replace(/\D/g, '')))} /></label>
              <label className="text-xs font-semibold text-slate-500">Commission %<input className="input mt-1" inputMode="decimal" value={edit.commission_pct} onChange={(e) => set('commission_pct', Number(e.target.value) || 0)} /></label>
              <label className="text-xs font-semibold text-slate-500">Duration<input className="input mt-1" value={edit.duration ?? ''} onChange={(e) => set('duration', e.target.value)} /></label>
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
      <label className="label">Partner kit price (₹)<input className="input mt-1" inputMode="numeric" value={s.partner_kit_price} onChange={txt('partner_kit_price')} /></label>
      <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-semibold"><input type="checkbox" checked={s.require_partner_kit} onChange={(e) => setS({ ...s, require_partner_kit: e.target.checked })} />Require partner kit for Pre-School sales</label>
      <label className="label">Support phone<input className="input mt-1" value={s.support_phone} onChange={txt('support_phone')} /></label>
      <label className="label">Support email<input className="input mt-1" value={s.support_email} onChange={txt('support_email')} /></label>
      <label className="label">WhatsApp number<input className="input mt-1" value={s.whatsapp_number} onChange={txt('whatsapp_number')} /></label>
      <button className="btn-primary w-full">Save settings</button>
    </form>
  )
}

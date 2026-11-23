import { useMemo, useState } from 'react'
import { AppHeader, Empty, ErrorNote, ModeTabs, Sheet, Shell, Spinner } from '../components/ui'
import { api, fmtDate, inr } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import type { OrderStatus, PartnerOrder } from '../lib/types'

type Tab = 'orders' | 'enrolled' | 'subscriptions' | 'delivery'
const ALERT: OrderStatus[] = ['cancelled', 'halted', 'failed', 'refunded']
const STATUS_STYLE: Record<OrderStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200', pending: 'bg-amber-50 text-amber-700 border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200', halted: 'bg-red-50 text-red-700 border-red-200',
  failed: 'bg-red-50 text-red-700 border-red-200', refunded: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function Orders() {
  const { mode } = useSession()
  const [orders, loading, , err] = useLoad(() => api.listMyOrders(), [])
  const [tab, setTab] = useState<Tab>('orders')
  const [q, setQ] = useState('')
  const [applied, setApplied] = useState('')
  const [filters, setFilters] = useState(false)
  const [status, setStatus] = useState<'all' | OrderStatus>('all')
  const [range, setRange] = useState<'all' | '7' | '30' | '90'>('all')

  const scoped = useMemo(() => (orders ?? []).filter((o) => o.mode === mode)
    .filter((o) => range === 'all' || Date.now() - new Date(o.created_at).getTime() <= Number(range) * 86400000), [orders, mode, range])

  const shown = useMemo(() => {
    let l = scoped
    if (tab === 'enrolled') l = l.filter((o) => o.kind === 'enrollment' || (o.kind === 'order' && o.status === 'paid'))
    if (tab === 'subscriptions') l = l.filter((o) => o.kind === 'subscription')
    if (tab === 'delivery') l = l.filter((o) => o.delivery !== 'not_applicable')
    if (status !== 'all') l = l.filter((o) => o.status === status)
    const s = applied.trim().toLowerCase()
    if (s) l = l.filter((o) => [o.buyer_name, o.buyer_phone_masked, o.order_code, o.product_title].some((v) => v.toLowerCase().includes(s)))
    return l
  }, [scoped, tab, status, applied])

  const paid = scoped.filter((o) => o.status === 'paid')
  return (
    <Shell>
      <AppHeader page="Reports"><ModeTabs noun="reports" /></AppHeader>
      <main className="space-y-4 p-4">
        <ErrorNote msg={err} />
        <section className="card p-4">
          <div className="mb-3 flex items-start justify-between">
            <div><h2 className="text-lg font-extrabold">Reports Overview</h2><p className="text-sm text-slate-500">Sales • Enrollments • Alerts • Delivery</p></div>
            <button className="btn-outline !px-3 !py-2" onClick={() => setFilters(true)}>⚙️ Filters{(status !== 'all' || range !== 'all') && ' •'}</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Tile tone="gold" icon="📈" label="Total Sales" value={inr(paid.reduce((s, o) => s + Number(o.amount), 0))} sub="Paid / captured" />
            <Tile tone="blue" icon="👥" label="Total Enrolled" value={String(paid.length)} sub="Your code based" />
            <Tile tone="pink" icon="⚠️" label="Alerts" value={String(scoped.filter((o) => ALERT.includes(o.status)).length)} sub="Cancel / Halt / Failed" />
            <Tile tone="green" icon="📦" label="Delivered" value={String(scoped.filter((o) => o.delivery === 'delivered').length)} sub={`of ${scoped.filter((o) => o.delivery !== 'not_applicable').length} shipments`} />
          </div>
        </section>

        <section className="card p-4">
          <h2 className="text-lg font-extrabold">Search</h2>
          <p className="mb-3 text-sm text-slate-500">Name / phone / order id / product</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(q) }}>
            <input className="input" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); if (!e.target.value) setApplied('') }} />
            <button className="btn shrink-0 bg-gradient-to-b from-[#e2b84a] to-[#c9962a] !px-6 text-white shadow-[0_6px_14px_rgba(201,150,42,0.35)]">🔍 Search</button>
          </form>
          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1">
            {(['orders', 'enrolled', 'subscriptions', 'delivery'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold capitalize ${tab === t ? 'bg-gradient-to-b from-[#d9ad42] to-[#b8862a] text-white shadow' : 'bg-slate-100 text-slate-700'}`}>{t}</button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {loading ? <Spinner /> : shown.length === 0
              ? <Empty icon="🧾" title="No records yet" text="Share a product link from Home — orders made through your link appear here." />
              : shown.map((o) => <OrderRow key={o.id} o={o} />)}
          </div>
        </section>
        <p className="px-2 text-center text-xs text-slate-400">Buyer phone numbers are masked to protect customer privacy.</p>
      </main>

      <Sheet open={filters} onClose={() => setFilters(false)} title="Filters">
        <label className="label">Status</label>
        <select className="input mb-4" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {['all', 'paid', 'pending', 'cancelled', 'halted', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
        <label className="label">Date range</label>
        <select className="input mb-5" value={range} onChange={(e) => setRange(e.target.value as typeof range)}>
          <option value="all">All time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-soft" onClick={() => { setStatus('all'); setRange('all') }}>Reset</button>
          <button className="btn-primary" onClick={() => setFilters(false)}>Apply</button>
        </div>
      </Sheet>
    </Shell>
  )
}

const TILE = {
  gold: 'border-[#a8842f] bg-gradient-to-br from-[#e6c36a] to-[#c9a04a]',
  blue: 'border-[#3f62a8] bg-gradient-to-br from-[#8fb0e6] to-[#5f86cf]',
  pink: 'border-[#d77f8f] bg-gradient-to-br from-[#f6c3cb] to-[#eba3b0]',
  green: 'border-[#6fa886] bg-gradient-to-br from-[#bfe3cc] to-[#93cfa9]',
} as const

function Tile({ tone, icon, label, value, sub }: { tone: keyof typeof TILE; icon: string; label: string; value: string; sub: string }) {
  return (
    <div className={`rounded-3xl border-2 p-3.5 text-slate-900 shadow-[0_6px_16px_rgba(15,23,42,0.12)] ${TILE[tone]}`}>
      <div className="flex items-center gap-2"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/60">{icon}</span><span className="text-sm font-extrabold leading-tight text-slate-800/80">{label}</span></div>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-slate-800/80">{sub}</p>
    </div>
  )
}

function OrderRow({ o }: { o: PartnerOrder }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold">{o.buyer_name}</p>
          <p className="text-xs text-slate-500">{o.buyer_phone_masked} • {o.order_code}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLE[o.status]}`}>{o.status}</span>
      </div>
      <p className="mt-2 truncate text-sm text-slate-700">{o.product_title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="chip">{inr(o.amount)}</span>
        {o.status === 'paid' && <span className="chip !border-emerald-200 !bg-emerald-50 !text-emerald-700">+{inr(o.commission_amount)} earned</span>}
        {o.delivery !== 'not_applicable' && <span className="chip capitalize">📦 {o.delivery}</span>}
        <span className="ml-auto text-slate-400">{fmtDate(o.created_at)}</span>
      </div>
    </div>
  )
}

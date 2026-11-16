import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { api, partnerLink } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import { MODE_LABEL, type Mode, type Product } from '../lib/types'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--accent-to)]" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function Empty({ icon, title, text }: { icon: string; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">{icon}</div>
      <p className="font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>}
    </div>
  )
}

export function ErrorNote({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{msg}</div>
}

export function SectionTitle({ icon, title, sub, right }: { icon?: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      {icon && <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-[var(--accent-soft)] text-xl">{icon}</div>}
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-extrabold leading-tight text-slate-900">{title}</h2>
        {sub && <p className="text-sm text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose}>
      <div role="dialog" aria-label={title} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-5 pb-safe shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button className="icon-btn !h-9 !w-9 !text-base" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ModeTabs({ noun }: { noun: string }) {
  const { mode, setMode } = useSession()
  const modes: Mode[] = ['pre_school', 'pro_school', 'school']
  return (
    <div>
      <div className="grid grid-cols-3 gap-1 rounded-full bg-slate-100 p-1.5">
        {modes.map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-full py-2.5 text-sm font-bold transition ${m === mode ? 'bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white shadow-md' : 'text-slate-600'}`}>
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-500">Showing: {MODE_LABEL[mode]} {noun}</p>
    </div>
  )
}

export function AppHeader({ page, showGreeting = true, children }: { page: string; showGreeting?: boolean; children?: ReactNode }) {
  const { profile } = useSession()
  const [sos, setSos] = useState(false)
  const [notes] = useLoad(() => api.listNotifications(), [])
  const unread = notes?.filter((n) => !n.read).length ?? 0
  return (
    <header className="border-b border-slate-200 bg-white px-4 pb-4 pt-4">
      <div className="flex items-center gap-3">
        <img src="/logo.jpeg" alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-md ring-1 ring-gold-300" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[17px] font-extrabold leading-tight text-navy-900">Leaders</p>
          <p className="truncate text-xs text-slate-500">{page}</p>
        </div>
        <Link to="/wallet" className="icon-btn !w-auto shrink-0 gap-1 px-2.5 text-sm font-bold text-gold-700" aria-label="Points and wallet">🪙 {profile?.points ?? 0}</Link>
        <button className="icon-btn !text-sm font-black text-red-600" onClick={() => setSos(true)} aria-label="SOS support">SOS</button>
        <Link to="/notifications" className="icon-btn relative" aria-label="Notifications">
          🔔
          {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
        </Link>
      </div>
      {showGreeting && (
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">Hello 👋</p>
            <p className="text-xl font-extrabold">{profile?.full_name || 'Partner'}</p>
          </div>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--accent-text)]">
            {profile?.role === 'admin' ? 'Admin' : 'Partner'} • {profile?.referral_code}
          </span>
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
      <SosSheet open={sos} onClose={() => setSos(false)} />
    </header>
  )
}

export function SubHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <button className="icon-btn" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))} aria-label="Back">←</button>
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="text-xs font-semibold text-slate-500">{eyebrow}</p>}
        <h1 className="truncate text-lg font-extrabold leading-tight">{title}</h1>
      </div>
      {right}
    </header>
  )
}

const TABS = [
  { to: '/', icon: '🏠', label: 'Home', end: true },
  { to: '/orders', icon: '🧾', label: 'Orders' },
  { to: '/team', icon: '👥', label: 'Team' },
  { to: '/learn', icon: '🎓', label: 'Learn' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="grid w-full max-w-md grid-cols-5 gap-1 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-safe backdrop-blur">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}
            className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs font-bold transition ${isActive ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]' : 'text-slate-500'}`}>
            <span className="text-xl leading-none">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50 pb-28 shadow-sm">
      {children}
      <BottomNav />
    </div>
  )
}

export async function copyText(t: string) {
  try {
    await navigator.clipboard.writeText(t)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = t; document.body.appendChild(ta); ta.select()
    const ok = document.execCommand('copy'); ta.remove()
    return ok
  }
}

export function shareMessage(p: Product, link: string) {
  const price = '₹' + p.price.toLocaleString('en-IN') + (p.billing === 'monthly' ? '/month' : '')
  return `${p.pitch ?? p.title}\n\n${p.emoji} *${p.title}* — ${price}${p.duration ? ` • ${p.duration}` : ''}\n👉 ${link}`
}

export function ShareSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { profile, toast } = useSession()
  if (!product || !profile) return null
  const link = partnerLink(product.slug, profile.referral_code)
  const msg = shareMessage(product, link)
  const enc = encodeURIComponent(msg)
  const native = typeof navigator !== 'undefined' && 'share' in navigator
  return (
    <Sheet open onClose={onClose} title="Share & earn">
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
        <span className="text-3xl">{product.emoji}</span>
        <div className="min-w-0">
          <p className="truncate font-bold">{product.title}</p>
          <p className="text-sm text-emerald-700 font-semibold">You earn {product.commission_pct}% = ₹{Math.round(product.price * product.commission_pct / 100).toLocaleString('en-IN')} per sale</p>
        </div>
      </div>
      <label className="label">Your partner link</label>
      <div className="mb-4 flex gap-2">
        <input readOnly value={link} className="input !py-2.5 text-sm" onFocus={(e) => e.target.select()} />
        <button className="btn-soft shrink-0" onClick={async () => { await copyText(link); toast('Link copied') }}>Copy</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <a className="btn bg-[#25D366] text-white" href={`https://wa.me/?text=${enc}`} target="_blank" rel="noreferrer">WhatsApp</a>
        <button className="btn bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white" onClick={async () => { await copyText(msg); toast('Caption copied — paste it in Instagram'); window.open('https://www.instagram.com/', '_blank') }}>Instagram</button>
        <a className="btn bg-sky-500 text-white" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(product.pitch ?? product.title)}`} target="_blank" rel="noreferrer">Telegram</a>
        <a className="btn bg-blue-600 text-white" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer">Facebook</a>
        <button className="btn-outline" onClick={async () => { await copyText(msg); toast('Message copied') }}>Copy message</button>
        {native && <button className="btn-outline" onClick={() => navigator.share({ title: product.title, text: msg }).catch(() => {})}>More…</button>}
      </div>
      <p className="mt-4 text-xs text-slate-500">Sales made through this link are credited to code <b>{profile.referral_code}</b>.</p>
    </Sheet>
  )
}

export function SosSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, toast } = useSession()
  const [subject, setSubject] = useState('Payment / payout issue')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const wa = settings.whatsapp_number.replace(/\D/g, '')
  return (
    <Sheet open={open} onClose={onClose} title="SOS — Get help fast">
      <div className="mb-4 grid grid-cols-2 gap-3">
        {settings.support_phone ? <a className="btn-soft" href={`tel:${settings.support_phone}`}>📞 Call support</a> : <span className="btn-soft opacity-50">📞 Not set</span>}
        {wa ? <a className="btn bg-[#25D366] text-white" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">💬 WhatsApp</a> : <span className="btn-soft opacity-50">💬 Not set</span>}
      </div>
      <form className="space-y-3" onSubmit={async (e) => {
        e.preventDefault(); if (!msg.trim()) return
        setBusy(true)
        try { await api.createTicket(subject, msg.trim()); toast('Ticket raised — we will reply soon'); setMsg(''); onClose() }
        catch (er) { toast(er instanceof Error ? er.message : 'Failed') } finally { setBusy(false) }
      }}>
        <div>
          <label className="label">Topic</label>
          <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {['Payment / payout issue', 'Order or delivery problem', 'Commission not credited', 'App not working', 'Other'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Describe the problem</label>
          <textarea className="input min-h-[96px]" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Order ID, what happened…" />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Raise ticket'}</button>
      </form>
    </Sheet>
  )
}

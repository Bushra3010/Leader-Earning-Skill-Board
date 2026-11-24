import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IconBell, IconClipboard, IconGrid, IconGridFill, IconHome, IconHomeFill, IconIdCard, IconLayers, IconPlay, IconUser } from './icons'
import { api, partnerLink } from '../lib/api'
import { sharePosterWithText } from '../lib/canvasCards'
import { useCan, useLoad, useSession } from '../lib/session'
import { ROLE_LABEL, type Product } from '../lib/types'

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

export function BrandLogo({ size = 56 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 p-[3px] shadow-[0_6px_16px_rgba(0,0,0,0.3)]" style={{ width: size, height: size }}>
      <img src="/logo.jpeg" alt="Leaders logo" className="h-full w-full rounded-full border-2 border-white object-cover" />
    </span>
  )
}

/** Blue curved brand band used at the top of main screens. */
export function BrandHeader({ title }: { title?: string }) {
  const [notes] = useLoad(() => api.listNotifications(), [])
  const unread = notes?.filter((n) => !n.read).length ?? 0
  return (
    <div className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-br from-[#1a37ad] via-[#2347c9] to-[#3563e8] px-5 pb-14 pt-5 text-white">
      <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/[0.07]" />
      <span className="pointer-events-none absolute -left-10 bottom-0 h-32 w-72 rounded-[50%] bg-white/[0.05]" />
      <div className="relative flex items-center gap-3">
        <BrandLogo size={58} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[26px] font-extrabold leading-none tracking-tight">Leaders</p>
          <p className="mt-1 truncate text-[15px] text-white/85">{title ?? 'Earning & Skills App'}</p>
        </div>
        <Link to="/notifications" className="relative grid h-12 w-12 place-items-center rounded-full bg-white text-[#14246b] shadow-md active:scale-95" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <IconBell size={24} />
          {unread > 0 && <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />}
        </Link>
        <Link to="/profile" className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#14246b] shadow-md active:scale-95" aria-label="My profile">
          <IconUser size={24} />
        </Link>
      </div>
    </div>
  )
}

export function AppHeader({ page, showGreeting = true, children }: { page: string; showGreeting?: boolean; children?: ReactNode }) {
  const { profile } = useSession()
  return (
    <header>
      <BrandHeader title={page} />
      {(showGreeting || children) && (
        <div className="relative -mt-9 px-4">
          <div className="rounded-[28px] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            {showGreeting && (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-600">Hello 👋</p>
                  <p className="truncate font-display text-xl font-extrabold text-[#0f1b4d]">{profile?.full_name || 'Partner'}</p>
                </div>
                <PartnerIdChip />
              </div>
            )}
            {children && <div className={showGreeting ? 'mt-4' : ''}>{children}</div>}
          </div>
        </div>
      )}
    </header>
  )
}

export function PartnerIdChip() {
  const { profile } = useSession()
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-800 shadow-sm">
      <IconIdCard size={16} className="text-slate-600" />
      {ROLE_LABEL[profile?.role ?? 'associate']} ID: <b className="font-extrabold">{profile?.referral_code}</b>
    </span>
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
  { to: '/', label: 'Home', Icon: IconHome, IconOn: IconHomeFill, match: (p: string) => p === '/' },
  { to: '/products', label: 'Products', Icon: IconLayers, IconOn: IconLayers, match: (p: string) => p.startsWith('/product') },
  { to: '/orders', label: 'Orders', Icon: IconClipboard, IconOn: IconClipboard, match: (p: string) => p.startsWith('/orders') },
  { to: '/learn', label: 'Learn', Icon: IconPlay, IconOn: IconPlay, match: (p: string) => p.startsWith('/learn') },
  { to: '/more', label: 'More', Icon: IconGrid, IconOn: IconGridFill, match: (p: string) => ['/more', '/profile', '/team', '/wallet', '/notifications', '/kit', '/admin', '/leaderboard', '/posters', '/cards'].some((r) => p.startsWith(r)) },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const can = useCan()
  const tabs = TABS.filter((t) => t.to !== '/learn' || can('learn'))
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} className="grid w-full max-w-md gap-1 rounded-t-[28px] bg-white px-3 pt-2.5 pb-safe shadow-[0_-6px_24px_rgba(15,23,42,0.08)]">
        {tabs.map(({ to, label, Icon, IconOn, match }) => {
          const on = match(pathname)
          const I = on ? IconOn : Icon
          return (
            <Link key={to} to={to} aria-current={on ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 rounded-[20px] py-2 text-[13px] font-semibold transition active:scale-95 ${on
                ? 'bg-gradient-to-b from-[#2f5be6] to-[#1b3fc2] text-white shadow-[0_6px_16px_rgba(35,71,201,0.4)]'
                : 'text-slate-700'}`}>
              <I size={24} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#f3f6fc] pb-28 shadow-sm">
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
  const title = p.title.trim()
  return `*Leaders Earning & Skill Board*\n\n${(p.pitch ?? title).trim()}\n\n${p.emoji} *${title}* — ${price}${p.duration?.trim() ? ` • ${p.duration.trim()}` : ''}\n👉 ${link}`
}

export function ShareSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { profile, toast } = useSession()
  const [busy, setBusy] = useState(false)
  if (!product || !profile) return null
  const link = partnerLink(product.slug, profile.referral_code)
  const msg = shareMessage(product, link)
  const enc = encodeURIComponent(msg)
  const native = typeof navigator !== 'undefined' && 'share' in navigator
  const posterShare = async () => {
    setBusy(true)
    try {
      const r = await sharePosterWithText(product, profile, link, msg)
      if (r === 'fallback') { await copyText(msg); toast('Poster saved & message copied — attach the poster in WhatsApp and paste'); window.open(`https://wa.me/?text=${enc}`, '_blank') }
    } catch { toast('Could not make the poster — sharing the link instead'); window.open(`https://wa.me/?text=${enc}`, '_blank') }
    finally { setBusy(false) }
  }
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
      <button className="btn mb-3 w-full bg-[#25D366] !py-3.5 text-white" disabled={busy} onClick={posterShare}>
        {busy ? 'Making poster…' : '🖼️ Share poster + message (WhatsApp)'}
      </button>
      <p className="-mt-1 mb-4 text-center text-xs text-slate-500">Sends the product poster with your name, number and link, plus the message as its caption.</p>
      <div className="grid grid-cols-2 gap-3">
        <a className="btn bg-[#25D366]/90 text-white" href={`https://wa.me/?text=${enc}`} target="_blank" rel="noreferrer">WhatsApp text only</a>
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

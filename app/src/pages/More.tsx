import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo, Shell, SosSheet } from '../components/ui'
import { IconBox, IconCapFill, IconChart, IconChevronRight, IconHeadset, IconLogout, IconMegaphone, IconSettings, IconShield, IconUser, IconUsers, IconWallet } from '../components/icons'
import { api } from '../lib/api'
import { useSession } from '../lib/session'

type Item = { label: string; sub: string; icon: ReactNode; tone: string; to?: string; onClick?: () => void }

export default function More() {
  const { profile, refresh } = useSession()
  const nav = useNavigate()
  const [sos, setSos] = useState(false)

  const items: Item[] = [
    { label: 'My Profile', sub: 'View & edit your profile', icon: <IconUser size={26} />, tone: 'bg-[#e8eeff] text-[#2347c9]', to: '/profile' },
    { label: 'My Orders', sub: 'Track orders & delivery', icon: <IconBox size={26} />, tone: 'bg-orange-50 text-orange-500', to: '/orders' },
    { label: 'My Courses', sub: 'Access your enrolled courses', icon: <IconCapFill size={28} />, tone: 'bg-[#e8eeff] text-[#2347c9]', to: '/learn' },
    { label: 'My Earnings', sub: 'Sales, wallet & payouts', icon: <IconChart size={26} />, tone: 'bg-emerald-50 text-emerald-600', to: '/wallet' },
    { label: 'My Team', sub: 'Add & manage your team', icon: <IconUsers size={26} />, tone: 'bg-sky-50 text-[#2b6be0]', to: '/team' },
    { label: 'Promotions', sub: 'Campaigns & offers', icon: <IconMegaphone size={26} />, tone: 'bg-rose-50 text-rose-500', to: '/notifications' },
    { label: 'Wallet', sub: 'Add money, withdraw & history', icon: <IconWallet size={26} />, tone: 'bg-[#e8eeff] text-[#2347c9]', to: '/wallet' },
    { label: 'Help & Support', sub: 'Get help, FAQs & contact us', icon: <IconHeadset size={26} />, tone: 'bg-violet-50 text-violet-600', onClick: () => setSos(true) },
    { label: 'Settings', sub: 'App, notification & security', icon: <IconSettings size={26} />, tone: 'bg-slate-100 text-slate-700', to: '/profile' },
  ]
  if (profile?.role === 'admin') items.push({ label: 'Admin Panel', sub: 'Orders, payouts & products', icon: <IconShield size={26} />, tone: 'bg-amber-50 text-amber-600', to: '/admin' })
  items.push({ label: 'Log out', sub: 'Sign out of this device', icon: <IconLogout size={26} />, tone: 'bg-red-50 text-red-500', onClick: async () => { await api.signOut(); await refresh(); nav('/login') } })

  return (
    <Shell>
      <header className="relative overflow-hidden bg-gradient-to-br from-[#1a37ad] via-[#2347c9] to-[#3563e8] px-5 pb-20 pt-6 text-white">
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/[0.07]" />
        <h1 className="relative font-display text-[30px] font-extrabold">More</h1>
        <div className="relative mt-4 flex items-center justify-center gap-3">
          <BrandLogo size={84} />
          <div>
            <p className="font-display text-[30px] font-extrabold leading-none">Leaders</p>
            <p className="mt-1 text-[16px] text-white/90">Earning &amp; Skills App</p>
          </div>
        </div>
        {/* wave */}
        <svg className="absolute inset-x-0 bottom-0 h-12 w-full" viewBox="0 0 400 48" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 30 C 90 0, 200 0, 260 18 S 360 40, 400 6 V48 H0Z" fill="#3d66ea" opacity=".55" />
          <path d="M0 40 C 100 14, 220 18, 290 30 S 370 40, 400 24 V48 H0Z" fill="#f3f6fc" />
        </svg>
      </header>

      <main className="relative -mt-4 px-4">
        <ul className="divide-y divide-slate-100 rounded-[26px] bg-white px-4 shadow-[0_8px_30px_rgba(15,23,42,0.07)]">
          {items.map((it) => {
            const inner = (
              <>
                <span className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl ${it.tone}`}>{it.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[18px] font-extrabold leading-tight text-[#0f1b4d]">{it.label}</span>
                  <span className="block truncate text-[14px] text-slate-600">{it.sub}</span>
                </span>
                <IconChevronRight size={22} className="shrink-0 text-slate-800" />
              </>
            )
            const cls = 'flex w-full items-center gap-4 py-3.5 text-left transition active:opacity-70'
            return (
              <li key={it.label}>
                {it.to ? <Link to={it.to} className={cls}>{inner}</Link> : <button className={cls} onClick={it.onClick}>{inner}</button>}
              </li>
            )
          })}
        </ul>
      </main>
      <SosSheet open={sos} onClose={() => setSos(false)} />
    </Shell>
  )
}

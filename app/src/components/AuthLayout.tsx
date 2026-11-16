import type { ReactNode } from 'react'

export default function AuthLayout({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-900 via-navy-800 to-navy-700">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo.jpeg" alt="Leaders Earning and Skill Board" className="h-28 w-28 rounded-full shadow-2xl ring-4 ring-gold-400/60" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-white">Leaders Earning &amp; Skill Board</h1>
          <p className="mt-1 text-sm font-semibold tracking-[0.2em] text-gold-300">EMPOWER • EDUCATE • ELEVATE</p>
        </div>
        <div className="mode-pre_school rounded-[28px] bg-white p-6 shadow-2xl">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <p className="mb-5 text-sm text-slate-500">{sub}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

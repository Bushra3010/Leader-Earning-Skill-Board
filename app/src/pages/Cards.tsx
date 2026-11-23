import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shell, Spinner, SubHeader } from '../components/ui'
import { PUBLIC_URL } from '../lib/api'
import { drawCard, shareOrDownload, type CardKind } from '../lib/canvasCards'
import { useSession } from '../lib/session'
import { Avatar } from './Leaderboard'

const KINDS: { id: CardKind; label: string; icon: string }[] = [
  { id: 'id', label: 'ID Card', icon: '🪪' },
  { id: 'visiting', label: 'Visiting', icon: '💳' },
  { id: 'certificate', label: 'Certificate', icon: '🏅' },
]

export default function Cards() {
  const { profile, toast } = useSession()
  const [kind, setKind] = useState<CardKind>('id')
  const [img, setImg] = useState<{ url: string; blob: Blob } | null>(null)
  const link = `${PUBLIC_URL}/register?ref=${profile?.referral_code ?? ''}`

  useEffect(() => {
    if (!profile) return
    let url = ''
    let alive = true
    setImg(null)
    drawCard(kind, profile, link).then((blob) => { if (!alive) return; url = URL.createObjectURL(blob); setImg({ url, blob }) }).catch(() => {})
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [kind, profile, link])

  if (!profile) return null
  const name = `${profile.referral_code}-${kind}.png`
  return (
    <Shell>
      <SubHeader eyebrow="Leaders" title="My Cards" />
      <main className="space-y-4 p-4">
        <section className="flex items-center gap-3 rounded-[22px] bg-white p-4 shadow-sm">
          <Avatar name={profile.full_name} size={52} />
          <div className="min-w-0 flex-1"><b className="block truncate">{profile.full_name}</b><span className="text-xs text-slate-500">{profile.role === 'admin' ? 'Admin' : 'Partner'} • {profile.referral_code}</span></div>
          <Link to="/profile" className="btn-primary !px-3 !py-2 text-xs">✏️ Edit Profile</Link>
        </section>
        <div className="flex gap-2">
          {KINDS.map((k) => (
            <button key={k.id} onClick={() => setKind(k.id)} aria-pressed={kind === k.id}
              className={`flex-1 rounded-full px-2 py-2.5 text-sm font-bold ${kind === k.id ? 'bg-[#2347c9] text-white' : 'bg-white text-slate-700 shadow-sm'}`}>{k.icon} {k.label}</button>
          ))}
        </div>
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div><h2 className="font-extrabold">{KINDS.find((k) => k.id === kind)?.label} Preview</h2><p className="text-xs text-slate-500">Filled in from your profile</p></div>
            <span className="chip">PNG</span>
          </div>
          {img ? <img src={img.url} alt={`${kind} card`} className="mx-auto max-h-[60vh] w-auto rounded-xl border border-slate-200" /> : <Spinner label="Drawing…" />}
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">Tip: phone ya city badla? Profile update karo — card apne aap update ho jayega ✅</p>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-soft" disabled={!img} onClick={() => img && shareOrDownload(img.blob, name, '', 'download')}>Download PNG</button>
          <button className="btn-primary" disabled={!img} onClick={async () => { if (img && (await shareOrDownload(img.blob, name, link, 'share')) === 'downloaded') toast('Saved — share it from your gallery') }}>Share</button>
        </div>
      </main>
    </Shell>
  )
}

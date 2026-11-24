import { useEffect, useState } from 'react'
import { ErrorNote, Sheet, Shell, Spinner, SubHeader } from '../components/ui'
import { api, partnerLink } from '../lib/api'
import { drawPoster, shareOrDownload } from '../lib/canvasCards'
import { useLoad, useSession } from '../lib/session'
import type { Product } from '../lib/types'
import { CATS, categoryOf, type Cat } from '../lib/category'

export default function Posters() {
  const { profile } = useSession()
  const [products, loading, , err] = useLoad(() => api.listProducts(), [])
  const [cat, setCat] = useState<'all' | Cat>('all')
  const [q, setQ] = useState('')
  const [preview, setPreview] = useState<{ p: Product; url: string; blob: Blob } | null>(null)
  const term = q.trim().toLowerCase()
  const list = (products ?? []).filter((p) => p.active && (cat === 'all' || categoryOf(p) === cat) && (!term || p.title.toLowerCase().includes(term)))

  return (
    <Shell>
      <SubHeader eyebrow={profile ? `Code: ${profile.referral_code}` : undefined} title="Ready-to-Share Gallery" />
      <main className="space-y-3 p-4">
        <p className="px-1 text-sm text-slate-600">Download or share posters — your name, number and code are printed on each one.</p>
        <input className="input" placeholder="Search poster title…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input !w-auto" value={cat} onChange={(e) => setCat(e.target.value as typeof cat)}>
          <option value="all">All products</option>
          {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <ErrorNote msg={err} />
        {loading || !profile ? <Spinner /> : list.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No posters match.</p> : (
          <div className="space-y-4">{list.map((p) => <PosterCard key={p.id} p={p} onPreview={setPreview} />)}</div>
        )}
      </main>
      <Sheet open={!!preview} onClose={() => setPreview(null)} title={preview?.p.title ?? ''}>
        {preview && profile && (
          <>
            <img src={preview.url} alt={`Poster for ${preview.p.title}`} className="w-full rounded-2xl border border-slate-200" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="btn-soft" onClick={() => shareOrDownload(preview.blob, `${preview.p.slug}-poster.png`, '', 'download')}>Download</button>
              <button className="btn-primary" onClick={() => shareOrDownload(preview.blob, `${preview.p.slug}-poster.png`, partnerLink(preview.p.slug, profile.referral_code), 'share')}>Share</button>
            </div>
          </>
        )}
      </Sheet>
    </Shell>
  )
}

function PosterCard({ p, onPreview }: { p: Product; onPreview: (v: { p: Product; url: string; blob: Blob }) => void }) {
  const { profile, toast } = useSession()
  const [img, setImg] = useState<{ url: string; blob: Blob } | null>(null)
  const link = profile ? partnerLink(p.slug, profile.referral_code) : ''
  useEffect(() => {
    if (!profile) return
    let url = ''
    let alive = true
    drawPoster(p, profile, link).then((blob) => { if (!alive) return; url = URL.createObjectURL(blob); setImg({ url, blob }) }).catch(() => {})
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [p, profile, link])
  if (!profile) return null
  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.07)]">
      {img ? <img src={img.url} alt={`Poster for ${p.title}`} className="aspect-[4/5] w-full object-cover" /> : <div className="grid aspect-[4/5] place-items-center bg-slate-100"><Spinner label="Drawing poster…" /></div>}
      <div className="p-4">
        <p className="font-extrabold text-[#0f1b4d]">{p.title}</p>
        <div className="mt-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
          <p><b>Name:</b> {profile.full_name}</p>
          <p><b>Number:</b> {profile.phone || <span className="text-amber-600">add in Profile</span>}</p>
          <p><b>Referral Code:</b> {profile.referral_code}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button className="btn-soft" disabled={!img} onClick={() => img && onPreview({ p, ...img })}>Preview</button>
          <button className="btn-primary" disabled={!img} onClick={async () => { if (img && (await shareOrDownload(img.blob, `${p.slug}-poster.png`, link, 'share')) === 'downloaded') toast('Poster saved — share it from your gallery') }}>Share</button>
        </div>
      </div>
    </div>
  )
}

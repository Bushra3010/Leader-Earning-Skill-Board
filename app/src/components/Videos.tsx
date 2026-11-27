import { useEffect, useState } from 'react'
import { api, partnerLink } from '../lib/api'
import { useLoad, useSession } from '../lib/session'
import type { DemoVideo, Product } from '../lib/types'

/** "Videos To Help You Start" — horizontal strip of tall video cards. Hidden when there are no videos. */
export function VideoStrip({ productId, title = 'Videos To Help You Start', sub = '30–60 sec demos (watch & copy)' }: { productId?: string; title?: string; sub?: string }) {
  const [videos] = useLoad(() => api.listVideos().catch(() => [] as DemoVideo[]), [])
  const [products] = useLoad(() => api.listProducts().catch(() => [] as Product[]), [])
  const [playing, setPlaying] = useState<DemoVideo | null>(null)
  const list = (videos ?? []).filter((v) => v.active && (!productId || v.product_id === productId))
  if (!list.length) return null
  return (
    <section className="rounded-[26px] bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
      <h2 className="text-[19px] font-extrabold leading-tight text-[#0f1b4d]">{title}</h2>
      <p className="mb-3 text-sm text-slate-500">{sub}</p>
      <div className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
        {list.map((v) => (
          <button key={v.id} onClick={() => setPlaying(v)} className="relative aspect-[9/13] w-[62%] shrink-0 snap-start overflow-hidden rounded-[24px] bg-slate-900 text-left active:scale-[0.98]" aria-label={`Play ${v.title}`}>
            <video src={`${v.video_url}#t=0.5`} preload="metadata" muted playsInline className="pointer-events-none h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute inset-x-4 bottom-4">
              <b className="block text-[17px] leading-tight text-white drop-shadow">{v.title}</b>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/25 px-4 py-2 text-sm font-semibold text-white backdrop-blur">▶ Play</span>
            </span>
          </button>
        ))}
      </div>
      <VideoPlayer video={playing} product={(products ?? []).find((p) => p.id === playing?.product_id) ?? null} onClose={() => setPlaying(null)} />
    </section>
  )
}

export function VideoPlayer({ video, product, onClose }: { video: DemoVideo | null; product: Product | null; onClose: () => void }) {
  const { profile, toast } = useSession()
  useEffect(() => {
    if (!video) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [video, onClose])
  if (!video) return null
  const link = product && profile ? partnerLink(product.slug, profile.referral_code) : null
  const text = `${video.title}${product ? ` — ${product.title.trim()}` : ''}\n▶ ${video.video_url}${link ? `\n👉 ${link}` : ''}`
  const share = async () => {
    if ('share' in navigator) { await navigator.share({ title: video.title, text }).catch(() => {}); return }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black" role="dialog" aria-label={video.title}>
      <div className="flex items-center gap-3 p-3 text-white">
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-lg" onClick={onClose} aria-label="Close">✕</button>
        <b className="min-w-0 flex-1 truncate">{video.title}</b>
      </div>
      <video src={video.video_url} controls autoPlay playsInline className="min-h-0 w-full flex-1 bg-black object-contain" onError={() => toast('This video could not be played')} />
      <div className="grid grid-cols-2 gap-3 p-3 pb-safe">
        <button className="btn bg-[#25D366] text-white" onClick={share}>Share</button>
        {product ? <a className="btn-gold" href={`/product/${product.slug}`}>View product</a> : <button className="btn-soft" onClick={onClose}>Close</button>}
      </div>
    </div>
  )
}

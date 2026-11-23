// Draws share posters and partner cards on a <canvas> in the browser, so nothing is stored on a server.
import type { Product, Profile } from './types'

const NAVY = '#0f1b4d'
const BLUE = '#2347c9'
const GOLD = '#f5b82e'
const FONT = '"Inter", "Segoe UI", system-ui, sans-serif'

function loadImg(src: string, cors = false): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const i = new Image()
    if (cors) i.crossOrigin = 'anonymous'
    i.onload = () => res(i)
    i.onerror = () => res(null)
    i.src = src
  })
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w } else cur = t
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '…') }
  return lines
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r)
}

function circleImg(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number) {
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2); ctx.restore()
}

const rupee = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'

function toBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not create image'))), 'image/png'))
}

async function brand(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color = '#fff') {
  const logo = await loadImg('/logo.jpeg')
  if (logo) {
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2 + 4, 0, Math.PI * 2); ctx.fill()
    circleImg(ctx, logo, x + size / 2, y + size / 2, size / 2)
  }
  ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'
  ctx.font = `800 ${size * 0.5}px ${FONT}`; ctx.fillText('Leaders', x + size + 18, y + size * 0.52)
  ctx.font = `500 ${size * 0.26}px ${FONT}`; ctx.fillText('Earning & Skill Board', x + size + 18, y + size * 0.9)
}

/** 1080×1350 product poster with the partner's contact details and link. */
export async function drawPoster(p: Product, me: Profile, link: string): Promise<Blob> {
  const W = 1080, H = 1350
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a37ad'); g.addColorStop(1, '#3a5fe0')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(W - 80, 120, 260, 0, Math.PI * 2); ctx.fill()
  await brand(ctx, 60, 50, 96)

  // picture
  const pic = p.image_url ? await loadImg(p.image_url, true) : null
  ctx.fillStyle = '#fff'; rr(ctx, 60, 190, W - 120, 420, 40); ctx.fill()
  if (pic) {
    ctx.save(); rr(ctx, 60, 190, W - 120, 420, 40); ctx.clip()
    const s = Math.max((W - 120) / pic.width, 420 / pic.height)
    ctx.drawImage(pic, 60 + ((W - 120) - pic.width * s) / 2, 190 + (420 - pic.height * s) / 2, pic.width * s, pic.height * s)
    ctx.restore()
  } else {
    ctx.font = `260px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.emoji || '📘', W / 2, 410); ctx.textAlign = 'left'
  }

  // title + subtitle
  ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff'; ctx.font = `800 64px ${FONT}`
  let y = 700
  for (const l of wrap(ctx, p.title, W - 120, 2)) { ctx.fillText(l, 60, y); y += 74 }
  if (p.subtitle) { ctx.font = `500 34px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(wrap(ctx, p.subtitle, W - 120, 1)[0], 60, y); y += 56 }

  // price pill
  const mrp = Number(p.mrp ?? 0)
  ctx.font = `900 58px ${FONT}`
  const price = rupee(p.price) + (p.billing === 'monthly' ? '/month' : '')
  const pw = ctx.measureText(price).width + 60
  ctx.fillStyle = GOLD; rr(ctx, 60, y, pw, 92, 46); ctx.fill()
  ctx.fillStyle = NAVY; ctx.fillText(price, 90, y + 66)
  let px = 60 + pw + 24
  if (mrp > p.price) {
    ctx.font = `600 38px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.75)'
    const t = rupee(mrp); ctx.fillText(t, px, y + 60)
    const tw = ctx.measureText(t).width
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, y + 47); ctx.lineTo(px + tw, y + 47); ctx.stroke()
    px += tw + 20
    ctx.fillStyle = '#ef4444'; ctx.font = `800 34px ${FONT}`; ctx.fillText(`${Math.round((1 - p.price / mrp) * 100)}% OFF`, px, y + 60)
  } else if (p.duration) {
    ctx.font = `600 36px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText('⏱ ' + p.duration, px, y + 60)
  }
  y += 130

  // features
  ctx.font = `600 34px ${FONT}`; ctx.fillStyle = '#fff'
  for (const f of (p.features ?? []).slice(0, 3)) { ctx.fillText('✓  ' + wrap(ctx, f, W - 160, 1)[0], 70, y); y += 50 }

  // contact panel
  const top = H - 230
  ctx.fillStyle = '#fff'; rr(ctx, 40, top, W - 80, 200, 32); ctx.fill()
  ctx.fillStyle = NAVY; ctx.font = `800 40px ${FONT}`; ctx.fillText(wrap(ctx, `Call / WhatsApp: ${me.full_name}`, W - 160, 1)[0], 80, top + 62)
  ctx.font = `600 34px ${FONT}`; ctx.fillStyle = '#334155'
  ctx.fillText(`📞 ${me.phone || '—'}    •    Code: ${me.referral_code}`, 80, top + 112)
  ctx.fillStyle = BLUE; ctx.font = `600 28px ${FONT}`; ctx.fillText(wrap(ctx, link.replace(/^https?:\/\//, ''), W - 160, 1)[0], 80, top + 160)
  return toBlob(c)
}

export type CardKind = 'id' | 'visiting' | 'certificate'

/** Partner ID card (portrait), visiting card (landscape) or certificate (landscape). */
export async function drawCard(kind: CardKind, me: Profile, link: string): Promise<Blob> {
  const since = new Date(me.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  if (kind === 'id') {
    const W = 720, H = 1120; c.width = W; c.height = H
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, 230); ctx.fillStyle = GOLD; ctx.fillRect(0, 230, W, 14)
    await brand(ctx, 50, 60, 110)
    // photo ring with initials
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(W / 2, 470, 170, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W / 2, 470, 150, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = BLUE; ctx.font = `800 110px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(initials(me.full_name), W / 2, 475)
    ctx.textBaseline = 'alphabetic'; ctx.fillStyle = NAVY; ctx.font = `800 56px ${FONT}`
    ctx.fillText(wrap(ctx, me.full_name || 'Partner', W - 80, 1)[0], W / 2, 730)
    ctx.fillStyle = BLUE; ctx.font = `700 34px ${FONT}`; ctx.fillText(me.role === 'admin' ? 'ADMIN' : 'AUTHORISED PARTNER', W / 2, 785)
    ctx.textAlign = 'left'; ctx.fillStyle = '#334155'; ctx.font = `600 32px ${FONT}`
    const rows: [string, string][] = [['Partner ID', me.referral_code], ['Phone', me.phone || '—'], ['City', me.city || '—'], ['Since', since]]
    rows.forEach(([k, v], i) => { const yy = 870 + i * 52; ctx.fillStyle = '#64748b'; ctx.fillText(k, 90, yy); ctx.fillStyle = NAVY; ctx.font = `700 32px ${FONT}`; ctx.fillText(v, 300, yy); ctx.font = `600 32px ${FONT}` })
    ctx.fillStyle = NAVY; ctx.fillRect(0, H - 60, W, 60)
    ctx.fillStyle = '#fff'; ctx.font = `500 22px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(link.replace(/^https?:\/\//, '').split('/')[0], W / 2, H - 22)
  } else if (kind === 'visiting') {
    const W = 1050, H = 600; c.width = W; c.height = H
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a37ad'); g.addColorStop(1, '#3a5fe0')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = GOLD; ctx.fillRect(0, H - 18, W, 18)
    await brand(ctx, 60, 50, 100)
    ctx.fillStyle = '#fff'; ctx.font = `800 62px ${FONT}`; ctx.fillText(wrap(ctx, me.full_name || 'Partner', W - 120, 1)[0], 60, 280)
    ctx.fillStyle = GOLD; ctx.font = `700 32px ${FONT}`; ctx.fillText('Education & Skills Partner', 60, 330)
    ctx.fillStyle = '#fff'; ctx.font = `600 32px ${FONT}`
    ctx.fillText(`📞  ${me.phone || '—'}`, 60, 410)
    ctx.fillText(`✉️  ${me.email || '—'}`, 60, 460)
    ctx.fillText(`🆔  Partner code: ${me.referral_code}${me.city ? '   •   📍 ' + me.city : ''}`, 60, 510)
  } else {
    const W = 1400, H = 990; c.width = W; c.height = H
    ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = GOLD; ctx.lineWidth = 18; ctx.strokeRect(30, 30, W - 60, H - 60)
    ctx.strokeStyle = NAVY; ctx.lineWidth = 4; ctx.strokeRect(60, 60, W - 120, H - 120)
    await brand(ctx, W / 2 - 200, 100, 110, NAVY)
    ctx.textAlign = 'center'; ctx.fillStyle = NAVY
    ctx.font = `800 76px ${FONT}`; ctx.fillText('Certificate of Partnership', W / 2, 340)
    ctx.font = `500 34px ${FONT}`; ctx.fillStyle = '#475569'; ctx.fillText('This is to certify that', W / 2, 430)
    ctx.font = `800 70px ${FONT}`; ctx.fillStyle = BLUE; ctx.fillText(wrap(ctx, me.full_name || 'Partner', W - 300, 1)[0], W / 2, 530)
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2 - 360, 560); ctx.lineTo(W / 2 + 360, 560); ctx.stroke()
    ctx.font = `500 34px ${FONT}`; ctx.fillStyle = '#475569'
    ctx.fillText('is an authorised partner of Leaders Earning & Skill Board', W / 2, 630)
    ctx.fillText(`Partner ID ${me.referral_code}${me.city ? ' • ' + me.city : ''} • Partner since ${since}`, W / 2, 685)
    ctx.font = `700 30px ${FONT}`; ctx.fillStyle = NAVY; ctx.fillText('Leaders Earning & Skill Board', W / 2, 860)
  }
  return toBlob(c)
}

/** Saves the blob as a file, or opens the share sheet with it when the device supports that. */
export async function shareOrDownload(blob: Blob, name: string, text: string, mode: 'share' | 'download') {
  const file = new File([blob], name, { type: 'image/png' })
  if (mode === 'share' && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text }).catch(() => {})
    return 'shared'
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return 'downloaded'
}

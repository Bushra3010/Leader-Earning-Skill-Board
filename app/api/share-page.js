// Serves the app's index.html for /p/:slug with Open Graph tags filled in, so WhatsApp,
// Facebook, Telegram etc. show a preview card (product picture, title, pitch) for partner links.
// The page itself is the normal app; only the <head> tags change.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

async function getProduct(slug) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || !/^[a-z0-9-]{1,120}$/.test(slug)) return null
  try {
    const r = await fetch(`${url}/rest/v1/products?slug=eq.${slug}&active=eq.true&select=title,subtitle,pitch,price,billing,duration,image_url&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    if (!r.ok) return null
    return (await r.json())[0] ?? null
  } catch { return null }
}

export default async function handler(req, res) {
  const slug = String(req.query.slug ?? '')
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const origin = `${req.headers['x-forwarded-proto'] || 'https'}://${host}`

  const [shell, p] = await Promise.all([
    fetch(`${origin}/index.html`).then((r) => (r.ok ? r.text() : null)).catch(() => null),
    getProduct(slug),
  ])
  if (!shell) { res.statusCode = 302; res.setHeader('Location', '/'); return res.end() }

  let html = shell
  if (p) {
    const title = `${p.title.trim()} — ₹${Number(p.price).toLocaleString('en-IN')}${p.billing === 'monthly' ? '/month' : ''}`
    const desc = `${(p.pitch || p.subtitle || '').trim()}${p.duration ? ` • ${p.duration.trim()}` : ''} | Leaders Earning & Skill Board`.replace(/^ \| /, '')
    const image = p.image_url || `${origin}/logo.jpeg`
    const pageUrl = `${origin}${req.url?.startsWith('/api/') ? `/p/${slug}` : req.url}`
    const tags = [
      `<meta property="og:site_name" content="Leaders Earning & Skill Board" />`,
      `<meta property="og:type" content="product" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:image" content="${esc(image)}" />`,
      `<meta property="og:url" content="${esc(pageUrl)}" />`,
      `<meta name="description" content="${esc(desc)}" />`,
      `<meta name="twitter:card" content="${p.image_url ? 'summary_large_image' : 'summary'}" />`,
    ].join('\n    ')
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} | Leaders</title>`).replace('</head>', `    ${tags}\n  </head>`)
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600')
  res.statusCode = 200
  res.end(html)
}

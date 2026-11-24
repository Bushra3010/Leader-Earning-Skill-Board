// DEMO backend: everything lives in this browser's localStorage so the app is fully clickable
// before Supabase is connected. Mirrors the rules in supabase/schema.sql.
import type { Api } from './api'
import { DEFAULT_SETTINGS, SEED_LESSONS, SEED_PRODUCTS } from './seed'
import type {
  AdminOrder, AppNotification, Lesson, OrderStatus, PartnerOrder, Product, Profile, Settings, WalletTx, Withdrawal,
} from './types'
import { maskPhone } from './format'

interface Order extends Omit<AdminOrder, 'products' | 'profiles'> {}
interface DB {
  users: { id: string; email: string; password: string }[]
  profiles: Profile[]
  products: Product[]
  orders: Order[]
  wallet: WalletTx[]
  withdrawals: Withdrawal[]
  notifications: AppNotification[]
  reads: { n: string; u: string }[]
  tickets: { id: string; user_id: string; subject: string; message: string; created_at: string }[]
  lessons: Lesson[]
  settings: Settings
}

const KEY = 'lesb-demo-db-v1'
const SESSION = 'lesb-demo-session'
const listeners = new Set<() => void>()
const rid = () => Math.random().toString(36).slice(2, 10)
const code = () => 'LE' + Math.random().toString(36).slice(2, 8).toUpperCase()
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString()
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

function blankProfile(id: string, email: string, name: string): Profile {
  return {
    id, email, full_name: name, phone: null, city: null, referral_code: code(), referred_by: null, role: 'associate', approval_status: 'pending', leaderboard_pin: null,
    kit_status: 'not_paid', points: 0, upi_id: null, bank_account_name: null, bank_account_number: null, bank_ifsc: null,
    pan_number: null, kyc_status: 'not_submitted', created_at: new Date().toISOString(),
  }
}

function seed(): DB {
  const demoId = 'demo-user'
  const me: Profile = { ...blankProfile(demoId, 'demo@leaders.app', 'Demo Partner'), role: 'admin', approval_status: 'approved', referral_code: 'LEDEMO1', phone: '+91 98765 43210', city: 'Jaipur', points: 120, created_at: daysAgo(40) }
  const team: Profile[] = [
    { ...blankProfile('tm1', 'a@x.in', 'Ritika Sharma'), approval_status: 'approved', role: 'partner', kit_status: 'paid', referred_by: demoId, city: 'Ajmer', created_at: daysAgo(20) },
    { ...blankProfile('tm2', 'b@x.in', 'Aman Verma'), approval_status: 'approved', referred_by: demoId, city: 'Kota', created_at: daysAgo(9) },
  ]
  const buyers = [
    ['Priya Mehta', '+919812345671'], ['Rahul Jain', '+919823456782'], ['Sneha Gupta', '+919834567893'],
    ['Vikas Yadav', '+919845678904'], ['Neha Singh', '+919856789015'], ['Arjun Patel', '+919867890126'],
  ]
  const plan: [string, OrderStatus, number, Order['delivery']?][] = [
    ['smart-memory-kit', 'paid', 2, 'delivered'], ['smart-memory-kit', 'paid', 5, 'shipped'], ['tally-prime-gst', 'paid', 7],
    ['national-competition', 'paid', 3], ['smart-memory-kit', 'cancelled', 11, 'pending'], ['phonics-starter-kit', 'pending', 1, 'pending'],
    ['gst-practitioner', 'failed', 14], ['national-competition', 'paid', 30],
  ]
  const products = SEED_PRODUCTS
  const orders: Order[] = []
  const wallet: WalletTx[] = []
  plan.forEach(([slug, status, ago, delivery], i) => {
    const p = products.find((x) => x.slug === slug)!
    const [name, phone] = buyers[i % buyers.length]
    const o: Order = {
      id: rid(), order_code: 'LE' + (240000 + i * 137), product_id: p.id, partner_id: demoId, buyer_name: name, buyer_phone: phone,
      buyer_email: null, buyer_address: null, payment_ref: status === 'paid' ? 'pay_' + rid() : null, amount: p.price,
      kind: p.billing === 'monthly' ? 'subscription' : p.mode === 'pro_school' ? 'enrollment' : 'order',
      status, delivery: delivery ?? (p.is_physical ? 'pending' : 'not_applicable'),
      commission_amount: status === 'paid' ? Math.round(p.price * p.commission_pct) / 100 : 0, created_at: daysAgo(ago),
    }
    orders.push(o)
    if (status === 'paid') wallet.push({ id: rid(), partner_id: demoId, order_id: o.id, amount: o.commission_amount, kind: 'commission', note: 'Commission for ' + o.order_code, created_at: o.created_at })
  })
  return {
    users: [{ id: demoId, email: 'demo@leaders.app', password: 'demo1234' }],
    profiles: [me, ...team],
    products,
    orders,
    wallet,
    withdrawals: [],
    notifications: [
      { id: rid(), user_id: null, title: 'Welcome to Leaders Earning and Skill Board 🎉', body: 'Share any product with your partner link and earn the commission shown on it.', created_at: daysAgo(40) },
      { id: rid(), user_id: null, title: 'New: Little Genius Activity Box', body: '18% commission on every monthly subscription.', created_at: daysAgo(4) },
    ],
    reads: [],
    tickets: [],
    lessons: SEED_LESSONS.map((l) => ({ ...l, id: rid() })),
    settings: { ...DEFAULT_SETTINGS, require_partner_kit: true, support_phone: '+91 00000 00000', support_email: 'support@example.com' },
  }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const db = seed()
  save(db)
  return db
}
function save(db: DB) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* ignore */ }
}
function session(): string | null {
  try { return localStorage.getItem(SESSION) } catch { return null }
}
function setSession(id: string | null) {
  try { id ? localStorage.setItem(SESSION, id) : localStorage.removeItem(SESSION) } catch { /* ignore */ }
  listeners.forEach((l) => l())
}
function mut(fn: (db: DB) => void) {
  const db = load(); fn(db); save(db)
}
function need(): string {
  const s = session()
  if (!s) throw new Error('Please log in')
  return s
}
function isAdmin(db: DB) {
  return db.profiles.find((p) => p.id === session())?.role === 'admin'
}

function applyStatus(db: DB, o: Order, status: OrderStatus) {
  const prev = o.status
  o.status = status
  if (!o.partner_id) return
  const p = db.products.find((x) => x.id === o.product_id)
  if (status === 'paid' && prev !== 'paid') {
    o.commission_amount = Math.round(o.amount * (p?.commission_pct ?? 0)) / 100
    if (!db.wallet.some((w) => w.order_id === o.id && w.kind === 'commission')) {
      db.wallet.push({ id: rid(), partner_id: o.partner_id, order_id: o.id, amount: o.commission_amount, kind: 'commission', note: 'Commission for ' + o.order_code, created_at: new Date().toISOString() })
      const prof = db.profiles.find((x) => x.id === o.partner_id)
      if (prof) prof.points += 10
      db.notifications.push({ id: rid(), user_id: o.partner_id, title: 'Commission earned 🎉', body: `₹${o.commission_amount} credited for order ${o.order_code}`, created_at: new Date().toISOString() })
    }
  } else if (prev === 'paid' && (status === 'cancelled' || status === 'refunded')) {
    db.wallet.push({ id: rid(), partner_id: o.partner_id, order_id: o.id, amount: -o.commission_amount, kind: 'reversal', note: 'Reversal for ' + o.order_code, created_at: new Date().toISOString() })
  }
}

export const demoApi: Api = {
  isDemo: true,

  async currentUserId() { return session() },
  onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb) },
  async signIn(email, password) {
    const db = load()
    const u = db.users.find((x) => x.email.toLowerCase() === email.toLowerCase().trim())
    if (!u || u.password !== password) throw new Error('Invalid email or password')
    setSession(u.id)
  },
  async signUp(i) {
    let id = ''
    mut((db) => {
      if (db.users.some((u) => u.email.toLowerCase() === i.email.toLowerCase())) throw new Error('This email is already registered')
      id = rid()
      db.users.push({ id, email: i.email.trim(), password: i.password })
      const ref = db.profiles.find((p) => p.referral_code === i.ref_code.trim().toUpperCase())
      db.profiles.push({ ...blankProfile(id, i.email.trim(), i.full_name), phone: i.phone, city: i.city, referred_by: ref?.id ?? null })
    })
    setSession(id)
    return { needsConfirmation: false }
  },
  async resetPassword() { /* demo: nothing to send */ },
  async resendConfirmation() { /* demo: nothing to send */ },
  async signOut() { setSession(null) },

  async getProfile() { const s = session(); return delay(load().profiles.find((p) => p.id === s) ?? null) },
  async updateProfile(patch) {
    const s = need()
    mut((db) => {
      const p = db.profiles.find((x) => x.id === s)!
      const { role, points, referral_code, referred_by, kit_status, ...safe } = patch
      void role; void points; void referral_code; void referred_by; void kit_status
      Object.assign(p, safe)
    })
  },
  async listProducts() { return delay(load().products.filter((p) => p.active || isAdmin(load())).sort((a, b) => a.sort_order - b.sort_order)) },
  async getProduct(slug) { return delay(load().products.find((p) => p.slug === slug) ?? null) },
  async listMyOrders() {
    const s = need(); const db = load()
    const res: PartnerOrder[] = db.orders.filter((o) => o.partner_id === s).map((o) => {
      const p = db.products.find((x) => x.id === o.product_id)!
      return { id: o.id, order_code: o.order_code, product_id: o.product_id, product_title: p?.title ?? '—', mode: p?.mode ?? 'school', buyer_name: o.buyer_name,
        buyer_phone_masked: maskPhone(o.buyer_phone), amount: o.amount, kind: o.kind, status: o.status, delivery: o.delivery, commission_amount: o.commission_amount, created_at: o.created_at }
    })
    return delay(res.sort((a, b) => b.created_at.localeCompare(a.created_at)))
  },
  async listWallet() { const s = need(); return delay(load().wallet.filter((w) => w.partner_id === s).sort((a, b) => b.created_at.localeCompare(a.created_at))) },
  async listWithdrawals() { const s = need(); return delay(load().withdrawals.filter((w) => w.partner_id === s).sort((a, b) => b.created_at.localeCompare(a.created_at))) },
  async requestWithdrawal(amount) {
    const s = need()
    mut((db) => {
      const bal = db.wallet.filter((w) => w.partner_id === s).reduce((a, w) => a + w.amount, 0)
      const me = db.profiles.find((p) => p.id === s)!
      if (!me.upi_id && !me.bank_account_number) throw new Error('Add UPI or bank details in Profile first')
      if (amount < db.settings.min_withdrawal) throw new Error(`Minimum withdrawal is ₹${db.settings.min_withdrawal}`)
      if (amount > bal) throw new Error('Amount exceeds wallet balance')
      const now = new Date().toISOString()
      db.withdrawals.push({ id: rid(), partner_id: s, amount, method: me.upi_id ? 'upi' : 'bank', status: 'requested', admin_note: null, created_at: now })
      db.wallet.push({ id: rid(), partner_id: s, order_id: null, amount: -amount, kind: 'withdrawal', note: 'Withdrawal request', created_at: now })
    })
  },
  async listTeam() {
    const s = need(); const db = load()
    return delay(db.profiles.filter((p) => p.referred_by === s).map((p) => ({ id: p.id, full_name: p.full_name, city: p.city, created_at: p.created_at,
      paid_sales: db.orders.filter((o) => o.partner_id === p.id && o.status === 'paid').length,
      last_sale_at: db.orders.filter((o) => o.partner_id === p.id && o.status === 'paid').map((o) => o.created_at).sort().pop() ?? null })))
  },
  async teamStats() {
    const s = need(); const db = load()
    const levels = new Map<string, number>()
    let frontier = [s]
    for (let lvl = 1; lvl <= 10 && frontier.length; lvl++) {
      frontier = db.profiles.filter((p) => p.referred_by && frontier.includes(p.referred_by) && !levels.has(p.id)).map((p) => p.id)
      frontier.forEach((id) => levels.set(id, lvl))
    }
    const ids = [...levels.keys()]
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0)
    const team = db.orders.filter((o) => o.partner_id && ids.includes(o.partner_id))
    const thisMonth = team.filter((o) => new Date(o.created_at) >= month)
    return delay({
      direct: [...levels.values()].filter((l) => l === 1).length, downline: ids.length, orders_month: thisMonth.length,
      sales_month: thisMonth.filter((o) => o.status === 'paid').reduce((a, o) => a + o.amount, 0),
      last_order: team.map((o) => o.created_at).sort().pop() ?? null,
    })
  },
  async leaderboard(scope) {
    const s = need(); const db = load()
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0)
    const myCity = (db.profiles.find((p) => p.id === s)?.city ?? '').trim().toLowerCase()
    const rows = db.profiles
      .filter((p) => scope !== 'city' || (p.city ?? '').trim().toLowerCase() === myCity)
      .filter((p) => (p.approval_status ?? 'approved') === 'approved')
      .map((p) => ({ partner_id: p.id, full_name: p.full_name, city: p.city, is_me: p.id === s, pin: p.leaderboard_pin ?? null, pinned: p.leaderboard_pin != null,
        sales: db.orders.filter((o) => o.partner_id === p.id && o.status === 'paid' && new Date(o.created_at) >= month).reduce((a, o) => a + o.amount, 0) }))
      .filter((r) => r.sales > 0 || r.is_me || r.pinned)
      .sort((a, b) => (a.pin ?? 99) - (b.pin ?? 99) || b.sales - a.sales || a.full_name.localeCompare(b.full_name))
    const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }))
    return delay(ranked.filter((r) => r.rank <= 50 || r.is_me))
  },
  async listNotifications() {
    const s = need(); const db = load()
    return delay(db.notifications.filter((n) => !n.user_id || n.user_id === s).map((n) => ({ ...n, read: db.reads.some((r) => r.n === n.id && r.u === s) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at)))
  },
  async markNotificationsRead(ids) {
    const s = need()
    mut((db) => ids.forEach((n) => { if (!db.reads.some((r) => r.n === n && r.u === s)) db.reads.push({ n, u: s }) }))
  },
  async createTicket(subject, message) {
    const s = need()
    mut((db) => db.tickets.push({ id: rid(), user_id: s, subject, message, created_at: new Date().toISOString() }))
  },
  async getSettings() { return delay(load().settings) },
  async requestPartnerKit(ref) {
    const s = need()
    mut((db) => {
      const p = db.profiles.find((x) => x.id === s)!
      if (p.kit_status === 'not_paid') p.kit_status = 'pending'
      db.tickets.push({ id: rid(), user_id: s, subject: 'Partner kit payment', message: 'Payment reference: ' + ref, created_at: new Date().toISOString() })
    })
  },
  async listLessons() { return delay(load().lessons.sort((a, b) => a.sort_order - b.sort_order)) },

  async partnerNameForCode(c) { return delay(load().profiles.find((p) => p.referral_code === c.toUpperCase())?.full_name.split(' ')[0] ?? null) },
  async createOrder(i) {
    let oc = ''
    mut((db) => {
      const p = db.products.find((x) => x.slug === i.slug && x.active)
      if (!p) throw new Error('Product not found')
      if (i.name.trim().length < 2 || i.phone.replace(/\D/g, '').length < 10) throw new Error('Valid name and 10-digit phone are required')
      const partner = db.profiles.find((x) => x.referral_code === i.ref.toUpperCase())
      oc = 'LE' + Date.now().toString().slice(-7)
      db.orders.push({ id: rid(), order_code: oc, product_id: p.id, partner_id: partner?.id ?? null, buyer_name: i.name.trim(), buyer_phone: i.phone.trim(),
        buyer_email: i.email || null, buyer_address: i.address || null, payment_ref: null, amount: p.price,
        kind: p.billing === 'monthly' ? 'subscription' : p.mode === 'pro_school' ? 'enrollment' : 'order', status: 'pending',
        delivery: p.is_physical ? 'pending' : 'not_applicable', commission_amount: 0, created_at: new Date().toISOString() })
    })
    return oc
  },

  async adminListOrders() {
    const db = load()
    return delay(db.orders.map((o) => {
      const p = db.products.find((x) => x.id === o.product_id); const pr = db.profiles.find((x) => x.id === o.partner_id)
      return { ...o, products: p ? { title: p.title, mode: p.mode } : null, profiles: pr ? { full_name: pr.full_name, referral_code: pr.referral_code } : null }
    }).sort((a, b) => b.created_at.localeCompare(a.created_at)))
  },
  async adminUpdateOrder(id, patch) {
    mut((db) => {
      const o = db.orders.find((x) => x.id === id)!
      if (patch.delivery) o.delivery = patch.delivery
      if (patch.payment_ref !== undefined) o.payment_ref = patch.payment_ref
      if (patch.status) applyStatus(db, o, patch.status)
    })
  },
  async adminListWithdrawals() {
    const db = load()
    return delay(db.withdrawals.map((w) => {
      const p = db.profiles.find((x) => x.id === w.partner_id)
      return { ...w, profiles: p ? { full_name: p.full_name, upi_id: p.upi_id, bank_account_number: p.bank_account_number, bank_ifsc: p.bank_ifsc } : null }
    }).sort((a, b) => b.created_at.localeCompare(a.created_at)))
  },
  async adminUpdateWithdrawal(id, status, note) {
    mut((db) => {
      const w = db.withdrawals.find((x) => x.id === id)!
      if (status === 'rejected' && w.status !== 'rejected')
        db.wallet.push({ id: rid(), partner_id: w.partner_id, order_id: null, amount: w.amount, kind: 'reversal', note: 'Withdrawal rejected — refunded', created_at: new Date().toISOString() })
      w.status = status; w.admin_note = note ?? null
    })
  },
  async adminListPartners() { return delay(load().profiles.sort((a, b) => b.created_at.localeCompare(a.created_at))) },
  async adminUpdatePartner(id, patch) {
    mut((db) => {
      const p = db.profiles.find((x) => x.id === id)!
      const wasPaid = p.kit_status === 'paid'
      Object.assign(p, patch)
      if (!wasPaid && p.kit_status === 'paid' && p.role === 'associate') p.role = 'partner'
    })
  },
  async adminSaveProduct(p) {
    mut((db) => {
      const ex = p.id ? db.products.find((x) => x.id === p.id) : undefined
      if (ex) Object.assign(ex, p)
      else db.products.push({ ...SEED_PRODUCTS[0], is_featured: false, ...p, id: 'prod-' + rid(), sort_order: db.products.length } as Product)
    })
  },
  async adminListMembers() {
    const db = load()
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
    return delay(db.profiles.map((p) => {
      const up = db.profiles.find((x) => x.id === p.referred_by)
      const paid = db.orders.filter((o) => o.partner_id === p.id && o.status === 'paid')
      const tx = db.wallet.filter((w) => w.partner_id === p.id)
      const wd = db.withdrawals.filter((w) => w.partner_id === p.id)
      return {
        id: p.id, full_name: p.full_name, email: p.email, phone: p.phone, city: p.city, referral_code: p.referral_code, role: p.role,
        kit_status: p.kit_status, kyc_status: p.kyc_status, approval_status: p.approval_status ?? 'approved', leaderboard_pin: p.leaderboard_pin ?? null,
        created_at: p.created_at, upline_name: up?.full_name ?? null, upline_code: up?.referral_code ?? null,
        team_size: db.profiles.filter((x) => x.referred_by === p.id).length, paid_orders: paid.length, sales_amount: sum(paid.map((o) => o.amount)),
        incentive_earned: sum(tx.filter((w) => w.kind !== 'withdrawal').map((w) => w.amount)),
        paid_out: sum(wd.filter((w) => w.status === 'paid').map((w) => w.amount)),
        pending_payout: sum(wd.filter((w) => w.status === 'requested' || w.status === 'approved').map((w) => w.amount)),
        wallet_balance: sum(tx.map((w) => w.amount)),
      }
    }).sort((a, b) => b.created_at.localeCompare(a.created_at)))
  },
  async adminUploadProductImage(file) {
    if (file.size > 1_500_000) throw new Error('In demo mode pictures must be under 1.5 MB')
    return new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('Could not read file')); r.readAsDataURL(file) })
  },
  async adminBroadcast(title, body) { mut((db) => db.notifications.push({ id: rid(), user_id: null, title, body, created_at: new Date().toISOString() })) },
  async adminSaveSettings(s) { mut((db) => { db.settings = s }) },
}

export function resetDemo() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(SESSION) } catch { /* ignore */ }
}

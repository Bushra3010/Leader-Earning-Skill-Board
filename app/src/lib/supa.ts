import { createClient } from '@supabase/supabase-js'
import type { Api } from './api'
import { PUBLIC_URL } from './config'
import { DEFAULT_SETTINGS } from './seed'
import type { AppNotification, Product, Settings } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = url && key ? createClient(url, key) : (null as never)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check(r: { data: any; error: { message: string } | null }): any {
  if (r.error) {
    if (/rate limit/i.test(r.error.message)) throw new Error('Too many sign-up emails were sent in the last hour. Please try again in about an hour.')
    throw new Error(r.error.message)
  }
  return r.data
}

async function uid() {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

const normProduct = (p: Product): Product => ({ ...p, price: Number(p.price), commission_pct: Number(p.commission_pct), features: p.features ?? [], mrp: p.mrp == null ? null : Number(p.mrp) })

export const supabaseApi: Api = {
  isDemo: false,

  currentUserId: uid,
  onAuthChange(cb) {
    const { data } = supabase.auth.onAuthStateChange(() => cb())
    return () => data.subscription.unsubscribe()
  },
  async signIn(email, password) {
    const r = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (r.error) {
      const m = r.error.message.toLowerCase()
      if (m.includes('email not confirmed')) throw new Error('EMAIL_NOT_CONFIRMED')
      if (m.includes('invalid login credentials')) throw new Error('Wrong email or password. If you forgot your password, tap "Forgot password?" below.')
      throw new Error(r.error.message)
    }
  },
  async signUp(i) {
    const data = check(await supabase.auth.signUp({
      email: i.email.trim(), password: i.password,
      options: {
        emailRedirectTo: PUBLIC_URL + '/login',
        data: { full_name: i.full_name, phone: i.phone, city: i.city, ref_code: i.ref_code.trim().toUpperCase() },
      },
    }))
    // Supabase hides "already registered" by returning a fake user with no identities.
    // In that case the new password was NOT saved, so tell the user instead of pretending it worked.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('This email is already registered. Please log in, or use "Forgot password?" on the login page to set a new password.')
    }
    return { needsConfirmation: !data.session }
  },
  async resendConfirmation(email) {
    check(await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: PUBLIC_URL + '/login' } }))
  },
  async resetPassword(email) {
    check(await supabase.auth.resetPasswordForEmail(email, { redirectTo: PUBLIC_URL + '/login' }))
  },
  async signOut() {
    await supabase.auth.signOut()
  },

  async getProfile() {
    const id = await uid()
    if (!id) return null
    return check(await supabase.from('profiles').select('*').eq('id', id).maybeSingle())
  },
  async updateProfile(patch) {
    const id = await uid()
    check(await supabase.from('profiles').update(patch).eq('id', id!))
  },
  async listProducts() {
    const d = check(await supabase.from('products').select('*').order('sort_order'))
    return (d as Product[]).map(normProduct)
  },
  async getProduct(slug) {
    const d = check(await supabase.from('products').select('*').eq('slug', slug).maybeSingle())
    return d ? normProduct(d as Product) : null
  },
  async listMyOrders() {
    return check(await supabase.from('my_orders').select('*').order('created_at', { ascending: false }))
  },
  async listWallet() {
    const id = await uid()
    return check(await supabase.from('wallet_transactions').select('*').eq('partner_id', id!).order('created_at', { ascending: false }))
  },
  async listWithdrawals() {
    const id = await uid()
    return check(await supabase.from('withdrawals').select('*').eq('partner_id', id!).order('created_at', { ascending: false }))
  },
  async requestWithdrawal(amount) {
    check(await supabase.rpc('request_withdrawal', { p_amount: amount }))
  },
  async listTeam() {
    return check(await supabase.from('my_team').select('*').order('created_at', { ascending: false }))
  },
  async teamStats() {
    const r = await supabase.rpc('my_team_stats')
    if (r.error && /my_team_stats/.test(r.error.message)) throw new Error('Team snapshot needs a database update (see supabase/migrations).')
    const d = check(r) ?? {}
    return { direct: Number(d.direct ?? 0), downline: Number(d.downline ?? 0), orders_month: Number(d.orders_month ?? 0),
      sales_month: Number(d.sales_month ?? 0), last_order: d.last_order ?? null }
  },
  async leaderboard(scope) {
    const r = await supabase.rpc('leaderboard', { p_scope: scope })
    if (r.error && /leaderboard/.test(r.error.message)) throw new Error('Leaderboard needs a database update (see supabase/migrations).')
    return (check(r) ?? []).map((x: { rank: number; sales: number }) => ({ ...x, rank: Number(x.rank), sales: Number(x.sales) }))
  },
  async listNotifications() {
    const id = await uid()
    const list = check(await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)) as AppNotification[]
    const reads = check(await supabase.from('notification_reads').select('notification_id').eq('user_id', id!)) as { notification_id: string }[]
    const r = new Set(reads.map((x) => x.notification_id))
    return list.map((n) => ({ ...n, read: r.has(n.id) }))
  },
  async markNotificationsRead(ids) {
    const id = await uid()
    if (!ids.length) return
    check(await supabase.from('notification_reads').upsert(ids.map((n) => ({ notification_id: n, user_id: id }))))
  },
  async listMyTickets() {
    const id = await uid()
    return check(await supabase.from('support_tickets').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20))
  },
  async listVideos() {
    const r = await supabase.from('demo_videos').select('*').order('sort_order').order('created_at', { ascending: false })
    if (r.error && /demo_videos/.test(r.error.message)) return []
    return check(r)
  },
  async adminSaveVideo(v) {
    const { id, ...rest } = v
    const r = id ? await supabase.from('demo_videos').update(rest).eq('id', id) : await supabase.from('demo_videos').insert(rest)
    if (r.error && /demo_videos/.test(r.error.message)) throw new Error('Videos need a database update first (supabase/migrations/20261127_demo_videos.sql).')
    check(r)
  },
  async adminDeleteVideo(id) {
    check(await supabase.from('demo_videos').delete().eq('id', id))
  },
  async adminUploadVideo(file, onProgress) {
    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4'
    const path = `video-${Date.now()}.${ext}`
    onProgress?.(5)
    const r = await supabase.storage.from('demo-videos').upload(path, file, { contentType: file.type || 'video/mp4', upsert: false, cacheControl: '31536000' })
    if (r.error) {
      if (/bucket not found/i.test(r.error.message)) throw new Error('Video upload needs a database update first (supabase/migrations/20261127_demo_videos.sql).')
      if (/exceeded|too large|maximum/i.test(r.error.message)) throw new Error('Video is too big — keep it under 50 MB (a 30–60 sec phone video usually is).')
      throw new Error(r.error.message)
    }
    onProgress?.(100)
    return supabase.storage.from('demo-videos').getPublicUrl(path).data.publicUrl
  },
  async adminListTickets() {
    return check(await supabase.from('support_tickets').select('*, profiles(full_name, phone, referral_code, approval_status)').order('created_at', { ascending: false }).limit(500))
  },
  async adminUpdateTicket(id, patch) {
    const body = patch.admin_reply !== undefined ? { ...patch, replied_at: patch.admin_reply ? new Date().toISOString() : null } : patch
    const r = await supabase.from('support_tickets').update(body).eq('id', id).select('id')
    if (r.error && /admin_reply|replied_at/.test(r.error.message)) throw new Error('Replies need a database update first (supabase/migrations/20261127_support_tickets.sql).')
    if (!r.error && !(r.data ?? []).length) throw new Error('Not saved — run supabase/migrations/20261127_support_tickets.sql first.')
    check(r)
  },
  async createTicket(subject, message) {
    const id = await uid()
    check(await supabase.from('support_tickets').insert({ user_id: id, subject, message }))
  },
  async getSettings() {
    const d = check(await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle()) as Settings | null
    return d ? { ...DEFAULT_SETTINGS, ...d, min_withdrawal: Number(d.min_withdrawal), partner_kit_price: Number(d.partner_kit_price), role_features: { ...DEFAULT_SETTINGS.role_features, ...(d.role_features ?? {}) } } : DEFAULT_SETTINGS
  },
  async requestPartnerKit(ref) {
    check(await supabase.rpc('request_partner_kit', { p_payment_ref: ref }))
  },
  async listLessons() {
    return check(await supabase.from('lessons').select('*').order('sort_order'))
  },

  async partnerNameForCode() {
    // Partner names are private; buyers only see the product. Return null intentionally.
    return null
  },
  async createOrder(i) {
    return check(await supabase.rpc('create_order', {
      p_product_slug: i.slug, p_ref_code: i.ref, p_name: i.name, p_phone: i.phone,
      p_email: i.email || null, p_address: i.address || null,
    })) as string
  },

  async adminListOrders() {
    return check(await supabase.from('orders').select('*, products(title, mode), profiles(full_name, referral_code)').order('created_at', { ascending: false }).limit(500))
  },
  async adminUpdateOrder(id, patch) {
    check(await supabase.from('orders').update(patch).eq('id', id))
  },
  async adminListWithdrawals() {
    return check(await supabase.from('withdrawals').select('*, profiles(full_name, upi_id, bank_account_number, bank_ifsc)').order('created_at', { ascending: false }))
  },
  async adminUpdateWithdrawal(id, status, note) {
    check(await supabase.from('withdrawals').update({ status, admin_note: note ?? null }).eq('id', id))
  },
  async adminListPartners() {
    return check(await supabase.from('profiles').select('*').order('created_at', { ascending: false }))
  },
  async adminUpdatePartner(id, patch) {
    const r = await supabase.from('profiles').update(patch).eq('id', id)
    if (r.error && /feature_overrides/.test(r.error.message)) throw new Error('Per-member menus need a database update first (supabase/migrations/20261127_member_features.sql).')
    check(r)
  },
  async adminSaveProduct(p) {
    const { id, ...rest } = p
    const r = id ? await supabase.from('products').update(rest).eq('id', id) : await supabase.from('products').insert(rest)
    if (r.error && /image_url|mrp/.test(r.error.message)) throw new Error('Photo and MRP need a database update first (supabase/migrations/20261124_leaderboard_team_products.sql).')
    check(r)
  },
  async adminListMembers() {
    const r = await supabase.from('admin_member_stats').select('*').order('created_at', { ascending: false }).limit(5000)
    if (r.error && /admin_member_stats/.test(r.error.message)) throw new Error('Members list needs a database update first (supabase/migrations/20261125_member_types.sql).')
    const num = ['team_size', 'paid_orders', 'sales_amount', 'incentive_earned', 'paid_out', 'pending_payout', 'wallet_balance']
    return (check(r) ?? []).map((m: Record<string, unknown>) => ({ ...m, ...Object.fromEntries(num.map((k) => [k, Number(m[k] ?? 0)])) }))
  },
  async adminUploadProductImage(file, slug) {
    const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
    const path = `${(slug || 'product').replace(/[^a-z0-9-]/g, '') || 'product'}-${Date.now()}.${ext}`
    const r = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' })
    if (r.error) {
      if (/bucket not found/i.test(r.error.message)) throw new Error('Picture upload needs a database update first (supabase/migrations/20261125_product_images.sql).')
      throw new Error(r.error.message)
    }
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
  },
  async adminBroadcast(title, body) {
    check(await supabase.from('notifications').insert({ title, body, user_id: null }))
  },
  async adminSaveSettings(s) {
    const r = await supabase.from('app_settings').update(s).eq('id', 1)
    if (r.error && /role_features/.test(r.error.message)) throw new Error('Menu settings need a database update first (supabase/migrations/20261125_member_types.sql).')
    check(r)
  },
}

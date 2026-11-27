export type Mode = 'pre_school' | 'pro_school' | 'school'
/** admin = runs the app • partner = paid the partner fee, can build a team • associate = free member, sells for themself */
export type Role = 'admin' | 'partner' | 'associate'
export const ROLE_LABEL: Record<Role, string> = { admin: 'Admin', partner: 'Partner', associate: 'Associate' }

/** Menus the admin can switch on/off per member type (Admin → Settings). Admins always see everything. */
export type Feature = 'team' | 'leaderboard' | 'posters' | 'cards' | 'learn'
export const FEATURES: { id: Feature; label: string }[] = [
  { id: 'team', label: 'My Team & invite link' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'posters', label: 'Posters gallery' },
  { id: 'cards', label: 'ID / visiting card & certificate' },
  { id: 'learn', label: 'Learn' },
]
export type RoleFeatures = Record<'partner' | 'associate', Feature[]>
export const DEFAULT_ROLE_FEATURES: RoleFeatures = {
  partner: ['team', 'leaderboard', 'posters', 'cards', 'learn'],
  associate: ['leaderboard', 'posters', 'cards', 'learn'],
}
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'halted' | 'failed' | 'refunded'
export type DeliveryStatus = 'not_applicable' | 'pending' | 'shipped' | 'delivered'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  city: string | null
  referral_code: string
  referred_by: string | null
  role: Role
  kit_status: 'not_paid' | 'pending' | 'paid'
  points: number
  upi_id: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_ifsc: string | null
  pan_number: string | null
  kyc_status: 'not_submitted' | 'submitted' | 'verified' | 'rejected'
  created_at: string
  /** New sign-ups wait for admin approval. Missing (before the DB update) = approved. */
  approval_status?: 'pending' | 'approved' | 'rejected'
  /** Admin-chosen leaderboard position (1 = top). */
  leaderboard_pin?: number | null
  /** Per-member menu switches set by admin; missing keys follow the member type. */
  feature_overrides?: Partial<Record<Feature, boolean>>
}

export interface Product {
  id: string
  slug: string
  mode: Mode
  title: string
  subtitle: string | null
  emoji: string
  price: number
  billing: 'one_time' | 'monthly'
  duration: string | null
  commission_pct: number
  best_for: string | null
  description: string | null
  features: string[]
  pitch: string | null
  is_physical: boolean
  requires_partner_kit: boolean
  is_featured: boolean
  banner_gradient: string | null
  active: boolean
  sort_order: number
  /** Optional: photo shown on product cards. */
  image_url?: string | null
  /** Optional: original price; when higher than price a % OFF badge is shown. */
  mrp?: number | null
}

export interface PartnerOrder {
  id: string
  order_code: string
  product_id: string
  product_title: string
  mode: Mode
  buyer_name: string
  buyer_phone_masked: string
  amount: number
  kind: 'order' | 'enrollment' | 'subscription'
  status: OrderStatus
  delivery: DeliveryStatus
  commission_amount: number
  created_at: string
}

export interface AdminOrder extends Omit<PartnerOrder, 'buyer_phone_masked' | 'product_title' | 'mode'> {
  partner_id: string | null
  buyer_phone: string
  buyer_email: string | null
  buyer_address: string | null
  payment_ref: string | null
  products?: { title: string; mode: Mode } | null
  profiles?: { full_name: string; referral_code: string } | null
}

export interface WalletTx {
  id: string
  partner_id: string
  order_id: string | null
  amount: number
  kind: 'commission' | 'withdrawal' | 'reversal' | 'bonus'
  note: string | null
  created_at: string
}

export interface Withdrawal {
  id: string
  partner_id: string
  amount: number
  method: string
  status: 'requested' | 'approved' | 'paid' | 'rejected'
  admin_note: string | null
  created_at: string
  profiles?: { full_name: string; upi_id: string | null; bank_account_number: string | null; bank_ifsc: string | null } | null
}

export interface AppNotification {
  id: string
  user_id: string | null
  title: string
  body: string | null
  created_at: string
  read?: boolean
}

export interface DemoVideo {
  id: string
  title: string
  video_url: string
  product_id: string | null
  sort_order: number
  active: boolean
  created_at: string
}

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  message: string
  status: 'open' | 'closed'
  admin_reply?: string | null
  replied_at?: string | null
  created_at: string
  profiles?: { full_name: string; phone: string | null; referral_code: string; approval_status?: string } | null
}

export interface TeamMember {
  id: string
  full_name: string
  city: string | null
  created_at: string
  paid_sales: number
  last_sale_at?: string | null
}

export interface LeaderRow {
  rank: number
  partner_id: string
  full_name: string
  city: string | null
  sales: number
  is_me: boolean
  pinned?: boolean
}

export interface MemberStat {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  city: string | null
  referral_code: string
  role: Role
  kit_status: Profile['kit_status']
  kyc_status: Profile['kyc_status']
  approval_status: NonNullable<Profile['approval_status']>
  leaderboard_pin: number | null
  feature_overrides?: Partial<Record<Feature, boolean>>
  created_at: string
  upline_name: string | null
  upline_code: string | null
  team_size: number
  paid_orders: number
  sales_amount: number
  incentive_earned: number
  paid_out: number
  pending_payout: number
  wallet_balance: number
}

export interface TeamStats {
  direct: number
  downline: number
  orders_month: number
  sales_month: number
  last_order: string | null
}

export interface Lesson {
  id: string
  product_id: string | null
  category: 'about' | 'how_to_sell' | 'branding'
  level: string
  title: string
  body: string
  sort_order: number
}

export interface Settings {
  min_withdrawal: number
  payout_days: string
  require_partner_kit: boolean
  partner_kit_price: number
  support_phone: string
  support_email: string
  whatsapp_number: string
  role_features: RoleFeatures
}

export interface SignUpInput {
  email: string
  password: string
  full_name: string
  phone: string
  city: string
  ref_code: string
}


/** Whether a member gets a menu: their own override first, then their member type's setting. Admins get everything. */
export function memberCan(m: Pick<Profile, 'role' | 'feature_overrides'>, f: Feature, roleFeatures: RoleFeatures): boolean {
  if (m.role === 'admin') return true
  const o = m.feature_overrides?.[f]
  if (typeof o === 'boolean') return o
  return (roleFeatures[m.role] ?? DEFAULT_ROLE_FEATURES[m.role]).includes(f)
}

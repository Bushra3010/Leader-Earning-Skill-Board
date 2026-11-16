export type Mode = 'pre_school' | 'pro_school' | 'school'
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
  role: 'partner' | 'admin'
  kit_status: 'not_paid' | 'pending' | 'paid'
  points: number
  upi_id: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_ifsc: string | null
  pan_number: string | null
  kyc_status: 'not_submitted' | 'submitted' | 'verified' | 'rejected'
  created_at: string
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

export interface TeamMember {
  id: string
  full_name: string
  city: string | null
  created_at: string
  paid_sales: number
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
}

export interface SignUpInput {
  email: string
  password: string
  full_name: string
  phone: string
  city: string
  ref_code: string
}

export const MODE_LABEL: Record<Mode, string> = {
  pre_school: 'Pre-School',
  pro_school: 'Pro-School',
  school: 'School',
}

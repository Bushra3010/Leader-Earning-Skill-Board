import type {
  AdminOrder, AppNotification, DeliveryStatus, Lesson, OrderStatus, PartnerOrder, Product, Profile,
  Settings, SignUpInput, TeamMember, WalletTx, Withdrawal,
} from './types'
import { demoApi } from './demo'
import { supabaseApi } from './supa'

export interface Api {
  isDemo: boolean
  // auth
  currentUserId(): Promise<string | null>
  onAuthChange(cb: () => void): () => void
  signIn(email: string, password: string): Promise<void>
  signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }>
  resetPassword(email: string): Promise<void>
  resendConfirmation(email: string): Promise<void>
  signOut(): Promise<void>
  // partner
  getProfile(): Promise<Profile | null>
  updateProfile(patch: Partial<Profile>): Promise<void>
  listProducts(): Promise<Product[]>
  getProduct(slug: string): Promise<Product | null>
  listMyOrders(): Promise<PartnerOrder[]>
  listWallet(): Promise<WalletTx[]>
  listWithdrawals(): Promise<Withdrawal[]>
  requestWithdrawal(amount: number): Promise<void>
  listTeam(): Promise<TeamMember[]>
  listNotifications(): Promise<AppNotification[]>
  markNotificationsRead(ids: string[]): Promise<void>
  createTicket(subject: string, message: string): Promise<void>
  getSettings(): Promise<Settings>
  requestPartnerKit(paymentRef: string): Promise<void>
  listLessons(): Promise<Lesson[]>
  // public (buyer)
  partnerNameForCode(code: string): Promise<string | null>
  createOrder(input: { slug: string; ref: string; name: string; phone: string; email?: string; address?: string }): Promise<string>
  // admin
  adminListOrders(): Promise<AdminOrder[]>
  adminUpdateOrder(id: string, patch: { status?: OrderStatus; delivery?: DeliveryStatus; payment_ref?: string }): Promise<void>
  adminListWithdrawals(): Promise<Withdrawal[]>
  adminUpdateWithdrawal(id: string, status: Withdrawal['status'], note?: string): Promise<void>
  adminListPartners(): Promise<Profile[]>
  adminUpdatePartner(id: string, patch: Partial<Profile>): Promise<void>
  adminSaveProduct(p: Partial<Product> & { slug: string }): Promise<void>
  adminBroadcast(title: string, body: string): Promise<void>
  adminSaveSettings(s: Settings): Promise<void>
}

const hasSupabase = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export const api: Api = hasSupabase ? supabaseApi : demoApi

export const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL as string | undefined) || window.location.origin

export function partnerLink(slug: string, code: string) {
  return `${PUBLIC_URL}/p/${slug}?ref=${code}`
}

export function walletBalance(tx: WalletTx[]) {
  return tx.reduce((s, t) => s + Number(t.amount), 0)
}

export { inr, maskPhone, fmtDate } from './format'

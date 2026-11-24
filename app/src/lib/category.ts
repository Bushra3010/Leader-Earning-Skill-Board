import type { Product } from './types'

/** The three product sections shown to members. Worked out from the product's own fields:
 *  monthly billing = Subscription, physical goods = E-Commerce, everything else = Educational Packages. */
export type Cat = 'packages' | 'subscription' | 'ecommerce'

export const CATS: { id: Cat; label: string; icon: string; idle: string }[] = [
  { id: 'packages', label: 'Educational Packages', icon: '🦄', idle: 'from-[#efe4ff] to-[#e3e9ff]' },
  { id: 'subscription', label: 'Subscription', icon: '🎓', idle: 'from-[#e3ebff] to-[#d6e2ff]' },
  { id: 'ecommerce', label: 'E-Commerce', icon: '📗', idle: 'from-[#d4f3ef] to-[#bfe9e3]' },
]

export const CAT_LABEL: Record<Cat, string> = { packages: 'Educational Packages', subscription: 'Subscription', ecommerce: 'E-Commerce' }

export function categoryOf(p: Pick<Product, 'billing' | 'is_physical'>): Cat {
  if (p.billing === 'monthly') return 'subscription'
  if (p.is_physical) return 'ecommerce'
  return 'packages'
}

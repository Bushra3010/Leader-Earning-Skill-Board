import { Capacitor } from '@capacitor/core'

const LIVE_URL = 'https://leaders-earning-skill-board.vercel.app'

/**
 * Public web address used in partner share links and Supabase email redirects.
 * Inside the Android app the page origin is https://localhost, which buyers can't open,
 * so the native build always points at the live site.
 */
export const PUBLIC_URL: string = Capacitor.isNativePlatform()
  ? LIVE_URL
  : (import.meta.env.VITE_PUBLIC_URL as string | undefined) || window.location.origin

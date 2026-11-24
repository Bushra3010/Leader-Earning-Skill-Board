import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import { DEFAULT_SETTINGS } from './seed'
import { DEFAULT_ROLE_FEATURES, type Feature, type Profile, type Settings } from './types'

interface SessionCtx {
  loading: boolean
  userId: string | null
  profile: Profile | null
  settings: Settings
  refresh: () => Promise<void>
  toast: (msg: string) => void
}

const Ctx = createContext<SessionCtx>(null as never)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const id = await api.currentUserId()
      setUserId(id)
      const [p, s] = await Promise.all([id ? api.getProfile() : Promise.resolve(null), api.getSettings()])
      setProfile(p)
      setSettings(s)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    return api.onAuthChange(() => { refresh() })
  }, [refresh])

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.setTimeout(() => setToastMsg((cur) => (cur === msg ? null : cur)), 2600)
  }, [])

  return (
    <Ctx.Provider value={{ loading, userId, profile, settings, refresh, toast }}>
      <div className="mode-pre_school">
        {children}
        {toastMsg && (
          <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 pointer-events-none">
            <div className="rounded-2xl bg-navy-900 px-4 py-3 text-sm font-medium text-white shadow-xl">{toastMsg}</div>
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}

export const useSession = () => useContext(Ctx)

/** Small data-loading hook: returns [data, loading, reload]. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): [T | undefined, boolean, () => void, string | null] {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true)
    fn().then((d) => { if (alive) { setData(d); setErr(null) } })
      .catch((e) => { if (alive) setErr(e instanceof Error ? e.message : String(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return [data, loading, () => setTick((t) => t + 1), err]
}

/** Whether the signed-in member may see a menu/feature (set per member type in Admin → Settings). */
export function useCan() {
  const { profile, settings } = useSession()
  return (f: Feature) => {
    if (!profile) return false
    if (profile.role === 'admin') return true
    const list = settings.role_features?.[profile.role] ?? DEFAULT_ROLE_FEATURES[profile.role]
    return list.includes(f)
  }
}

import { useEffect } from 'react'
import { Empty, Shell, Spinner, SubHeader } from '../components/ui'
import { api, fmtDate } from '../lib/api'
import { useLoad } from '../lib/session'

export default function Notifications() {
  const [list, loading] = useLoad(() => api.listNotifications(), [])
  useEffect(() => {
    const unread = (list ?? []).filter((n) => !n.read).map((n) => n.id)
    if (unread.length) api.markNotificationsRead(unread).catch(() => {})
  }, [list])
  return (
    <Shell>
      <SubHeader title="Notifications" />
      <main className="space-y-3 p-4">
        {loading ? <Spinner /> : !list?.length ? <Empty icon="🔔" title="You're all caught up" /> : list.map((n) => (
          <div key={n.id} className={`card p-4 ${!n.read ? 'border-[var(--accent-to)]' : ''}`}>
            <div className="flex items-start gap-2">
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-to)]" />}
              <div className="min-w-0 flex-1">
                <p className="font-bold">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
                <p className="mt-1 text-xs text-slate-400">{fmtDate(n.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </main>
    </Shell>
  )
}

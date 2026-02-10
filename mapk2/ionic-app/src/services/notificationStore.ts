export type StoredNotification = {
  id: string
  title: string
  body: string
  data?: Record<string, any>
  receivedAt: string
  read: boolean
}

const STORAGE_KEY = 'mapk2_notifications'

const loadRaw = (): StoredNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveRaw = (items: StoredNotification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('notifications-updated'))
}

export const getNotifications = (): StoredNotification[] => {
  return loadRaw().sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
}

export const addNotification = (payload: {
  title?: string
  body?: string
  data?: Record<string, any>
}) => {
  const items = loadRaw()
  const item: StoredNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: payload.title ?? 'Notification',
    body: payload.body ?? '',
    data: payload.data ?? {},
    receivedAt: new Date().toISOString(),
    read: false
  }
  saveRaw([item, ...items])
}

export const markAllRead = () => {
  const items = loadRaw().map((item) => ({ ...item, read: true }))
  saveRaw(items)
}

export const clearNotifications = () => {
  saveRaw([])
}

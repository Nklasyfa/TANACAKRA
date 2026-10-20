import { ref, computed } from 'vue'

export interface AppNotification {
  id: string
  title: string
  message: string
  time: string
  category: 'cuaca' | 'pasar' | 'hama' | 'sistem'
  read: boolean
  targetRole?: 'ALL' | 'ADMIN' | 'PETANI'
  link?: string
  createdAt?: string
}

export function getCurrentRole(): 'ADMIN' | 'PETANI' {
  try {
    const raw = localStorage.getItem('tanacakra_user')
    if (raw) {
      const u = JSON.parse(raw)
      if (u && (u.role === 'ADMIN' || u.role === 'PENYULUH' || (u.email && u.email.toLowerCase().includes('admin')))) {
        return 'ADMIN'
      }
    }
  } catch {
    /* fallback */
  }
  return 'PETANI'
}

export function formatRelativeTime(dateInput: string | Date | number): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return 'Baru saja'
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} jam lalu`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari lalu`
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  } catch {
    return 'Baru saja'
  }
}

function getDefaultNotifications(): AppNotification[] {
  const now = Date.now()
  return [
    {
      id: 'notif-1',
      title: 'Peringatan Agroklimat Lereng Merapi',
      message: 'Telemetri BMKG: Kelembapan udara 78% & curah hujan stabil di lereng Cangkringan.',
      time: '15 menit lalu',
      category: 'cuaca',
      read: false,
      targetRole: 'ALL',
      link: '/kabar-tani',
      createdAt: new Date(now - 15 * 60000).toISOString()
    },
    {
      id: 'notif-2',
      title: 'Dinamika Pasar: Cabai Merah Tembus Rp 55.000/kg',
      message: 'Lelang pasar induk Sleman bergerak naik +8.0%. Estimasi ROI panen meningkat.',
      time: '1 jam lalu',
      category: 'pasar',
      read: false,
      targetRole: 'ALL',
      link: '/prediksi-pasar',
      createdAt: new Date(now - 60 * 60000).toISOString()
    },
    {
      id: 'notif-3',
      title: 'Peringatan Hama Thrips Musim Kemarau',
      message: 'Laporan intensitas hama sedang pada tanaman hortikultura Umbulharjo. Simak panduan biopestisida.',
      time: '3 jam lalu',
      category: 'hama',
      read: false,
      targetRole: 'PETANI',
      link: '/kabar-tani',
      createdAt: new Date(now - 180 * 60000).toISOString()
    },
    {
      id: 'notif-4',
      title: 'Model RandomForest & Telemetri Siap',
      message: 'Pipeline inferensi AI telah sinkron dengan master dataset 108 petak Regosol Vulkanik.',
      time: '5 jam lalu',
      category: 'sistem',
      read: false,
      targetRole: 'ADMIN',
      link: '/admin/pengaturan',
      createdAt: new Date(now - 300 * 60000).toISOString()
    },
    {
      id: 'notif-5',
      title: 'Registry Lahan PostgreSQL Tersinkron',
      message: 'Semua record telemetri dan master komoditas telah diverifikasi integritasnya.',
      time: 'Kemarin',
      category: 'sistem',
      read: true,
      targetRole: 'ADMIN',
      link: '/admin/master-data',
      createdAt: new Date(now - 24 * 3600000).toISOString()
    }
  ]
}

function getInitialNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem('tanacakra_notifications')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
    return getDefaultNotifications()
  } catch {
    return getDefaultNotifications()
  }
}

export const notificationsList = ref<AppNotification[]>(getInitialNotifications())

export const roleFilteredNotifications = computed(() => {
  const currentRole = getCurrentRole()
  return notificationsList.value.filter(n => {
    if (!n.targetRole || n.targetRole === 'ALL') return true
    return n.targetRole === currentRole
  })
})

export const unreadCount = computed(() => {
  return roleFilteredNotifications.value.filter(n => !n.read).length
})

import { showToast } from './toast'

export function addNotification(notif: {
  title: string
  message: string
  category: 'cuaca' | 'pasar' | 'hama' | 'sistem'
  targetRole?: 'ALL' | 'ADMIN' | 'PETANI'
  link?: string
}) {
  const newNotif: AppNotification = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    title: notif.title,
    message: notif.message,
    category: notif.category,
    targetRole: notif.targetRole || 'ALL',
    link: notif.link,
    read: false,
    createdAt: new Date().toISOString(),
    time: 'Baru saja'
  }

  // Prepend to top
  notificationsList.value.unshift(newNotif)
  saveNotifications()

  // Trigger realtime toast if relevant to current user
  const userRole = getCurrentRole()
  if (!notif.targetRole || notif.targetRole === 'ALL' || notif.targetRole === userRole) {
    showToast({
      title: notif.title,
      message: notif.message,
      type: notif.category === 'hama' ? 'warning' : notif.category === 'sistem' ? 'success' : 'info',
      link: notif.link
    })
  }

  return newNotif
}

export function syncNotificationsFromFeed(feedItems: any[]) {
  if (!Array.isArray(feedItems) || feedItems.length === 0) return

  let changed = false
  for (const item of feedItems) {
    const notifId = `feed-${item.id}`
    const exists = notificationsList.value.some(n => n.id === notifId)
    if (!exists) {
      const catMap: Record<string, 'cuaca' | 'pasar' | 'hama' | 'sistem'> = {
        cuaca: 'cuaca',
        pasar: 'pasar',
        hama: 'hama',
        lahan: 'cuaca',
        prediksi: 'pasar'
      }
      notificationsList.value.unshift({
        id: notifId,
        title: item.title,
        message: item.summary || item.title,
        time: item.timestamp ? formatRelativeTime(item.timestamp) : 'Baru saja',
        category: catMap[item.category] || 'sistem',
        read: false,
        targetRole: item.category === 'prediksi' ? 'ALL' : 'PETANI',
        link: item.cta_url || '/kabar-tani',
        createdAt: item.timestamp || new Date().toISOString()
      })
      changed = true
    }
  }

  if (changed) {
    saveNotifications()
  }
}

export function markAsRead(id: string) {
  const item = notificationsList.value.find((n: AppNotification) => n.id === id)
  if (item) {
    item.read = true
    saveNotifications()
  }
}

export function markAllAsRead() {
  const currentRole = getCurrentRole()
  notificationsList.value.forEach((n: AppNotification) => {
    if (!n.targetRole || n.targetRole === 'ALL' || n.targetRole === currentRole) {
      n.read = true
    }
  })
  saveNotifications()
}

export function clearNotifications() {
  notificationsList.value = []
  saveNotifications()
}

function saveNotifications() {
  try {
    localStorage.setItem('tanacakra_notifications', JSON.stringify(notificationsList.value))
  } catch { /* ignore */ }
}


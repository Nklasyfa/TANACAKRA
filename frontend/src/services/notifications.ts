import { ref } from 'vue'

export interface AppNotification {
  id: string
  title: string
  message: string
  time: string
  category: 'cuaca' | 'pasar' | 'hama' | 'sistem'
  read: boolean
  link?: string
}

const defaultNotifications: AppNotification[] = [
  {
    id: '1',
    title: 'Peringatan Agroklimat Lereng Merapi',
    message: 'Kelembapan tanah Cangkringan stabil di 68%. Waktu ideal untuk pemupukan susulan NPK.',
    time: '10 menit lalu',
    category: 'cuaca',
    read: false,
    link: '/petani'
  },
  {
    id: '2',
    title: 'Tren Harga Cabai Merah Naik 8%',
    message: 'Harga lelang pasar Cangkringan hari ini menyentuh Rp 55.000/kg. Cek grafik estimasi ROI.',
    time: '1 jam lalu',
    category: 'pasar',
    read: false,
    link: '/prediksi-pasar'
  },
  {
    id: '3',
    title: 'Waspada Hama Thrips Musim Kemarau',
    message: 'Laporan gejala daun menggulung di 3 petak Umbulharjo. Lihat panduan biopestisida.',
    time: '3 jam lalu',
    category: 'hama',
    read: false,
    link: '/warta/1'
  },
  {
    id: '4',
    title: 'Inferensi Scikit-Learn Retrained',
    message: 'Model RandomForest telah memperbarui rekomendasi hara Regosol Vulkanik.',
    time: 'Kemarin',
    category: 'sistem',
    read: true,
    link: '/admin/master-data'
  }
]

function getInitialNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem('tanacakra_notifications')
    return raw ? JSON.parse(raw) : defaultNotifications
  } catch {
    return defaultNotifications
  }
}

export const notificationsList = ref<AppNotification[]>(getInitialNotifications())

export const unreadCount = ref<number>(0)

export function updateUnread() {
  unreadCount.value = notificationsList.value.filter((n: AppNotification) => !n.read).length
}
updateUnread()

export function markAsRead(id: string) {
  const item = notificationsList.value.find((n: AppNotification) => n.id === id)
  if (item) {
    item.read = true
    saveNotifications()
  }
}

export function markAllAsRead() {
  notificationsList.value.forEach((n: AppNotification) => (n.read = true))
  saveNotifications()
}

function saveNotifications() {
  try {
    localStorage.setItem('tanacakra_notifications', JSON.stringify(notificationsList.value))
  } catch { /* ignore */ }
  updateUnread()
}

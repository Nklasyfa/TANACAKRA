<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { LahanService, AdminService, generateFallbackDashboard, downloadCsv, generatePlotlySchema } from '@/services/api'
import { fetchCuacaCangkringan, type CuacaInfo } from '@/services/weather'
import { AuditLogger } from '@/services/audit'

import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminBottomNav from '@/components/admin/AdminBottomNav.vue'
import PlotlyChart from '@/components/shared/PlotlyChart.vue'
import NotificationModal from '@/components/common/NotificationModal.vue'
import { unreadCount } from '@/services/notifications'

const isNotifOpen = ref(false)

const map = ref<any>(null)
const markersGroup = ref<any>(null)
const lahanList = ref<any[]>([])
const dashboardStats = ref<any>({
  ...generateFallbackDashboard(),
  price_trends: []
})
const usersList = ref<any[]>([])
const cuacaReal = ref<CuacaInfo | null>(null)

// Commodity filter state for chart
const selectedCommodity = ref<string>('Semua')

const allCommodities = computed(() => {
  const trends = dashboardStats.value?.price_trends || []
  if (trends.length) {
    return Object.keys(trends[0]).filter(k => k !== 'month' && k !== 'volume_ton')
  }
  return ['Cabai Merah', 'Salak Pondoh', 'Bawang Merah', 'Padi', 'Jagung', 'Kacang Tanah']
})

const filteredChartSchema = computed(() => {
  let trends = dashboardStats.value?.price_trends || []
  let volTrends = dashboardStats.value?.volume_trends || []

  if (!trends || !trends.length) return null

  // Slice based on activePeriod ('3m', '6m', '12m')
  const count = activePeriod.value === '3m' ? 3 : activePeriod.value === '6m' ? 6 : 12
  trends = trends.slice(-count)
  if (volTrends && volTrends.length) {
    volTrends = volTrends.slice(-count)
  }

  const activeList = selectedCommodity.value === 'Semua' ? allCommodities.value : [selectedCommodity.value]
  return generatePlotlySchema(trends, volTrends, activeList)
})

// Modal User Management state
const isUserModalOpen = ref(false)
const newUsername = ref('')
const newEmail = ref('')
const newRole = ref<'ADMIN' | 'PETANI'>('PETANI')

const openAddUserModal = () => {
  newUsername.value = ''
  newEmail.value = ''
  newRole.value = 'PETANI'
  isUserModalOpen.value = true
}

const handleAddUser = async () => {
  if (!newUsername.value.trim() || !newEmail.value.trim()) return
  const updated = await AdminService.addUser({
    username: newUsername.value,
    email: newEmail.value,
    role: newRole.value
  })
  usersList.value = updated
  isUserModalOpen.value = false

  AuditLogger.addLog({
    title: `Tambah pengguna baru (${newUsername.value})`,
    subtitle: `Email: ${newEmail.value} · Peran: ${newRole.value}`,
    category: 'auth',
    endpoint: '/api/v1/users/add'
  })
  activityLogs.value = AuditLogger.getStoredLogs()
}

const handleToggleRole = async (userId: number) => {
  const updated = await AdminService.toggleUserRole(userId)
  usersList.value = updated
  AuditLogger.addLog({
    title: `Ubah peran pengguna #${userId}`,
    subtitle: `Penyesuaian otorisasi peran pengguna`,
    category: 'auth',
    endpoint: `/api/v1/users/${userId}/role`
  })
  activityLogs.value = AuditLogger.getStoredLogs()
}

const handleDeleteUser = async (userId: number) => {
  if (!confirm('Apakah Anda yakin ingin menghapus/menonaktifkan pengguna ini?')) return
  const updated = await AdminService.deleteUser(userId)
  usersList.value = updated
  AuditLogger.addLog({
    title: `Hapus/nonaktifkan akun pengguna #${userId}`,
    subtitle: `Akses pengguna dicabut oleh Super Admin`,
    category: 'auth',
    endpoint: `/api/v1/users/${userId}/delete`
  })
  activityLogs.value = AuditLogger.getStoredLogs()
}

// Export functions
const exportLogsCsv = () => {
  downloadCsv('tanacakra_audit_logs.csv', activityLogs.value.map(l => ({
    Waktu: l.time || l.timestamp,
    Aktivitas: l.title || l.action,
    Operator: l.userName || l.user?.username || 'Sistem',
    Status: l.statusText || l.status || 'Berhasil (200)'
  })))

  AuditLogger.addLog({
    title: 'Unduh berkas CSV log aktivitas',
    subtitle: `Mengekspor ${activityLogs.value.length} baris log dari Dashboard Pengelola`,
    category: 'download',
    endpoint: '/api/v1/audit-logs/export-csv'
  })
  activityLogs.value = AuditLogger.getStoredLogs()
}

const exportUsersCsv = () => {
  downloadCsv('tanacakra_registered_users.csv', usersList.value.map(u => ({
    ID: u.id,
    Username: u.username,
    Email: u.email,
    Peran: u.role
  })))

  AuditLogger.addLog({
    title: 'Unduh daftar pengguna terdaftar (CSV)',
    subtitle: `Mengekspor ${usersList.value.length} data pengguna terdaftar`,
    category: 'download',
    endpoint: '/api/v1/users/export-csv'
  })
  activityLogs.value = AuditLogger.getStoredLogs()
}

// UI Interactive states
const activePeriod = ref<'3m' | '6m' | '12m'>('6m')
const activeMapFilter = ref<'all' | 'healthy' | 'risk'>('all')
const activeTableTab = ref<'activity' | 'users'>('activity')

const todayLabel = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

// Activity logs fetched from backend
const activityLogs = ref<any[]>([])

const initMap = () => {
  if (map.value) return
  const container = document.getElementById('mapLeaflet')
  if (!container) return

  map.value = L.map('mapLeaflet', {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([-7.64, 110.44], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value)

  markersGroup.value = (L as any).markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 45,
    iconCreateFunction: (cluster: any) => {
      const markers = cluster.getAllChildMarkers()
      let sehatCount = 0
      markers.forEach((m: any) => {
        if (m.options.status === 'sehat') sehatCount++
      })
      const total = markers.length
      const ratio = sehatCount / total
      const bgColor = ratio >= 0.75 ? '#4A5B3A' : ratio >= 0.4 ? '#C28E3A' : '#C84C32'

      return L.divIcon({
        html: `<div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 13px; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">${total}</div>`,
        className: 'custom-cluster-icon',
        iconSize: L.point(36, 36)
      })
    }
  })

  map.value.addLayer(markersGroup.value)

  setTimeout(() => {
    map.value?.invalidateSize()
  }, 200)
}

const renderMarkers = (items: any[]) => {
  if (!map.value || !markersGroup.value) return
  markersGroup.value.clearLayers()

  items.forEach((item: any, idx: number) => {
    const params = item.input_parameters || item
    let lat = parseFloat(params.latitude)
    let lng = parseFloat(params.longitude)

    if (isNaN(lat) || isNaN(lng)) {
      const baseLats = [-7.64, -7.65, -7.63, -7.66, -7.62]
      const baseLngs = [110.44, 110.43, 110.45, 110.42, 110.46]
      lat = baseLats[idx % 5] + (Math.random() - 0.5) * 0.03
      lng = baseLngs[idx % 5] + (Math.random() - 0.5) * 0.03
    }

    const farmId = params.farm_id || ('CGK' + String(item.id || idx + 1).padStart(3, '0'))
    const desa = params.desa || 'Cangkringan'
    const ph = parseFloat(params.soil_ph || 6.5)
    const soilType = params.soil_type || 'Regosol Vulkanik'
    const areaHa = params.area_ha || 1.0
    const isSehat = ph >= 6.0

    const markerColor = isSehat ? '#4A5B3A' : '#C84C32'
    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: markerColor,
      color: '#FFFFFF',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.95,
      status: isSehat ? 'sehat' : 'atensi'
    } as any)

    const popupContent = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px 2px; min-width: 180px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight:700; color: ${isSehat ? '#4A5B3A' : '#C84C32'}; text-transform: uppercase; letter-spacing:0.04em;">
            ${isSehat ? 'Kondisi Prima' : 'Perlu Tindakan'}
          </span>
          <span style="background:${isSehat ? '#d5e9c3' : '#ffdad6'}; color:${isSehat ? '#243319' : '#93000a'}; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 600;">
            ${isSehat ? 'Sehat' : 'Risiko'}
          </span>
        </div>
        <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #231a10;">Petak ${farmId}</h4>
        <p style="margin: 2px 0 8px 0; font-size: 12px; color: #645d58;">Lokasi: ${desa} &bull; ${areaHa} Ha</p>
        <div style="font-size: 11px; color: #444840; background: #fff8f4; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; line-height: 1.4;">
          <strong>pH Tanah:</strong> ${ph} (${isSehat ? 'Ideal' : 'Asam Vulkanik'})<br>
          <strong>Jenis:</strong> ${soilType}
        </div>
      </div>
    `
    marker.bindPopup(popupContent)
    markersGroup.value.addLayer(marker)
  })
}

const filterMapMarkers = (type: 'all' | 'healthy' | 'risk') => {
  activeMapFilter.value = type
  if (!lahanList.value.length) return

  const filtered = lahanList.value.filter((item: any) => {
    const params = item.input_parameters || item
    const ph = parseFloat(params.soil_ph || 6.5)
    const isSehat = ph >= 6.0
    if (type === 'healthy') return isSehat
    if (type === 'risk') return !isSehat
    return true
  })

  renderMarkers(filtered)
}

const computeLahanStats = (list: any[]) => {
  const rows = list || []
  const params = rows.map((it: any) => it.input_parameters || it || {})
  const phs = params
    .map(p => parseFloat(p.soil_ph ?? p.pH ?? NaN))
    .filter((v: number) => !Number.isNaN(v))
  const total = rows.length
  const sehat = phs.filter(v => v >= 6.0).length
  const userEntries = rows.filter((it: any) => !!it.user || (typeof it.id === 'number' && it.id > 100000)).length
  return {
    total_lahan: total,
    sehat_count: sehat,
    perlu_atensi_count: Math.max(0, total - sehat),
    avg_ph: phs.length ? +(phs.reduce((a, b) => a + b, 0) / phs.length).toFixed(1) : 6.4,
    weekly_reports: userEntries
  }
}

const loadData = async () => {
  initMap()

  const [weatherRes, lahans, trends, users, logs] = await Promise.all([
    fetchCuacaCangkringan(),
    LahanService.getAllLahan(),
    AdminService.getDashboardTrends(),
    AdminService.getUsers(),
    AdminService.getAuditLogs()
  ])

  if (weatherRes) {
    cuacaReal.value = weatherRes
  }

  lahanList.value = lahans || []
  dashboardStats.value = {
    ...dashboardStats.value,
    ...trends,
    ...computeLahanStats(lahanList.value)
  }
  usersList.value = users || []
  activityLogs.value = (logs && logs.length > 0) ? logs : AuditLogger.getStoredLogs()

  // Initialize selected commodities
  selectedCommodity.value = 'Semua'

  renderMarkers(lahanList.value)
}

onMounted(() => {
  setTimeout(() => {
    loadData()
  }, 50)
})
</script>

<template>
  <div class="min-h-screen bg-[#FFF8F4] text-[#231a10] font-sans antialiased flex flex-col md:flex-row pb-[88px] md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden sticky top-0 z-40 pt-safe bg-white/95 backdrop-blur-md border-b border-[#E5E0D8] px-4 py-3 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-7 w-auto" />
        <div>
          <h1 class="text-sm font-bold text-[#243319] leading-tight">Tanacakra</h1>
          <span class="text-[10px] uppercase font-bold text-[#7E7063]">Super Admin</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <button @click="isNotifOpen = true" class="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#F9F7F4] border border-[#E5E0D8] text-[#243319] cursor-pointer">
          <span class="material-symbols-outlined text-[20px]">notifications</span>
          <span v-if="unreadCount > 0" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#A8452A]"></span>
        </button>
      </div>
    </header>

    <NotificationModal :is-open="isNotifOpen" @close="isNotifOpen = false" />

    <!-- Sidebar Admin -->
    <AdminSidebar />

    <!-- MAIN CONTENT AREA Wrapper -->
    <div class="flex-1 md:ml-60 flex flex-col min-w-0">
      <main class="w-full max-w-[1500px] mx-auto p-4 md:p-8 lg:p-10 space-y-6 md:space-y-8">

      <!-- 1. Header Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E0D8]">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full bg-[#243319] text-[#d5e9c3] text-[10px] font-bold uppercase tracking-wider">
              Konsol Pengelola Tanacakra
            </span>
            <span class="text-xs text-[#7E7063] font-mono">• Sektor Cangkringan</span>
          </div>
          <h1 class="font-headline-xl text-2xl md:text-3xl font-bold text-[#231a10] tracking-tight">
            Dashboard Pengelola
          </h1>
          <p class="text-xs md:text-sm text-[#645d58] mt-0.5">
            Pemantauan terpadu kondisi pertanian dan dinamika lelang lereng Merapi
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-2 font-mono text-[12px] text-[#645d58] bg-white px-3.5 py-2 rounded-xl border border-[#E5E0D8] shadow-sm">
            <span class="material-symbols-outlined text-[16px] text-[#243319]">schedule</span>
            <span>{{ todayLabel }}</span>
          </div>
          <div class="flex items-center gap-1.5 bg-[#EBF2E5] text-[#243319] px-3.5 py-2 rounded-xl border border-[#d5e9c3]/60 text-xs font-bold shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>PostgreSQL Synchronized</span>
          </div>
        </div>
      </div>

      <!-- 2. Weather Strip (4 Kolom Mikroklimat - Live BMKG Data) -->
      <div class="bg-[#FFFBF7] border border-[#E5E0D8] rounded-[16px] p-5 shadow-sm flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E0D8]/60">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-[#243319]">cloudy_snowing</span>
            <span class="text-sm font-bold text-[#243319] tracking-wide">Cuaca &amp; Kondisi Udara</span>
          </div>
          <span class="text-[11px] text-[#7E7063] font-mono uppercase tracking-wider">
            Sumber: {{ cuacaReal?.sumber || 'BMKG' }} · {{ cuacaReal?.lokasi || 'Pos Pengamatan Kaliurang' }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Suhu -->
          <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-11 h-11 rounded-xl bg-[#EBF2E5] flex items-center justify-center text-[#243319] font-bold shrink-0">
              <span class="material-symbols-outlined text-[24px]">thermostat</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[11px] font-bold text-[#7E7063] uppercase tracking-wider">Suhu Udara</span>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="font-mono text-2xl font-bold text-[#231a10]">{{ cuacaReal?.suhu || 28 }}°C</span>
                <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Optimal</span>
              </div>
            </div>
          </div>

          <!-- Kelembapan -->
          <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-11 h-11 rounded-xl bg-[#EBF2E5] flex items-center justify-center text-[#243319] font-bold shrink-0">
              <span class="material-symbols-outlined text-[24px]">humidity_percentage</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[11px] font-bold text-[#7E7063] uppercase tracking-wider">Kelembapan</span>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="font-mono text-2xl font-bold text-[#231a10]">{{ cuacaReal?.kelembaban || 78 }}%</span>
                <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">RH Relatif</span>
              </div>
            </div>
          </div>

          <!-- Curah Hujan -->
          <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-11 h-11 rounded-xl bg-[#EBF2E5] flex items-center justify-center text-[#243319] font-bold shrink-0">
              <span class="material-symbols-outlined text-[24px]">rainy</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[11px] font-bold text-[#7E7063] uppercase tracking-wider">Curah Hujan</span>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="font-mono text-2xl font-bold text-[#231a10]">{{ cuacaReal ? cuacaReal.curahHujanMm : 2 }} mm</span>
                <span class="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">{{ cuacaReal?.curahHujanLabel || cuacaReal?.kondisi || 'Hujan Ringan' }}</span>
              </div>
            </div>
          </div>

          <!-- Kecepatan Angin -->
          <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="w-11 h-11 rounded-xl bg-[#EBF2E5] flex items-center justify-center text-[#243319] font-bold shrink-0">
              <span class="material-symbols-outlined text-[24px]">air</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[11px] font-bold text-[#7E7063] uppercase tracking-wider">Kecepatan Angin</span>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span class="font-mono text-2xl font-bold text-[#231a10]">{{ cuacaReal ? cuacaReal.anginKmh : 12 }} km/h</span>
                <span class="text-[11px] font-semibold text-[#7E7063] bg-stone-100 px-2 py-0.5 rounded">{{ cuacaReal ? 'Perkiraan BMKG' : 'Selatan' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Stat Cards (4 Cards with Trends) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Stat 1: Rata-rata margin -->
        <div class="bg-white rounded-[16px] border border-[#E5E0D8] p-5 shadow-sm flex flex-col justify-between h-[155px] hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs text-[#7E7063] font-semibold tracking-wider uppercase">Rata-rata Keuntungan</span>
            <div class="w-8 h-8 rounded-lg bg-[#EBF2E5] flex items-center justify-center text-[#243319]">
              <span class="material-symbols-outlined text-[18px]">trending_up</span>
            </div>
          </div>
          <div class="flex items-baseline my-1">
            <span class="font-mono text-4xl font-bold text-[#231a10] tracking-tight">34.8%</span>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-200/60">
            <span class="material-symbols-outlined text-[15px]">arrow_upward</span>
            <span>+4.2% dari kuartal lalu</span>
          </div>
        </div>

        <!-- Stat 2: Total produktivitas -->
        <div class="bg-white rounded-[16px] border border-[#E5E0D8] p-5 shadow-sm flex flex-col justify-between h-[155px] hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs text-[#7E7063] font-semibold tracking-wider uppercase">Total Hasil Panen</span>
            <div class="w-8 h-8 rounded-lg bg-[#EBF2E5] flex items-center justify-center text-[#243319]">
              <span class="material-symbols-outlined text-[18px]">agriculture</span>
            </div>
          </div>
          <div class="flex items-baseline my-1">
            <span class="font-mono text-4xl font-bold text-[#231a10] tracking-tight">{{ dashboardStats.total_produksi_ton || 84.6 }}</span>
            <span class="text-sm font-bold text-[#7E7063] ml-1.5">ton</span>
          </div>
          <span class="text-xs text-[#645d58] font-medium">
            {{ dashboardStats.total_lahan || 42 }} petak lahan &middot; {{ dashboardStats.commodities?.length || 12 }} komoditas aktif
          </span>
        </div>

        <!-- Stat 3: Lahan berisiko -->
        <div class="bg-white rounded-[16px] border border-[#E5E0D8] p-5 shadow-sm flex flex-col justify-between h-[155px] hover:shadow-md transition-all relative overflow-hidden">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#C84C32] animate-ping"></span>
              <span class="font-mono text-xs text-[#7E7063] font-semibold tracking-wider uppercase">Lahan Perlu Perhatian</span>
            </div>
            <div class="w-8 h-8 rounded-lg bg-[#FFDAD6] flex items-center justify-center text-[#C84C32]">
              <span class="material-symbols-outlined text-[18px]">warning</span>
            </div>
          </div>
          <div class="flex items-baseline my-1">
            <span class="font-mono text-4xl font-bold text-[#C84C32] tracking-tight">{{ dashboardStats.perlu_atensi_count || 3 }}</span>
            <span class="text-sm font-bold text-[#C84C32] ml-1.5">petak</span>
          </div>
          <span class="text-xs text-[#C84C32] font-semibold bg-rose-50 px-2 py-0.5 rounded w-fit border border-rose-200/60">
            Perlu intervensi drainase &amp; pH
          </span>
        </div>

        <!-- Stat 4: Input minggu ini -->
        <div class="bg-white rounded-[16px] border border-[#E5E0D8] p-5 shadow-sm flex flex-col justify-between h-[155px] hover:shadow-md transition-all">
          <div class="flex items-center justify-between">
            <span class="font-mono text-xs text-[#7E7063] font-semibold tracking-wider uppercase">Data Masuk</span>
            <div class="w-8 h-8 rounded-lg bg-[#EBF2E5] flex items-center justify-center text-[#243319]">
              <span class="material-symbols-outlined text-[18px]">edit_note</span>
            </div>
          </div>
          <div class="flex items-baseline my-1">
            <span class="font-mono text-4xl font-bold text-[#231a10] tracking-tight">{{ dashboardStats.weekly_reports || 142 }}</span>
            <span class="text-sm font-bold text-[#7E7063] ml-1.5">entri</span>
          </div>
          <span class="text-xs text-[#645d58] font-medium">
            Dari {{ usersList.length || 38 }} petani terdaftar
          </span>
        </div>
      </div>

      <!-- 4. Banner ML Komoditas Rekomendasi (Scikit-Learn Engine Output) -->
      <div v-if="dashboardStats?.best_commodity" class="bg-[#F3ECE0] rounded-[16px] p-6 border border-[#E2D8C7] shadow-sm relative overflow-hidden">
        <div class="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#6FA05C]/20 to-transparent rounded-bl-full pointer-events-none"></div>
        <div class="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div class="space-y-2 max-w-4xl">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#243319] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <span class="material-symbols-outlined text-[14px] text-[#d5e9c3]">auto_awesome</span>
                {{ dashboardStats.best_commodity.badge }}
              </span>
              <span class="text-xs font-semibold text-[#7E7063]">Sistem Prediksi AI</span>
            </div>
            <h3 class="text-xl md:text-2xl font-bold text-[#231a10]">
              Rekomendasi AI: <span class="text-[#243319]">{{ dashboardStats.best_commodity.title }}</span>
            </h3>
            <p class="text-sm text-[#4A4036] leading-relaxed">
              {{ dashboardStats.best_commodity.reason }}
            </p>
            <div class="flex flex-wrap items-center gap-2 pt-2 text-xs font-semibold text-[#231a10]">
              <span class="bg-white px-3 py-1.5 rounded-lg border border-[#E2D8C7] shadow-2xs">Harga Est: <strong class="text-[#A8452A]">{{ dashboardStats.best_commodity.avg_price }}</strong></span>
              <span class="bg-white px-3 py-1.5 rounded-lg border border-[#E2D8C7] shadow-2xs">Hasil Panen: <strong class="text-[#243319]">{{ dashboardStats.best_commodity.expected_yield }}</strong></span>
              <span class="bg-white px-3 py-1.5 rounded-lg border border-[#E2D8C7] shadow-2xs">Margin Proyeksi: <strong class="text-[#243319]">{{ dashboardStats.best_commodity.roi_estimate || '+145%' }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Chart Card: Tren Harga & Volume Panen (Plotly.js + Commodity & Period Selector) -->
      <div class="bg-white rounded-[16px] border border-[#E5E0D8] p-6 shadow-sm flex flex-col gap-5">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <h2 class="font-headline-md text-xl font-bold text-[#231a10]">
                Tren Harga &amp; Volume Panen Komoditas
              </h2>
              <span class="px-2.5 py-0.5 rounded-full bg-[#EBF2E5] text-[#243319] text-[11px] font-bold border border-[#243319]/20">
                Grafik Interaktif
              </span>
            </div>
            <p class="text-xs text-[#7E7063]">
              Pilih komoditas di bawah untuk memfilter atau mengisolasi pergerakan harga pasar Cangkringan &amp; DIY.
            </p>
          </div>

          <!-- Segmented Control Periode -->
          <div class="inline-flex p-1 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl self-start lg:self-auto shrink-0">
            <button
              @click="activePeriod = '3m'"
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all"
              :class="activePeriod === '3m' ? 'bg-[#243319] text-white shadow-sm' : 'text-[#7E7063] hover:text-[#231a10]'"
            >
              3 bulan
            </button>
            <button
              @click="activePeriod = '6m'"
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all"
              :class="activePeriod === '6m' ? 'bg-[#243319] text-white shadow-sm' : 'text-[#7E7063] hover:text-[#231a10]'"
            >
              6 bulan
            </button>
            <button
              @click="activePeriod = '12m'"
              class="px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all"
              :class="activePeriod === '12m' ? 'bg-[#243319] text-white shadow-sm' : 'text-[#7E7063] hover:text-[#231a10]'"
            >
              12 bulan
            </button>
          </div>
        </div>

        <!-- Filter Komoditas Dropdown -->
        <div class="flex items-center gap-2 pt-1 pb-1 border-y border-[#E5E0D8]/60">
          <span class="text-xs font-bold text-[#7E7063] mr-1">Filter Komoditas:</span>
          <div class="relative w-48 md:w-56">
            <select
              v-model="selectedCommodity"
              class="w-full appearance-none bg-[#F9F7F4] border border-[#E5E0D8] text-[#231a10] text-xs font-bold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#243319] cursor-pointer"
            >
              <option value="Semua">Semua ({{ allCommodities.length }})</option>
              <option v-for="c in allCommodities" :key="c" :value="c">
                {{ c }}
              </option>
            </select>
            <span class="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#7E7063] pointer-events-none">expand_more</span>
          </div>
        </div>

        <!-- Plotly Canvas Container -->
        <div class="w-full h-[340px] md:h-[420px] rounded-xl bg-[#FFFBF7] p-2 border border-[#E5E0D8]/60">
          <PlotlyChart
            v-if="filteredChartSchema"
            :schema="filteredChartSchema"
          />
          <div v-else class="h-full flex items-center justify-center text-xs text-[#7E7063]">
            Memuat grafik Plotly.js...
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-[#E5E0D8] text-xs text-[#7E7063] gap-2">
          <span class="font-mono">Sumber data: Agregasi Pasar Lelang Sleman &amp; BMKG Cangkringan &middot; Diperbarui 06:00 WIB</span>
          <span class="font-mono font-semibold text-[#243319]">&bull; Model Korelasi ML R² = 0.89</span>
        </div>
      </div>

      <!-- 6. Grid Layout (65% Map Sebaran Lahan + 35% AI Recommendations) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- KOLOM KIRI: MAP (65% ~ 8 Cols) -->
        <div class="lg:col-span-8 bg-white rounded-[16px] border border-[#E5E0D8] p-6 shadow-sm flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <h2 class="font-headline-md text-xl font-bold text-[#231a10]">Sebaran Lahan</h2>
              <span class="text-xs text-[#7E7063] font-mono">Lereng Merapi Selatan</span>
            </div>

            <!-- Segmented Filter Lahan -->
            <div class="inline-flex p-1 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs font-bold">
              <button
                @click="filterMapMarkers('all')"
                class="px-3 py-1.5 rounded-lg transition-all"
                :class="activeMapFilter === 'all' ? 'bg-[#243319] text-white shadow-sm' : 'text-[#7E7063] hover:text-[#231a10]'"
              >
                Semua ({{ lahanList.length || 42 }})
              </button>
              <button
                @click="filterMapMarkers('healthy')"
                class="px-3 py-1.5 rounded-lg transition-all"
                :class="activeMapFilter === 'healthy' ? 'bg-[#243319] text-white shadow-sm' : 'text-[#7E7063] hover:text-[#231a10]'"
              >
                Sehat ({{ dashboardStats.sehat_count || 39 }})
              </button>
              <button
                @click="filterMapMarkers('risk')"
                class="px-3 py-1.5 rounded-lg transition-all"
                :class="activeMapFilter === 'risk' ? 'bg-[#C84C32] text-white shadow-sm' : 'text-[#C84C32] hover:text-[#231a10]'"
              >
                Risiko ({{ dashboardStats.perlu_atensi_count || 3 }})
              </button>
            </div>
          </div>

          <!-- Leaflet Map Container -->
          <div class="relative w-full h-[460px] rounded-xl overflow-hidden border border-[#E5E0D8] shadow-inner bg-[#EFECE6]">
            <div id="mapLeaflet" class="w-full h-full z-10"></div>
            <!-- Custom Floating Map Legend -->
            <div class="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] shadow-md flex items-center gap-4">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-[#4A5B3A] shadow-xs inline-block"></span>
                <span class="text-xs font-semibold text-[#231a10]">Sehat</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-[#C84C32] shadow-xs inline-block"></span>
                <span class="text-xs font-semibold text-[#231a10]">Risiko Tinggi</span>
              </div>
            </div>
          </div>
        </div>

        <!-- KOLOM KANAN: AI RECOMMENDATIONS (35% ~ 4 Cols) -->
        <div class="lg:col-span-4 bg-white rounded-[16px] border border-[#E5E0D8] p-6 shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between pb-2 border-b border-[#E5E0D8]">
            <h2 class="font-headline-md text-xl font-bold text-[#231a10]">Rekomendasi AI Hari Ini</h2>
            <span class="px-3 py-1 rounded-full bg-rose-50 text-[#ba1a1a] text-xs font-bold border border-rose-200">
              3 Perhatian
            </span>
          </div>

          <div class="flex flex-col gap-3">
            <!-- Card 1: Urgensi Tinggi -->
            <div class="rounded-xl p-4 bg-[#FFF5F2] border-l-4 border-l-[#C84C32] border border-[#E5E0D8]/60 shadow-xs">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] uppercase font-bold text-[#C84C32] tracking-wider">Urgensi Tinggi</span>
                <span class="material-symbols-outlined text-[18px] text-[#C84C32]">priority_high</span>
              </div>
              <p class="text-xs text-[#231a10] font-medium leading-relaxed mt-1">
                Blok B: produktivitas turun 3 bulan berturut, disarankan cek irigasi &amp; kadar asam vulkanik.
              </p>
              <div class="flex justify-end pt-2">
                <router-link to="/admin/lahan" class="px-3 py-1 rounded-lg bg-white text-[#C84C32] border border-[#E5E0D8] text-xs font-bold hover:bg-[#FFF5F2] transition-colors shadow-2xs">
                  Tindak lanjut &rarr;
                </router-link>
              </div>
            </div>

            <!-- Card 2: Optimal -->
            <div class="rounded-xl p-4 bg-[#F7F9F4] border-l-4 border-l-[#4A5B3A] border border-[#E5E0D8]/60 shadow-xs">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] uppercase font-bold text-[#4A5B3A] tracking-wider">Performa Optimal</span>
                <span class="material-symbols-outlined text-[18px] text-[#4A5B3A]">workspace_premium</span>
              </div>
              <p class="text-xs text-[#231a10] font-medium leading-relaxed mt-1">
                Cabai di Blok A margin tertinggi musim kemarin (+18.4%). Perluas alokasi lelang komoditas unggulan.
              </p>
              <div class="flex justify-end pt-2">
                <router-link to="/admin/lahan" class="px-3 py-1 rounded-lg bg-white text-[#4A5B3A] border border-[#E5E0D8] text-xs font-bold hover:bg-[#F7F9F4] transition-colors shadow-2xs">
                  Tindak lanjut &rarr;
                </router-link>
              </div>
            </div>

            <!-- Card 3: Rekomendasi Musim -->
            <div class="rounded-xl p-4 bg-[#FFFDF5] border-l-4 border-l-[#C28E3A] border border-[#E5E0D8]/60 shadow-xs">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] uppercase font-bold text-[#C28E3A] tracking-wider">Rekomendasi Musim</span>
                <span class="material-symbols-outlined text-[18px] text-[#C28E3A]">calendar_month</span>
              </div>
              <p class="text-xs text-[#231a10] font-medium leading-relaxed mt-1">
                Waktu tanam tomat optimal: November. Siapkan bibit tahan kelembapan tinggi untuk mitigasi anomali La Niña.
              </p>
              <div class="flex justify-end pt-2">
                <router-link to="/admin/lahan" class="px-3 py-1 rounded-lg bg-white text-[#C28E3A] border border-[#E5E0D8] text-xs font-bold hover:bg-[#FFFDF5] transition-colors shadow-2xs">
                  Tindak lanjut &rarr;
                </router-link>
              </div>
            </div>
          </div>

          <div class="mt-auto pt-3 border-t border-[#E5E0D8] flex items-center gap-2 text-xs text-[#7E7063]">
            <span class="material-symbols-outlined text-[16px] text-[#243319]">psychology</span>
            <span>Analisis machine-learning diperbarui per 6 jam</span>
          </div>
        </div>
      </div>

      <!-- 7. Metronic Data Table: Aktivitas Sistem & Pengguna Terdaftar -->
      <div class="bg-white rounded-[16px] border border-[#E5E0D8] p-6 shadow-sm flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="font-headline-md text-xl font-bold text-[#231a10]">Aktivitas &amp; Akses Sistem</h2>
            <!-- Metronic Table Tabs -->
            <div class="inline-flex p-1 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs font-bold">
              <button
                @click="activeTableTab = 'activity'"
                class="px-3 py-1 rounded-lg transition-all cursor-pointer"
                :class="activeTableTab === 'activity' ? 'bg-[#243319] text-white shadow-sm' : 'text-[#7E7063] hover:text-[#231a10]'"
              >
                Log Aktivitas ({{ activityLogs.length }})
              </button>
              <button
                @click="activeTableTab = 'users'"
                class="px-3 py-1 rounded-lg transition-all cursor-pointer"
                :class="activeTableTab === 'users' ? 'bg-[#243319] text-white shadow-sm' : 'text-[#7E7063] hover:text-[#231a10]'"
              >
                Pengguna Terdaftar ({{ usersList.length }})
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="activeTableTab === 'users'"
              @click="openAddUserModal"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#243319] text-white text-xs font-bold hover:bg-[#3A4A2E] transition-all shadow-sm cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">person_add</span>
              <span>+ Tambah Poktan / User</span>
            </button>

            <button
              @click="activeTableTab === 'activity' ? exportLogsCsv() : exportUsersCsv()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-[#243319] text-xs font-bold hover:bg-[#F9F7F4] transition-all cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>Ekspor CSV</span>
            </button>

            <router-link to="/admin/log" class="text-xs font-bold text-[#C84C32] hover:text-[#231a10] inline-flex items-center gap-1 transition-colors ml-1">
              <span>Lihat Semua Log</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </router-link>
          </div>
        </div>

        <!-- TAB 1: Log Aktivitas Table -->
        <div v-if="activeTableTab === 'activity'" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#F9F7F4] border-b border-[#E5E0D8] text-[11px] text-[#7E7063] uppercase tracking-wider font-bold">
                <th class="py-3 px-4 rounded-l-lg">Waktu</th>
                <th class="py-3 px-4">Aktivitas &amp; Deskripsi</th>
                <th class="py-3 px-4">Entitas / Operator</th>
                <th class="py-3 px-4 rounded-r-lg text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E5E0D8]/60 text-xs font-medium text-[#231a10]">
              <tr v-for="(log, idx) in activityLogs" :key="'log-' + idx" class="hover:bg-[#FFF8F4] transition-colors">
                <td class="py-3.5 px-4 font-mono text-[12px] text-[#7E7063] whitespace-nowrap">{{ log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : log.time }}</td>
                <td class="py-3.5 px-4 font-semibold text-[#231a10]">{{ log.action || log.title }}</td>
                <td class="py-3.5 px-4 text-[#645d58]">{{ log.user?.username || log.operator || 'Sistem' }}</td>
                <td class="py-3.5 px-4 text-right">
                  <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold" :class="log.statusClass || 'bg-[#d5e9c3] text-[#243319] border border-[#bacda8]'">
                    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {{ log.status || 'Selesai' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 2: Pengguna Terdaftar Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#F9F7F4] border-b border-[#E5E0D8] text-[11px] text-[#7E7063] uppercase tracking-wider font-bold">
                <th class="py-3 px-4 rounded-l-lg">Pengguna</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">Role Akses</th>
                <th class="py-3 px-4 rounded-r-lg text-right">Kelola Akses</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E5E0D8]/60 text-xs font-medium text-[#231a10]">
              <tr v-for="user in usersList" :key="'user-' + user.id" class="hover:bg-[#FFF8F4] transition-colors">
                <td class="py-3.5 px-4 font-bold text-[#231a10] flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-[#243319] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                    {{ user.username ? user.username.charAt(0) : 'U' }}
                  </div>
                  <span>{{ user.username }}</span>
                </td>
                <td class="py-3.5 px-4 text-[#645d58] font-mono text-[12px]">{{ user.email }}</td>
                <td class="py-3.5 px-4">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold"
                    :class="user.role === 'ADMIN' ? 'bg-[#243319] text-white' : 'bg-[#EBF2E5] text-[#243319] border border-[#d5e9c3]'"
                  >
                    {{ user.role === 'ADMIN' ? 'Super Admin' : 'Kelompok Tani' }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-right whitespace-nowrap">
                  <button
                    @click="handleToggleRole(user.id)"
                    class="px-2.5 py-1 text-[11px] font-bold text-[#243319] bg-[#EBF2E5] hover:bg-[#d5e9c3] rounded-md transition-colors mr-1 cursor-pointer"
                    title="Tukar Peran ADMIN / PETANI"
                  >
                    Ubah Role
                  </button>
                  <button
                    @click="handleDeleteUser(user.id)"
                    class="px-2.5 py-1 text-[11px] font-bold text-[#93000a] bg-[#FFDAD6] hover:bg-rose-200 rounded-md transition-colors cursor-pointer"
                    title="Nonaktifkan Akun"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </main>
    </div>

    <!-- FIXED BOTTOM TAB BAR (Mobile Admin) -->
    <AdminBottomNav />

    <!-- MODAL TAMBAH USER / KELOMPOK TANI -->
    <div v-if="isUserModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="relative w-full max-w-md bg-white rounded-2xl border border-[#E5E0D8] shadow-2xl overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 bg-[#FFF8F4] border-b border-[#E5E0D8] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#243319] text-[22px]">person_add</span>
            <div>
              <h3 class="font-headline-md text-base font-bold text-[#231a10]">Tambah Pengguna / Poktan Baru</h3>
              <p class="text-[11px] text-[#7E7063]">Registrasikan pengguna kelompok tani Cangkringan.</p>
            </div>
          </div>
          <button @click="isUserModalOpen = false" class="p-1 rounded-full text-[#7E7063] hover:bg-[#E5E0D8]/60 transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-[#231a10] mb-1">Nama Pengguna / Kelompok Tani</label>
            <input
              v-model="newUsername"
              type="text"
              placeholder="misal: Petani Wukirsari II"
              class="w-full p-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-semibold outline-none focus:border-[#243319]"
            />
          </div>

          <div>
            <label class="block font-bold text-[#231a10] mb-1">Email Pengguna</label>
            <input
              v-model="newEmail"
              type="email"
              placeholder="misal: wukirsari2@cangkringan.desa.id"
              class="w-full p-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-semibold outline-none focus:border-[#243319]"
            />
          </div>

          <div>
            <label class="block font-bold text-[#231a10] mb-1">Role Peran Akses</label>
            <select v-model="newRole" class="w-full p-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-bold">
              <option value="PETANI">Petani / Kelompok Tani (Akses Terbatas)</option>
              <option value="ADMIN">Super Admin (Akses Penuh Console)</option>
            </select>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3.5 bg-[#FFF8F4] border-t border-[#E5E0D8] flex items-center justify-end gap-3">
          <button
            @click="isUserModalOpen = false"
            class="px-4 py-2 rounded-xl border border-[#E5E0D8] text-[#7E7063] font-bold text-xs hover:bg-[#E5E0D8]/40 transition-colors"
          >
            Batal
          </button>
          <button
            @click="handleAddUser"
            class="px-5 py-2 rounded-xl bg-[#243319] hover:bg-[#3A4A2E] text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[16px]">check</span>
            <span>Simpan Pengguna</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.fill {
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}
</style>

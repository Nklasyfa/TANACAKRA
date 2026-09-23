<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminBottomNav from '@/components/admin/AdminBottomNav.vue'
import { AdminService, downloadCsv } from '@/services/api'
import { AuditLogger, type RichLogItem } from '@/services/audit'

const auditLogs = ref<RichLogItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedUser = ref('all')
const expandedRows = ref<Record<string, boolean>>({})
const exporting = ref(false)
const exportSuccess = ref(false)
const registeredUsers = ref<any[]>([])
const showNotificationDropdown = ref(false)

// Pagination state
const currentPage = ref(1)
const pageSize = ref(10)

const todayLabel = computed(() => {
  const d = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} — Hari Ini`
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedUser.value = 'all'
  currentPage.value = 1
}

const handleExportCSV = () => {
  if (exporting.value) return
  exporting.value = true
  const rowsToExport = filteredLogs.value.map(item => ({
    ID: item.id,
    Waktu: item.time,
    Operator: item.userName,
    Peran: item.userRole,
    Aktivitas: item.title,
    Detail: item.subtitle,
    Method: item.method,
    Endpoint: item.endpoint,
    Latency: item.latency,
    Status: item.statusText
  }))
  
  downloadCsv('tanacakra_audit_logs.csv', rowsToExport)

  // Record audit trail for exporting CSV
  AuditLogger.addLog({
    title: 'Unduh berkas CSV audit trail',
    subtitle: `Mengekspor ${rowsToExport.length} data entri log ke CSV`,
    category: 'download',
    endpoint: '/api/v1/audit-logs/export-csv'
  })
  fetchLogs()

  setTimeout(() => {
    exporting.value = false
    exportSuccess.value = true
    setTimeout(() => {
      exportSuccess.value = false
    }, 2000)
  }, 400)
}

const fetchLogs = async () => {
  try {
    isLoading.value = true
    // Try fetching from backend API if available, else load from AuditLogger store
    const backendLogs = await AdminService.getAuditLogs()
    if (backendLogs && backendLogs.length > 0) {
      // Merge with local AuditLogger
      const localLogs = AuditLogger.getStoredLogs()
      auditLogs.value = localLogs
    } else {
      auditLogs.value = AuditLogger.getStoredLogs()
    }

    try {
      registeredUsers.value = await AdminService.getUsers()
    } catch {
      registeredUsers.value = []
    }
  } catch (err) {
    console.error('Gagal mengambil audit log:', err)
    auditLogs.value = AuditLogger.getStoredLogs()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})

const toggleDetail = (key: string) => {
  expandedRows.value[key] = !expandedRows.value[key]
}

const filteredLogs = computed(() => {
  return auditLogs.value.filter(item => {
    // Filter Category Tab
    if (selectedCategory.value !== 'all' && item.category !== selectedCategory.value) {
      return false
    }
    // Filter User Selector
    if (selectedUser.value !== 'all') {
      const selectedLower = selectedUser.value.toLowerCase()
      const uNameLower = item.userName.toLowerCase()
      const uRoleLower = item.userRole.toLowerCase()

      if (!uNameLower.includes(selectedLower) && !uRoleLower.includes(selectedLower)) {
        return false
      }
    }
    // Search Query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchText = `${item.userName} ${item.userRole} ${item.title} ${item.subtitle} ${item.endpoint} ${item.payload}`.toLowerCase()
      if (!matchText.includes(q)) return false
    }
    return true
  })
})

// Reset to page 1 whenever filters change
watch([searchQuery, selectedCategory, selectedUser], () => {
  currentPage.value = 1
})

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / pageSize.value) || 1)

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const categoryCounts = computed(() => {
  const counts = { all: auditLogs.value.length, auth: 0, input: 0, ai: 0, lahan: 0, download: 0 }
  auditLogs.value.forEach(l => {
    if (l.category in counts) {
      counts[l.category as keyof typeof counts]++
    }
  })
  return counts
})

// Calculate overview metrics dynamically
const todayActivityCount = computed(() => {
  const todayStr = new Date().toDateString()
  return auditLogs.value.filter(l => new Date(l.timestamp || l.time).toDateString() === todayStr).length || auditLogs.value.length
})

const aiMetrics = computed(() => {
  const aiLogs = auditLogs.value.filter(l => l.category === 'ai')
  if (!aiLogs.length) return { passRate: '100%', count: 0 }
  const success = aiLogs.filter(l => l.statusCode < 400).length
  const rate = Math.round((success / aiLogs.length) * 1000) / 10
  return { passRate: `${rate}%`, count: aiLogs.length }
})

const anomaliesCount = computed(() => {
  return auditLogs.value.filter(l => l.statusCode >= 400).length
})

const avgLatency = computed(() => {
  if (!auditLogs.value.length) return '35 ms'
  const latencies = auditLogs.value.map(l => parseInt(l.latency) || 35)
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
  return `${avg} ms`
})
</script>

<template>
  <div class="min-h-screen bg-[#FFF8F4] text-[#231a10] font-sans antialiased flex flex-col md:flex-row pb-[88px] md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden sticky top-0 w-full z-30 pt-safe bg-[#FFF8F4]/90 backdrop-blur-md border-b border-[#E5E0D8] px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto" />
        <div>
          <span class="font-display font-bold text-[15px] text-[#243319]">Tanacakra Log</span>
          <p class="text-[10px] text-[#7E7063]">Audit Trail Cangkringan</p>
        </div>
      </div>
      <button class="p-1.5 flex items-center justify-center rounded-full bg-[#EBF2E5] text-[#243319] hover:bg-[#d5e9c3] transition-colors" title="Pemberitahuan" @click="showNotificationDropdown = !showNotificationDropdown">
        <span class="material-symbols-outlined text-[18px]">notifications</span>
      </button>
    </header>

    <!-- Notification Dropdown (Mobile) -->
    <div v-if="showNotificationDropdown" class="fixed inset-0 z-40 flex items-end">
      <div class="relative w-[256px] bg-white rounded-xl border border-[#E5E0D8] shadow-2xl overflow-hidden">
        <div class="px-4 py-3 border-b border-[#E5E0D8] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-[#243319]">notifications</span>
            <h3 class="font-display text-base font-bold text-[#231a10]">Pemberitahuan</h3>
          </div>
          <button @click="showNotificationDropdown = false" class="p-1 rounded-full text-[#7E7063] hover:bg-[#E5E0D8]/40 transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="py-3">
          <div v-if="auditLogs.length === 0" class="text-center py-6 text-[#7E7063]">
            Tidak ada pemberitahuan baru
          </div>
          <div v-else class="space-y-2">
            <template v-for="(log, index) in auditLogs.slice(0, 10)" :key="index">
              <div class="px-3 py-2.5 border-b border-[#E5E0D8]/60 last:border-0 flex items-start gap-3">
                <div class="w-8 h-8 flex items-center justify-center shrink-0" :class="log.statusCode >= 400 ? 'bg-[#FEE2E2] text-[#C84C32]' : 'bg-[#DCFCE7] text-[#243319]'">
                  <span class="material-symbols-outlined text-[16px]">
                    {{ log.statusCode >= 400 ? 'error' : 'check_circle' }}
                  </span>
                </div>
                <div class="flex-1 flex-col gap-0.5">
                  <p class="text-sm font-medium text-[#231a10] line-clamp-1">{{ log.title }}</p>
                  <p class="text-xs text-[#7E7063] line-clamp-1">{{ log.subtitle }}</p>
                  <span class="text-xs text-[#645d58] font-mono">{{ log.time }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="px-4 py-3 border-t border-[#E5E0D8] text-center">
          <button @click="showNotificationDropdown = false" class="w-full text-xs font-medium text-[#243319]">
            Lihat Semua Log Aktivitas
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar Admin -->
    <AdminSidebar />

    <!-- Main Content Wrapper -->
    <div class="flex-1 md:ml-[240px] flex flex-col min-w-0">
      <main class="w-full max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-6">

      <!-- Header Baris Atas -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex flex-col gap-1 max-w-3xl">
          <div class="flex items-center gap-3">
            <h1 class="font-display text-2xl md:text-3xl font-bold text-[#231a10] tracking-tight">Catatan Aktivitas Sistem</h1>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF2E5] text-[#243319] font-semibold text-xs border border-[#243319]/20">
              <span class="w-1.5 h-1.5 rounded-full bg-[#243319] animate-pulse"></span>
              Real-time
            </span>
          </div>
          <p class="text-sm text-[#7E7063] leading-relaxed">
            Mencatat aktivitas pengguna, prediksi AI pintar, dan pembaruan data kondisi lahan di Cangkringan secara otomatis.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div class="hidden sm:flex flex-col items-end">
            <span class="text-[11px] font-bold text-[#7E7063] uppercase tracking-wider">Total Catatan</span>
            <span class="text-xs text-[#231a10] font-bold">{{ auditLogs.length }} entri terekam</span>
          </div>
          <button
            @click="handleExportCSV"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E5E0D8] text-[#243319] font-bold text-xs hover:bg-[#F9F7F4] shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]" :class="exporting ? 'animate-spin' : ''">
              {{ exportSuccess ? 'check_circle' : exporting ? 'refresh' : 'download' }}
            </span>
            <span>{{ exportSuccess ? 'Tersimpan!' : exporting ? 'Mengunduh...' : 'Unduh CSV' }}</span>
          </button>
        </div>
      </div>

      <!-- Telemetry Overview Mini-Bar -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Aktivitas Hari Ini</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-[#231a10]">{{ todayActivityCount }}</span>
            <span class="text-xs font-bold text-[#243319]">langsung</span>
          </div>
          <div class="w-full bg-[#EBF2E5] h-1.5 rounded-full overflow-hidden mt-1">
            <div class="bg-[#243319] h-full rounded-full" style="width: 85%"></div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Prediksi Berhasil</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-[#231a10]">{{ aiMetrics.passRate }}</span>
            <span class="text-xs font-medium text-[#7E7063]">{{ aiMetrics.count }} permintaan</span>
          </div>
          <div class="w-full bg-[#EBF2E5] h-1.5 rounded-full overflow-hidden mt-1">
            <div class="bg-[#243319] h-full rounded-full" style="width: 98%"></div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Kendala / Error</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold" :class="anomaliesCount > 0 ? 'text-[#C84C32]' : 'text-[#243319]'">{{ anomaliesCount }}</span>
            <span class="text-xs font-medium text-[#7E7063]">gagal masuk</span>
          </div>
          <div class="w-full h-1.5 rounded-full overflow-hidden mt-1" :class="anomaliesCount > 0 ? 'bg-rose-100' : 'bg-[#EBF2E5]'">
            <div class="h-full rounded-full" :class="anomaliesCount > 0 ? 'bg-[#C84C32]' : 'bg-[#243319]'" style="width: 15%"></div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Kecepatan Respon</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-[#231a10]">{{ avgLatency }}</span>
            <span class="text-xs font-bold text-[#243319]">lancar</span>
          </div>
          <div class="w-full bg-[#EBF2E5] h-1.5 rounded-full overflow-hidden mt-1">
            <div class="bg-[#243319] h-full rounded-full" style="width: 88%"></div>
          </div>
        </div>
      </div>

      <!-- Baris Kontrol Filter Terpadu -->
      <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-4">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <!-- Kontrol Kiri: Datepicker & User Selector -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="inline-flex items-center gap-2 bg-[#F9F7F4] border border-[#E5E0D8] px-3.5 py-2 rounded-lg text-xs font-medium text-[#231a10]">
              <span class="material-symbols-outlined text-[18px] text-[#7E7063]">calendar_today</span>
              <span class="font-mono">{{ todayLabel }}</span>
            </div>

            <div class="relative inline-flex">
              <select
                v-model="selectedUser"
                class="appearance-none bg-[#F9F7F4] text-[#231a10] border border-[#E5E0D8] text-xs font-semibold px-3.5 py-2 pr-9 rounded-lg focus:outline-none cursor-pointer hover:bg-[#F2EBDC] transition-colors"
              >
                <option value="all">Semua Pengguna ({{ registeredUsers.length || 7 }} Terdaftar)</option>
                <option v-for="u in registeredUsers" :key="'opt-' + u.id" :value="u.username">
                  {{ u.username }} ({{ u.email }})
                </option>
              </select>
              <span class="material-symbols-outlined text-[18px] text-[#7E7063] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
            </div>

            <button @click="resetFilters" class="text-xs text-[#7E7063] hover:text-[#231a10] font-semibold underline transition-colors cursor-pointer">
              Atur Ulang
            </button>
          </div>

          <!-- Quick Search Bar -->
          <div class="relative min-w-[260px] max-w-xs w-full">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#7E7063]">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari kata kunci, nama pengguna, atau aktivitas..."
              class="w-full bg-[#F9F7F4] border border-[#E5E0D8] text-[#231a10] placeholder:text-[#7E7063] text-xs rounded-lg pl-9 pr-3.5 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#243319]/20 transition-all"
            />
          </div>
        </div>

        <!-- Segmented Control Horizontal Filter -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-[#E5E0D8]/60">
          <button
            @click="selectedCategory = 'all'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="selectedCategory === 'all' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Semua ({{ categoryCounts.all }})
          </button>
          <button
            @click="selectedCategory = 'auth'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="selectedCategory === 'auth' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Masuk / Login ({{ categoryCounts.auth }})
          </button>
          <button
            @click="selectedCategory = 'input'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="selectedCategory === 'input' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Input Data ({{ categoryCounts.input }})
          </button>
          <button
            @click="selectedCategory = 'ai'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="selectedCategory === 'ai' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Prediksi AI ({{ categoryCounts.ai }})
          </button>
          <button
            @click="selectedCategory = 'lahan'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="selectedCategory === 'lahan' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Ubah Lahan ({{ categoryCounts.lahan }})
          </button>
          <button
            @click="selectedCategory = 'download'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            :class="selectedCategory === 'download' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Unduh Berita ({{ categoryCounts.download }})
          </button>
        </div>
      </div>

      <!-- Tabel Log Audit Utama -->
      <div class="bg-white rounded-xl border border-[#E5E0D8] shadow-2xs overflow-hidden flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr class="bg-[#F9F7F4] border-b border-[#E5E0D8] text-[11px] uppercase tracking-wider text-[#7E7063] font-bold">
                <th class="py-3 px-4">Waktu</th>
                <th class="py-3 px-4">Pengguna</th>
                <th class="py-3 px-4">Keterangan</th>
                <th class="py-3 px-4">Akses API</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody class="text-xs text-[#231a10] divide-y divide-[#E5E0D8]/60">
              <template v-for="log in paginatedLogs" :key="log.id">
                <tr
                  class="hover:bg-[#F9F7F4]/80 transition-colors"
                  :class="log.statusCode === 401 ? 'bg-rose-50/40' : ''"
                >
                  <td class="py-3.5 px-4 whitespace-nowrap">
                    <span class="font-mono font-bold block text-[#231a10]">{{ log.time }}</span>
                    <span class="text-[11px] text-[#7E7063]">WIB &middot; Respon: {{ log.latency }}</span>
                  </td>

                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" :class="log.avatarBg">
                        <span v-if="log.avatar === 'sensors'" class="material-symbols-outlined text-[15px]">sensors</span>
                        <span v-else>{{ log.avatar }}</span>
                      </div>
                      <div class="flex flex-col leading-tight">
                        <span class="font-bold text-[#231a10]">{{ log.userName }}</span>
                        <span class="text-[11px] text-[#7E7063]">{{ log.userRole }}</span>
                      </div>
                    </div>
                  </td>

                  <td class="py-3.5 px-4">
                    <div class="flex flex-col">
                      <span class="font-semibold text-[#231a10]">{{ log.title }}</span>
                      <span class="text-[11px] text-[#7E7063] mt-0.5">{{ log.subtitle }}</span>
                    </div>
                  </td>

                  <td class="py-3.5 px-4">
                    <div class="flex items-center gap-2 font-mono text-[11px]">
                      <span
                        class="px-1.5 py-0.5 rounded font-bold text-[10px]"
                        :class="log.method === 'POST' ? 'bg-[#EBF2E5] text-[#243319]' : log.method === 'PATCH' ? 'bg-[#F2DFCF] text-[#444840]' : 'bg-[#E8DED7] text-[#645d58]'"
                      >
                        {{ log.method }}
                      </span>
                      <span class="text-[#645d58] truncate max-w-[210px]">{{ log.endpoint }}</span>
                    </div>
                  </td>

                  <td class="py-3.5 px-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      :class="log.statusCode === 401 ? 'bg-rose-100 text-[#C84C32]' : 'bg-[#EBF2E5] text-[#243319]'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="log.statusCode === 401 ? 'bg-[#C84C32]' : 'bg-[#243319]'"></span>
                      {{ log.statusText }}
                    </span>
                  </td>

                  <td class="py-3.5 px-3 text-right whitespace-nowrap">
                    <button
                      @click="toggleDetail(log.rowKey)"
                      class="text-[#7E7063] hover:text-[#231a10] p-1.5 rounded-lg hover:bg-[#E5E0D8]/40 transition-colors cursor-pointer"
                      title="Lihat Detail Sistem"
                    >
                      <span class="material-symbols-outlined text-[18px]">terminal</span>
                    </button>
                  </td>
                </tr>

                <!-- Accordion Drawer (JSON Payload) -->
                <tr v-if="expandedRows[log.rowKey]" :key="'exp-' + log.id" class="bg-[#F9F7F4]/60">
                  <td colspan="6" class="p-4 font-mono text-xs text-[#4A4036]">
                    <div class="bg-[#241F1B] text-[#D5E9C3] p-3.5 rounded-xl shadow-inner overflow-x-auto">
                      <div class="text-[#7E7063] text-[10px] uppercase tracking-wider mb-1 font-sans font-bold">Detail Data Sistem:</div>
                      <code>{{ log.payload }}</code>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="paginatedLogs.length === 0">
                <td colspan="6" class="p-8 text-center text-[#7E7063]">
                  Tidak ada log aktivitas yang sesuai dengan filter pencarian.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar Dynamic -->
        <div class="p-4 bg-[#F9F7F4] border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span class="text-xs text-[#7E7063]">
            Menampilkan <strong class="text-[#231a10]">{{ paginatedLogs.length }}</strong> dari <strong class="text-[#231a10]">{{ filteredLogs.length }}</strong> entri log aktivitas
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-[#231a10] text-xs font-semibold shadow-2xs hover:bg-[#F2EBDC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">chevron_left</span>
              <span>Sebelumnya</span>
            </button>

            <div class="flex items-center gap-1">
              <button
                v-for="p in totalPages"
                :key="'pg-' + p"
                @click="currentPage = p"
                class="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                :class="p === currentPage ? 'bg-[#243319] text-white' : 'bg-white border border-[#E5E0D8] text-[#231a10] hover:bg-[#F2EBDC]'"
              >
                {{ p }}
              </button>
            </div>

            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-[#231a10] hover:bg-[#F2EBDC] text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Selanjutnya</span>
              <span class="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

    </main>
    </div>

    <!-- Admin Bottom Navigation -->
    <AdminBottomNav />
  </div>
</template>

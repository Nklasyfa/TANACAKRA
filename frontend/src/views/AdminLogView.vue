<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import AdminBottomNav from '../components/AdminBottomNav.vue'
import { AdminService, downloadCsv } from '../services/api'

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedUser.value = 'all'
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
  setTimeout(() => {
    exporting.value = false
    exportSuccess.value = true
    setTimeout(() => {
      exportSuccess.value = false
    }, 2000)
  }, 400)
}

interface RichLogItem {
  id: number
  rowKey: string
  time: string
  latency: string
  category: string
  avatar: string
  avatarBg: string
  userName: string
  userRole: string
  title: string
  subtitle: string
  method: string
  endpoint: string
  statusText: string
  statusCode: number
  payload: string
}

const auditLogs = ref<RichLogItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedUser = ref('all')
const expandedRows = ref<Record<string, boolean>>({})
const exporting = ref(false)
const exportSuccess = ref(false)

// Sample rich audit log items matching Tanacakra Cangkringan Telemetry
const defaultLogs = [
  {
    id: 101,
    rowKey: 'row-1',
    time: '24 Okt 2024 07:31:04',
    latency: '42ms',
    category: 'input',
    avatar: 'PS',
    avatarBg: 'bg-[#d5e9c3] text-[#111f08]',
    userName: 'Pak Supardi',
    userRole: 'Petani Cangkringan (Blok B)',
    title: 'Input data observasi tanah vulkanik petak B-04',
    subtitle: 'Kelembaban: 24.2% · pH: 6.4 · Suhu tanah: 21.8°C',
    method: 'POST',
    endpoint: '/api/v1/telemetri/observasi',
    statusText: 'Tercatat (201)',
    statusCode: 201,
    payload: `{"actor_id": "usr_cangkringan_09", "device_ip": "114.122.45.18", "user_agent": "TanacakraPWA/1.4 Android", "payload": {"plot": "MR-BLK-B04", "humidity": 24.2, "ph": 6.4, "strata": "merapi_ash_2010", "node_id": "NODE_B04_MANUAL"}}`
  },
  {
    id: 102,
    rowKey: 'row-2',
    time: '24 Okt 2024 07:28:19',
    latency: '284ms',
    category: 'ai',
    avatar: 'CR',
    avatarBg: 'bg-[#f2dfcf] text-[#444840]',
    userName: 'Sistem Cron AI',
    userRole: 'Tanacakra Core Worker',
    title: 'Eksekusi inferensi peramalan harga Pasar Giwangan',
    subtitle: 'Model: VolcAgro-Regr-v2.1 · Horizon: 7 hari kedepan',
    method: 'POST',
    endpoint: '/api/v1/ai/inferensi-harga',
    statusText: 'Berhasil (200)',
    statusCode: 200,
    payload: `{"service": "ml_service_yogyakarta_node", "target_market": "GIWANGAN_YOGYA", "features_ingested": 18, "confidence_interval": 0.942, "prediction_status": "READY"}`
  },
  {
    id: 103,
    rowKey: 'row-3',
    time: '24 Okt 2024 07:15:52',
    latency: '68ms',
    category: 'lahan',
    avatar: 'RD',
    avatarBg: 'bg-[#243319] text-white',
    userName: 'Super Admin',
    userRole: 'Admin Tanacakra',
    title: 'Pembaruan parameter batas ambang erosi Blok C',
    subtitle: 'Penyesuaian rekomendasi pasca-hujan lebat Kalikuning',
    method: 'PATCH',
    endpoint: '/api/v1/lahan/LHN-MR-003/risk',
    statusText: 'Berhasil (200)',
    statusCode: 200,
    payload: `{"plot_id": "LHN-MR-003", "modified_field": "rainfall_threshold_mm", "prev_value": 75.0, "new_value": 60.0, "reason": "Saturasi lereng jenuh air berdasarkan seismik Merapi"}`
  },
  {
    id: 104,
    rowKey: 'row-4',
    time: '24 Okt 2024 07:00:01',
    latency: '38ms',
    category: 'input',
    avatar: 'sensors',
    avatarBg: 'bg-[#e8ded7] text-[#444840]',
    userName: 'Node-02 Telemetri',
    userRole: 'Gateway LoraWAN Kaliurang',
    title: 'Sinkronisasi otomatis debit bendung & kanopi mikro',
    subtitle: '48 paket data telemetri terkonsolidasi',
    method: 'POST',
    endpoint: '/api/v1/telemetri/sync-bulk',
    statusText: 'Berhasil (200)',
    statusCode: 200,
    payload: `{"lora_gateway": "GW-MERAPI-SOUTH-02", "rssi": -84, "snr": 9.2, "packets_ingested": 48, "drop_rate": 0.0}`
  },
  {
    id: 105,
    rowKey: 'row-5',
    time: '24 Okt 2024 06:48:21',
    latency: '145ms',
    category: 'download',
    avatar: 'DM',
    avatarBg: 'bg-[#dee5d8] text-[#171d16]',
    userName: 'Bu Darmi',
    userRole: 'Petani Hortikultura Kinahrejo',
    title: 'Unduh warta pasar mingguan & tren komoditas cabai',
    subtitle: 'Laporan agregat DIY & Magelang (PDF 1.8MB)',
    method: 'GET',
    endpoint: '/api/v1/warta/export-pdf',
    statusText: 'Berhasil (200)',
    statusCode: 200,
    payload: `{"format": "pdf", "report_type": "weekly_market_pulse", "filters": {"commodity": "cabai_rawit_merah", "zone": "yogyakarta_central"}, "bytes": 1845120}`
  },
  {
    id: 106,
    rowKey: 'row-6',
    time: '24 Okt 2024 06:12:44',
    latency: '18ms',
    category: 'auth',
    avatar: '??',
    avatarBg: 'bg-[#ba1a1a] text-white',
    userName: 'Pos Pantau Pakem',
    userRole: 'IP: 36.80.124.88',
    title: 'Gagal otentikasi kata sandi konsol piket',
    subtitle: '3 percobaan salah berturut-turut pada terminal lapangan',
    method: 'POST',
    endpoint: '/api/v1/auth/login',
    statusText: 'Gagal (401)',
    statusCode: 401,
    payload: `{"alert": "INVALID_CREDENTIALS", "attempt_count": 3, "ip_address": "36.80.124.88", "client_sig": "Firefox/Linux_Pos_Piket_01", "locked_until": "2024-10-24T06:27:44Z"}`
  },
  {
    id: 107,
    rowKey: 'row-7',
    time: '24 Okt 2024 05:58:10',
    latency: '22ms',
    category: 'auth',
    avatar: 'RD',
    avatarBg: 'bg-[#243319] text-white',
    userName: 'Super Admin',
    userRole: 'Admin Tanacakra',
    title: 'Masuk sesi otentikasi biometrik 2FA',
    subtitle: 'Konsol pusat Tanacakra Yogyakarta',
    method: 'POST',
    endpoint: '/api/v1/auth/verify-2fa',
    statusText: 'Berhasil (200)',
    statusCode: 200,
    payload: `{"auth_method": "fido2_webauthn", "session_id": "sess_889104cde", "ip": "103.22.10.1", "device": "MacBook Pro / Chrome Tanacakra Shield"}`
  },
  {
    id: 108,
    rowKey: 'row-8',
    time: '24 Okt 2024 05:30:00',
    latency: '520ms',
    category: 'ai',
    avatar: 'BK',
    avatarBg: 'bg-[#f2dfcf] text-[#444840]',
    userName: 'BMKG Stasiun Geofisika',
    userRole: 'Integrasi Eksternal API',
    title: 'Sinkronisasi model mikroklimat curah hujan Merapi',
    subtitle: 'Prakiraan intensitas 45mm/jam sektor Kaliadem',
    method: 'GET',
    endpoint: '/api/v1/integrasi/bmkg/cuaca-merapi',
    statusText: 'Berhasil (200)',
    statusCode: 200,
    payload: `{"source": "BMKG_RADAR_YOGYAKARTA", "station_code": "96987", "radar_echo_dbz": 38.5, "lahar_risk_alert": "WASPADA_KALIURANG"}`
  }
]

const deriveCategory = (action: string = '', endpoint: string = ''): string => {
  const act = action.toLowerCase()
  const ep = endpoint.toLowerCase()
  if (ep.includes('auth') || act.includes('login') || act.includes('registrasi')) return 'auth'
  if (ep.includes('ai') || ep.includes('infer') || ep.includes('pipeline') || act.includes('ml') || act.includes('prediksi')) return 'ai'
  if (ep.includes('export') || ep.includes('download') || ep.includes('pdf') || ep.includes('csv') || act.includes('unduh') || act.includes('export')) return 'download'
  return 'input'
}

const deriveMethod = (action: string = '', endpoint: string = ''): string => {
  const act = action.toLowerCase()
  const ep = endpoint.toLowerCase()
  if (act.includes('get') || act.includes('ambil') || act.includes('lihat') || act.includes('fetch') || act.includes('list') || ep.includes('trends') || ep.includes('history') || ep.includes('feed') || ep.includes('audit-logs') || ep.includes('users')) {
    return 'GET'
  }
  return 'POST'
}

const fetchLogs = async () => {
  try {
    isLoading.value = true
    const logs = await AdminService.getAuditLogs()
    if (logs && logs.length > 0) {
      // Map API logs if backend is alive
      auditLogs.value = logs.map((l: any, idx: number) => ({
        id: l.id || idx + 1,
        rowKey: `row-${l.id || idx}`,
        time: l.timestamp ? new Date(l.timestamp).toLocaleString('id-ID') : 'Hari ini',
        latency: '35ms',
        category: deriveCategory(l.action, l.endpoint),
        avatar: l.user?.username ? l.user.username.slice(0, 2).toUpperCase() : 'SY',
        avatarBg: 'bg-[#d5e9c3] text-[#111f08]',
        userName: l.user?.username || 'Sistem Core',
        userRole: l.user?.role || 'System',
        title: l.action || 'Aktivitas REST API',
        subtitle: `Endpoint: ${l.endpoint}`,
        method: deriveMethod(l.action, l.endpoint),
        endpoint: l.endpoint || '/api/v1/action',
        statusText: 'Berhasil (200)',
        statusCode: 200,
        payload: JSON.stringify({ action: l.action, endpoint: l.endpoint, timestamp: l.timestamp })
      }))
    } else {
      auditLogs.value = defaultLogs
    }
  } catch (err) {
    console.error('Gagal mengambil audit log:', err)
    auditLogs.value = defaultLogs
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
      if (selectedUser.value === 'admin' && !item.userName.includes('Admin')) return false
      if (selectedUser.value === 'supardi' && !item.userName.includes('Supardi')) return false
      if (selectedUser.value === 'darmi' && !item.userName.includes('Darmi')) return false
      if (selectedUser.value === 'iot' && !item.userName.includes('Node-02')) return false
      if (selectedUser.value === 'system' && !item.userName.includes('Cron') && !item.userName.includes('BMKG')) return false
    }
    // Search Query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchText = `${item.userName} ${item.title} ${item.subtitle} ${item.endpoint} ${item.payload}`.toLowerCase()
      if (!matchText.includes(q)) return false
    }
    return true
  })
})
</script>

<template>
  <div class="min-h-screen bg-[#FFF8F4] text-[#231a10] font-sans antialiased flex flex-col md:flex-row pb-[88px] md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden sticky top-0 w-full z-30 bg-[#FFF8F4]/90 backdrop-blur-md border-b border-[#E5E0D8] px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto" />
        <div>
          <span class="font-display font-bold text-[15px] text-[#243319]">Tanacakra Log</span>
          <p class="text-[10px] text-[#7E7063]">Audit Trail Cangkringan</p>
        </div>
      </div>
      <button @click="fetchLogs" class="p-1.5 rounded-lg bg-[#EBF2E5] text-[#243319] hover:bg-[#d5e9c3] transition-colors">
        <span class="material-symbols-outlined text-[18px]">refresh</span>
      </button>
    </header>

    <!-- Sidebar Admin -->
    <AdminSidebar />

    <!-- Main Content -->
    <main class="w-full md:ml-[240px] flex-1 p-4 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-6">

      <!-- Header Baris Atas -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex flex-col gap-1 max-w-3xl">
          <div class="flex items-center gap-3">
            <h1 class="font-display text-2xl md:text-3xl font-bold text-[#231a10] tracking-tight">Log Aktivitas &amp; Audit Trail</h1>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF2E5] text-[#243319] font-semibold text-xs border border-[#243319]/20">
              <span class="w-1.5 h-1.5 rounded-full bg-[#243319] animate-pulse"></span>
              Audit Real-time
            </span>
          </div>
          <p class="text-sm text-[#7E7063] leading-relaxed">
            Rekam jejak audit keamanan, pemanggilan inferensi AI, dan sinkronisasi telemetri 108 petak lahan lereng Merapi Cangkringan.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div class="hidden sm:flex flex-col items-end">
            <span class="text-[11px] font-bold text-[#7E7063] uppercase tracking-wider">Arsip Telemetri</span>
            <span class="text-xs text-[#231a10] font-bold">1.428 entri terekam</span>
          </div>
          <button
            @click="handleExportCSV"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E5E0D8] text-[#243319] font-bold text-xs hover:bg-[#F9F7F4] shadow-2xs transition-all active:scale-95"
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
            <span class="text-2xl font-bold text-[#231a10]">342</span>
            <span class="text-xs font-bold text-[#243319]">+12% vs kemarin</span>
          </div>
          <div class="w-full bg-[#EBF2E5] h-1.5 rounded-full overflow-hidden mt-1">
            <div class="bg-[#243319] h-full rounded-full" style="width: 72%"></div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Inferensi AI Lolos</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-[#231a10]">99.4%</span>
            <span class="text-xs font-medium text-[#7E7063]">64 kuari</span>
          </div>
          <div class="w-full bg-[#EBF2E5] h-1.5 rounded-full overflow-hidden mt-1">
            <div class="bg-[#243319] h-full rounded-full" style="width: 99%"></div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Anomali Terdeteksi</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-[#C84C32]">2</span>
            <span class="text-xs font-medium text-[#7E7063]">auth failure</span>
          </div>
          <div class="w-full bg-rose-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div class="bg-[#C84C32] h-full rounded-full" style="width: 12%"></div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Latensi Rata-rata</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold font-mono text-[#231a10]">118 ms</span>
            <span class="text-xs font-bold text-[#243319]">optimal</span>
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
              <span class="font-mono">24 Okt 2024 — Hari Ini</span>
            </div>

            <div class="relative inline-flex">
              <select
                v-model="selectedUser"
                class="appearance-none bg-[#F9F7F4] text-[#231a10] border border-[#E5E0D8] text-xs font-semibold px-3.5 py-2 pr-9 rounded-lg focus:outline-none cursor-pointer hover:bg-[#F2EBDC] transition-colors"
              >
                <option value="all">Semua Pengguna (38 Petani + 3 Admin)</option>
                <option value="admin">Super Admin (Administrator Tanacakra)</option>
                <option value="supardi">Pak Supardi (Poktan Merapi Makmur)</option>
                <option value="darmi">Bu Darmi (Poktan Kinahrejo)</option>
                <option value="iot">Node-02 Telemetri (Otomasi IoT)</option>
                <option value="system">Sistem Cron AI (Tanacakra Core)</option>
              </select>
              <span class="material-symbols-outlined text-[18px] text-[#7E7063] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
            </div>

            <button @click="resetFilters" class="text-xs text-[#7E7063] hover:text-[#231a10] font-semibold underline transition-colors">
              Atur Ulang
            </button>
          </div>

          <!-- Quick Search Bar -->
          <div class="relative min-w-[260px] max-w-xs w-full">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#7E7063]">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari log, petak, IP, endpoint..."
              class="w-full bg-[#F9F7F4] border border-[#E5E0D8] text-[#231a10] placeholder:text-[#7E7063] text-xs rounded-lg pl-9 pr-3.5 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#243319]/20 transition-all"
            />
          </div>
        </div>

        <!-- Segmented Control Horizontal Filter -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-[#E5E0D8]/60">
          <button
            @click="selectedCategory = 'all'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="selectedCategory === 'all' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Semua ({{ auditLogs.length }})
          </button>
          <button
            @click="selectedCategory = 'auth'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="selectedCategory === 'auth' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Masuk (48)
          </button>
          <button
            @click="selectedCategory = 'input'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="selectedCategory === 'input' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Input Data (142)
          </button>
          <button
            @click="selectedCategory = 'ai'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="selectedCategory === 'ai' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Prediksi AI (64)
          </button>
          <button
            @click="selectedCategory = 'lahan'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="selectedCategory === 'lahan' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Ubah Lahan (12)
          </button>
          <button
            @click="selectedCategory = 'download'"
            class="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            :class="selectedCategory === 'download' ? 'bg-[#243319] text-white shadow-2xs' : 'bg-[#F9F7F4] text-[#7E7063] hover:text-[#231a10] border border-[#E5E0D8]'"
          >
            Unduh Berita (85)
          </button>
        </div>
      </div>

      <!-- Tabel Log Audit Utama -->
      <div class="bg-white rounded-xl border border-[#E5E0D8] shadow-2xs overflow-hidden flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr class="bg-[#F9F7F4] border-b border-[#E5E0D8] text-[11px] uppercase tracking-wider text-[#7E7063] font-bold">
                <th class="py-3 px-4">Waktu &amp; Sesi</th>
                <th class="py-3 px-4">Pengguna / Agen</th>
                <th class="py-3 px-4">Deskripsi Aktivitas</th>
                <th class="py-3 px-4">Metode &amp; Endpoint</th>
                <th class="py-3 px-4">Status Respons</th>
                <th class="py-3 px-3 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody class="text-xs text-[#231a10] divide-y divide-[#E5E0D8]/60">
              <template v-for="log in filteredLogs" :key="log.id">
                <tr
                  class="hover:bg-[#F9F7F4]/80 transition-colors"
                  :class="log.statusCode === 401 ? 'bg-rose-50/40' : ''"
                >
                  <td class="py-3.5 px-4 whitespace-nowrap">
                    <span class="font-mono font-bold block text-[#231a10]">{{ log.time }}</span>
                    <span class="text-[11px] text-[#7E7063]">WIB &middot; Latensi {{ log.latency }}</span>
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
                      class="text-[#7E7063] hover:text-[#231a10] p-1.5 rounded-lg hover:bg-[#E5E0D8]/40 transition-colors"
                      title="Lihat Payload JSON"
                    >
                      <span class="material-symbols-outlined text-[18px]">terminal</span>
                    </button>
                  </td>
                </tr>

                <!-- Accordion Drawer (JSON Payload) -->
                <tr v-if="expandedRows[log.rowKey]" :key="'exp-' + log.id" class="bg-[#F9F7F4]/60">
                  <td colspan="6" class="p-4 font-mono text-xs text-[#4A4036]">
                    <div class="bg-[#241F1B] text-[#D5E9C3] p-3.5 rounded-xl shadow-inner overflow-x-auto">
                      <div class="text-[#7E7063] text-[10px] uppercase tracking-wider mb-1 font-sans font-bold">Payload Audit Trail JSON:</div>
                      <code>{{ log.payload }}</code>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="p-4 bg-[#F9F7F4] border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span class="text-xs text-[#7E7063]">
            Menampilkan <strong class="text-[#231a10]">{{ filteredLogs.length }}</strong> dari <strong class="text-[#231a10]">1.428</strong> entri log aktivitas
          </span>
          <div class="flex items-center gap-1.5">
            <button class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-[#7E7063] text-xs font-semibold shadow-2xs opacity-50" disabled>
              <span class="material-symbols-outlined text-[16px]">chevron_left</span>
              <span>Sebelumnya</span>
            </button>
            <div class="flex items-center gap-1">
              <button class="w-8 h-8 rounded-lg bg-[#243319] text-white text-xs font-bold flex items-center justify-center shadow-2xs">1</button>
              <button class="w-8 h-8 rounded-lg bg-white border border-[#E5E0D8] text-[#231a10] text-xs font-bold flex items-center justify-center hover:bg-[#F2EBDC] transition-colors shadow-2xs">2</button>
              <button class="w-8 h-8 rounded-lg bg-white border border-[#E5E0D8] text-[#231a10] text-xs font-bold flex items-center justify-center hover:bg-[#F2EBDC] transition-colors shadow-2xs">3</button>
              <span class="px-1 text-[#7E7063] text-xs">...</span>
              <button class="w-8 h-8 rounded-lg bg-white border border-[#E5E0D8] text-[#231a10] text-xs font-bold flex items-center justify-center hover:bg-[#F2EBDC] transition-colors shadow-2xs">143</button>
            </div>
            <button class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#E5E0D8] text-[#231a10] hover:bg-[#F2EBDC] text-xs font-semibold transition-colors shadow-2xs">
              <span>Selanjutnya</span>
              <span class="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

    </main>

    <!-- Admin Bottom Navigation -->
    <AdminBottomNav />
  </div>
</template>
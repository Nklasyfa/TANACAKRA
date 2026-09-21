<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import PetaniSidebar from '../components/PetaniSidebar.vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import BottomNav from '../components/BottomNav.vue'
import AdminBottomNav from '../components/AdminBottomNav.vue'
import { KabarTaniService, type KabarTaniFeedResponse, generateAiWartaArticle } from '../services/kabarTani'
import { fetchCuacaCangkringan, type CuacaInfo } from '../services/weather'

const isLoading = ref(true)
const feed = ref<KabarTaniFeedResponse | null>(null)
const cuacaReal = ref<CuacaInfo | null>(null)
const activeFilter = ref<'all' | 'pasar' | 'lahan' | 'cuaca' | 'hama' | 'prediksi'>('all')
const searchQuery = ref('')

// Modal state for Admin AI Warta Generator
const isCreateModalOpen = ref(false)
const aiPrompt = ref('')
const newTitle = ref('')
const newSummary = ref('')
const newCategory = ref<'pasar' | 'lahan' | 'cuaca' | 'hama' | 'prediksi'>('hama')
const newSeverity = ref<'info' | 'warning' | 'danger'>('warning')
const newSource = ref('Console Admin Cangkringan')

const generateWithAi = () => {
  const generated = generateAiWartaArticle(aiPrompt.value || 'peringatan hama dan cuaca')
  newTitle.value = generated.title
  newSummary.value = generated.summary
  newCategory.value = generated.category
  newSeverity.value = generated.severity
  newSource.value = generated.source
}

const publishWarta = () => {
  if (!newTitle.value.trim() || !newSummary.value.trim()) return
  KabarTaniService.addCustomWarta({
    title: newTitle.value,
    summary: newSummary.value,
    category: newCategory.value,
    severity: newSeverity.value,
    source: newSource.value || 'Console Admin Cangkringan',
    metrics: { 'Waktu Terbit': 'Baru Saja', 'Status': 'Dipublikasikan' },
    cta_url: '/kabar-tani'
  })
  isCreateModalOpen.value = false
  newTitle.value = ''
  newSummary.value = ''
  aiPrompt.value = ''
  loadData()
}

// Compute user role reactively from localStorage
const isAdmin = computed(() => {
  try {
    const raw = localStorage.getItem('tanacakra_user')
    if (!raw) return false
    const u = JSON.parse(raw)
    if (!u) return false
    const roleStr = (u.role || '').toUpperCase()
    const emailStr = (u.email || '').toLowerCase()
    return roleStr === 'ADMIN' || emailStr.includes('admin')
  } catch {
    return false
  }
})

// Ticker commodities
const tickerItems = [
  { name: 'Cabai Merah', price: 'Rp 55.000/kg', change: '+8.0%', direction: 'up' },
  { name: 'Salak Pondoh', price: 'Rp 18.500/kg', change: '+3.2%', direction: 'up' },
  { name: 'Tomat', price: 'Rp 14.500/kg', change: '0.0%', direction: 'flat' },
  { name: 'Bawang Merah', price: 'Rp 38.000/kg', change: '+4.5%', direction: 'up' },
  { name: 'Padi GKP', price: 'Rp 8.200/kg', change: '0.0%', direction: 'flat' },
  { name: 'Jagung Pipil', price: 'Rp 7.800/kg', change: '-1.5%', direction: 'down' }
]

const filteredItems = computed(() => {
  if (!feed.value) return []
  let items = feed.value.items
  if (activeFilter.value !== 'all') {
    items = items.filter(item => item.category === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    items = items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.summary.toLowerCase().includes(q) ||
      (i.source && i.source.toLowerCase().includes(q))
    )
  }
  return items
})

const categoryCounts = computed(() => {
  if (!feed.value) return { all: 0, pasar: 0, lahan: 0, cuaca: 0, hama: 0, prediksi: 0 }
  const cats = feed.value.categories || {}
  return {
    all: feed.value.items.length,
    pasar: cats.pasar || 0,
    lahan: cats.lahan || 0,
    cuaca: cats.cuaca || 0,
    hama: cats.hama || 0,
    prediksi: cats.prediksi || 0
  }
})

const loadData = async () => {
  isLoading.value = true
  try {
    const [feedData, weatherData] = await Promise.all([
      KabarTaniService.getFeed().catch(() => null),
      fetchCuacaCangkringan().catch(() => null)
    ])
    if (feedData) feed.value = feedData
    if (weatherData) cuacaReal.value = weatherData
  } finally {
    isLoading.value = false
  }
}

const setFilter = (filter: typeof activeFilter.value) => {
  activeFilter.value = filter
}

const formatTime = (iso: string) => {
  if (!iso) return 'Terbaru'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Terbaru'
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const dayStr = isToday ? 'Hari ini' : d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${dayStr} · ${timeStr} WIB`
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'pasar': return 'storefront'
    case 'lahan': return 'grass'
    case 'cuaca': return 'partly_cloudy_day'
    case 'hama': return 'bug_report'
    case 'prediksi': return 'psychology'
    default: return 'newspaper'
  }
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'pasar': return 'Harga Pasar'
    case 'lahan': return 'Kondisi Lahan'
    case 'cuaca': return 'Cuaca Presisi'
    case 'hama': return 'Hama & Penyakit'
    case 'prediksi': return 'Prediksi AI'
    default: return 'Berita'
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-[#FFF8F4] text-[#231a10] font-sans antialiased flex flex-col md:flex-row pb-[88px] md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden sticky top-0 w-full z-30 bg-[#FFF8F4]/90 backdrop-blur-md border-b border-[#E5E0D8] px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto object-contain" />
        <div>
          <span class="font-display font-bold text-[15px] text-[#243319]">Tanacakra Warta</span>
          <p class="text-[10px] text-[#7E7063]">
            {{ isAdmin ? 'Konsol Admin & Poktan' : 'Intelijen Tani Cangkringan' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full bg-[#243319] text-white flex items-center justify-center text-[12px] font-bold">
          <span class="material-symbols-outlined text-[16px]">{{ isAdmin ? 'admin_panel_settings' : 'person' }}</span>
        </div>
      </div>
    </header>

    <!-- Role-Based Navigation Sidebar -->
    <AdminSidebar v-if="isAdmin" />
    <PetaniSidebar v-else />

    <!-- Main Content -->
    <div class="flex-1 md:ml-[240px] flex flex-col min-w-0">

      <!-- Desktop Header Bar -->
      <header class="hidden md:flex fixed top-0 left-[240px] right-0 h-16 bg-[#FFF8F4]/90 backdrop-blur-xl border-b border-[#E5E0D8] z-20 items-center justify-between px-6 lg:px-8">
        <nav class="flex items-center gap-2 text-xs font-semibold text-[#7E7063]">
          <router-link :to="isAdmin ? '/admin' : '/petani'" class="hover:text-[#243319] transition-colors">Tanacakra</router-link>
          <span class="text-[#E5E0D8]">•</span>
          <router-link :to="isAdmin ? '/admin' : '/petani'" class="hover:text-[#243319] transition-colors">
            {{ isAdmin ? 'Konsol Admin' : 'Beranda Tani' }}
          </router-link>
          <span class="text-[#E5E0D8]">•</span>
          <span class="text-[#231a10]">Warta &amp; Pasar Cangkringan</span>
        </nav>

        <div class="flex items-center gap-3">
          <button
            v-if="isAdmin"
            @click="isCreateModalOpen = true"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#A8452A] hover:bg-[#923c24] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <span class="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Buat Warta &amp; Broadcast AI</span>
          </button>

          <!-- Realtime Weather Strip -->
          <div class="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E5E0D8] rounded-full shadow-2xs">
            <span class="material-symbols-outlined text-[#A8452A] text-[18px]">thermostat</span>
            <span class="text-xs font-bold text-[#231a10]">{{ cuacaReal ? Math.round(cuacaReal.suhu) + '°C' : '24°C' }}</span>
            <span class="text-[#E5E0D8]">•</span>
            <span class="material-symbols-outlined text-[#3A4A2E] text-[18px]">water_drop</span>
            <span class="text-xs font-bold text-[#231a10]">{{ cuacaReal ? Math.round(cuacaReal.kelembaban) + '%' : '78%' }}</span>
            <span class="text-[#E5E0D8]">•</span>
            <span class="text-[11px] font-semibold text-[#7E7063]">Lereng Merapi</span>
          </div>

          <div class="w-8 h-8 rounded-full bg-[#243319] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <span class="material-symbols-outlined text-[18px]">{{ isAdmin ? 'admin_panel_settings' : 'person' }}</span>
          </div>
        </div>
      </header>

      <!-- Main Container -->
      <main class="flex-1 pt-4 md:pt-20 pb-12 px-4 md:px-6 lg:px-8 max-w-[1300px] mx-auto w-full flex flex-col gap-6">

        <!-- 1. Commodity Price Live Ticker Banner -->
        <div class="bg-white border border-[#E5E0D8] rounded-2xl p-3 shadow-2xs overflow-hidden flex items-center gap-3">
          <div class="flex items-center gap-1.5 px-3 py-1 bg-[#243319] text-[#D5E9C3] rounded-xl text-xs font-bold shrink-0">
            <span class="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Pasar Yogyakarta</span>
          </div>
          <div class="flex items-center gap-6 overflow-x-auto no-scrollbar py-1 text-xs">
            <div v-for="t in tickerItems" :key="t.name" class="flex items-center gap-2 shrink-0">
              <span class="font-medium text-[#7E7063]">{{ t.name }}:</span>
              <span class="font-bold text-[#231a10]">{{ t.price }}</span>
              <span
                class="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded"
                :class="t.direction === 'up' ? 'bg-[#EBF2E5] text-[#243319]' : t.direction === 'down' ? 'bg-rose-100 text-[#C84C32]' : 'bg-[#F9F7F4] text-[#7E7063]'"
              >
                {{ t.change }}
              </span>
            </div>
          </div>
        </div>

        <!-- 2. Page Title Header & Search Bar -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div class="flex flex-col gap-1 max-w-2xl">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#A8452A] animate-pulse"></span>
              <span class="text-[11px] text-[#7E7063] uppercase tracking-widest font-bold">Agro-Intelijen Presisi</span>
            </div>
            <h1 class="font-display text-2xl md:text-3xl font-bold text-[#231a10] tracking-tight">Warta &amp; Kabar Tani</h1>
            <p class="text-xs md:text-sm text-[#7E7063] leading-relaxed">
              Agregasi berita komoditas pasar, rekomendasi mikroklimat tanah vulkanik, dan peringatan dini pertanian Cangkringan.
            </p>
          </div>

          <!-- Search Input -->
          <div class="relative w-full md:w-72 shrink-0">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#7E7063]">search</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari warta cabai, tanah, BMKG..."
              class="w-full bg-white border border-[#E5E0D8] text-[#231a10] placeholder:text-[#7E7063] text-xs rounded-xl pl-9 pr-4 py-2.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#243319]/20 transition-all"
            />
          </div>
        </div>

        <!-- 3. Category Filter Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-[#E5E0D8]/70">
          <button
            v-for="cat in ['all', 'pasar', 'lahan', 'cuaca', 'hama', 'prediksi']"
            :key="cat"
            @click="setFilter(cat as typeof activeFilter)"
            class="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            :class="activeFilter === cat
              ? 'bg-[#243319] text-[#D5E9C3] shadow-sm'
              : 'bg-white text-[#5C4A32] hover:bg-[#F2EBDC] border border-[#E5E0D8]'"
          >
            <span class="material-symbols-outlined text-[16px]">{{ getCategoryIcon(cat) }}</span>
            <span>{{ cat === 'all' ? 'Semua Warta' : getCategoryLabel(cat) }}</span>
            <span class="text-[10px] opacity-80">({{ categoryCounts[cat] || 0 }})</span>
          </button>
        </div>

        <!-- 4. Featured News Banner Card -->
        <article v-if="feed?.featured && activeFilter === 'all' && !searchQuery" class="bg-gradient-to-br from-[#FFF8F4] via-[#F5EEE4] to-[#EAE0D2] rounded-2xl p-6 md:p-8 border border-[#E5E0D8] shadow-sm relative overflow-hidden">
          <div class="relative z-10 flex flex-col gap-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A8452A] text-white text-[11px] font-bold tracking-wider uppercase shadow-2xs">
                <span class="material-symbols-outlined text-[14px]">bolt</span>
                Warta Utama · Agro-Intelijen Cangkringan
              </span>
              <span class="text-xs font-medium text-[#7E7063] flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">schedule</span>
                {{ formatTime(feed.featured.timestamp) }}
              </span>
            </div>

            <div class="flex flex-col gap-2">
              <h2 class="font-display text-xl md:text-2xl font-bold text-[#231a10] leading-snug">
                {{ feed.featured.title }}
              </h2>
              <p class="text-xs md:text-sm text-[#5C4A32] leading-relaxed max-w-4xl">
                {{ feed.featured.summary }}
              </p>
            </div>

            <!-- Metrics Highlight Bar -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div v-for="(val, key) in feed.featured.metrics" :key="key" class="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-[#E5E0D8]/60 flex flex-col">
                <span class="text-[11px] font-semibold text-[#7E7063]">{{ key }}</span>
                <span class="text-sm font-bold text-[#231a10] mt-0.5">{{ val }}</span>
              </div>
            </div>

            <div class="pt-2 flex items-center">
              <router-link
                :to="feed.featured.cta_url || '/prediksi-pasar'"
                class="inline-flex items-center gap-2 bg-[#243319] hover:bg-[#3a4a2e] text-[#D5E9C3] px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs group"
              >
                <span>Lihat Analisis Prediksi Pasar</span>
                <span class="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-1">arrow_forward</span>
              </router-link>
            </div>
          </div>
        </article>

        <!-- Loading State -->
        <div v-if="isLoading" class="bg-white rounded-2xl p-12 border border-[#E5E0D8] text-center flex flex-col items-center gap-3">
          <span class="material-symbols-outlined text-3xl animate-spin text-[#243319]">sync</span>
          <span class="text-xs text-[#7E7063]">Memuat warta pertanian Cangkringan...</span>
        </div>

        <!-- 5. News Grid Cards -->
        <div v-else-if="filteredItems.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <article
            v-for="item in filteredItems"
            :key="item.id"
            class="bg-white rounded-2xl p-5 md:p-6 border border-[#E5E0D8] shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div class="flex flex-col gap-3">
              <!-- Card Header Badge -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 text-xs font-bold text-[#7E7063]">
                  <span class="material-symbols-outlined text-[18px] text-[#243319]">{{ getCategoryIcon(item.category) }}</span>
                  <span>{{ getCategoryLabel(item.category) }}</span>
                  <span class="text-[#E5E0D8]">•</span>
                  <span class="text-[11px] font-normal text-[#7E7063]">{{ formatTime(item.timestamp) }}</span>
                </div>
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  :class="item.severity === 'danger' ? 'bg-rose-100 text-[#C84C32]' : item.severity === 'warning' ? 'bg-amber-100 text-[#92400E]' : 'bg-[#EBF2E5] text-[#243319]'"
                >
                  {{ item.severity === 'danger' ? 'Perlu Aksi' : item.severity === 'warning' ? 'Perhatian' : 'Informasi' }}
                </span>
              </div>

              <!-- Title & Summary -->
              <div class="flex flex-col gap-1.5">
                <h3 class="font-display text-base md:text-lg font-bold text-[#231a10] group-hover:text-[#A8452A] transition-colors leading-snug">
                  {{ item.title }}
                </h3>
                <p class="text-xs md:text-sm text-[#5C4A32] leading-relaxed">
                  {{ item.summary }}
                </p>
              </div>
            </div>

            <!-- Card Footer & Metrics -->
            <div class="pt-3 border-t border-[#E5E0D8]/60 flex flex-col gap-3">
              <div v-if="item.metrics && Object.keys(item.metrics).length" class="flex flex-wrap items-center gap-2">
                <span v-for="(val, key) in item.metrics" :key="key" class="bg-[#FFF8F4] border border-[#E5E0D8] px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#231a10]">
                  <strong class="text-[#7E7063]">{{ key }}:</strong> {{ val }}
                </span>
              </div>

              <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] text-[#7E7063] font-medium">Sumber: {{ item.source || 'Tanacakra Core' }}</span>
                <router-link
                  :to="item.cta_url || '/prediksi-pasar'"
                  class="inline-flex items-center gap-1 text-xs font-bold text-[#243319] hover:text-[#A8452A] transition-colors"
                >
                  <span>Lihat Rincian</span>
                  <span class="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                </router-link>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty State -->
        <div v-else-if="!isLoading && filteredItems.length === 0" class="bg-white rounded-2xl p-12 border border-[#E5E0D8] text-center flex flex-col items-center gap-3">
          <span class="material-symbols-outlined text-4xl text-[#7E7063]/50">newspaper</span>
          <span class="text-sm font-bold text-[#231a10]">Tidak ada warta ditemukan</span>
          <p class="text-xs text-[#7E7063]">Coba ganti kata kunci pencarian atau pilih kategori warta lainnya.</p>
        </div>

        <!-- 6. Bottom Call to Action Card -->
        <div class="bg-white rounded-2xl p-6 md:p-8 border border-[#E5E0D8] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-[#243319] text-[#D5E9C3] flex items-center justify-center shrink-0 mt-0.5">
              <span class="material-symbols-outlined text-[22px]">analytics</span>
            </div>
            <div class="flex flex-col gap-1">
              <h3 class="font-display text-base md:text-lg font-bold text-[#231a10]">Ingin rekomendasi tanam sesuai sensor lahan Anda?</h3>
              <p class="text-xs md:text-sm text-[#7E7063]">
                Model Random Forest Scikit-learn menganalisis kondisi tanah mikro lereng Merapi secara presisi.
              </p>
            </div>
          </div>
          <div class="shrink-0">
            <router-link
              :to="isAdmin ? '/admin' : '/prediksi-pasar'"
              class="inline-flex items-center gap-2 bg-[#3A4A2E] hover:bg-[#243319] text-[#D5E9C3] px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <span>{{ isAdmin ? 'Kembali ke Dasbor Admin' : 'Buka Panel Prediksi' }}</span>
              <span class="material-symbols-outlined text-[18px]">dashboard</span>
            </router-link>
          </div>
        </div>

      </main>

    </div>

    <!-- Role-Based Bottom Navigation for Mobile -->
    <AdminBottomNav v-if="isAdmin" />
    <BottomNav v-else />

    <!-- MODAL BUAT WARTA & BROADCAST AI -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div class="relative w-full max-w-2xl bg-white rounded-2xl border border-[#E5E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 bg-[#FFF8F4] border-b border-[#E5E0D8] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#A8452A] text-[22px]">campaign</span>
            <div>
              <h3 class="font-headline-md text-base font-bold text-[#231a10]">Buat Warta &amp; Broadcast Agro-Intelijen</h3>
              <p class="text-[11px] text-[#7E7063]">Publikasikan pengumuman atau gunakan generator rekomendasi AI.</p>
            </div>
          </div>
          <button @click="isCreateModalOpen = false" class="p-1 rounded-full text-[#7E7063] hover:bg-[#E5E0D8]/60 transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-4 text-xs">
          <!-- AI Prompt Generator Bar -->
          <div class="bg-[#FFF8F4] border border-[#E2D8C7] rounded-xl p-3.5 space-y-2">
            <label class="block font-bold text-[#243319] text-[11px] uppercase tracking-wider">
              ✨ Auto-Generate Draf Warta dengan AI
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="aiPrompt"
                type="text"
                placeholder="Ketik topik (misal: 'hama thrips', 'hujan asam merapi', 'harga cabai naik')..."
                class="flex-1 px-3 py-2 bg-white border border-[#E2D8C7] rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A8452A]"
              />
              <button
                type="button"
                @click="generateWithAi"
                class="px-4 py-2 bg-[#243319] hover:bg-[#3A4A2E] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
              >
                <span class="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>Generate Draf AI</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-[#231a10] mb-1">Kategori Warta</label>
              <select v-model="newCategory" class="w-full p-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-semibold">
                <option value="hama">Hama &amp; Penyakit</option>
                <option value="cuaca">Cuaca Presisi</option>
                <option value="pasar">Harga Pasar</option>
                <option value="lahan">Kondisi Lahan</option>
                <option value="prediksi">Prediksi AI</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-[#231a10] mb-1">Tingkat Urgensi</label>
              <select v-model="newSeverity" class="w-full p-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-semibold">
                <option value="info">Informasi (Hijau)</option>
                <option value="warning">Perhatian (Kuning)</option>
                <option value="danger">Perlu Aksi (Merah)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-[#231a10] mb-1">Judul Warta</label>
            <input
              v-model="newTitle"
              type="text"
              placeholder="Judul warta atau peringatan..."
              class="w-full p-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-semibold outline-none focus:border-[#A8452A]"
            />
          </div>

          <div>
            <label class="block font-bold text-[#231a10] mb-1">Ringkasan Warta &amp; Rekomendasi Agronomi</label>
            <textarea
              v-model="newSummary"
              rows="4"
              placeholder="Deskripsi terperinci mengenai kondisi lapangan, rekomendasi pestisida/upaya drainase..."
              class="w-full p-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-medium outline-none focus:border-[#A8452A]"
            ></textarea>
          </div>

          <div>
            <label class="block font-bold text-[#231a10] mb-1">Sumber Pengirim / Instansi</label>
            <input
              v-model="newSource"
              type="text"
              placeholder="Misal: Console Admin Cangkringan / BMKG Kaliurang"
              class="w-full p-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-medium outline-none focus:border-[#A8452A]"
            />
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="px-6 py-3.5 bg-[#FFF8F4] border-t border-[#E5E0D8] flex items-center justify-end gap-3">
          <button
            @click="isCreateModalOpen = false"
            class="px-4 py-2 rounded-xl border border-[#E5E0D8] text-[#7E7063] font-bold text-xs hover:bg-[#E5E0D8]/40 transition-colors"
          >
            Batal
          </button>
          <button
            @click="publishWarta"
            class="px-5 py-2 rounded-xl bg-[#A8452A] hover:bg-[#923c24] text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[16px]">send</span>
            <span>Publikasikan Warta</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
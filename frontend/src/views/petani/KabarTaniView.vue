<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import PetaniSidebar from '@/components/petani/PetaniSidebar.vue'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import BottomNav from '@/components/petani/BottomNav.vue'
import AdminBottomNav from '@/components/admin/AdminBottomNav.vue'
import UserDropdown from '@/components/common/UserDropdown.vue'
import { KabarTaniService, type KabarTaniFeedResponse, generateAiWartaArticleAsync } from '@/services/kabarTani'
import { fetchCuacaCangkringan, type CuacaInfo } from '@/services/weather'

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

const isGenerating = ref(false)

const generateWithAi = async () => {
  if (isGenerating.value) return
  isGenerating.value = true
  try {
    const generated = await generateAiWartaArticleAsync(aiPrompt.value || 'peringatan hama dan cuaca')
    newTitle.value = generated.title
    newSummary.value = generated.summary
    newCategory.value = generated.category as 'pasar' | 'lahan' | 'cuaca' | 'hama' | 'prediksi'
    newSeverity.value = generated.severity as 'info' | 'warning' | 'danger'
    newSource.value = generated.source
  } finally {
    isGenerating.value = false
  }
}

const editItemId = ref<string | null>(null)

const publishWarta = () => {
  if (!newTitle.value.trim() || !newSummary.value.trim()) return

  if (editItemId.value) {
    KabarTaniService.updateCustomWarta(editItemId.value, {
      title: newTitle.value,
      summary: newSummary.value,
      category: newCategory.value,
      severity: newSeverity.value,
      source: newSource.value || 'Console Admin Cangkringan'
    })
  } else {
    KabarTaniService.addCustomWarta({
      title: newTitle.value,
      summary: newSummary.value,
      category: newCategory.value,
      severity: newSeverity.value,
      source: newSource.value || 'Console Admin Cangkringan',
      metrics: { 'Waktu Terbit': 'Baru Saja', 'Status': 'Dipublikasikan' },
      cta_url: '/kabar-tani'
    })
  }

  isCreateModalOpen.value = false
  newTitle.value = ''
  newSummary.value = ''
  aiPrompt.value = ''
  editItemId.value = null
  loadData()
}

const openCreateModal = () => {
  editItemId.value = null
  newTitle.value = ''
  newSummary.value = ''
  aiPrompt.value = ''
  isCreateModalOpen.value = true
}

const editWarta = (item: any) => {
  editItemId.value = item.id
  newTitle.value = item.title
  newSummary.value = item.summary
  newCategory.value = item.category as 'pasar' | 'lahan' | 'cuaca' | 'hama' | 'prediksi'
  newSeverity.value = item.severity as 'info' | 'warning' | 'danger'
  newSource.value = item.source || 'Console Admin Cangkringan'
  isCreateModalOpen.value = true
}

const deleteWarta = (id: string) => {
  if (confirm('Yakin ingin menghapus warta ini?')) {
    KabarTaniService.deleteCustomWarta(id)
    loadData()
  }
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
  const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  return isToday ? `${dateStr} (Hari ini) · ${timeStr} WIB` : `${dateStr} · ${timeStr} WIB`
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
        <button
          v-if="isAdmin"
          @click="openCreateModal"
          class="flex items-center gap-1 px-2.5 py-1.5 bg-[#243319] hover:bg-[#3A4A2E] text-[#D5E9C3] rounded-lg text-[10px] font-bold shadow-sm transition-all border border-[#4A5B3A]"
        >
          <span class="material-symbols-outlined text-[14px]">auto_awesome</span>
          <span>AI Warta</span>
        </button>
        <UserDropdown />
      </div>
    </header>

    <!-- Role-Based Navigation Sidebar -->
    <AdminSidebar v-if="isAdmin" />
    <PetaniSidebar v-else />

    <!-- Main Content -->
    <div class="flex-1 md:ml-[240px] flex flex-col min-w-0">

      <!-- Desktop Header Bar -->
      <header class="hidden md:flex fixed top-0 left-[240px] right-0 h-16 bg-[#FFF8F4]/90 backdrop-blur-xl border-b border-[#E5E0D8] z-20 items-center justify-between px-4 lg:px-8 gap-4">
        <nav class="flex items-center gap-2 text-xs font-semibold text-[#7E7063] truncate min-w-0 shrink">
          <router-link :to="isAdmin ? '/admin' : '/petani'" class="hover:text-[#243319] transition-colors shrink-0">Tanacakra</router-link>
          <span class="text-[#E5E0D8] shrink-0 hidden lg:inline">•</span>
          <router-link :to="isAdmin ? '/admin' : '/petani'" class="hover:text-[#243319] transition-colors shrink-0 hidden lg:inline">
            {{ isAdmin ? 'Konsol Admin' : 'Beranda Tani' }}
          </router-link>
          <span class="text-[#E5E0D8] shrink-0">•</span>
          <span class="text-[#231a10] truncate">Warta &amp; Pasar Cangkringan</span>
        </nav>

        <div class="flex items-center gap-2 lg:gap-3 shrink-0 md:pr-14">
          <button
            v-if="isAdmin"
            @click="openCreateModal"
            class="inline-flex items-center gap-1.5 px-3 lg:px-3.5 py-1.5 rounded-full bg-[#243319] hover:bg-[#3A4A2E] text-[#D5E9C3] text-xs font-bold transition-all shadow-sm cursor-pointer border border-[#4A5B3A]"
          >
            <span class="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span class="hidden lg:inline">Buat Warta AI (NVIDIA)</span>
            <span class="lg:hidden">AI Warta</span>
          </button>

          <UserDropdown class="ml-1" />
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
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
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
                <span>{{ feed.featured.category === 'pasar' || feed.featured.category === 'prediksi' ? 'Lihat Analisis Prediksi Pasar' : (feed.featured.category === 'hama' ? 'Lihat Panduan Mitigasi Hama' : 'Baca Artikel Selengkapnya') }}</span>
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

              <div class="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-3">
                <span class="text-[11px] text-[#7E7063] font-medium">Sumber: {{ item.source || 'Tanacakra Core' }}</span>
                <div class="flex items-center gap-2 self-end sm:self-auto">
                  <div v-if="isAdmin && item.id.startsWith('warta-custom-')" class="flex items-center gap-2 border-r border-[#E5E0D8] pr-2 mr-1">
                    <button @click="editWarta(item)" class="text-[10px] font-bold text-[#7E7063] hover:text-[#243319] transition-colors" title="Edit Warta">Edit</button>
                    <button @click="deleteWarta(item.id)" class="text-[10px] font-bold text-[#C84C32] hover:text-[#93000a] transition-colors" title="Hapus Warta">Hapus</button>
                  </div>
                  <router-link
                    :to="item.cta_url || '/prediksi-pasar'"
                    class="inline-flex items-center gap-1 text-xs font-bold text-[#243319] hover:text-[#A8452A] transition-colors"
                  >
                    <span>Lihat Rincian</span>
                    <span class="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                  </router-link>
                </div>
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
              <h3 class="font-display text-base md:text-lg font-bold text-[#231a10]">Ingin rekomendasi tanam sesuai kondisi lahan Anda?</h3>
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
    <!-- Mobile: bottom sheet | Desktop: centered dialog -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isCreateModalOpen" class="fixed inset-0 z-[70] flex flex-col justify-end md:justify-center md:items-center md:p-4 bg-black/50 backdrop-blur-sm" @click.self="isCreateModalOpen = false">
          <div class="sheet-panel relative w-full md:max-w-2xl bg-white md:rounded-2xl rounded-t-3xl border border-[#E5E0D8] shadow-2xl flex flex-col max-h-[92dvh] md:max-h-[88vh]">

            <!-- Drag handle (mobile only) -->
            <div class="md:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div class="w-10 h-1 rounded-full bg-[#E2D8C7]"></div>
            </div>

            <!-- Header -->
            <div class="px-5 py-3.5 bg-[#FFF8F4] border-b border-[#E5E0D8] flex items-center justify-between shrink-0 md:rounded-t-2xl">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="material-symbols-outlined text-[#A8452A] text-[22px] shrink-0">campaign</span>
                <div class="min-w-0">
                  <h3 class="font-bold text-[#231a10] leading-snug">
                    <span class="md:hidden text-sm">{{ editItemId ? 'Edit Warta' : 'Buat Warta AI' }}</span>
                    <span class="hidden md:inline text-base">{{ editItemId ? 'Edit Warta Tani' : 'Buat Warta &amp; Broadcast Agro-Intelijen' }}</span>
                  </h3>
                  <p class="text-[11px] text-[#7E7063] truncate">Publikasikan pengumuman atau gunakan generator AI.</p>
                </div>
              </div>
              <button @click="isCreateModalOpen = false" class="ml-2 shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[#7E7063] hover:bg-[#E5E0D8]/70 transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <!-- Body (scrollable) -->
            <div class="px-5 py-4 overflow-y-auto space-y-4 text-xs flex-1">

              <!-- AI Prompt Generator Bar -->
              <div class="bg-[#FFF8F4] border border-[#E2D8C7] rounded-xl p-3.5 space-y-2.5">
                <label class="block font-bold text-[#243319] text-[11px] uppercase tracking-wider">
                  ✨ Auto-Generate Draf Warta dengan AI
                </label>
                <!-- Stack vertically on mobile, row on md+ -->
                <div class="flex flex-col md:flex-row items-stretch gap-2">
                  <input
                    v-model="aiPrompt"
                    type="text"
                    placeholder="Ketik topik (misal: 'hama thrips', 'harga cabai naik')..."
                    class="flex-1 px-3 py-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A8452A]"
                  />
                  <button
                    type="button"
                    @click="generateWithAi"
                    :disabled="isGenerating"
                    class="w-full md:w-auto px-4 py-2.5 bg-[#243319] hover:bg-[#3A4A2E] disabled:bg-[#7E7063] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <span v-if="!isGenerating" class="material-symbols-outlined text-[16px]">auto_awesome</span>
                    <span v-else class="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    <span>{{ isGenerating ? 'AI Sedang Menulis...' : 'Generate Draf AI' }}</span>
                  </button>
                </div>
              </div>

              <!-- Kategori + Urgensi: 2 col on md, 1 col on mobile -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-[#231a10] mb-1.5">Kategori Warta</label>
                  <select v-model="newCategory" class="w-full px-3 py-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#A8452A] appearance-none">
                    <option value="hama">Hama &amp; Penyakit</option>
                    <option value="cuaca">Cuaca Presisi</option>
                    <option value="pasar">Harga Pasar</option>
                    <option value="lahan">Kondisi Lahan</option>
                    <option value="prediksi">Prediksi AI</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-[#231a10] mb-1.5">Tingkat Urgensi</label>
                  <select v-model="newSeverity" class="w-full px-3 py-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#A8452A] appearance-none">
                    <option value="info">Informasi (Hijau)</option>
                    <option value="warning">Perhatian (Kuning)</option>
                    <option value="danger">Perlu Aksi (Merah)</option>
                  </select>
                </div>
              </div>

              <!-- Judul -->
              <div>
                <label class="block font-bold text-[#231a10] mb-1.5">Judul Warta</label>
                <input
                  v-model="newTitle"
                  type="text"
                  placeholder="Judul warta atau peringatan..."
                  class="w-full px-3 py-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-semibold outline-none focus:border-[#A8452A]"
                />
              </div>

              <!-- Ringkasan -->
              <div>
                <label class="block font-bold text-[#231a10] mb-1.5">Ringkasan &amp; Rekomendasi Agronomi</label>
                <textarea
                  v-model="newSummary"
                  rows="4"
                  placeholder="Deskripsi kondisi lapangan, rekomendasi pestisida/drainase..."
                  class="w-full px-3 py-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-medium outline-none focus:border-[#A8452A] resize-none"
                ></textarea>
              </div>

              <!-- Sumber -->
              <div>
                <label class="block font-bold text-[#231a10] mb-1.5">Sumber Pengirim / Instansi</label>
                <input
                  v-model="newSource"
                  type="text"
                  placeholder="Misal: Console Admin Cangkringan / BMKG Kaliurang"
                  class="w-full px-3 py-2.5 bg-white border border-[#E2D8C7] rounded-lg text-xs font-medium outline-none focus:border-[#A8452A]"
                />
              </div>
            </div>

            <!-- Footer Actions: stacked on mobile, row on md+ -->
            <div class="px-5 py-4 bg-[#FFF8F4] border-t border-[#E5E0D8] flex flex-col-reverse md:flex-row md:justify-end gap-2.5 shrink-0 md:rounded-b-2xl">
              <button
                @click="isCreateModalOpen = false"
                class="w-full md:w-auto px-5 py-2.5 rounded-xl border border-[#E5E0D8] text-[#7E7063] font-bold text-xs hover:bg-[#E5E0D8]/40 transition-colors text-center"
              >
                Batal
              </button>
              <button
                @click="publishWarta"
                class="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#A8452A] hover:bg-[#923c24] text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-[18px]">send</span>
                <span>{{ editItemId ? 'Simpan Perubahan' : 'Publikasikan Warta' }}</span>
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* Bottom-sheet slide-up (mobile) + fade-scale (desktop) */
.modal-enter-active { transition: opacity 0.25s ease; }
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.modal-enter-active .sheet-panel { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.modal-leave-active .sheet-panel  { transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1); }
.modal-enter-from .sheet-panel, .modal-leave-to .sheet-panel { transform: translateY(100%); }

@media (min-width: 768px) {
  .modal-enter-from .sheet-panel, .modal-leave-to .sheet-panel { transform: scale(0.95); }
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

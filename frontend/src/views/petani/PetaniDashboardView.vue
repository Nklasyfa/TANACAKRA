<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PetaniSidebar from '@/components/petani/PetaniSidebar.vue'
import BottomNav from '@/components/petani/BottomNav.vue'
import { useRouter } from 'vue-router'
import { LahanService, AdminService } from '@/services/api'
import { fetchCuacaCangkringan, type CuacaInfo } from '@/services/weather'
import { KabarTaniService, type KabarTaniItem } from '@/services/kabarTani'
import NotificationModal from '@/components/common/NotificationModal.vue'
import { unreadCount } from '@/services/notifications'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const router = useRouter()
const isNotifOpen = ref(false)
const map = ref<any>(null)
const markersGroup = ref<any>(null)
const lahanList = ref<any[]>([])
const dashboardData = ref<any>(null)
const cuacaReal = ref<CuacaInfo | null>(null)
const cuacaLoading = ref(true)

const kabarTaniItems = ref<KabarTaniItem[]>([])
const kabarTaniLoading = ref(true)

const loadKabarTani = async () => {
  try {
    const items = await KabarTaniService.getItems('all', 3)
    kabarTaniItems.value = items
  } catch (e) {
    console.warn('Failed to load kabar tani:', e)
  } finally {
    kabarTaniLoading.value = false
  }
}

const initMap = () => {
  if (map.value) return
  const container = document.getElementById('mapPetaniLeaflet')
  if (!container) return

  map.value = L.map('mapPetaniLeaflet', {
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
      const bgColor = ratio >= 0.75 ? '#6FA05C' : ratio >= 0.4 ? '#D98E26' : '#B23A24'

      return L.divIcon({
        html: `<div style="background-color: ${bgColor}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 13px; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${total}</div>`,
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

    const markerColor = isSehat ? '#6FA05C' : '#D98E26'
    const marker = L.circleMarker([lat, lng], {
      radius: 7,
      fillColor: markerColor,
      color: '#FFFFFF',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
      status: isSehat ? 'sehat' : 'atensi'
    } as any)

    const popupContent = `
      <div style="font-family: sans-serif; padding: 2px; min-width: 180px;">
        <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
          <span>Petak ${farmId}</span>
          <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; color: white; background-color: ${isSehat ? '#6FA05C' : '#D98E26'};">
            ${isSehat ? 'Subur' : 'Perlu Perhatian'}
          </span>
        </div>
        <div style="font-size: 12px; color: #555; line-height: 1.5;">
          <strong>Desa:</strong> ${desa}<br/>
          <strong>pH Tanah:</strong> ${ph} (${isSehat ? 'Ideal' : 'Kurang Ideal'})<br/>
          <strong>Jenis Tanah:</strong> ${soilType}<br/>
          <strong>Luas Lahan:</strong> ${areaHa} Ha
        </div>
        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #eee; font-size: 11px; color: #777;">
          ${isSehat ? 'Tanah subur, cocok untuk ditanami.' : 'Tanah agak kering, coba tambah pupuk atau air.'}
        </div>
      </div>
    `
    marker.bindPopup(popupContent)
    markersGroup.value.addLayer(marker)
  })
}

const loadPetaniData = async () => {
  initMap()

  const [lahans, trends] = await Promise.all([
    LahanService.getAllLahan(),
    AdminService.getDashboardTrends()
  ])

  lahanList.value = lahans || []
  if (trends) {
    dashboardData.value = trends
  }

  renderMarkers(lahanList.value)
}

const reloadCuaca = async () => {
  cuacaLoading.value = true
  try {
    const c = await fetchCuacaCangkringan()
    if (c) cuacaReal.value = c
  } catch {
    /* ignore */
  } finally {
    cuacaLoading.value = false
  }
}

onMounted(() => {
  setTimeout(() => {
    loadPetaniData()
  }, 50)
  reloadCuaca()
  loadKabarTani()
})

const userName = ref('Pak Supardi')
;(() => {
  try {
    const raw = localStorage.getItem('tanacakra_user')
    if (raw) {
      const u = JSON.parse(raw)
      if (u && u.username) userName.value = u.username
    }
  } catch {
    /* ignore */
  }
})()

const greetingLabel = computed(() => {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
})

const todayLabel = computed(() =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
)

const formatDate = (isoStr?: string) => {
  if (!isoStr) return 'Terbaru'
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return 'Terbaru'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatKabarTime = (iso: string) => {
  if (!iso) return 'Terbaru'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Terbaru'
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return `Hari ini, ${timeStr} WIB`
  if (isYesterday) return `Kemarin, ${timeStr} WIB`
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${timeStr} WIB`
}

const todaySummary = computed(() => {
  const trends = (dashboardData.value?.price_trends || []) as Record<string, any>[]
  const best = dashboardData.value?.best_commodity
  let commodityLabel = best?.title?.split('&')[0]?.trim() || 'Cabai Merah'
  let direction = 'stabil'
  if (trends.length >= 2) {
    const keys = Object.keys(trends[0]).filter(k => k !== 'month')
    if (keys.length) {
      const key = keys.find(k => k.toLowerCase().includes(commodityLabel.toLowerCase())) || keys[0]
      const values = trends
        .map((t) => parseFloat(t[key]))
        .filter((v) => !isNaN(v) && v > 0)
      if (values.length >= 2) {
        const first = values[0]
        const last = values[values.length - 1]
        direction = last > first ? 'naik' : last < first ? 'turun' : 'stabil'
      }
      commodityLabel = key
    }
  }
  const moistureRaw = dashboardData.value?.avg_moisture
  const moistureNum = parseInt(String(moistureRaw).replace('%', ''))
  const kondisi = isNaN(moistureNum) ? 'lembab' : moistureNum < 40 ? 'kering' : moistureNum <= 62 ? 'lembab' : 'basah'
  const ph = dashboardData.value?.avg_ph
  return { commodityLabel, direction, kondisi, ph }
})

const lahanStatus = computed(() => {
  const phNum = parseFloat(dashboardData.value?.avg_ph)
  if (!isNaN(phNum) && phNum >= 6.0) {
    return {
      label: 'Subur',
      message: 'Tanah Anda dalam kondisi subur. Cocok untuk menanam cabai atau sayuran.',
      color: 'text-[#3A4A2E]',
      bg: 'bg-[#EBF2E5] border-[#3A4A2E]/20'
    }
  }
  return {
    label: 'Perlu Perhatian',
    message: 'Tanah Anda sedikit asam. Disarankan menambah dolomit sebelum tanam.',
    color: 'text-[#92400E]',
    bg: 'bg-[#FBF0DB] border-[#D97706]/25'
  }
})

const cuacaHariIni = computed(() => {
  const kondisi = todaySummary.value.kondisi
  if (kondisi === 'kering') {
    return { emoji: '☀️', label: 'Cerah & Kering', message: 'Tanah agak kering. Tambah air jika perlu.' }
  }
  if (kondisi === 'basah') {
    return { emoji: '🌧️', label: 'Hujan / Basah', message: 'Tanah basah. Jaga saluran air agar tidak tergenang.' }
  }
  return { emoji: '🌤️', label: 'Lembab', message: 'Cuaca lembab, kondisi yang baik untuk bercocok tanam.' }
})

const cuacaDisplay = computed(() => cuacaReal.value || cuacaHariIni.value)

const lokasiPendek = computed(() => {
  if (!cuacaReal.value) return 'Cangkringan'
  const parts = cuacaReal.value.lokasi.split(',')
  return parts[0]?.trim() || 'Cangkringan'
})

const catatanList = computed(() => {
  const items = (lahanList.value || []).slice(0, 3)
  if (!items.length) {
    return []
  }
  return items.map((it: any) => {
    const p = it.input_parameters || it
    const ph = parseFloat(p.soil_ph || 6.5)
    const ok = ph >= 6.0
    return {
      icon: ok ? 'grass' : 'water_drop',
      tone: ok ? 'positive' : 'warn',
      title: `${p.farm_id || 'CGK'} • ${p.desa || 'Cangkringan'}`,
      date: formatDate(it.created_at),
      label: ok ? 'Subur / Kelembapan Optimal' : 'Tanah Perlu Irigasi'
    }
  })
})
</script>

<template>
  <div class="min-h-screen bg-surface antialiased text-on-surface flex flex-col md:flex-row pb-[88px] md:pb-0 font-sans">

    <header class="md:hidden fixed top-0 left-0 right-0 z-30 pt-safe bg-surface/85 backdrop-blur-xl border-b border-[#F0EDE6]">
      <div class="h-14 px-4 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-8 w-auto object-contain shrink-0" />
          <div class="flex flex-col leading-none min-w-0">
            <span class="font-display text-[15px] text-primary tracking-tight leading-none">Tanacakra</span>
            <span class="text-[11px] text-on-surface-variant mt-0.5 truncate">Beranda</span>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button @click="isNotifOpen = true" class="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer" aria-label="Pemberitahuan">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
            <span v-if="unreadCount > 0" class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#A8452A]"></span>
          </button>
        </div>
      </div>
    </header>

    <NotificationModal :is-open="isNotifOpen" @close="isNotifOpen = false" />

    <PetaniSidebar />

    <main class="md:ml-[240px] flex-1 w-full px-4 md:px-8 lg:px-12 pt-[calc(env(safe-area-inset-top,0px)+68px)] md:pt-8">
      <div class="max-w-[720px] mx-auto flex flex-col gap-5 md:gap-6 pb-12">

        <!-- 1. Sapaan -->
        <header class="flex flex-col gap-1 pt-1 sm:pt-2">
          <h1 class="font-display text-xl sm:text-2xl md:text-[28px] leading-tight font-bold tracking-tight text-[#241F1B]">
            {{ greetingLabel }}, <span class="italic font-normal">{{ userName }}</span>
          </h1>
          <div class="flex items-center gap-1.5 text-on-surface-variant">
            <span class="material-symbols-outlined text-[14px] sm:text-[15px] text-secondary">calendar_today</span>
            <span class="text-xs sm:text-[13px] text-secondary">{{ todayLabel }} · Cangkringan, Sleman</span>
          </div>
        </header>

        <!-- 2. Strip Cuaca Hari Ini -->
        <section class="bg-white rounded-[16px] border border-[#E5E0D8] p-4 md:p-5 shadow-sm flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-[18px]">partly_cloudy_day</span>
              <span class="text-xs sm:text-[13px] font-medium text-secondary">Cuaca hari ini di Cangkringan</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] sm:text-[11px] text-secondary bg-surface-container px-2 py-0.5 rounded-full">
                {{ cuacaReal?.sumber || 'BMKG' }} · {{ cuacaReal?.lokasi || lokasiPendek }}
              </span>
              <button @click="reloadCuaca" class="text-secondary hover:text-[#241F1B] transition-colors p-0.5" title="Perbarui data cuaca" type="button">
                <span class="material-symbols-outlined text-[15px] align-middle">sync</span>
              </button>
            </div>
          </div>

          <div v-if="cuacaLoading" class="py-3 flex items-center gap-2 text-xs sm:text-[13px] text-secondary">
            <div class="h-2 w-20 rounded-full bg-surface-container overflow-hidden">
              <div class="h-full w-1/2 rounded-full bg-primary animate-pulse"></div>
            </div>
            Memuat prakiraan cuaca...
          </div>

          <template v-else>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-2 py-1">
              <div class="flex flex-col justify-between bg-surface-container-low md:bg-transparent rounded-lg p-2 md:p-0">
                <span class="text-[11px] text-secondary flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">thermostat</span> Suhu
                </span>
                <div class="mt-1 flex items-baseline gap-0.5">
                  <span class="text-lg sm:text-[24px] font-bold text-[#241F1B] tracking-tight leading-7 sm:leading-8">{{ cuacaReal ? Math.round(cuacaReal.suhu) : '—' }}</span>
                  <span class="text-[11px] text-secondary font-semibold">°C</span>
                </div>
              </div>
              <div class="flex flex-col justify-between bg-surface-container-low md:bg-transparent rounded-lg p-2 md:p-0">
                <span class="text-[11px] text-secondary flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">humidity_mid</span> Kelembapan
                </span>
                <div class="mt-1 flex items-baseline gap-0.5">
                  <span class="text-lg sm:text-[24px] font-bold text-[#241F1B] tracking-tight leading-7 sm:leading-8">{{ cuacaReal ? Math.round(cuacaReal.kelembaban) : '—' }}</span>
                  <span class="text-[11px] text-secondary font-semibold">%</span>
                </div>
              </div>
              <div class="flex flex-col justify-between bg-surface-container-low md:bg-transparent rounded-lg p-2 md:p-0">
                <span class="text-[11px] text-secondary flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">rainy</span> Curah Hujan
                </span>
                <div class="mt-1 flex items-baseline gap-0.5">
                  <span class="text-lg sm:text-[24px] font-bold text-[#241F1B] tracking-tight leading-7 sm:leading-8">{{ cuacaReal ? cuacaReal.curahHujanMm : '—' }}</span>
                  <span class="text-[11px] text-secondary font-semibold">mm</span>
                </div>
              </div>
              <div class="flex flex-col justify-between bg-surface-container-low md:bg-transparent rounded-lg p-2 md:p-0">
                <span class="text-[11px] text-secondary flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">filter_drama</span> Kondisi
                </span>
                <div class="mt-1 flex items-baseline gap-0.5">
                  <span class="text-lg sm:text-[24px] font-bold text-[#241F1B] tracking-tight leading-7 sm:leading-8">{{ cuacaDisplay.emoji }}</span>
                </div>
              </div>
              <div class="flex flex-col justify-between bg-surface-container-low md:bg-transparent rounded-lg p-2 md:p-0">
                <span class="text-[11px] text-secondary flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">air</span> Lokasi
                </span>
                <div class="mt-1 flex items-baseline gap-0.5 min-w-0">
                  <span class="text-base sm:text-[18px] md:text-[20px] font-bold text-[#241F1B] tracking-tight leading-7 sm:leading-8 truncate">{{ lokasiPendek }}</span>
                </div>
              </div>
            </div>
            <div class="pt-3 border-t border-[#F3ECE0] flex items-start gap-2">
              <span class="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">nature_people</span>
              <p class="text-xs sm:text-[13px] md:text-[15px] leading-relaxed text-[#4A3F35]">
                <span class="font-semibold text-[#3A4A2E]">{{ cuacaDisplay.label }}.</span> {{ cuacaDisplay.message }}
              </p>
            </div>
          </template>
        </section>

        <!-- 3. Kartu Kondisi Lahan -->
        <section class="bg-white rounded-[16px] border border-[#E5E0D8] p-5 md:p-6 shadow-sm flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-secondary">Kondisi lahan Anda hari ini</span>
            <span class="w-2.5 h-2.5 rounded-full bg-[#D97706] animate-pulse"></span>
          </div>
          <div class="flex items-start gap-3 mt-0.5">
            <span class="w-3 h-3 rounded-full bg-[#D97706] shrink-0 mt-1.5 ring-4 ring-[#D97706]/15"></span>
            <div class="min-w-0">
              <p class="text-base sm:text-[18px] md:text-[20px] font-bold text-[#241F1B] tracking-tight leading-snug sm:leading-7">
                <span :class="lahanStatus.color">{{ lahanStatus.label }}</span> &mdash; {{ lahanStatus.message }}
              </p>
              <p v-if="todaySummary.ph" class="text-xs sm:text-[13px] text-secondary mt-1.5 sm:mt-2">
                pH rata-rata: <strong class="text-[#241F1B]">{{ todaySummary.ph }}</strong> · Tanah: <strong class="text-[#241F1B]">{{ todaySummary.kondisi }}</strong>
              </p>
            </div>
          </div>
          <div class="pt-2 flex justify-end">
            <button @click="router.push('/riwayat')" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F9F7F4] text-[#231a10] border border-[#E5E0D8] font-semibold text-xs sm:text-[13px] px-4 py-2 rounded-lg hover:bg-[#F0EDE6] transition-colors">
              <span>Lihat detail lahan</span>
              <span class="material-symbols-outlined text-[16px] leading-none">arrow_forward</span>
            </button>
          </div>
        </section>

        <!-- 4. Tombol Aksi Utama -->
        <button @click="router.push('/input-lahan')" class="w-full h-[46px] sm:h-[52px] rounded-[12px] bg-cta hover:bg-cta-hover text-white flex items-center justify-center gap-2 text-sm sm:text-[16px] font-semibold shadow-[0_3px_12px_rgba(168,69,42,0.22)] transition-all hover:shadow-[0_5px_16px_rgba(168,69,42,0.3)] active:scale-[0.99]">
          <span class="material-symbols-outlined text-[18px] sm:text-[20px]">add_circle</span>
          <span>Catat Data Lahan</span>
        </button>

        <!-- 5. Peta Lahan -->
        <section class="bg-white rounded-[16px] border border-[#E5E0D8] p-4 md:p-5 shadow-sm">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#F3ECE0]">
            <div>
              <h3 class="text-sm sm:text-[15px] font-bold text-[#241F1B]">Peta Lahan Desa Cangkringan</h3>
              <p class="text-[11px] sm:text-[12px] text-secondary mt-0.5">{{ lahanList.length }} petak lahan terdaftar</p>
            </div>
          </div>

          <div id="mapPetaniLeaflet" class="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-[10px] overflow-hidden z-10"></div>

          <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-[#6FA05C] inline-block"></span> Hijau = tanah subur</span>
            <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-[#D98E26] inline-block"></span> Oranye = perlu perhatian</span>
            <span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-[#B23A24] inline-block"></span> Merah = perlu tindakan</span>
          </div>
          <p class="text-[13px] text-secondary mt-3 leading-relaxed">Ketuk titik di peta untuk melihat kondisi satu petak lahan.</p>
        </section>

        <!-- 6. Kabar Tani Hari Ini -->
        <section class="flex flex-col gap-3 pt-2">
          <div class="flex items-center justify-between px-0.5">
            <h2 class="font-display text-[22px] leading-7 font-bold text-[#241F1B]">Kabar Tani Hari Ini</h2>
            <router-link to="/kabar-tani" class="text-cta hover:text-cta-hover text-[14px] font-semibold inline-flex items-center gap-0.5 transition-colors">
              <span>Lihat semua</span>
              <span class="material-symbols-outlined text-[16px]">arrow_right_alt</span>
            </router-link>
          </div>
          <div class="bg-white rounded-[16px] border border-[#E5E0D8] shadow-sm overflow-hidden" v-if="kabarTaniLoading">
            <div class="p-4 space-y-3">
              <div v-for="i in 3" :key="i" class="h-16 bg-[#F9F7F4] rounded animate-pulse"></div>
            </div>
          </div>
          <div class="bg-white rounded-[16px] border border-[#E5E0D8] shadow-sm overflow-hidden" v-else>
            <article v-for="item in kabarTaniItems" :key="item.id" class="p-4 border-b border-[#E5E0D8] flex items-start justify-between gap-4 hover:bg-[#FFF8F4] transition-colors last:border-0">
              <div class="flex items-start gap-2.5 min-w-0">
                <span class="material-symbols-outlined text-[18px] shrink-0 mt-0.5" :class="item.severity === 'danger' ? 'text-error' : item.severity === 'warning' ? 'text-[#D97706]' : 'text-primary'">
                  {{ item.category === 'pasar' ? 'trending_up' : item.category === 'lahan' ? 'warning' : item.category === 'cuaca' ? 'cloud' : item.category === 'hama' ? 'bug_report' : 'psychology' }}
                </span>
                <p class="text-[15px] leading-6 text-[#241F1B] font-medium">{{ item.title }}</p>
              </div>
              <time class="text-[11px] text-secondary shrink-0 mt-1 font-mono">{{ formatKabarTime(item.timestamp) }}</time>
            </article>
            <div v-if="kabarTaniItems.length === 0" class="p-4 text-center text-secondary">
              Tidak ada berita terbaru saat ini
            </div>
          </div>
        </section>

        <!-- 7. Catatan Terakhir Anda -->
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between px-0.5">
            <h2 class="font-display text-[18px] leading-6 font-bold text-[#241F1B]">Catatan Terakhir Anda</h2>
            <span class="text-[11px] text-secondary">{{ catatanList.length }} Entri Terkini</span>
          </div>
          <div class="bg-white rounded-[16px] border border-[#E5E0D8] shadow-sm overflow-hidden">
            <template v-if="catatanList.length > 0">
              <template v-for="(note, i) in catatanList" :key="i">
                <router-link
                  to="/riwayat"
                  class="p-4 flex items-center justify-between hover:bg-[#F9F7F4] transition-colors"
                  :class="i < catatanList.length - 1 ? 'border-b border-[#E5E0D8]' : ''"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-[#EBF2E5] flex items-center justify-center shrink-0" :class="note.tone === 'warn' ? 'text-[#D97706]' : 'text-[#243319]'">
                      <span class="material-symbols-outlined text-[18px]">{{ note.icon }}</span>
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-[14px] font-semibold text-[#241F1B] truncate">{{ note.title }}</span>
                      <span class="text-[12px] text-[#7E7063] font-mono">{{ note.date }}</span>
                    </div>
                  </div>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium shrink-0 ml-2"
                    :class="note.tone === 'warn' ? 'bg-[#D97706]/15 text-[#92400E]' : 'bg-[#EBF2E5] text-[#243319]'"
                  >
                    {{ note.label }}
                  </span>
                </router-link>
              </template>
            </template>
            <div v-else class="p-5 text-center text-secondary text-sm">
              Belum ada catatan observasi lahan yang tersimpan.
            </div>
          </div>
        </section>

        <!-- 8. Saran Tanam ML (data live) -->
        <section v-if="dashboardData?.best_commodity" class="bg-[#FFFBF7] rounded-[16px] border border-[#E5E0D8] p-5 md:p-6 shadow-sm flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-[24px] text-[#243319] shrink-0">insights</span>
            <div class="flex flex-col gap-1">
              <p class="text-[15px] font-bold leading-[22px] text-[#231a10]">
                Saran tanam: {{ dashboardData.best_commodity.title.split('&').join('dan') }}
              </p>
              <p class="text-[13px] md:text-[15px] leading-[22px] text-[#4A3F35]">{{ dashboardData.best_commodity.reason }}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <span class="px-2.5 py-1 rounded-md border border-[#E5E0D8] bg-white text-xs font-bold text-[#243319]">Harga: {{ dashboardData.best_commodity.avg_price }}</span>
            <span class="px-2.5 py-1 rounded-md border border-[#E5E0D8] bg-white text-xs font-bold text-[#243319]">Hasil: {{ dashboardData.best_commodity.expected_yield }}</span>
          </div>
        </section>

        <!-- 9. Kartu Ajakan Dasbor -->
        <section class="bg-white rounded-[16px] border border-[#E5E0D8] p-5 md:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-lg bg-[#EBF2E5] flex items-center justify-center text-[#243319] shrink-0">
              <span class="material-symbols-outlined text-[20px]">insights</span>
            </div>
            <div>
              <p class="text-[15px] font-medium leading-relaxed text-[#231a10]">
                Ingin lihat prediksi lengkap hasil panen &amp; tren harga pasar komoditas?
              </p>
              <p class="text-[13px] text-[#7E7063] mt-1">Dihitung berbasis data agroklimat mikro lereng Merapi.</p>
            </div>
          </div>
          <button @click="router.push('/prediksi-pasar')" class="w-full sm:w-auto shrink-0 bg-[#F9F7F4] border border-[#E5E0D8] px-4 py-2 rounded-lg text-sm font-semibold text-[#231a10] hover:bg-[#F0EDE6] transition-all whitespace-nowrap">
            Buka Panel Dasbor
          </button>
        </section>

      </div>
    </main>

    <BottomNav />

  </div>
</template>

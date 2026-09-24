<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PetaniSidebar from '@/components/petani/PetaniSidebar.vue'
import BottomNav from '@/components/petani/BottomNav.vue'
import PlotlyChart from '@/components/shared/PlotlyChart.vue'
import { LahanService, AdminService, TindakanService, generatePlotlySchema } from '@/services/api'
import { fetchCuacaCangkringan, type CuacaInfo } from '@/services/weather'
import NotificationModal from '@/components/common/NotificationModal.vue'
import UserDropdown from '@/components/common/UserDropdown.vue'
import { unreadCount } from '@/services/notifications'

const router = useRouter()
const isNotifOpen = ref(false)

const isLoading = ref(true)
const lahanList = ref<any[]>([])
const dashboardData = ref<any>(null)
const cuacaReal = ref<CuacaInfo | null>(null)

const selectedFarm = ref('all')
const selectedCommodity = ref('')
const ALL_COMMODITIES = 'Semua Komoditas'
const chartViewMode = ref<'subplots' | 'dual'>('subplots')

const applying = ref(false)
const applied = ref(false)

const parseNum = (v: any, fallback: number) => {
  const n = parseFloat(v)
  return isNaN(n) ? fallback : n
}

const selectedCommodityKpis = computed(() => {
  const trends = (dashboardData.value?.price_trends || []) as Record<string, any>[]
  const volTrends = (dashboardData.value?.volume_trends || []) as Record<string, any>[]
  const total = trends.length

  if (!total) {
    const isSemua = !selectedCommodity.value || selectedCommodity.value === ALL_COMMODITIES || selectedCommodity.value === 'Semua'
    if (isSemua) {
      return {
        currentPrice: 34500,
        priceChangePct: '+3.2%',
        isPriceUp: true,
        projPrice: 38200,
        projPriceDiff: '+Rp 3.700',
        priceRange: 'Rp 35.000 - Rp 41.500',
        currentVol: 380,
        volChangePct: '+4.5%',
        isVolUp: true,
        projVol: 440,
        projVolDiff: '+60 Ton'
      }
    }
    const commodityDefaults: Record<string, { currentPrice: number; projPrice: number; currentVol: number; projVol: number }> = {
      'Cabai Merah': { currentPrice: 72400, projPrice: 84200, currentVol: 85, projVol: 98 },
      'Salak Pondoh': { currentPrice: 43500, projPrice: 59200, currentVol: 140, projVol: 165 },
      'Padi': { currentPrice: 6750, projPrice: 7200, currentVol: 190, projVol: 215 },
      'Jagung': { currentPrice: 6300, projPrice: 6800, currentVol: 110, projVol: 128 },
      'Bawang Merah': { currentPrice: 40500, projPrice: 44800, currentVol: 65, projVol: 76 },
      'Kacang Tanah': { currentPrice: 26900, projPrice: 29500, currentVol: 45, projVol: 52 },
      'Tomat': { currentPrice: 15000, projPrice: 17500, currentVol: 55, projVol: 64 }
    }
    const def = commodityDefaults[selectedCommodity.value] || { currentPrice: 25000, projPrice: 28000, currentVol: 75, projVol: 88 }
    const pDiff = def.projPrice - def.currentPrice
    const vDiff = def.projVol - def.currentVol
    return {
      currentPrice: def.currentPrice,
      priceChangePct: '+4.8%',
      isPriceUp: true,
      projPrice: def.projPrice,
      projPriceDiff: `${pDiff >= 0 ? '+' : ''}Rp ${Math.abs(pDiff).toLocaleString('id-ID')}`,
      priceRange: `Rp ${Math.round(def.projPrice * 0.94).toLocaleString('id-ID')} - Rp ${Math.round(def.projPrice * 1.06).toLocaleString('id-ID')}`,
      currentVol: def.currentVol,
      volChangePct: '+5.2%',
      isVolUp: true,
      projVol: def.projVol,
      projVolDiff: `+${vDiff} Ton`
    }
  }

  const isSemua = !selectedCommodity.value || selectedCommodity.value === ALL_COMMODITIES || selectedCommodity.value === 'Semua'
  const projCount = total >= 6 ? Math.min(3, Math.floor(total / 3)) : 0
  const histCount = total - projCount

  if (isSemua) {
    const allKeys = Object.keys(trends[0] || {}).filter(k => k !== 'month' && k !== 'volume_ton')
    const currentPriceAvg = Math.round(allKeys.reduce((acc, k) => acc + (Number(trends[histCount - 1]?.[k]) || 0), 0) / (allKeys.length || 1))
    const prevPriceAvg = Math.round(allKeys.reduce((acc, k) => acc + (Number(trends[histCount - 2]?.[k]) || 0), 0) / (allKeys.length || 1))
    const priceChange = prevPriceAvg ? (((currentPriceAvg - prevPriceAvg) / prevPriceAvg) * 100).toFixed(1) : '0.0'
    const isPriceUp = parseFloat(priceChange) >= 0

    const projPriceAvg = Math.round(allKeys.reduce((acc, k) => acc + (Number(trends[total - 1]?.[k]) || 0), 0) / (allKeys.length || 1))
    const priceDiffNum = projPriceAvg - currentPriceAvg
    const projPriceDiff = `${priceDiffNum >= 0 ? '+' : ''}Rp ${Math.abs(priceDiffNum).toLocaleString('id-ID')}`
    const priceRange = `Rp ${Math.round(projPriceAvg * 0.92).toLocaleString('id-ID')} - Rp ${Math.round(projPriceAvg * 1.08).toLocaleString('id-ID')}`

    const currentVol = volTrends[histCount - 1]?.volume_ton || 380
    const prevVol = volTrends[histCount - 2]?.volume_ton || currentVol
    const volChange = prevVol ? (((currentVol - prevVol) / prevVol) * 100).toFixed(1) : '0.0'
    const isVolUp = parseFloat(volChange) >= 0
    const projVol = volTrends[total - 1]?.volume_ton || 440
    const volDiffNum = projVol - currentVol

    return {
      currentPrice: currentPriceAvg,
      priceChangePct: `${isPriceUp ? '+' : ''}${priceChange}%`,
      isPriceUp,
      projPrice: projPriceAvg,
      projPriceDiff,
      priceRange,
      currentVol,
      volChangePct: `${isVolUp ? '+' : ''}${volChange}%`,
      isVolUp,
      projVol,
      projVolDiff: `${volDiffNum >= 0 ? '+' : ''}${Math.abs(volDiffNum)} Ton`
    }
  } else {
    const key = selectedCommodity.value
    const currentPrice = Number(trends[histCount - 1]?.[key]) || 15000
    const prevPrice = Number(trends[histCount - 2]?.[key]) || currentPrice
    const priceChange = prevPrice ? (((currentPrice - prevPrice) / prevPrice) * 100).toFixed(1) : '0.0'
    const isPriceUp = parseFloat(priceChange) >= 0

    const projPrice = Number(trends[total - 1]?.[key]) || Math.round(currentPrice * 1.08)
    const priceDiffNum = projPrice - currentPrice
    const projPriceDiff = `${priceDiffNum >= 0 ? '+' : ''}Rp ${Math.abs(priceDiffNum).toLocaleString('id-ID')}`
    const priceRange = `Rp ${Math.round(projPrice * 0.95).toLocaleString('id-ID')} - Rp ${Math.round(projPrice * 1.05).toLocaleString('id-ID')}`

    const commodityVolMap: Record<string, number> = {
      'Cabai Merah': 85,
      'Salak Pondoh': 140,
      'Padi': 190,
      'Jagung': 110,
      'Bawang Merah': 65,
      'Kacang Tanah': 45,
      'Tomat': 55
    }
    const baseVol = commodityVolMap[key] || 75
    const currentVol = baseVol
    const projVol = Math.round(baseVol * 1.15)
    const volDiffNum = projVol - currentVol

    return {
      currentPrice,
      priceChangePct: `${isPriceUp ? '+' : ''}${priceChange}%`,
      isPriceUp,
      projPrice,
      projPriceDiff,
      priceRange,
      currentVol,
      volChangePct: '+5.5%',
      isVolUp: true,
      projVol,
      projVolDiff: `+${volDiffNum} Ton`
    }
  }
})

const analystInsightHtml = computed(() => {
  const comm = (!selectedCommodity.value || selectedCommodity.value === ALL_COMMODITIES) ? 'Komoditas Pertanian' : selectedCommodity.value
  const kpis = selectedCommodityKpis.value
  return `
    <p>&bull; <strong>Dinamika Harga Pasar:</strong> Harga komoditas ${comm} diproyeksikan berada pada kisaran <strong>Rp ${kpis.projPrice.toLocaleString('id-ID')}/kg</strong> (${kpis.projPriceDiff}).</p>
    <p>&bull; <strong>Est. Panen &amp; Pasokan:</strong> Volume hasil panen regional diperkirakan mencapai <strong>${kpis.projVol} Ton</strong>.</p>
    <p>&bull; <strong>Saran Petani:</strong> Sesuaikan jadwal petik dan kurangi risiko penjualan borongan saat puncak panen.</p>
  `
})

const petakOptions = computed(() => {
  const seen = new Set<string>()
  const result: { value: string; label: string }[] = []
  
  ;(lahanList.value || []).forEach((item: any) => {
    const p = item.input_parameters || {}
    const farmId = p.farm_id || `CGK${String(item.id).padStart(3, '0')}`
    if (!seen.has(farmId)) {
      seen.add(farmId)
      result.push({
        value: farmId,
        label: `${farmId} — ${p.desa || 'Cangkringan'}`
      })
    }
  })
  return result
})

const selectedFarmItem = computed(() => {
  if (selectedFarm.value === 'all') return null
  return (lahanList.value || []).find((item: any) => {
    const p = item.input_parameters || {}
    return (p.farm_id || `CGK${String(item.id).padStart(3, '0')}`) === selectedFarm.value
  }) || null
})

const commodities = computed<string[]>(() => {
  const list = dashboardData.value?.commodities
  if (Array.isArray(list) && list.length) return list
  const trends = dashboardData.value?.price_trends || []
  if (trends.length) return Object.keys(trends[0]).filter((k) => k !== 'month')
  return []
})

const soilStats = computed(() => {
  const aggPh = parseFloat(dashboardData.value?.avg_ph)
  const aggMoisture = parseInt(String(dashboardData.value?.avg_moisture || '').replace('%', ''))

  let ph = isNaN(aggPh) ? 6.4 : aggPh
  let moisture = isNaN(aggMoisture) ? 68 : aggMoisture
  let nitrogen = 142
  let kalium = 210
  let estimated = false

  if (selectedFarmItem.value) {
    const p = selectedFarmItem.value.input_parameters || {}
    if (p.soil_ph != null) ph = parseNum(p.soil_ph, ph)
    if (p.kelembapan != null || p.humidity_percent != null) {
      moisture = parseNum(p.kelembapan ?? p.humidity_percent, moisture)
    }
    if (p.nitrogen != null) nitrogen = parseNum(p.nitrogen, nitrogen)
    else estimated = true
    if (p.kalium != null) kalium = parseNum(p.kalium, kalium)
  }

  const fisikLabel = moisture < 40 ? 'Kering' : moisture <= 62 ? 'Lembab' : 'Basah'
  const fisikOk = fisikLabel === 'Lembab'
  const phOk = ph >= 6.0 && ph <= 7.0

  return {
    ph,
    moisture,
    nitrogen,
    kalium,
    estimated,
    fisikLabel,
    fisikOk,
    phOk,
    nLabel: nitrogen >= 120 ? 'Cukup' : nitrogen >= 80 ? 'Sedang' : 'Rendah',
    kLabel: kalium >= 180 ? 'Kaya Mineral' : kalium >= 120 ? 'Sedang' : 'Rendah'
  }
})

const rekomendasi = computed(() => {
  const best = dashboardData.value?.best_commodity
  if (!best) return null
  return {
    title: best.title,
    reason: best.reason,
    avg_price: best.avg_price,
    expected_yield: best.expected_yield,
    badge: best.badge || 'Rekomendasi Agrikultur Cerdas'
  }
})

const keselarasan = computed(() => {
  const hum = cuacaReal.value?.kelembaban
  if (hum == null) {
    return { label: 'Menunggu Data', ok: true, text: 'Data cuaca BMKG belum tersedia untuk membandingkan kondisi tanah Anda.' }
  }
  const diff = Math.abs(hum - soilStats.value.moisture)
  const selaras = diff <= 15
  return {
    label: selaras ? 'Selaras' : 'Perlu Cek',
    ok: selaras,
    text: `BMKG mencatat kelembapan udara ${Math.round(hum)}%. Tanah Anda terakhir dicatat ${soilStats.value.fisikLabel.toLowerCase()} (${soilStats.value.moisture}%). ${selaras ? 'Kondisi selaras.' : 'Ada selisih cukup besar, pertimbangkan pengecekan lapangan.'}`
  }
})

const chartSchema = computed(() => {
  const trends = (dashboardData.value?.price_trends || []) as Record<string, any>[]
  const volTrends = (dashboardData.value?.volume_trends || []) as Record<string, any>[]
  if (!trends.length) return null

  const activeList = (selectedCommodity.value && selectedCommodity.value !== ALL_COMMODITIES)
    ? [selectedCommodity.value]
    : []

  return generatePlotlySchema(trends, volTrends, activeList, chartViewMode.value)
})

const projectionZone = computed(() => {
  const trends = dashboardData.value?.price_trends || []
  if (!trends.length) return ''
  const MONTH_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const total = trends.length
  const projCount = total >= 6 ? Math.min(3, Math.floor(total / 3)) : 0
  if (projCount === 0) return ''
  const projStart = trends[total - projCount]?.month || ''
  const projEnd = trends[total - 1]?.month || ''
  
  const formatYm = (ym: string) => {
    if (ym && ym.includes('-')) {
      const [y, m] = ym.split('-')
      return `${MONTH_ID[parseInt(m) - 1]} '${y.substring(2)}`
    }
    return ym
  }
  return `${formatYm(projStart)} – ${formatYm(projEnd)}`
})

const loadData = async () => {
  isLoading.value = true
  try {
    const [lahans, trends, cuaca] = await Promise.all([
      LahanService.getAllLahan(),
      AdminService.getDashboardTrends(),
      fetchCuacaCangkringan().catch(() => null)
    ])
    lahanList.value = lahans || []
    if (trends) dashboardData.value = trends
    if (cuaca) cuacaReal.value = cuaca
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

const applyRecommendation = async () => {
  if (applying.value || applied.value) return
  applying.value = true
  try {
    await TindakanService.confirm('TND-PRED-001')
    applied.value = true
    setTimeout(() => {
      applied.value = false
      let saran = rekomendasi.value?.title || 'Cabai Merah'
      if (saran.includes('&')) {
        saran = saran.split('&')[0].trim()
      } else if (saran.toLowerCase().includes(' dan ')) {
        saran = saran.split(/ dan /i)[0].trim()
      }
      router.push({ path: '/input-lahan', query: { tanam: saran } })
    }, 1200)
  } finally {
    applying.value = false
  }
}

const createSchedule = () => {
  router.push('/input-lahan')
}
</script>

<template>
  <div class="min-h-screen bg-surface text-on-surface antialiased flex flex-col md:flex-row pb-[88px] md:pb-0 font-sans">

    <!-- Mobile header -->
    <header class="md:hidden fixed top-0 left-0 right-0 z-30 pt-safe bg-[#fff8f4]/95 backdrop-blur-xl border-b border-[#F0EDE6]">
      <div class="h-14 px-4 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-8 w-auto object-contain shrink-0" />
          <div class="flex flex-col leading-none min-w-0">
            <span class="font-display text-[15px] text-[#3A4A2E] tracking-tight leading-none font-bold">Tanacakra</span>
            <span class="text-[11px] text-[#6B5B4A] mt-0.5 truncate font-medium">Prediksi &amp; Pasar</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="isNotifOpen = true" class="relative w-10 h-10 flex items-center justify-center rounded-full text-[#6B5B4A] hover:text-[#241F1B] hover:bg-[#E8DED7] transition-colors cursor-pointer" aria-label="Pemberitahuan">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
            <span v-if="unreadCount > 0" class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#A8452A]"></span>
          </button>
          <UserDropdown />
        </div>
      </div>
    </header>

    <NotificationModal :is-open="isNotifOpen" @close="isNotifOpen = false" />

    <PetaniSidebar />

    <!-- Desktop top header -->
    <header class="hidden md:flex fixed top-0 left-[240px] right-0 h-16 z-20 items-center justify-between px-6 lg:px-8 bg-surface/85 backdrop-blur-xl border-b border-[#F0EDE6]">
      <div class="flex items-center gap-2 text-[12px] text-on-surface-variant">
        <span class="text-primary font-semibold">Tanacakra</span>
        <span class="material-symbols-outlined text-[14px]">chevron_right</span>
        <span>Sistem Tani Presisi</span>
        <span class="material-symbols-outlined text-[14px]">chevron_right</span>
        <span class="text-on-surface font-semibold">Cangkringan Sektor 4</span>
      </div>
      <div class="flex items-center gap-4 md:pr-14">
        <UserDropdown />
      </div>
    </header>

    <main class="md:ml-[240px] flex-1 w-full px-4 md:px-6 lg:px-8 pt-[calc(env(safe-area-inset-top,0px)+72px)] md:pt-20">
      <div class="max-w-[1100px] mx-auto flex flex-col gap-6 pb-12">

        <!-- 1. Judul & Selector -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-cta"></span>
              <span class="text-[11px] text-[#6B5B4A] uppercase tracking-widest font-semibold">Agro-Analitika Presisi</span>
            </div>
            <h1 class="font-display text-[28px] md:text-[34px] leading-tight text-[#241F1B] font-bold tracking-tight">Panel Dasbor</h1>
            <p class="text-[15px] text-[#6B5B4A]">Hasil analisis prediktif cuaca mikro, kondisi tanah, dan rekomendasi tanam cerdas lereng Merapi.</p>
          </div>

          <div class="relative inline-flex items-center shrink-0">
            <span class="material-symbols-outlined absolute left-3.5 text-[#6B5B4A] text-[18px] pointer-events-none">terrain</span>
            <select
              v-model="selectedFarm"
              class="bg-white text-[#241F1B] text-[13px] font-medium pl-10 pr-9 py-2.5 rounded-lg shadow-sm cursor-pointer border border-[#E2D8C7] hover:bg-surface-container-lowest transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A4A2E]/20 appearance-none"
            >
              <option value="all">Semua Lahan</option>
              <option v-for="p in petakOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5B4A] text-[18px] pointer-events-none">expand_more</span>
          </div>
        </div>

        <!-- 2. Strip Cuaca 4 Kolom -->
        <section class="card p-5 flex flex-col gap-4">
          <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#F2DFCF]">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#3A4A2E] text-[20px]">wb_cloudy</span>
              <span class="text-[14px] text-[#4A3F35] font-semibold">Cuaca Terkini Kecamatan Cangkringan</span>
            </div>
            <div class="flex items-center gap-1.5 text-[#6B5B4A] text-[11px]">
              <span class="w-1.5 h-1.5 rounded-full bg-[#3A4A2E]"></span>
              <span>Sumber: {{ cuacaReal?.sumber || 'BMKG' }} &middot; {{ cuacaReal?.lokasi || 'Cangkringan' }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex flex-col bg-[#FFF8F4] p-3.5 rounded-lg">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[13px] text-[#6B5B4A]">Suhu Udara</span>
                <span class="material-symbols-outlined text-[#A8452A] text-[18px]">device_thermostat</span>
              </div>
              <span class="text-[28px] leading-none font-bold text-[#241F1B] mb-1">{{ cuacaReal ? Math.round(cuacaReal.suhu) + '°C' : '—' }}</span>
              <span class="text-[11px] text-[#4A3F35]">{{ cuacaReal ? cuacaReal.kondisi : 'Menunggu data' }}</span>
            </div>
            <div class="flex flex-col bg-[#FFF8F4] p-3.5 rounded-lg">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[13px] text-[#6B5B4A]">Kelembapan Udara</span>
                <span class="material-symbols-outlined text-[#3A4A2E] text-[18px]">water_drop</span>
              </div>
              <span class="text-[28px] leading-none font-bold text-[#241F1B] mb-1">{{ cuacaReal ? Math.round(cuacaReal.kelembaban) + '%' : '—' }}</span>
              <span class="text-[11px] text-[#4A3F35]">{{ cuacaReal && cuacaReal.kelembaban >= 70 ? 'Kelembapan tinggi' : 'Kelembapan sedang' }}</span>
            </div>
            <div class="flex flex-col bg-[#FFF8F4] p-3.5 rounded-lg">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[13px] text-[#6B5B4A]">Curah Hujan</span>
                <span class="material-symbols-outlined text-[#3A4A2E] text-[18px]">rainy</span>
              </div>
              <span class="text-[28px] leading-none font-bold text-[#241F1B] mb-1">{{ cuacaReal ? cuacaReal.curahHujanMm + ' mm' : '—' }}</span>
              <span class="text-[11px] text-[#4A3F35]">{{ cuacaReal ? cuacaReal.curahHujanLabel : 'Belum tersedia dari BMKG' }}</span>
            </div>
            <div class="flex flex-col bg-[#FFF8F4] p-3.5 rounded-lg">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[13px] text-[#6B5B4A]">Kecepatan Angin</span>
                <span class="material-symbols-outlined text-[#6B5B4A] text-[18px]">air</span>
              </div>
              <span class="text-[28px] leading-none font-bold text-[#241F1B] mb-1">{{ cuacaReal ? cuacaReal.anginKmh + ' km/j' : '—' }}</span>
              <span class="text-[11px] text-[#4A3F35]">{{ cuacaReal ? 'Arah angin dari perkiraan BMKG' : 'Belum tersedia dari BMKG' }}</span>
            </div>
          </div>
        </section>

        <!-- 3. Empat Stat Card Kondisi Tanah -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[13px] text-[#6B5B4A]">Kondisi Fisik Tanah</span>
              <span class="material-symbols-outlined text-[#3A4A2E] text-[20px]">layers</span>
            </div>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-[28px] leading-none font-bold text-[#3A4A2E]">{{ soilStats.fisikLabel }}</span>
              <span class="chip" :class="soilStats.fisikOk ? 'bg-[#EBF3E7] text-[#3A4A2E] border-[#3A4A2E]/20' : 'bg-[#FBF0DB] text-[#92400E] border-[#D97706]/25'">
                {{ soilStats.fisikOk ? 'Optimal' : 'Perlu Atensi' }}
              </span>
            </div>
            <div class="mt-3 pt-2 border-t border-[#F2DFCF] flex items-center justify-between text-[12px] text-[#6B5B4A]">
              <span>Kelembapan tercatat</span>
              <span class="font-semibold text-[#241F1B]">{{ soilStats.moisture }}%</span>
            </div>
          </div>

          <div class="card p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[13px] text-[#6B5B4A]">Tingkat Keasaman (pH)</span>
              <span class="material-symbols-outlined text-[#6B5B4A] text-[20px]">science</span>
            </div>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-[28px] leading-none font-bold text-[#241F1B]">{{ soilStats.ph }} pH</span>
              <span class="chip" :class="soilStats.phOk ? 'bg-[#EBF3E7] text-[#3A4A2E] border-[#3A4A2E]/20' : 'bg-[#FBF0DB] text-[#92400E] border-[#D97706]/25'">
                {{ soilStats.phOk ? 'Netral Sehat' : 'Perlu Pembenahan' }}
              </span>
            </div>
            <div class="mt-3 pt-2 border-t border-[#F2DFCF] flex items-center justify-between text-[12px] text-[#6B5B4A]">
              <span>Zona toleransi</span>
              <span class="font-semibold text-[#241F1B]">6.0 - 7.0</span>
            </div>
          </div>

          <div class="card p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[13px] text-[#6B5B4A]">Kadar Nitrogen (N)</span>
              <span class="material-symbols-outlined text-[#6B5B4A] text-[20px]">eco</span>
            </div>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-[28px] leading-none font-bold text-[#241F1B]">{{ soilStats.nitrogen }} ppm</span>
              <span class="chip bg-[#EBF3E7] text-[#3A4A2E] border-[#3A4A2E]/20">{{ soilStats.nLabel }}</span>
            </div>
            <div class="mt-3 pt-2 border-t border-[#F2DFCF] flex items-center justify-between text-[12px] text-[#6B5B4A]">
              <span>{{ soilStats.estimated ? 'Estimasi dataset' : 'Mineral vulkanik aktif' }}</span>
              <span class="font-semibold text-[#241F1B]">{{ soilStats.estimated ? 'Default' : 'Tercatat' }}</span>
            </div>
          </div>

          <div class="card p-5 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[13px] text-[#6B5B4A]">Kadar Kalium (K)</span>
              <span class="material-symbols-outlined text-[#6B5B4A] text-[20px]">volcano</span>
            </div>
            <div class="flex items-baseline justify-between mt-2">
              <span class="text-[28px] leading-none font-bold text-[#241F1B]">{{ soilStats.kalium }} ppm</span>
              <span class="chip bg-[#EBF3E7] text-[#3A4A2E] border-[#3A4A2E]/20">{{ soilStats.kLabel }}</span>
            </div>
            <div class="mt-3 pt-2 border-t border-[#F2DFCF] flex items-center justify-between text-[12px] text-[#6B5B4A]">
              <span>Endapan abu Merapi</span>
              <span class="font-semibold text-[#241F1B]">{{ soilStats.kalium >= 180 ? 'Tinggi' : 'Sedang' }}</span>
            </div>
          </div>
        </div>

        <!-- 4. Kartu Rekomendasi AI -->
        <div v-if="rekomendasi" class="bg-[#F3ECE0] rounded-[14px] p-6 relative overflow-hidden border border-[#E2D8C7] border-l-[6px] border-l-[#A8452A] shadow-[0_4px_16px_-4px_rgba(36,31,27,0.06)]">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div class="flex flex-wrap items-center gap-3">
              <span class="bg-[#A8452A] text-white px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-sm">
                <span class="material-symbols-outlined text-[15px]">psychology</span>
                {{ rekomendasi.badge }}
              </span>
              <span class="text-xs font-semibold text-[#4A3F35] bg-white/70 px-2.5 py-1 rounded-md">RandomForest Scikit-Learn</span>
            </div>
            <span class="text-[11px] text-[#6B5B4A]">Berlaku untuk {{ selectedFarm === 'all' ? 'semua lahan' : selectedFarm }}</span>
          </div>
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="max-w-3xl flex flex-col gap-2">
              <h2 class="font-display text-[20px] font-bold text-[#241F1B] leading-snug">
                Saran tanam: {{ rekomendasi.title.split('&').join('dan') }}
              </h2>
              <p class="text-[15px] text-[#4A3F35] leading-relaxed">{{ rekomendasi.reason }}</p>
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <span class="chip-positive normal-case tracking-normal">Harga: {{ rekomendasi.avg_price }}</span>
                <span class="chip-positive normal-case tracking-normal">Hasil: {{ rekomendasi.expected_yield }}</span>
              </div>
            </div>
            <div class="shrink-0">
              <button
                @click="applyRecommendation"
                :disabled="applying"
                class="bg-[#3A4A2E] text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-[#2e3b25] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
              >
                <span class="material-symbols-outlined text-[18px]">{{ applied ? 'check_circle' : 'calendar_add_on' }}</span>
                {{ applied ? 'Rekomendasi Diterapkan' : 'Terapkan Rekomendasi' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 5. Kartu Keselarasan Cuaca & Tanah -->
        <div class="card px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
              :class="keselarasan.ok ? 'bg-[#EBF3E7] text-[#3A4A2E]' : 'bg-[#FBF0DB] text-[#92400E]'">
              <span class="material-symbols-outlined text-[15px]">{{ keselarasan.ok ? 'check_circle' : 'warning' }}</span>
              <span>{{ keselarasan.label }}</span>
            </div>
            <p class="text-sm font-medium leading-normal" :class="keselarasan.ok ? 'text-[#3A4A2E]' : 'text-[#92400E]'">{{ keselarasan.text }}</p>
          </div>
          <div class="flex items-center gap-2 text-xs text-[#6B5B4A] shrink-0 sm:pl-4">
            <span class="material-symbols-outlined text-[16px] text-[#6B5B4A]">water_drop</span>
            <span>{{ soilStats.fisikOk ? 'Tidak perlu irigasi darurat hari ini.' : 'Pertimbangkan penyiraman tambahan.' }}</span>
          </div>
        </div>

        <!-- 6. Chart & Analytics Section: AgriAnalytics Pro -->
        <!-- 6a. KPI Cards Grid (Harga & Volume) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Card 1: Harga Saat Ini -->
          <div class="card p-4 flex flex-col justify-between hover:shadow-md transition">
            <div class="flex items-center justify-between text-[#6B5B4A] text-xs font-bold uppercase tracking-wider">
              <span>Harga Saat Ini</span>
              <span class="material-symbols-outlined text-[18px] text-[#A8452A]">sell</span>
            </div>
            <div class="mt-2 flex items-baseline justify-between">
              <span class="text-xl font-bold text-[#241F1B]">Rp {{ selectedCommodityKpis.currentPrice.toLocaleString('id-ID') }}/kg</span>
              <span class="text-xs font-bold flex items-center gap-1" :class="selectedCommodityKpis.isPriceUp ? 'text-emerald-700' : 'text-[#A8452A]'">
                <span class="material-symbols-outlined text-[14px]">{{ selectedCommodityKpis.isPriceUp ? 'trending_up' : 'trending_down' }}</span>
                {{ selectedCommodityKpis.priceChangePct }}
              </span>
            </div>
            <div class="text-[11px] text-[#6B5B4A] mt-1.5">Rata-rata tingkat petani Sleman &amp; DIY</div>
          </div>

          <!-- Card 2: Proyeksi Harga -->
          <div class="card p-4 flex flex-col justify-between hover:shadow-md transition">
            <div class="flex items-center justify-between text-[#6B5B4A] text-xs font-bold uppercase tracking-wider">
              <span>Proyeksi Harga</span>
              <span class="material-symbols-outlined text-[18px] text-[#A8452A]">show_chart</span>
            </div>
            <div class="mt-2 flex items-baseline justify-between">
              <span class="text-xl font-bold text-[#A8452A]">Rp {{ selectedCommodityKpis.projPrice.toLocaleString('id-ID') }}/kg</span>
              <span class="text-xs font-bold text-[#A8452A]">{{ selectedCommodityKpis.projPriceDiff }}</span>
            </div>
            <div class="text-[11px] text-[#6B5B4A] mt-1.5">Rentang: <span class="font-medium text-[#241F1B]">{{ selectedCommodityKpis.priceRange }}</span></div>
          </div>

          <!-- Card 3: Estimasi Panen -->
          <div class="card p-4 flex flex-col justify-between hover:shadow-md transition">
            <div class="flex items-center justify-between text-[#6B5B4A] text-xs font-bold uppercase tracking-wider">
              <span>Estimasi Panen</span>
              <span class="material-symbols-outlined text-[18px] text-[#3A4A2E]">grass</span>
            </div>
            <div class="mt-2 flex items-baseline justify-between">
              <span class="text-xl font-bold text-[#241F1B]">{{ selectedCommodityKpis.currentVol }} Ton</span>
              <span class="text-xs font-bold flex items-center gap-1" :class="selectedCommodityKpis.isVolUp ? 'text-emerald-700' : 'text-[#A8452A]'">
                <span class="material-symbols-outlined text-[14px]">{{ selectedCommodityKpis.isVolUp ? 'trending_up' : 'trending_down' }}</span>
                {{ selectedCommodityKpis.volChangePct }}
              </span>
            </div>
            <div class="text-[11px] text-[#6B5B4A] mt-1.5">Estimasi pasokan lereng Merapi</div>
          </div>

          <!-- Card 4: Proyeksi Volume Panen -->
          <div class="card p-4 flex flex-col justify-between hover:shadow-md transition">
            <div class="flex items-center justify-between text-[#6B5B4A] text-xs font-bold uppercase tracking-wider">
              <span>Proyeksi Panen</span>
              <span class="material-symbols-outlined text-[18px] text-[#3A4A2E]">inventory_2</span>
            </div>
            <div class="mt-2 flex items-baseline justify-between">
              <span class="text-xl font-bold text-[#3A4A2E]">{{ selectedCommodityKpis.projVol }} Ton</span>
              <span class="text-xs font-bold text-[#3A4A2E]">{{ selectedCommodityKpis.projVolDiff }}</span>
            </div>
            <div class="text-[11px] text-[#6B5B4A] mt-1.5">Puncak siklus panen mendatang</div>
          </div>
        </div>

        <!-- 6b. Kartu Chart Tren Harga & Hasil Panen -->
        <div class="card p-5 flex flex-col shadow-[0_2px_12px_-3px_rgba(36,31,27,0.05)] gap-4">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[#E2D8C7]">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <h3 class="font-display text-[18px] font-bold text-[#241F1B]">
                  Tren Harga &amp; Perkiraan Hasil Panen: {{ selectedCommodity || ALL_COMMODITIES }}
                </h3>
                <span class="px-2 py-0.5 rounded-full bg-[#EBF3E7] text-[#3A4A2E] text-[11px] font-bold border border-[#3A4A2E]/20">
                  AgriAnalytics Pro
                </span>
              </div>
              <p class="text-[12px] text-[#6B5B4A]">Proyeksi 3 bulan ke depan berbasis siklus pasar dan mikroklimat Merapi</p>
            </div>

            <!-- Controls: Tampilan Switcher & Commodity Dropdown -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- View Mode Switcher -->
              <div class="flex items-center gap-1 bg-[#F9F5F0] border border-[#E2D8C7] p-1 rounded-xl text-xs font-bold">
                <button
                  @click="chartViewMode = 'subplots'"
                  class="px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                  :class="chartViewMode === 'subplots' ? 'bg-[#3A4A2E] text-white shadow-xs' : 'text-[#6B5B4A] hover:text-[#241F1B]'"
                >
                  <span class="material-symbols-outlined text-[16px]">grid_view</span>
                  <span>Terpisah (Rekomendasi)</span>
                </button>
                <button
                  @click="chartViewMode = 'dual'"
                  class="px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                  :class="chartViewMode === 'dual' ? 'bg-[#3A4A2E] text-white shadow-xs' : 'text-[#6B5B4A] hover:text-[#241F1B]'"
                >
                  <span class="material-symbols-outlined text-[16px]">layers</span>
                  <span>Dual Axis (Gabung)</span>
                </button>
              </div>

              <!-- Filter Komoditas Selector -->
              <div class="relative min-w-[170px]">
                <select
                  v-model="selectedCommodity"
                  class="w-full bg-[#FFF8F4] text-[#241F1B] text-[12px] font-bold pl-3 pr-8 py-2 rounded-xl cursor-pointer border border-[#E2D8C7] hover:bg-[#F2DFCF]/50 transition-colors focus:outline-none appearance-none shadow-2xs"
                >
                  <option :value="ALL_COMMODITIES">🌽 Semua Komoditas</option>
                  <option v-for="c in commodities" :key="c" :value="c">
                    {{ c === 'Cabai Merah' ? '🌶️' : c === 'Jagung' ? '🌽' : c === 'Padi' ? '🌾' : c === 'Bawang Merah' ? '🧅' : c === 'Tomat' ? '🍅' : c === 'Salak Pondoh' ? '🌴' : '🫘' }} {{ c }}
                  </option>
                </select>
                <span class="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B5B4A] text-[18px] pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          <div class="w-full relative">
            <PlotlyChart v-if="chartSchema" :schema="chartSchema" />
            <div v-else class="h-[360px] md:h-[440px] flex items-center justify-center text-xs text-[#75786f]">
              {{ isLoading ? 'Memuat grafik Plotly.js...' : 'Data tren harga belum tersedia.' }}
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 mt-1 border-t border-[#F2DFCF]/60 text-xs text-[#6B5B4A]">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-amber-600">info</span>
              <span><strong>Catatan:</strong> Garis putus-putus (<span class="inline-block w-4 border-b-2 border-dashed border-[#6B5B4A]"></span>) dan area peneduh menunjukkan proyeksi indikatif dengan batas kepercayaan 90%.</span>
            </div>
            <span v-if="projectionZone && selectedCommodity !== ALL_COMMODITIES" class="font-mono text-[11px] text-[#A8452A] font-semibold bg-[#A8452A]/10 px-2 py-0.5 rounded">Zona Proyeksi: {{ projectionZone }}</span>
          </div>
        </div>

        <!-- 6c. Grid: Insights & Weather Climate Details -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Ringkasan Analisis Pasokan & Harga -->
          <div class="lg:col-span-2 card p-5 flex flex-col justify-between">
            <div>
              <h4 class="text-base font-bold text-[#241F1B] flex items-center gap-2 mb-3">
                <span class="material-symbols-outlined text-[#3A4A2E] text-[20px]">psychology</span>
                Ringkasan Analisis Pasokan &amp; Harga: {{ selectedCommodity || ALL_COMMODITIES }}
              </h4>
              <div v-html="analystInsightHtml" class="text-xs md:text-sm text-[#6B5B4A] space-y-2 leading-relaxed"></div>
            </div>
          </div>

          <!-- Mikroklimat Merapi -->
          <div class="bg-gradient-to-br from-[#3A4A2E] to-[#243319] text-white p-5 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold uppercase tracking-wider text-[#d5e9c3]">Kondisi Cuaca &amp; Tanah</span>
                <span class="material-symbols-outlined text-[#d5e9c3] text-[22px]">thunderstorm</span>
              </div>
              <h4 class="font-bold text-base mb-1">Transisi La Niña Lemah</h4>
              <p class="text-xs text-[#d5e9c3]/80 leading-relaxed">
                Curah hujan diperkirakan stabil. Kelembapan tanah lereng Merapi berada di rentang optimal untuk fase pembuahan.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-[#d5e9c3]/20 flex items-center justify-between text-xs">
              <span class="text-[#d5e9c3]">Indeks Kelembaban:</span>
              <span class="font-bold text-emerald-400">Optimum ({{ soilStats.moisture }}%)</span>
            </div>
          </div>
        </div>

        <!-- 7. Kartu Penjelas + Riwayat -->
        <div class="bg-[#F9F5F0] rounded-[14px] p-5 md:p-6 border border-[#E2D8C7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-3.5 max-w-2xl">
            <div class="w-9 h-9 rounded-lg bg-[#3A4A2E]/10 flex items-center justify-center text-[#3A4A2E] shrink-0 mt-0.5">
              <span class="material-symbols-outlined text-[20px]">balance</span>
            </div>
            <div class="flex flex-col gap-1">
              <h4 class="text-[18px] font-bold text-[#241F1B]">Data ini dipakai untuk apa?</h4>
              <p class="text-[13px] text-[#6B5B4A] leading-relaxed">
                Data riwayat kondisi lahan dan masukan Anda diselaraskan dengan tren komoditas induk Yogyakarta untuk meminimalkan risiko anjloknya harga panen.
              </p>
            </div>
          </div>
          <div class="shrink-0 flex items-center gap-2 justify-end">
            <button
              @click="createSchedule"
              class="hidden md:inline-flex border border-[#3A4A2E] text-[#3A4A2E] bg-transparent hover:bg-[#3A4A2E]/5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">event_available</span>
              <span>+ Buat Jadwal Tanam</span>
            </button>
            <button
              @click="router.push('/riwayat')"
              class="border border-[#A8452A] text-[#A8452A] bg-transparent hover:bg-[#A8452A]/5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              <span>Lihat Riwayat Lengkap</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

      </div>
    </main>

    <BottomNav />
  </div>
</template>

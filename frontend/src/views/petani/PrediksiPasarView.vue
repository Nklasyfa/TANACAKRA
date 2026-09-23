<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PetaniSidebar from '@/components/petani/PetaniSidebar.vue'
import BottomNav from '@/components/petani/BottomNav.vue'
import PlotlyChart from '@/components/shared/PlotlyChart.vue'
import { LahanService, AdminService, TindakanService } from '@/services/api'
import { fetchCuacaCangkringan, type CuacaInfo } from '@/services/weather'

const router = useRouter()

const isLoading = ref(true)
const lahanList = ref<any[]>([])
const dashboardData = ref<any>(null)
const cuacaReal = ref<CuacaInfo | null>(null)

const selectedFarm = ref('all')
const selectedCommodity = ref('')
const ALL_COMMODITIES = 'Semua Komoditas'

const applying = ref(false)
const applied = ref(false)
const MONTH_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const monthLabel = (ym: string) => {
  if (!ym || !ym.includes('-')) return ym
  const [, m] = ym.split('-')
  return MONTH_ID[parseInt(m) - 1] ?? ym
}

const nextMonthLabels = (lastYm: string, count: number) => {
  const [y0, m0] = (lastYm || '2024-01').split('-').map(Number)
  const out: string[] = []
  let y = y0
  let m = m0
  for (let i = 0; i < count; i++) {
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
    out.push(`${MONTH_ID[m - 1]} '${String(y).slice(2)}`)
  }
  return out
}

const linreg = (values: number[]) => {
  const n = values.length
  if (n === 0) return { slope: 0, intercept: 0 }
  if (n === 1) return { slope: 0, intercept: values[0] }
  const meanX = (n - 1) / 2
  const meanY = values.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY)
    den += (i - meanX) ** 2
  }
  const slope = den ? num / den : 0
  return { slope, intercept: meanY - slope * meanX }
}

const parseNum = (v: any, fallback: number) => {
  const n = parseFloat(v)
  return isNaN(n) ? fallback : n
}

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
  if (!trends.length) return null

  const keys = Object.keys(trends[0]).filter((k) => k !== 'month')
  if (!keys.length) return null

  const pick = selectedCommodity.value && selectedCommodity.value !== ALL_COMMODITIES
    ? keys.filter((k) => k === selectedCommodity.value)
    : keys
  const active = pick.length ? pick : keys

  const realMonths = trends.map((t) => t.month)
  const realValues = trends.map((t) => {
    const vals = active.map((k) => parseFloat(t[k])).filter((v) => !isNaN(v) && v > 0)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  })

  const trimmed = realValues.slice(-6)
  const { slope, intercept } = linreg(trimmed)
  const base = realValues.length
  const lastReal = realValues[realValues.length - 1] || 0
  const futureLabels = nextMonthLabels(realMonths[realMonths.length - 1] || '2024-01', 3)

  const projValues = futureLabels.map((_, i) => Math.max(0, Math.round(slope * (base + i) + intercept)))
  const band = projValues.map((v) => Math.max(0, Math.round(v * 0.12)))

  const projX = [monthLabel(realMonths[realMonths.length - 1] || ''), ...futureLabels]
  const projY = [lastReal, ...projValues]
  const bandUp = [lastReal, ...projValues.map((v, i) => v + band[i])]
  const bandDown = [lastReal, ...projValues.map((v, i) => Math.max(0, v - band[i]))]

  const realX = realMonths.map(monthLabel)

  const volumeData = (dashboardData.value?.volume_trends || []) as Record<string, any>[]
  const volX = volumeData.map((v) => monthLabel(v.month))
  const volY = volumeData.map((v) => parseFloat(v.volume_ton) || 0)
  const volTrim = volY.slice(-6)
  const volReg = linreg(volTrim)
  const volBase = volY.length
  const lastVol = volY[volY.length - 1] || 0
  const volProj = futureLabels.map((_, i) => Math.max(0, Math.round(volReg.slope * (volBase + i) + volReg.intercept)))
  const volProjX = [monthLabel(volumeData[volumeData.length - 1]?.month || ''), ...futureLabels]
  const volProjY = [lastVol, ...volProj]

  return {
    data: [
      {
        x: projX, y: bandUp, type: 'scatter', mode: 'lines', line: { width: 0 },
        showlegend: false, yaxis: 'y', hoverinfo: 'none'
      },
      {
        x: projX, y: bandDown, type: 'scatter', mode: 'lines', fill: 'tonexty',
        fillcolor: 'rgba(168, 69, 42, 0.12)', line: { width: 0 },
        showlegend: false, yaxis: 'y', hoverinfo: 'none'
      },
      {
        x: realX, y: realValues, type: 'scatter', mode: 'lines+markers', name: 'Harga (Rp/kg)',
        line: { color: '#A8452A', width: 3 }, marker: { size: 7, color: '#A8452A' },
        yaxis: 'y', hovertemplate: '<b>%{x}</b><br>Harga: Rp %{y:,.0f}/kg<extra></extra>'
      },
      {
        x: projX, y: projY, type: 'scatter', mode: 'lines+markers', name: 'Proyeksi Harga',
        line: { color: '#A8452A', width: 3, dash: 'dot' },
        marker: { size: 6, symbol: 'circle-open', color: '#A8452A' },
        yaxis: 'y', hovertemplate: '<b>%{x}</b><br>Proyeksi: Rp %{y:,.0f}/kg<extra></extra>'
      },
      {
        x: volX, y: volY, type: 'scatter', mode: 'lines+markers', name: 'Volume Panen (Ton)',
        line: { color: '#4A5B3A', width: 2.5 }, marker: { size: 6, color: '#4A5B3A' },
        yaxis: 'y2', hovertemplate: '<b>%{x}</b><br>Volume: %{y:.1f} Ton<extra></extra>'
      },
      {
        x: volProjX, y: volProjY, type: 'scatter', mode: 'lines+markers', name: 'Proyeksi Volume',
        line: { color: '#4A5B3A', width: 2.5, dash: 'dot' },
        marker: { size: 6, symbol: 'square-open', color: '#4A5B3A' },
        yaxis: 'y2', hovertemplate: '<b>%{x}</b><br>Proyeksi: %{y:.0f} Ton<extra></extra>'
      }
    ],
    layout: {
      autosize: true,
      margin: { l: 55, r: 50, t: 15, b: 40 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      showlegend: false,
      xaxis: {
        tickfont: { family: 'Plus Jakarta Sans', size: 11, color: '#6B5B4A' },
        tickangle: -45,
        automargin: true,
        showgrid: true, gridcolor: '#F2DFCF', zeroline: false
      },
      yaxis: {
        title: 'Harga (Rp/kg)',
        tickfont: { family: 'Plus Jakarta Sans', size: 11, color: '#A8452A' },
        automargin: true,
        showgrid: true, gridcolor: '#F2DFCF', zeroline: false, tickformat: 's'
      },
      yaxis2: {
        title: 'Volume (Ton)',
        tickfont: { family: 'Plus Jakarta Sans', size: 11, color: '#4A5B3A' },
        automargin: true,
        overlaying: 'y', side: 'right', showgrid: false, zeroline: false
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#241F1B', bordercolor: '#241F1B',
        font: { family: 'Plus Jakarta Sans', color: '#FFFFFF', size: 12 }
      },
      font: { color: '#2C2622', family: 'Plus Jakarta Sans, sans-serif' }
    }
  }
})

const projectionZone = computed(() => {
  const trends = dashboardData.value?.price_trends || []
  if (!trends.length) return ''
  const labels = nextMonthLabels(trends[trends.length - 1].month || '2024-01', 3)
  return labels.length ? `${labels[0]} – ${labels[labels.length - 1]}` : ''
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
    <header class="md:hidden sticky top-0 z-30 bg-surface/85 backdrop-blur-xl border-b border-[#F0EDE6] px-4 h-14 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-8 w-auto object-contain shrink-0" />
        <div class="flex flex-col leading-none min-w-0">
          <span class="font-display text-[15px] text-primary tracking-tight leading-none">Tanacakra</span>
          <span class="text-[11px] text-on-surface-variant mt-0.5 truncate">Prediksi &amp; Pasar</span>
        </div>
      </div>
      <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
      </div>
    </header>

    <PetaniSidebar />

    <!-- Desktop top header (mockup) -->
    <header class="hidden md:flex fixed top-0 left-[240px] right-0 h-16 z-20 items-center justify-between px-6 lg:px-8 bg-surface/85 backdrop-blur-xl border-b border-[#F0EDE6]">
      <div class="flex items-center gap-2 text-[12px] text-on-surface-variant">
        <span class="text-primary font-semibold">Tanacakra</span>
        <span class="material-symbols-outlined text-[14px]">chevron_right</span>
        <span>Sistem Tani Presisi</span>
        <span class="material-symbols-outlined text-[14px]">chevron_right</span>
        <span class="text-on-surface font-semibold">Cangkringan Sektor 4</span>
      </div>
      <div class="flex items-center gap-4">
        <button class="relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors" aria-label="Pemberitahuan">
          <span class="material-symbols-outlined text-[20px]">notifications</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error"></span>
        </button>
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
        </div>
      </div>
    </header>

    <main class="md:ml-[240px] flex-1 w-full px-4 md:px-6 lg:px-8 pt-4 md:pt-20">
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
              class="bg-white text-[#241F1B] text-[13px] font-medium pl-10 pr-2 py-2.5 rounded-lg shadow-sm cursor-pointer border border-[#E2D8C7] hover:bg-surface-container-lowest transition-colors focus:outline-none focus:ring-2 focus:ring-[#3A4A2E]/20"
            >
              <option value="all">Semua Lahan</option>
              <option v-for="p in petakOptions" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
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
              <span class="text-[28px] leading-none font-bold text-[#241F1B] mb-1">—</span>
              <span class="text-[11px] text-[#4A3F35]">Belum tersedia dari BMKG</span>
            </div>
            <div class="flex flex-col bg-[#FFF8F4] p-3.5 rounded-lg">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[13px] text-[#6B5B4A]">Kecepatan Angin</span>
                <span class="material-symbols-outlined text-[#6B5B4A] text-[18px]">air</span>
              </div>
              <span class="text-[28px] leading-none font-bold text-[#241F1B] mb-1">—</span>
              <span class="text-[11px] text-[#4A3F35]">Belum tersedia dari BMKG</span>
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

        <!-- 6. Kartu Chart Tren Harga & Hasil Panen -->
        <div class="card p-6 flex flex-col shadow-[0_2px_12px_-3px_rgba(36,31,27,0.05)]">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div class="flex flex-col gap-1">
              <h3 class="font-display text-[18px] font-bold text-[#241F1B]">Tren Harga &amp; Perkiraan Hasil Panen</h3>
              <p class="text-[13px] text-[#6B5B4A]">Proyeksi 3 bulan ke depan berbasis siklus pasar dan mikroklimat</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="hidden md:flex items-center gap-4 text-xs font-medium text-[#4A3F35] mr-2">
                <div class="flex items-center gap-1.5">
                  <span class="w-3 h-1 bg-[#A8452A] rounded-full"></span>
                  <span>Harga (Rp/kg)</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="w-3 h-1 bg-[#4A5B3A] rounded-full"></span>
                  <span>Volume (Ton)</span>
                </div>
              </div>
              <div class="relative">
                <select
                  v-model="selectedCommodity"
                  class="bg-[#FFF8F4] text-[#241F1B] text-[12px] font-semibold pl-3.5 pr-2 py-2 rounded-lg cursor-pointer border border-[#E2D8C7] hover:bg-[#F2DFCF]/50 transition-colors focus:outline-none"
                >
                  <option :value="ALL_COMMODITIES">{{ ALL_COMMODITIES }}</option>
                  <option v-for="c in commodities" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="w-full relative min-h-[420px] md:min-h-[460px]">
            <PlotlyChart v-if="chartSchema" :schema="chartSchema" />
            <div v-else class="min-h-[420px] md:min-h-[460px] flex items-center justify-center text-xs text-[#75786f]">
              {{ isLoading ? 'Memuat grafik Plotly.js...' : 'Data tren harga belum tersedia.' }}
            </div>
          </div>

          <div class="flex items-center justify-between pt-3 mt-1 border-t border-[#F2DFCF]/60 text-xs italic text-[#6B5B4A]">
            <span>Catatan: Garis putus-putus menunjukkan proyeksi indikatif, bukan hasil pasti.</span>
            <span v-if="projectionZone" class="not-italic font-mono text-[11px] text-[#A8452A] font-medium bg-[#A8452A]/10 px-2 py-0.5 rounded">Zona Proyeksi: {{ projectionZone }}</span>
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

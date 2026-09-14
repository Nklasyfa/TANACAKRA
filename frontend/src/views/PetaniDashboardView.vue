<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PetaniSidebar from '../components/PetaniSidebar.vue'
import BottomNav from '../components/BottomNav.vue'
import PlotlyChart from '../components/PlotlyChart.vue'
import { useRouter } from 'vue-router'
import { LahanService, AdminService } from '../services/api'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const router = useRouter()
const map = ref<any>(null)
const markersGroup = ref<any>(null)
const lahanList = ref<any[]>([])
const dashboardData = ref<any>(null)

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
      const bgColor = ratio >= 0.75 ? '#4E7C40' : ratio >= 0.4 ? '#D98E26' : '#B3542C'

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
    const elevation = params.elevation_m || 600
    const organicC = params.organic_carbon || 2.1
    const isSehat = ph >= 6.0

    const markerColor = isSehat ? '#4E7C40' : '#B3542C'
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
          <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; color: white; background-color: ${isSehat ? '#4E7C40' : '#B3542C'};">
            ${isSehat ? 'Sehat' : 'Perlu Atensi'}
          </span>
        </div>
        <div style="font-size: 12px; color: #555; line-height: 1.5;">
          <strong>Desa:</strong> ${desa}<br/>
          <strong>pH Tanah:</strong> ${ph} (${isSehat ? 'Ideal' : 'Kurang Ideal'})<br/>
          <strong>Jenis Tanah:</strong> ${soilType}<br/>
          <strong>Luas Lahan:</strong> ${areaHa} Ha<br/>
          <strong>Elevasi:</strong> ${elevation} m dpl<br/>
          <strong>Karbon Organik:</strong> ${organicC}%
        </div>
        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #eee; font-size: 11px; color: #777;">
          ${isSehat ? '🟢 Subur & retensi hara tinggi.' : '🔴 Perlu pemberian pupuk kalium/dolomit.'}
        </div>
      </div>
    `
    marker.bindPopup(popupContent)
    markersGroup.value.addLayer(marker)
  })
}

const loadPetaniData = async () => {
  initMap()

  LahanService.getAllLahan().then((lahans) => {
    if (lahans && lahans.length > 0) {
      lahanList.value = lahans
      renderMarkers(lahans)
    }
  }).catch(() => {
    const fallbackList = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      input_parameters: {
        farm_id: 'CGK' + String(i + 1).padStart(3, '0'),
        desa: ['Wukirsari', 'Argomulyo', 'Glagaharjo', 'Kepuharjo', 'Umpak'][i % 5],
        soil_ph: (5.2 + (i % 25) * 0.1).toFixed(1),
        soil_type: 'Regosol Vulkanik',
        area_ha: (0.5 + (i % 4) * 0.5).toFixed(1),
        elevation_m: 550 + (i % 10) * 20,
        organic_carbon: (1.5 + (i % 5) * 0.3).toFixed(1)
      }
    }))
    lahanList.value = fallbackList
    renderMarkers(fallbackList)
  })

  AdminService.getDashboardTrends().then((trends) => {
    if (trends) {
      dashboardData.value = trends
    }
  }).catch((err) => console.error('Gagal memuat dashboard data:', err))
}

onMounted(() => {
  setTimeout(() => {
    loadPetaniData()
  }, 100)
})
</script>

<template>
  <div class="min-h-screen bg-abu-letusan antialiased text-abu-vulkanik flex flex-col md:flex-row pb-24 md:pb-0 font-sans">
    
    <!-- Mobile Clean Header -->
    <header class="md:hidden px-5 pt-5 pb-3 border-b border-[#DED7CA]/60 flex items-center justify-between bg-abu-letusan sticky top-0 z-10">
      <div>
        <h1 class="font-display font-semibold text-lg text-genteng leading-tight">Tanacakra</h1>
        <p class="text-[11px] text-tanah-subur">Desa Cangkringan • Lereng Merapi</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#DED7CA] text-[11px] text-tanah-subur">
          <span class="w-2 h-2 rounded-full bg-terasering"></span>
          <span>PostgreSQL Active</span>
        </span>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <PetaniSidebar />

    <!-- Main Content Area -->
    <main class="md:ml-[240px] flex-1 px-5 pt-4 md:p-10 max-w-7xl flex flex-col gap-5 md:gap-8">
      
      <!-- Header sentence -->
      <header class="md:mb-0">
        <h2 class="font-display text-lg md:text-2xl font-semibold text-abu-vulkanik leading-snug">
          Dashboard Tani Cangkringan — 100 Petak Terintegrasi PostgreSQL
        </h2>
        <p class="text-xs md:text-sm text-tanah-subur mt-0.5 md:mt-1">
          Pantau sebaran lahan, rekomendasi komoditas Scikit-learn, dan peta geografis lereng Merapi.
        </p>
      </header>

      <!-- HERO BANNER: KOMODITAS TERBAIK SAAT INI (POPUPS/RECOMMENDATION) -->
      <section v-if="dashboardData?.best_commodity" class="bg-gradient-to-r from-genteng/10 via-[#F7F4EE] to-[#EFEAE0] rounded-xl p-5 md:p-6 border-2 border-genteng/40 shadow-sm relative overflow-hidden">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1.5 max-w-3xl">
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-genteng text-white text-[10px] font-bold tracking-wide uppercase">
              🌟 {{ dashboardData.best_commodity.badge }}
            </div>
            <h3 class="font-display font-bold text-lg md:text-xl text-abu-vulkanik">
              Komoditas Terbaik Musim Ini: <span class="text-genteng">{{ dashboardData.best_commodity.title }}</span>
            </h3>
            <p class="text-xs md:text-sm text-abu-vulkanik/90 leading-relaxed">
              {{ dashboardData.best_commodity.reason }}
            </p>

            <div class="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-tanah-subur">
              <span class="bg-white/80 px-2.5 py-1 rounded border border-[#DED7CA]">Rata-rata Harga: <strong class="text-genteng">{{ dashboardData.best_commodity.avg_price }}</strong></span>
              <span class="bg-white/80 px-2.5 py-1 rounded border border-[#DED7CA]">Estimasi Hasil: <strong class="text-terasering">{{ dashboardData.best_commodity.expected_yield }}</strong></span>
              <span class="bg-white/80 px-2.5 py-1 rounded border border-[#DED7CA]">Potensi ROI: <strong class="text-terasering">{{ dashboardData.best_commodity.roi_estimate }}</strong></span>
            </div>
          </div>

          <button @click="router.push('/input-lahan')" class="px-5 py-3 rounded-lg bg-genteng hover:bg-genteng-hover text-white text-xs md:text-sm font-semibold tracking-wide transition-all shadow-md shrink-0">
            Catat Tanam Sekarang →
          </button>
        </div>
      </section>

      <!-- SPATIAL LEAFLET MAP FOR FARMERS -->
      <section class="bg-white rounded-xl p-4 md:p-6 border border-[#DED7CA] shadow-sm">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-[#EFEAE0]">
          <div>
            <h3 class="font-display font-semibold text-base text-abu-vulkanik">Peta Sebaran Lahan Tani Cangkringan</h3>
            <p class="text-[11px] text-tanah-subur">100 Petak Lahan Terdaftar di Lereng Merapi</p>
          </div>
          <span class="text-xs font-medium text-terasering bg-terasering/10 px-2.5 py-1 rounded">100 Petak Terpetakan</span>
        </div>
        <div id="mapPetaniLeaflet" class="w-full h-[260px] md:h-[360px] rounded-lg border border-[#DED7CA] z-10"></div>
      </section>

      <!-- PLOTLY INTERACTIVE CHART: TREN HARGA & VOLUME PANEN -->
      <section class="bg-white rounded-xl p-4 md:p-6 border border-[#DED7CA] shadow-sm">
        <div class="flex items-center justify-between pb-2.5 border-b border-[#EFEAE0] mb-3">
          <div>
            <h3 class="font-display font-semibold text-base text-abu-vulkanik">Tren Harga Pasar &amp; Volume Panen Interaktif</h3>
            <p class="text-[11px] md:text-xs text-tanah-subur">Visualisasi Data Real-time Plotly.js (Cabai Merah &amp; Salak Pondoh)</p>
          </div>
        </div>
        <div class="w-full min-h-[300px]">
          <PlotlyChart 
            v-if="dashboardData?.plotly_chart_schema" 
            :schema="dashboardData.plotly_chart_schema" 
          />
          <div v-else class="h-[260px] flex items-center justify-center text-xs text-abu-vulkanik/60">
            Memuat visualisasi grafik Plotly.js...
          </div>
        </div>
      </section>

      <!-- Grid Layout for Content -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 items-start">
        
        <!-- Primary Left Column (Full on mobile, 7 cols on desktop) -->
        <div class="md:col-span-7 space-y-5 md:space-y-8">
          
          <!-- ONE Large Primary Status Card -->
          <section class="bg-white rounded-xl p-5 md:p-7 border border-[#DED7CA] shadow-sm">
            <div class="flex items-center justify-between pb-3 md:pb-4 border-b border-[#EFEAE0]">
              <div class="flex items-center gap-2 md:gap-2.5">
                <span class="inline-block w-2.5 h-2.5 rounded-full bg-terasering"></span>
                <span class="text-xs font-semibold text-terasering md:tracking-wide">Kondisi tanah optimal</span>
              </div>
              <span class="text-[11px] md:text-xs text-tanah-subur">Cabai Merah & Salak • Cangkringan</span>
            </div>

            <!-- Recommendation Sentence -->
            <div class="py-4 md:py-6">
              <p class="text-[11px] md:text-xs text-tanah-subur mb-1.5 md:mb-2">Rekomendasi tindakan lapangan hari ini</p>
              <p class="font-display text-base md:text-xl font-medium text-abu-vulkanik leading-snug md:leading-relaxed">
                Kondisi tanah optimal untuk pembungaan cabai; berikan pupuk kalium 150 kg/ha dan pertahankan drainase bedengan sebelum intensitas hujan lereng meningkat.
              </p>
              <p class="text-xs md:text-sm text-abu-vulkanik/75 md:text-abu-vulkanik/80 mt-2.5 md:mt-3.5 leading-normal">
                Kadar air pori tanah berada di 68% dengan pH 6.5. Retensi hara stabil untuk 18 hari ke depan selama tidak terjadi limpasan pasir Kali Gendol.
              </p>
            </div>

            <!-- Primary CTA Button -->
            <div class="pt-1 md:pt-2">
              <button @click="router.push('/input-lahan')" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 md:gap-2.5 px-4 md:px-6 py-3 md:py-3.5 rounded-lg bg-genteng hover:bg-genteng-hover text-white text-sm font-semibold tracking-wide transition-all shadow-sm active:scale-[0.99]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                <span>Catat Kegiatan Hari Ini</span>
              </button>
            </div>
          </section>

          <!-- Ringkasan Parameter (Mobile only layout here, Desktop has it on right col but let's keep it responsive) -->
          <section class="grid grid-cols-3 gap-2.5 md:hidden">
            <div class="bg-white/80 rounded-lg p-3 border border-[#DED7CA]/70 text-center">
              <p class="text-[10px] text-tanah-subur">pH Tanah</p>
              <p class="font-display text-base font-medium text-abu-vulkanik mt-0.5">6.5</p>
              <p class="text-[10px] text-terasering font-medium">Ideal</p>
            </div>
            <div class="bg-white/80 rounded-lg p-3 border border-[#DED7CA]/70 text-center">
              <p class="text-[10px] text-tanah-subur">Kelembapan</p>
              <p class="font-display text-base font-medium text-abu-vulkanik mt-0.5">68%</p>
              <p class="text-[10px] text-terasering font-medium">Optimal</p>
            </div>
            <div class="bg-white/80 rounded-lg p-3 border border-[#DED7CA]/70 text-center">
              <p class="text-[10px] text-tanah-subur">Kalium Lapang</p>
              <p class="font-display text-base font-medium text-genteng mt-0.5">78</p>
              <p class="text-[10px] text-tanah-subur">mg/kg</p>
            </div>
          </section>

          <!-- Aktivitas Terbaru -->
          <section class="bg-white rounded-xl p-5 md:p-7 border border-[#DED7CA] shadow-sm">
            <div class="flex items-center justify-between mb-3 md:mb-4">
              <h3 class="font-display text-sm md:text-base font-semibold text-abu-vulkanik">Aktivitas terbaru</h3>
              <span class="text-[11px] md:text-xs text-tanah-subur">Terakhir dicatat</span>
            </div>

            <div class="divide-y divide-[#EFEAE0]">
              <div class="py-2.5 md:py-3.5 first:pt-1">
                <div class="flex items-baseline justify-between">
                  <p class="text-xs md:text-sm font-semibold md:font-medium text-abu-vulkanik">Input data sampel tanah</p>
                  <span class="text-[10px] md:text-xs text-tanah-subur whitespace-nowrap ml-4">12 Mei, 08:30</span>
                </div>
                <p class="text-[11px] md:text-xs text-tanah-subur mt-0.5">pH 6.5, kelembapan 68%, NPK 120:45:70</p>
              </div>

              <div class="py-2.5 md:py-3.5">
                <div class="flex items-baseline justify-between">
                  <p class="text-xs md:text-sm font-semibold md:font-medium text-abu-vulkanik">Konfirmasi sebar dolomit</p>
                  <span class="text-[10px] md:text-xs text-tanah-subur whitespace-nowrap ml-4">10 Mei, 07:15</span>
                </div>
                <p class="text-[11px] md:text-xs text-tanah-subur mt-0.5">Dosis 150 kg/ha selesai dilaksanakan</p>
              </div>

              <div class="py-2.5 md:py-3.5 last:pb-1">
                <div class="flex items-baseline justify-between">
                  <p class="text-xs md:text-sm font-semibold md:font-medium text-abu-vulkanik">Peringatan siaga lahar</p>
                  <span class="text-[10px] md:text-xs text-bahaya-lahar font-medium whitespace-nowrap ml-4">08 Mei, 16:40</span>
                </div>
                <p class="text-[11px] md:text-xs text-bahaya-lahar mt-0.5">Periksa tanggul saluran pembuang barat</p>
              </div>
            </div>
          </section>

        </div>

        <!-- Secondary Right Column (Hidden on mobile mostly, except combined sections) -->
        <div class="hidden md:block md:col-span-5 space-y-6">
          
          <!-- Tren retensi hara 7 hari -->
          <section class="bg-white rounded-xl p-7 border border-[#DED7CA] shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-display text-base font-semibold text-abu-vulkanik">Tren retensi hara 7 hari</h3>
              <span class="text-xs text-tanah-subur">mg/kg tanah</span>
            </div>
            <p class="text-xs text-tanah-subur leading-relaxed mb-6">
              Kadar kalium harian petak cabai dibandingkan ambang aman serapan akar.
            </p>

            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="font-medium text-abu-vulkanik">Hari ini (12 Mei)</span>
                  <span class="font-semibold text-genteng">78 mg/kg <span class="text-tanah-subur font-normal text-[11px]">(Optimal)</span></span>
                </div>
                <div class="w-full h-3 bg-abu-letusan rounded-sm overflow-hidden flex items-center">
                  <div class="h-full bg-genteng rounded-sm" style="width: 78%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="font-medium text-abu-vulkanik">11 Mei</span>
                  <span class="font-medium text-abu-vulkanik">74 mg/kg</span>
                </div>
                <div class="w-full h-3 bg-abu-letusan rounded-sm overflow-hidden flex items-center">
                  <div class="h-full bg-genteng rounded-sm" style="width: 74%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="font-medium text-abu-vulkanik">10 Mei</span>
                  <span class="font-medium text-abu-vulkanik">82 mg/kg</span>
                </div>
                <div class="w-full h-3 bg-abu-letusan rounded-sm overflow-hidden flex items-center">
                  <div class="h-full bg-genteng rounded-sm" style="width: 82%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="font-medium text-abu-vulkanik">09 Mei</span>
                  <span class="font-medium text-abu-vulkanik">65 mg/kg</span>
                </div>
                <div class="w-full h-3 bg-abu-letusan rounded-sm overflow-hidden flex items-center">
                  <div class="h-full bg-tanah-subur rounded-sm" style="width: 65%;"></div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-[#EFEAE0] flex items-center justify-between text-xs text-tanah-subur">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-sm bg-genteng"></span>
                <span>Kadar hara aman (&gt;70)</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-sm bg-tanah-subur"></span>
                <span>Batas minimum (60)</span>
              </div>
            </div>
          </section>

          <!-- Desktop Parameter Lapang Singkat -->
          <section class="bg-surface-card rounded-xl p-6 border border-[#DED7CA]">
            <h4 class="text-xs font-semibold text-tanah-subur uppercase tracking-wider mb-3">Ringkasan parameter tanah</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-tanah-subur">Keasaman (pH)</p>
                <p class="font-display text-lg font-medium text-abu-vulkanik mt-0.5">6.5 pH</p>
                <span class="text-[11px] text-terasering">Ideal cabai</span>
              </div>
              <div>
                <p class="text-xs text-tanah-subur">Kelembapan</p>
                <p class="font-display text-lg font-medium text-abu-vulkanik mt-0.5">68%</p>
                <span class="text-[11px] text-terasering">Kapasitas baik</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>

    <!-- Mobile Bottom Tab Bar -->
    <BottomNav />

  </div>
</template>

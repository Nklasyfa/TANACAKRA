<script setup lang="ts">
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { LahanService, AdminService } from '../services/api'

import AdminSidebar from '../components/AdminSidebar.vue'
import AdminBottomNav from '../components/AdminBottomNav.vue'

const map = ref<any>(null)
const markersGroup = ref<any>(null)
const lahanList = ref<any[]>([])
const dashboardStats = ref<any>({
  total_lahan: 100,
  sehat_count: 78,
  perlu_atensi_count: 22,
  avg_ph: 6.3,
  avg_moisture: '68%',
  weekly_reports: 42,
  price_trends: []
})

const initMap = () => {
  if (map.value) return
  map.value = L.map('mapLeaflet', {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([-7.64, 110.44], 12)

  // CartoDB Voyager Minimalist Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map.value)

  // Initialize MarkerClusterGroup
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
}

const loadData = async () => {
  initMap()

  try {
    const [lahans, trends] = await Promise.all([
      LahanService.getAllLahan(),
      AdminService.getDashboardTrends().catch(() => null)
    ])

    lahanList.value = lahans || []
    if (trends) {
      dashboardStats.value = trends
    }

    if (map.value && markersGroup.value && lahanList.value.length > 0) {
      markersGroup.value.clearLayers()

      lahanList.value.forEach((item: any) => {
        const params = item.input_parameters || {}
        const lat = parseFloat(params.latitude)
        const lng = parseFloat(params.longitude)
        const farmId = params.farm_id || ('CGK' + String(item.id).padStart(3, '0'))
        const desa = params.desa || 'Cangkringan'
        const ph = parseFloat(params.soil_ph || 6.5)
        const soilType = params.soil_type || 'Regosol Vulkanik'
        const areaHa = params.area_ha || 1.0
        const elevation = params.elevation_m || 600
        const organicC = params.organic_carbon || 2.1
        const isSehat = ph >= 6.0

        if (!isNaN(lat) && !isNaN(lng)) {
          // Requirement 3: Use L.circleMarker (radius 7px) with Green (#4E7C40) or Red (#B3542C)
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

          // Requirement 5: Detailed Popup on-click
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
                ${isSehat ? '🟢 Retensi hara stabil, rekomendasi tanaman cabai/tomat.' : '🔴 Disarankan penambahan dolomit 150 kg/ha.'}
              </div>
            </div>
          `
          marker.bindPopup(popupContent)
          markersGroup.value.addLayer(marker)
        }
      })
    }
  } catch (err) {
    console.error('Gagal memuat data dashboard:', err)
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-abu-letusan text-abu-vulkanik font-sans antialiased selection:bg-genteng/20 selection:text-genteng flex flex-col md:flex-row pb-24 md:pb-0">

    <!-- Mobile Top App Bar -->
    <header class="md:hidden sticky top-0 z-20 bg-[#EFEAE0]/95 backdrop-blur-sm border-b border-[#DFD9CD] px-4 py-3 flex items-center justify-between">
      <div>
        <h1 class="font-display font-semibold text-[19px] tracking-tight text-genteng leading-none">Tanacakra</h1>
        <p class="text-[11px] text-tanah-subur mt-1 font-medium">Dashboard Admin • Cangkringan</p>
      </div>
      <div class="flex items-center gap-1">
        <button class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#DFD9CD]/60 text-abu-vulkanik">
          <span class="material-symbols-outlined text-[20px]">notifications</span>
        </button>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <AdminSidebar />

    <!-- MAIN CONTENT AREA -->
    <main class="md:ml-60 flex-1 p-4 md:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-5 md:space-y-8">

      <!-- Context Sentence & Filter -->
      <div class="bg-[#F7F4EE] rounded-lg md:rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="font-display font-semibold text-lg md:text-2xl text-abu-vulkanik">Sebaran Lahan Desa Cangkringan</h2>
            <p class="text-[13px] md:text-sm text-abu-vulkanik/80 font-medium leading-relaxed mt-1">
              5 Desa, {{ dashboardStats.total_lahan }} lahan terdaftar ({{ dashboardStats.total_tanam || 480 }} histori tanam &amp; {{ dashboardStats.total_panen || 480 }} histori panen).
            </p>
          </div>
          <div class="flex items-center justify-between md:justify-start gap-4 pt-2 md:pt-0 border-t md:border-0 border-[#DFD9CD]/60 text-xs text-tanah-subur font-medium">
            <div class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#DFD9CD]">
              <span class="material-symbols-outlined text-[16px]">calendar_today</span>
              <span>PostgreSQL Master Sync</span>
            </div>
          </div>
        </div>
      </div>

      <!-- POPUP / PANEL RECOMMENDATION KOMODITAS TERBAIK SAAT INI -->
      <section v-if="dashboardStats?.best_commodity" class="bg-gradient-to-r from-genteng/10 via-[#F7F4EE] to-[#EFEAE0] rounded-xl p-5 md:p-6 border-2 border-genteng/40 shadow-sm">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1.5">
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-genteng text-white text-[10px] font-bold tracking-wide uppercase">
              🌟 {{ dashboardStats.best_commodity.badge }}
            </div>
            <h3 class="font-display font-bold text-lg md:text-xl text-abu-vulkanik">
              Komoditas Rekomendasi Utama: <span class="text-genteng">{{ dashboardStats.best_commodity.title }}</span>
            </h3>
            <p class="text-xs md:text-sm text-abu-vulkanik/90 leading-relaxed max-w-3xl">
              {{ dashboardStats.best_commodity.reason }}
            </p>
            <div class="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-tanah-subur">
              <span class="bg-white px-2.5 py-1 rounded border border-[#DFD9CD]">Harga Rata-Rata: <strong class="text-genteng">{{ dashboardStats.best_commodity.avg_price }}</strong></span>
              <span class="bg-white px-2.5 py-1 rounded border border-[#DFD9CD]">Estimasi Yield: <strong class="text-terasering">{{ dashboardStats.best_commodity.expected_yield }}</strong></span>
              <span class="bg-white px-2.5 py-1 rounded border border-[#DFD9CD]">Total Histori Panen: <strong class="text-abu-vulkanik">{{ dashboardStats.total_produksi_ton || 4236.6 }} Ton</strong></span>
            </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 items-start">
        <!-- Main Column (Map and Chart) -->
        <div class="lg:col-span-8 space-y-5 md:space-y-8">
          
          <!-- HERO ELEMENT: SPATIAL MAP -->
          <div class="bg-[#F7F4EE] rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-[#DFD9CD]/70 mb-3 md:mb-4">
              <div>
                <h2 class="font-display font-semibold text-base md:text-lg text-abu-vulkanik">Peta Sebaran Lahan</h2>
                <p class="text-[11px] md:text-xs text-tanah-subur">Status tanah vulkanik &amp; alur Kali Gendol ({{ dashboardStats.total_lahan }} Petak)</p>
              </div>
            </div>

            <!-- Map Legend -->
            <div class="flex items-center gap-4 text-[11px] md:text-xs font-medium pb-2.5 md:pb-4">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-terasering inline-block"></span>
                <span class="text-abu-vulkanik">Sehat ({{ dashboardStats.sehat_count }})</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-bahaya-lahar inline-block"></span>
                <span class="text-abu-vulkanik">Perlu atensi / risiko ({{ dashboardStats.perlu_atensi_count }})</span>
              </div>
            </div>

            <!-- Leaflet Map Container -->
            <div id="mapLeaflet" class="w-full h-[240px] md:h-[350px] rounded-lg border border-[#DFD9CD] overflow-hidden z-10">
            </div>
          </div>

          <!-- TREND CHART -->
          <div class="bg-[#F7F4EE] rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm">
            <div class="flex items-center justify-between pb-2.5 border-b border-[#DFD9CD]/60">
              <div>
                <h3 class="font-display font-semibold text-sm md:text-base text-abu-vulkanik">Tren Harga &amp; Volume Panen</h3>
                <p class="text-[11px] md:text-xs text-tanah-subur">Cabai Merah &amp; Salak Pondoh (Dataset Excel)</p>
              </div>
            </div>

            <!-- Legend -->
            <div class="flex items-center gap-3 text-[11px] md:text-xs font-medium pt-2 md:pt-4 pb-1 md:pb-3">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 bg-genteng inline-block"></span>
                <span class="text-abu-vulkanik">Cabai Merah (Rp/kg)</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 bg-tanah-subur inline-block"></span>
                <span class="text-abu-vulkanik">Salak Pondoh (Rp/kg)</span>
              </div>
            </div>

            <div class="w-full h-[160px] md:h-[220px] mt-1 relative border-l border-b border-[#DFD9CD]">
              <svg class="w-full h-full absolute inset-0" viewBox="0 0 320 150" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M10,90 C50,40 100,120 150,60 C200,30 250,70 310,40" stroke="#B3542C" stroke-width="2.5" fill="none"></path>
                <circle cx="10" cy="90" r="4" fill="#B3542C"></circle>
                <circle cx="85" cy="50" r="4" fill="#B3542C"></circle>
                <circle cx="160" cy="60" r="4" fill="#B3542C"></circle>
                <circle cx="235" cy="45" r="4" fill="#B3542C"></circle>
                <circle cx="310" cy="40" r="4" fill="#B3542C"></circle>

                <path d="M10,80 C50,35 100,110 150,75 C200,45 250,55 310,35" stroke="#5C4A32" stroke-width="2.5" fill="none"></path>
                <circle cx="10" cy="80" r="4" fill="#5C4A32"></circle>
                <circle cx="85" cy="35" r="4" fill="#5C4A32"></circle>
                <circle cx="160" cy="75" r="4" fill="#5C4A32"></circle>
                <circle cx="235" cy="55" r="4" fill="#5C4A32"></circle>
                <circle cx="310" cy="35" r="4" fill="#5C4A32"></circle>
              </svg>
              <div class="absolute bottom-0 w-full flex justify-between px-4 text-[10px] md:text-xs text-tanah-subur -mb-5">
                <span v-for="t in dashboardStats.price_trends.slice(-5)" :key="t.month">{{ t.month }}</span>
              </div>
            </div>
            <p class="text-[11px] md:text-xs text-tanah-subur mt-8 md:mt-10">
              Tren fluktuasi harga komoditas utama lereng Merapi berdasarkan dataset 360 histori transaksi pasar.
            </p>
          </div>
        </div>

        <!-- Sidebar Right Column -->
        <div class="lg:col-span-4 space-y-5 md:space-y-8">
          
          <!-- KEY NUMBERS COMPACT -->
          <div class="bg-[#F7F4EE] rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm">
            <h3 class="font-display font-semibold text-sm md:text-base text-abu-vulkanik mb-4">Ringkasan Sistem</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-white border border-[#DFD9CD] rounded-lg">
                <div class="text-[11px] md:text-xs font-medium text-tanah-subur">Total lahan aktif</div>
                <div class="mt-1 flex items-baseline gap-1.5">
                  <span class="font-display text-xl md:text-2xl font-bold text-abu-vulkanik">{{ dashboardStats.total_lahan }}</span>
                  <span class="text-[10px] md:text-xs text-terasering font-medium">{{ dashboardStats.sehat_count }} sehat</span>
                </div>
              </div>
              <div class="p-3 bg-white border border-[#DFD9CD] rounded-lg">
                <div class="text-[11px] md:text-xs font-medium text-tanah-subur">Rata-rata pH</div>
                <div class="mt-1 flex items-baseline gap-1.5">
                  <span class="font-display text-xl md:text-2xl font-bold text-abu-vulkanik">{{ dashboardStats.avg_ph }}</span>
                </div>
              </div>
              <div class="p-3 bg-white border border-[#DFD9CD] rounded-lg">
                <div class="text-[11px] md:text-xs font-medium text-tanah-subur">Kelembapan</div>
                <div class="mt-1 flex items-baseline gap-1.5">
                  <span class="font-display text-xl md:text-2xl font-bold text-abu-vulkanik">{{ dashboardStats.avg_moisture }}</span>
                </div>
              </div>
              <div class="p-3 bg-white border border-[#DFD9CD] rounded-lg">
                <div class="text-[11px] md:text-xs font-medium text-tanah-subur">Laporan minggu ini</div>
                <div class="mt-1 flex items-baseline gap-1.5">
                  <span class="font-display text-xl md:text-2xl font-bold text-genteng">{{ dashboardStats.weekly_reports }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RECOMMENDATION FEED -->
          <div class="bg-[#F7F4EE] rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-[#DFD9CD]/60">
              <h3 class="font-display font-semibold text-sm md:text-base text-abu-vulkanik">Rekomendasi Tindakan</h3>
              <span class="text-[11px] md:text-xs font-semibold text-genteng">3 Perlu Tindakan</span>
            </div>

            <!-- Card 1: Urgent -->
            <div class="p-3.5 rounded-lg bg-[#F1E5E1] border border-[#E4D1CA] shadow-sm">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] md:text-xs font-bold text-bahaya-lahar">Prioritas Tinggi • Blok B</span>
                <span class="text-[10px] md:text-xs text-tanah-subur">08:30 WIB</span>
              </div>
              <p class="text-xs md:text-sm text-abu-vulkanik leading-relaxed">
                Lahan Blok B: produktivitas turun 3 bulan berturut, cek irigasi sektor utara dan periksa rembesan endapan pasir kali.
              </p>
              <button class="mt-3 text-[11px] md:text-xs font-semibold text-bahaya-lahar hover:underline block">
                Tugaskan penyuluh lapangan →
              </button>
            </div>

            <!-- Card 2: Moderate -->
            <div class="p-3.5 rounded-lg bg-white border border-[#DFD9CD] shadow-sm">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] md:text-xs font-bold text-genteng">Rekomendasi Pupuk • Blok A</span>
                <span class="text-[10px] md:text-xs text-tanah-subur">Kemarin</span>
              </div>
              <p class="text-xs md:text-sm text-abu-vulkanik leading-relaxed">
                Lahan Blok A menunjukkan retensi hara kalium membaik; sarankan penambahan dolomit 150 kg per hektar sebelum tanam cabai berikutnya.
              </p>
              <button class="mt-3 text-[11px] md:text-xs font-semibold text-genteng hover:underline block">
                Kirim broadcast ke petani →
              </button>
            </div>

            <!-- Card 3: Normal -->
            <div class="p-3.5 rounded-lg bg-white border border-[#DFD9CD] shadow-sm">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] md:text-xs font-bold text-terasering">Kesiapan Panen • Blok D</span>
                <span class="text-[10px] md:text-xs text-tanah-subur">10 Mei 2024</span>
              </div>
              <p class="text-xs md:text-sm text-abu-vulkanik leading-relaxed">
                Komoditas salak pondoh Blok D Glagaharjo memasuki fase panen optimal dalam 5 hari ke depan; koordinasikan jadwal angkut posko tani.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </main>

    <!-- FIXED BOTTOM TAB BAR (Admin) -->
    <AdminBottomNav />

  </div>
</template>

<style scoped>
.fill {
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}
</style>

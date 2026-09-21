<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { LahanService, type LandInputPayload, downloadCsv } from '@/services/api'
// Leaflet imports
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminBottomNav from '@/components/admin/AdminBottomNav.vue'
import PlotlyChart from '@/components/shared/PlotlyChart.vue'

const lahanList = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedDesa = ref('all')
const isDrawerOpen = ref(false)
const selectedLahan = ref<any>(null)
// Map state
const showMap = ref(false)
const map = ref<any>(null)
const markersGroup = ref<any>(null)
const mapLeaflet = ref<HTMLElement | null>(null)

const handleExportCsv = () => {
  const dataToExport = filteredLahan.value.map(item => {
    const p = item.input_parameters || {}
    const ph = parseFloat(p.pH || p.soil_ph || 6.5)
    return {
      'ID Lahan': p.farm_id || ('LHN-' + item.id),
      'Desa': p.desa || 'Cangkringan',
      'Tipe Tanah': p.soil_type || 'Regosol Vulkanik',
      'pH Tanah': ph,
      'Status Lahan': ph >= 6.0 ? 'Subur' : 'Perlu Atensi',
      'Kelembapan (%)': p.kelembapan || p.humidity_percent || 60,
      'Nitrogen (N)': p.nitrogen || p.n || 100,
      'Fosfor (P)': p.fosfor || p.p || 35,
      'Kalium (K)': p.kalium || p.k || 130,
      'Luas (Ha)': p.area_ha || 1.0,
      'Elevasi (mdpl)': p.elevation_m || 600,
      'Irigasi': p.irrigation || 'Teknis',
      'Karbon Organik (%)': p.organic_carbon || 2.1,
      'Latitude': p.latitude || '',
      'Longitude': p.longitude || '',
      'Tanggal Catat': item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : 'Hari ini'
    }
  })
  downloadCsv('tanacakra_lahan_cangkringan.csv', dataToExport)
}

const fetchLahanData = async () => {
  try {
    isLoading.value = true
    const data = await LahanService.getAllLahan()
    lahanList.value = data
  } catch (err) {
    console.error('Gagal mengambil data lahan:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchLahanData()
})

const filteredLahan = computed(() => {
  return lahanList.value.filter(item => {
    const params = item.input_parameters || {}
    const query = searchQuery.value.toLowerCase()
    const farmId = (params.farm_id || '').toLowerCase()
    const desa = (params.desa || '').toLowerCase()
    const soilType = (params.soil_type || '').toLowerCase()

    const matchesSearch = farmId.includes(query) || desa.includes(query) || soilType.includes(query)
    const matchesDesa = selectedDesa.value === 'all' || desa.toLowerCase() === selectedDesa.value.toLowerCase()

    return matchesSearch && matchesDesa
  })
})

const openDrawer = (item: any) => {
  selectedLahan.value = item
  isDrawerOpen.value = true
}

const closeDrawer = () => {
  isDrawerOpen.value = false
  selectedLahan.value = null
}

// ============ CATAT SAMPLE (Admin → ML Inference) ============
const isSampleOpen = ref(false)
const sampleFarmId = ref('')
const samplePh = ref(6.5)
const sampleMoisture = ref(55)
const sampleKondisi = ref<'Kering' | 'Lembab' | 'Basah'>('Lembab')
const sampleN = ref(100)
const sampleP = ref(35)
const sampleK = ref(130)
const isSubmittingSample = ref(false)
const sampleResult = ref<any>(null)
const samplePlotly = ref<any>(null)
const sampleError = ref('')

const KONDISI_MOISTURE: Record<string, number> = { Kering: 30, Lembab: 55, Basah: 80 }

const moistureToKondisi = (moisture: number): 'Kering' | 'Lembab' | 'Basah' => {
  if (moisture < 40) return 'Kering'
  if (moisture <= 62) return 'Lembab'
  return 'Basah'
}

const onKondisiChange = () => {
  sampleMoisture.value = KONDISI_MOISTURE[sampleKondisi.value]
}

const onMoistureChange = () => {
  sampleKondisi.value = moistureToKondisi(sampleMoisture.value)
}

const openSample = (item?: any) => {
  const farm = item
    ? item
    : (filteredLahan.value[0] || lahanList.value[0])
  const params = farm?.input_parameters || {}
  sampleFarmId.value = (params.farm_id || 'CGK001')
  samplePh.value = parseFloat(params.soil_ph) || 6.5
  sampleKondisi.value = 'Lembab'
  sampleMoisture.value = 55
  sampleResult.value = null
  samplePlotly.value = null
  sampleError.value = ''
  isSampleOpen.value = true
}

const closeSample = () => {
  isSampleOpen.value = false
  sampleResult.value = null
  samplePlotly.value = null
  sampleError.value = ''
}

const submitSample = async () => {
  isSubmittingSample.value = true
  sampleError.value = ''
  sampleResult.value = null
  samplePlotly.value = null

  const payload: LandInputPayload & { kondisi_tanah: string } = {
    pH: parseFloat(samplePh.value.toString()),
    kelembapan: parseInt(sampleMoisture.value.toString()),
    nitrogen: parseInt(sampleN.value.toString()),
    fosfor: parseInt(sampleP.value.toString()),
    kalium: parseInt(sampleK.value.toString()),
    kondisi_tanah: sampleKondisi.value
  }

  try {
    const res = await LahanService.inputLahan(sampleFarmId.value, payload)
    sampleResult.value = res.engine_output?.prediction_result
    samplePlotly.value = res.plotly_schema
  } catch (err: any) {
    console.error('Error menjalankan rekomendasi ML:', err)
    const detail =
      err.response?.data?.error ||
      err.response?.data?.details ||
      err.message
    sampleError.value = detail
      ? `Gagal: ${detail}`
      : 'Gagal terhubung ke backend Django REST API. Pastikan server berjalan di 127.0.0.1:8000.'
  } finally {
    isSubmittingSample.value = false
  }
}

// Pre-select first lahan when the form is opened
const onSampleFarmChange = (farmId: string) => {
  sampleFarmId.value = farmId
  const farm = lahanList.value.find(
    (f: any) => f.input_parameters?.farm_id === farmId
  )
  if (farm?.input_parameters?.soil_ph) {
    samplePh.value = parseFloat(farm.input_parameters.soil_ph)
  }
}

// Map functions
const initMap = () => {
  if (map.value) return
  if (!mapLeaflet.value) return
  map.value = L.map(mapLeaflet.value).setView([-7.64, 110.44], 12)

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

const addMarkers = (list: any[]) => {
  if (!map.value || !markersGroup.value) return
  markersGroup.value.clearLayers()

  list.forEach((item: any, idx: number) => {
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

    const markerColor = isSehat ? '#6FA05C' : '#B23A24'
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
          <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; color: white; background-color: ${isSehat ? '#6FA05C' : '#B23A24'};">
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
          ${isSehat ? '🟢 Status tanah baik.' : '🔴 Butuh pengapuran dolomit.'}
        </div>
      </div>
    `
    marker.bindPopup(popupContent)
    markersGroup.value.addLayer(marker)
  })
}

// Watch for map visibility
watch(
  () => showMap.value,
  async (val) => {
    if (val) {
      await nextTick()
      initMap()
      if (lahanList.value.length) {
        addMarkers(lahanList.value)
      } else {
        const fallbackList = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          input_parameters: {
            farm_id: 'CGK' + String(i + 1).padStart(3, '0'),
            desa: ['Wukirsari', 'Argomulyo', 'Glagahharjo', 'Kepuharjo', 'Umbulharjo'][i % 5],
            soil_ph: (5.2 + (i % 25) * 0.1).toFixed(1),
            soil_type: 'Regosol Vulkanik',
            area_ha: (0.5 + (i % 4) * 0.5).toFixed(1),
            elevation_m: 550 + (i % 10) * 20,
            organic_carbon: (1.5 + (i % 5) * 0.3).toFixed(1)
          }
        }))
        addMarkers(fallbackList)
      }
    } else {
      if (map.value) {
        map.value.remove()
        map.value = null
      }
    }
  }
)

// Watch for lahan data changes to update markers
watch(
  () => lahanList.value,
  (list) => {
    if (map.value && list.length) {
      addMarkers(list)
    }
  }
)
</script>

<template>
  <div class="min-h-screen bg-[#fff8f4] text-[#231a10] font-sans antialiased flex flex-col md:flex-row pb-[88px] md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden sticky top-0 w-full z-30 bg-[#fff8f4]/95 backdrop-blur-md border-b border-[#E8E3DA] px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5">
            <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto" />
            <img src="@/assets/tanacakra-wordmark.svg" alt="Tanacakra" class="h-4 w-auto" />
          </div>
          <p class="text-[11px] text-[#243319] mt-0.5 font-medium">Manajemen Lahan • {{ lahanList.length }} petak terdaftar</p>
        </div>
        <div class="flex items-center gap-1">
          <button @click="openSample()" class="w-9 h-9 flex items-center justify-center hover:bg-[#EFECE6] rounded-full transition-colors" title="Catat Sample ML">
            <span class="material-symbols-outlined text-[20px]">auto_awesome</span>
          </button>
          <button @click="fetchLahanData" class="p-2 hover:bg-[#EFECE6] transition-colors rounded-full">
            <span class="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <main class="w-full md:ml-[240px] flex-1 p-4 md:pt-8 md:p-8 min-w-0 max-w-[1200px] mx-auto">

      <!-- Content Header (Desktop) -->
      <header class="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl md:text-[28px] font-bold text-[#231a10] tracking-tight">Manajemen Lahan Pertanian</h2>
          <p class="text-[13px] text-[#645d58] mt-1">Inventarisasi {{ lahanList.length }} petak lahan lereng Merapi dan tata kelola pipeline data tanah.</p>
        </div>
        <div class="flex items-center gap-2.5 shrink-0">
          <button @click="handleExportCsv" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#243319] hover:bg-[#3A4A2E] text-[#D5E9C3] rounded-lg shadow-sm transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">download</span>
            <span>Ekspor CSV Lahan</span>
          </button>
          <button @click="openSample()" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-[#A8452A] hover:bg-[#923c24] text-white rounded-lg shadow-sm transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>Catat Sample ML</span>
          </button>
          <button @click="fetchLahanData" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white hover:bg-[#FDEBDB] text-[#231a10] border border-[#E2D8C7] rounded-lg shadow-sm transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[16px] text-[#645d58]">refresh</span>
            <span>Refresh Data</span>
          </button>
          <button @click="showMap = !showMap" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white hover:bg-[#FDEBDB] text-[#231a10] border border-[#E2D8C7] rounded-lg shadow-sm transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[16px] text-[#645d58]">{{ showMap ? 'grid_view' : 'map' }}</span>
            <span>{{ showMap ? 'Tabel Data' : 'Peta Lahan' }}</span>
          </button>
        </div>
      </header>

      <!-- Filter Toolbar -->
      <section class="bg-[#F3ECE0] border border-[#E2D8C7] rounded-xl p-3 md:p-3.5 mb-4 md:mb-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:flex-wrap items-center gap-3">
          <div class="w-full md:flex-1 md:min-w-[260px] relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-[#75786f]/70 pointer-events-none">
              <span class="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input v-model="searchQuery" type="text" placeholder="Cari ID lahan (misal: CGK001), nama desa..." class="w-full pl-9 pr-4 py-2 md:py-2 text-xs md:text-sm bg-white border border-[#E2D8C7] rounded-lg focus:ring-1 focus:ring-[#A8452A] outline-none" />
          </div>
          <div class="hidden md:block w-48">
            <select v-model="selectedDesa" class="w-full py-2 px-3 text-xs bg-white border border-[#E2D8C7] rounded-lg focus:ring-1 focus:ring-[#A8452A] outline-none">
              <option value="all">Semua Desa (Cangkringan)</option>
              <option value="Wukirsari">Wukirsari</option>
              <option value="Argomulyo">Argomulyo</option>
              <option value="Umbulharjo">Umbulharjo</option>
              <option value="Kepuharjo">Kepuharjo</option>
              <option value="Glagaharjo">Glagaharjo</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12 bg-white border border-[#E2D8C7] rounded-xl">
        <span class="material-symbols-outlined animate-spin text-3xl text-[#75786f]">sync</span>
        <p class="text-xs text-[#645d58] mt-2">Memuat data 100 lahan Cangkringan dari PostgreSQL...</p>
      </div>

      <!-- Land Data Table (Desktop) -->
      <section v-else class="hidden md:block bg-white border border-[#E2D8C7] rounded-xl shadow-sm overflow-hidden mb-6">
        <div class="overflow-x-auto max-h-[600px]">
          <table class="w-full text-left border-collapse">
            <thead class="bg-[#F3ECE0] border-b border-[#E2D8C7] text-[11px] font-semibold text-[#645d58] tracking-wider sticky top-0 z-10">
              <tr>
                <th class="py-3 px-4 w-28">ID Lahan</th>
                <th class="py-3 px-4 w-40">Desa</th>
                <th class="py-3 px-4 w-32">pH Tanah</th>
                <th class="py-3 px-4 w-36">Elevasi &amp; Luas</th>
                <th class="py-3 px-4 w-44">Tipe Tanah</th>
                <th class="py-3 px-4 w-32">Irigasi</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#FDEBDB] text-xs">
              <tr v-for="item in filteredLahan" :key="item.id" class="hover:bg-[#FFF1E6]/60 transition-colors cursor-pointer" @click="openDrawer(item)">
                <td class="py-3 px-4 font-mono font-semibold text-[#243319]">{{ item.input_parameters?.farm_id || ('LHN-' + item.id) }}</td>
                <td class="py-3 px-4 font-medium text-[#231a10]">{{ item.input_parameters?.desa || 'Cangkringan' }}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold" :class="(item.input_parameters?.soil_ph < 6.0) ? 'bg-[#FFDAD6] text-[#93000a]' : 'bg-[#EEF2E6] text-[#3A4A2E]'">
                    pH {{ item.input_parameters?.soil_ph || 6.5 }}
                  </span>
                </td>
                <td class="py-3 px-4 text-[#231a10]">
                  <div>{{ item.input_parameters?.elevation_m || 600 }} mdpl</div>
                  <div class="text-[10px] text-[#75786f]">{{ item.input_parameters?.area_ha || 1.0 }} ha</div>
                </td>
                <td class="py-3 px-4 text-[#645d58] text-[11px]">{{ item.input_parameters?.soil_type || 'Regosol Vulkanik' }}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#FDEBDB] text-[#645d58]">
                    {{ item.input_parameters?.irrigation || 'Teknis' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right whitespace-nowrap">
                  <button class="px-2.5 py-1 text-xs font-medium text-[#3A4A2E] bg-[#EEF2E6] hover:bg-[#D5E9C3] rounded transition-colors" @click.stop="openSample(item)">
                    Catat Sample
                  </button>
                  <button class="ml-1 px-2.5 py-1 text-xs font-medium text-[#645d58] bg-[#F3ECE0] hover:bg-[#E2D8C7] rounded transition-colors" @click.stop="openDrawer(item)">
                    Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Land Cards List (Mobile) -->
      <section v-if="!isLoading" class="md:hidden space-y-3 mb-6">
        <article v-for="item in filteredLahan" :key="'mob-' + item.id" class="bg-white border border-[#E2D8C7] rounded-xl p-3.5 shadow-sm" @click="openDrawer(item)">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <span class="text-[10px] font-mono font-bold tracking-wider text-[#243319]">{{ item.input_parameters?.farm_id || ('LHN-' + item.id) }}</span>
              <h2 class="font-semibold text-[14px] text-[#231a10] leading-snug">Desa {{ item.input_parameters?.desa || 'Cangkringan' }}</h2>
              <p class="text-[10px] text-[#645d58]">{{ item.input_parameters?.soil_type || 'Regosol Vulkanik' }}</p>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold" :class="(item.input_parameters?.soil_ph < 6.0) ? 'bg-[#FFDAD6] text-[#93000a]' : 'bg-[#EEF2E6] text-[#3A4A2E]'">
              pH {{ item.input_parameters?.soil_ph || 6.5 }}
            </span>
          </div>
          <div class="bg-[#FFF1E6] rounded-lg p-2.5 my-2 grid grid-cols-2 gap-2 text-[11px] border border-[#F2DFCF]">
            <div>
              <span class="text-[9px] text-[#645d58] block uppercase tracking-wider">Luas Lahan</span>
              <span class="font-semibold text-[#231a10]">{{ item.input_parameters?.area_ha || 1.0 }} ha</span>
            </div>
            <div>
              <span class="text-[9px] text-[#645d58] block uppercase tracking-wider">Elevasi</span>
              <span class="font-semibold text-[#231a10]">{{ item.input_parameters?.elevation_m || 600 }} mdpl</span>
            </div>
          </div>
        </article>
      </section>

      <!-- Map View (Desktop) -->
      <section v-if="showMap" class="hidden md:block w-full h-[500px] mt-4 rounded-xl overflow-hidden border border-[#E2D8C7] shadow-inner bg-[#EFECE6]">
        <div ref="mapLeaflet" class="w-full h-full"></div>
      </section>
    </main>

    <!-- Detail Drawer / Bottom Sheet -->
    <div v-if="isDrawerOpen && selectedLahan" class="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div class="absolute inset-0" @click="closeDrawer"></div>

      <div class="relative w-full md:w-[420px] h-full mt-auto md:mt-0 max-h-[88vh] md:max-h-full bg-white md:border-l border-t md:border-t-0 border-[#E2D8C7] shadow-2xl flex flex-col rounded-t-2xl md:rounded-none">
        <div class="px-4 md:px-5 py-3 md:py-4 border-b border-[#E2D8C7] flex items-center justify-between bg-[#FFF8F4]">
          <div>
            <p class="text-xs text-[#A8452A] font-semibold">Detail Lahan Cangkringan</p>
            <h3 class="text-base font-bold text-[#231a10]">{{ selectedLahan.input_parameters?.farm_id }} — {{ selectedLahan.input_parameters?.desa }}</h3>
          </div>
          <button @click="closeDrawer" class="p-1 rounded-full hover:bg-[#F3ECE0] text-[#645d58]">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 text-xs md:text-sm">
          <div class="bg-[#FFF1E6] p-3 rounded-lg border border-[#F2DFCF] space-y-2">
            <div class="flex justify-between"><span class="text-[#645d58]">Tipe Tanah:</span><span class="font-semibold text-[#231a10]">{{ selectedLahan.input_parameters?.soil_type }}</span></div>
            <div class="flex justify-between"><span class="text-[#645d58]">pH Tanah:</span><span class="font-bold text-[#243319]">{{ selectedLahan.input_parameters?.soil_ph }}</span></div>
            <div class="flex justify-between"><span class="text-[#645d58]">Karbon Organik:</span><span class="font-semibold text-[#231a10]">{{ selectedLahan.input_parameters?.organic_carbon }}%</span></div>
            <div class="flex justify-between"><span class="text-[#645d58]">Irigasi:</span><span class="font-semibold text-[#231a10]">{{ selectedLahan.input_parameters?.irrigation }}</span></div>
            <div class="flex justify-between"><span class="text-[#645d58]">Elevasi:</span><span class="font-semibold text-[#231a10]">{{ selectedLahan.input_parameters?.elevation_m }} mdpl</span></div>
            <div class="flex justify-between"><span class="text-[#645d58]">Luas Petak:</span><span class="font-semibold text-[#231a10]">{{ selectedLahan.input_parameters?.area_ha }} ha</span></div>
            <div class="flex justify-between"><span class="text-[#645d58]">Koordinat:</span><span class="font-mono text-[11px] text-[#231a10]">{{ selectedLahan.input_parameters?.latitude }}, {{ selectedLahan.input_parameters?.longitude }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Catat Sample ML Modal / Bottom Sheet -->
    <div v-if="isSampleOpen" class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div class="absolute inset-0" @click="closeSample"></div>

      <div class="relative w-full md:max-w-2xl max-h-[92vh] md:h-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col md:border md:border-[#E2D8C7]">
        <div class="px-4 md:px-6 py-4 border-b border-[#E2D8C7] flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <p class="text-xs text-[#A8452A] font-semibold">Rekomendasi Scikit-learn</p>
            <h3 class="text-base md:text-lg font-bold text-[#231a10]">Catat Sample Lahan</h3>
          </div>
          <button @click="closeSample" class="p-1 rounded-full hover:bg-[#F3ECE0] text-[#645d58]">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          <!-- Pilih Petak -->
          <div>
            <label class="block text-xs font-bold text-[#231a10] mb-1.5">Pilih Petak Lahan</label>
            <select :value="sampleFarmId" @change="onSampleFarmChange(($event.target as HTMLSelectElement).value)" class="w-full py-2 px-3 text-sm font-semibold text-[#231a10] bg-[#FFF8F4] border border-[#E2D8C7] rounded-xl focus:ring-1 focus:ring-[#A8452A] outline-none">
              <option v-for="item in filteredLahan" :key="'sf-' + item.id" :value="item.input_parameters?.farm_id || ('LHN-' + item.id)">
                {{ item.input_parameters?.farm_id || ('LHN-' + item.id) }} — Desa {{ item.input_parameters?.desa || 'Cangkringan' }}
              </option>
            </select>
            <p class="text-[11px] text-[#645d58] mt-1">Parameter akan terhubung ke endpoint <code class="font-mono">/lahan/:id/input</code> Django.</p>
          </div>

          <!-- Kondisi Tanah (Standardized) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-[#231a10] mb-1.5">Kondisi Tanah</label>
              <select v-model="sampleKondisi" @change="onKondisiChange" class="w-full py-2 px-3 text-sm font-semibold text-[#231a10] bg-[#FFF8F4] border border-[#E2D8C7] rounded-xl focus:ring-1 focus:ring-[#A8452A] outline-none">
                <option value="Kering">Kering</option>
                <option value="Lembab">Lembab</option>
                <option value="Basah">Basah</option>
              </select>
            </div>
            <div>
              <label for="sample-moisture" class="block text-xs font-bold text-[#231a10] mb-1.5">Kelembapan lapang (%)</label>
              <input v-model="sampleMoisture" id="sample-moisture" @input="onMoistureChange" type="range" min="0" max="100" step="5"
                class="w-full mt-2.5 accent-[#A8452A] cursor-pointer">
              <div class="flex items-baseline gap-1 mt-1">
                <span class="text-lg font-bold text-[#243319]">{{ sampleMoisture }}</span>
                <span class="text-[11px] font-medium text-[#645d58]">%</span>
              </div>
            </div>
          </div>

          <!-- pH -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="sample-ph" class="text-xs font-bold text-[#231a10]">Derajat keasaman (pH)</label>
              <span class="text-lg font-bold text-[#243319]">{{ samplePh }} pH</span>
            </div>
            <input v-model="samplePh" id="sample-ph" type="range" min="0" max="14" step="0.1"
              class="w-full h-2.5 bg-gradient-to-r from-[#93000a] via-[#3A4A2E] to-[#75786f]/50 rounded-lg appearance-none cursor-pointer">
          </div>

          <!-- N-P-K -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label for="sample-n" class="block text-xs font-semibold text-[#231a10] mb-1">Nitrogen (N)</label>
              <input v-model="sampleN" id="sample-n" type="number" class="w-full py-2 px-3 text-sm font-semibold text-[#231a10] bg-[#FFF8F4] border border-[#E2D8C7] rounded-xl">
            </div>
            <div>
              <label for="sample-p" class="block text-xs font-semibold text-[#231a10] mb-1">Fosfor (P)</label>
              <input v-model="sampleP" id="sample-p" type="number" class="w-full py-2 px-3 text-sm font-semibold text-[#231a10] bg-[#FFF8F4] border border-[#E2D8C7] rounded-xl">
            </div>
            <div>
              <label for="sample-k" class="block text-xs font-semibold text-[#231a10] mb-1">Kalium (K)</label>
              <input v-model="sampleK" id="sample-k" type="number" class="w-full py-2 px-3 text-sm font-semibold text-[#231a10] bg-[#FFF8F4] border border-[#E2D8C7] rounded-xl">
            </div>
          </div>

          <!-- Error -->
          <p v-if="sampleError" class="text-xs text-[#93000a] font-medium bg-[#FFDAD6] border border-[#E9C5BE] rounded-lg p-2.5">{{ sampleError }}</p>

          <!-- Submit -->
          <button @click="submitSample" :disabled="isSubmittingSample" class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#A8452A] hover:bg-[#923c24] text-white font-semibold text-sm rounded-xl shadow-sm transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed">
            <template v-if="!isSubmittingSample">
              <span class="material-symbols-outlined text-[20px]">auto_awesome</span>
              <span>Proses Rekomendasi ML</span>
            </template>
            <template v-else>
              <span class="material-symbols-outlined animate-spin text-[20px]">sync</span>
              <span>Menjalankan Scikit-learn...</span>
            </template>
          </button>

          <!-- ML Result -->
          <div v-if="sampleResult" class="border-2 border-[#3A4A2E] rounded-2xl p-4 space-y-3 bg-[#FFF8F4]">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2DFCF] pb-3">
              <h4 class="text-base font-bold text-[#231a10]">Hasil Rekomendasi Petak {{ sampleFarmId }}</h4>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[11px] px-2.5 py-1 bg-[#EEF2E6] text-[#3A4A2E] rounded-full font-bold">Panen: {{ sampleResult.estimasi_hasil_panen_ton_ha || '15.5' }} ton/ha</span>
                <span class="text-[11px] px-2.5 py-1 bg-[#EEF2E6] text-[#3A4A2E] rounded-full font-semibold">Status: {{ sampleResult.status_kesehatan }}</span>
              </div>
            </div>
            <ul class="space-y-2">
              <li v-for="(rec, idx) in sampleResult.rekomendasi_tindakan" :key="'rec-' + idx" class="flex items-start gap-2 text-xs text-[#231a10] font-semibold bg-[#FFF1E6] p-2.5 rounded-lg border border-[#F2DFCF]">
                <span class="material-symbols-outlined text-[#3A4A2E] text-[18px]">check_circle</span>
                <span>{{ rec }}</span>
              </li>
            </ul>
            <p class="text-[11px] text-[#645d58] italic">{{ sampleResult.catatan_lokasi }}</p>
            <div v-if="samplePlotly" class="bg-[#FFF1E6] rounded-xl p-2 border border-[#F2DFCF] h-[280px] md:h-[320px]">
              <PlotlyChart :schema="samplePlotly" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Admin Bottom Navigation (Mobile) -->
    <AdminBottomNav />

  </div>
</template>

<style scoped>
.fill {
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}
</style>

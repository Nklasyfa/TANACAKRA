<script setup lang="ts">
import PetaniSidebar from '@/components/petani/PetaniSidebar.vue'
import BottomNav from '@/components/petani/BottomNav.vue'
import PlotlyChart from '@/components/shared/PlotlyChart.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { LahanService, type LandInputPayload } from '@/services/api'
import { fetchCuacaCangkringan, type CuacaInfo } from '@/services/weather'

const router = useRouter()

// Step state: 1 | 2 | 3 | 'loading' | 'success'
const currentStep = ref<1 | 2 | 3 | 'loading' | 'success'>(1)

// Form State
const fieldName = ref('Blok A - Rojolele')
const fieldArea = ref(1200)
const selectedFarmId = ref('CGK001')
const availableFarms = ref<any[]>([])

// Map & Geolocation state
let map: L.Map | null = null
let mapMarker: L.Marker | null = null
const coords = ref({ lat: -7.664200, lng: 110.418900 })
const isLocating = ref(false)
const locateMsg = ref('Gunakan lokasi saya')

// Map Location Search state
const searchMapQuery = ref('')
const isSearchingMap = ref(false)
const searchStatusMsg = ref('')

const searchLocationOnMap = async () => {
  const queryText = searchMapQuery.value.trim() || fieldName.value.trim()
  if (!queryText) {
    searchStatusMsg.value = 'Ketik nama desa atau blok terlebih dahulu.'
    return
  }

  isSearchingMap.value = true
  searchStatusMsg.value = ''

  try {
    const fullQuery = encodeURIComponent(`${queryText}, Cangkringan, Sleman, Yogyakarta`)
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fullQuery}`)
    const data = await res.json()

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)

      coords.value = { lat, lng }
      if (map && mapMarker) {
        map.flyTo([lat, lng], 15)
        mapMarker.setLatLng([lat, lng])
      }
      searchStatusMsg.value = `📍 Peta berpindah ke lokasi: ${data[0].display_name.split(',')[0]}`
    } else {
      const fallbackQuery = encodeURIComponent(`${queryText}, Sleman, Yogyakarta`)
      const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fallbackQuery}`)
      const fallbackData = await fallbackRes.json()

      if (fallbackData && fallbackData.length > 0) {
        const lat = parseFloat(fallbackData[0].lat)
        const lng = parseFloat(fallbackData[0].lon)
        coords.value = { lat, lng }
        if (map && mapMarker) {
          map.flyTo([lat, lng], 15)
          mapMarker.setLatLng([lat, lng])
        }
        searchStatusMsg.value = `📍 Peta berpindah ke: ${fallbackData[0].display_name.split(',')[0]}`
      } else {
        searchStatusMsg.value = '⚠️ Nama lokasi tidak ditemukan di pencarian peta. Silakan geser pin secara manual.'
      }
    }
  } catch (err) {
    searchStatusMsg.value = '⚠️ Gagal mencari lokasi. Silakan geser pin pada peta secara manual.'
  } finally {
    isSearchingMap.value = false
  }
}

const quickSelectDesa = (desaName: string) => {
  searchMapQuery.value = desaName
  searchLocationOnMap()
}

// Soil Condition state
const kondisiTanah = ref<'Kering' | 'Lembab' | 'Basah'>('Lembab')
const phValue = ref(6.5)
const nValue = ref(140)
const pValue = ref(45)
const kValue = ref(190)

// API submission & loading simulation states
const errorMessage = ref('')
const mlResult = ref<any>(null)
const plotlySchema = ref<any>(null)
const cuacaReal = ref<CuacaInfo | null>(null)

// Simulation steps DOM states
const progStage = ref<1 | 2 | 3>(1)

// Fetch initial farm list & weather
const fetchFarms = async () => {
  try {
    const list = await LahanService.getAllLahan()
    availableFarms.value = list
    if (list.length > 0) {
      const f = list[0]
      if (f.input_parameters) {
        selectedFarmId.value = f.input_parameters.farm_id || 'CGK001'
        if (f.input_parameters.soil_ph) phValue.value = f.input_parameters.soil_ph
      }
    }
  } catch (err) {
    console.error('Error fetching farm list:', err)
  }
}

onMounted(() => {
  fetchFarms()
  fetchCuacaCangkringan()
    .then((c) => {
      if (c) cuacaReal.value = c
    })
    .catch(() => undefined)

  nextTick(() => {
    initMap()
  })
})

const initMap = () => {
  const el = document.getElementById('leafletMapContainer')
  if (!el) return

  if (map) {
    map.remove()
    map = null
  }

  map = L.map(el, {
    center: [coords.value.lat, coords.value.lng],
    zoom: 14,
    zoomControl: false
  })

  L.control.zoom({ position: 'bottomleft' }).addTo(map)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  const customIcon = L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="width:28px; height:28px; background:#A8452A; border:3px solid #FFFFFF; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; cursor:grab;">
        <div style="width:8px; height:8px; background:#FFFFFF; border-radius:50%; margin:auto;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  })

  mapMarker = L.marker([coords.value.lat, coords.value.lng], {
    draggable: true,
    icon: customIcon
  }).addTo(map)

  mapMarker.on('drag', (e: any) => {
    const pos = e.target.getLatLng()
    coords.value.lat = pos.lat
    coords.value.lng = pos.lng
  })

  mapMarker.on('dragend', (e: any) => {
    const pos = e.target.getLatLng()
    coords.value.lat = pos.lat
    coords.value.lng = pos.lng
  })
}

const handleLocateMe = () => {
  if ('geolocation' in navigator) {
    isLocating.value = true
    locateMsg.value = 'Mencari lokasi...'
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coords.value.lat = pos.coords.latitude
        coords.value.lng = pos.coords.longitude
        if (map && mapMarker) {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 16)
          mapMarker.setLatLng([pos.coords.latitude, pos.coords.longitude])
        }
        locateMsg.value = 'Lokasi didapat'
        isLocating.value = false
        setTimeout(() => {
          locateMsg.value = 'Gunakan lokasi saya'
        }, 2500)
      },
      () => {
        locateMsg.value = 'Gagal mendeteksi'
        isLocating.value = false
        setTimeout(() => {
          locateMsg.value = 'Gunakan lokasi saya'
        }, 2500)
      }
    )
  }
}

const switchStep = (target: 1 | 2 | 3) => {
  currentStep.value = target
  if (target === 1) {
    nextTick(() => {
      if (map) map.invalidateSize()
    })
  }
}

const selectMoisture = (val: 'Kering' | 'Lembab' | 'Basah') => {
  kondisiTanah.value = val
}

const phStatusNote = (ph: number) => {
  if (ph < 6.0) return 'Asam (Perlu Dolomit)'
  if (ph <= 7.0) return 'Netral/Subur (Optimal)'
  return 'Alkali/Basa'
}

const submitData = async () => {
  currentStep.value = 'loading'
  progStage.value = 1
  errorMessage.value = ''
  mlResult.value = null
  plotlySchema.value = null

  const moistureMap = { Kering: 30, Lembab: 55, Basah: 80 }
  const payload: LandInputPayload & { kondisi_tanah: string; field_name: string; area_sqm: number; latitude: number; longitude: number } = {
    pH: parseFloat(phValue.value.toString()),
    kelembapan: moistureMap[kondisiTanah.value],
    nitrogen: parseInt(nValue.value.toString()),
    fosfor: parseInt(pValue.value.toString()),
    kalium: parseInt(kValue.value.toString()),
    kondisi_tanah: kondisiTanah.value,
    field_name: fieldName.value,
    area_sqm: fieldArea.value,
    latitude: coords.value.lat,
    longitude: coords.value.lng
  }

  // Trigger real backend call with responsive progress feedback
  try {
    progStage.value = 1
    const resPromise = LahanService.inputLahan(selectedFarmId.value, payload)
    
    // Quick progress stages
    setTimeout(() => { progStage.value = 2 }, 300)
    setTimeout(() => { progStage.value = 3 }, 600)

    const res = await resPromise
    mlResult.value = res.engine_output?.prediction_result
    plotlySchema.value = res.plotly_schema
    currentStep.value = 'success'
  } catch (err: any) {
    console.error('Error submitting land data:', err)
    if (err.response && err.response.data && err.response.data.error) {
      errorMessage.value = err.response.data.error
    } else {
      errorMessage.value = 'Gagal menyimpan data lahan. Silakan periksa koneksi Anda.'
    }
    // Jika benar-benar gagal, kembalikan ke form (bukan success)
    currentStep.value = 1
  }
}

const resetForm = () => {
  currentStep.value = 1
  nextTick(() => {
    if (map) map.invalidateSize()
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#fff8f4] text-[#231a10] font-sans antialiased flex flex-col md:flex-row pb-[88px] md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden px-5 pt-5 pb-3 border-b border-[#E5E0D8] flex items-center justify-between bg-[#fff8f4] sticky top-0 z-30 shadow-sm">
      <div class="flex items-center gap-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto" />
        <span class="font-headline-lg text-lg font-bold text-[#243319]">Tanacakra</span>
      </div>
      <button @click="router.back()" class="text-xs font-semibold text-[#A8452A] flex items-center gap-1">
        <span class="material-symbols-outlined text-[16px]">arrow_back</span>
        Kembali
      </button>
    </header>

    <PetaniSidebar />

    <main class="md:ml-[240px] flex-1 w-full px-4 md:px-8 lg:px-12 pt-5 md:pt-8 flex flex-col items-center">
      <div class="w-full max-w-[640px] space-y-5 pb-16">

        <!-- Editorial Context Title -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs uppercase tracking-widest text-[#645d58] font-bold">Formulir Lahan Baru</span>
            <span class="text-xs text-[#243319] font-bold bg-[#EBF2E5] px-3 py-1 rounded-full border border-[#d5e9c3]">Siklus Tanam II &middot; 2026</span>
          </div>
          <h1 class="font-headline-xl text-[28px] md:text-[34px] font-normal text-[#243319] leading-tight">Catat Data Lahan</h1>
          <p class="text-sm text-[#4A4036] leading-relaxed font-normal">
            Input berkala kondisi fisik tanah dan lokasi petak untuk sinkronisasi model pertumbuhan tanaman berbasis mikroklimat Merapi.
          </p>
        </div>

        <!-- 1. STRIP CUACA (Cross-check Cuaca BMKG) -->
        <div class="bg-white rounded-xl p-3.5 sm:px-4 sm:py-3.5 shadow-sm border border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div class="flex items-center gap-2.5 text-[#4A3F35]">
            <span class="material-symbols-outlined text-[20px] text-[#243319] shrink-0">routine</span>
            <div class="text-sm leading-snug font-medium text-[#4A3F35]">
              <template v-if="cuacaReal">
                <span class="font-bold text-[#241F1B]">Suhu {{ Math.round(cuacaReal.suhu) }}°C</span> &middot; Kelembapan {{ Math.round(cuacaReal.kelembaban) }}% &middot; {{ cuacaReal.label }}
              </template>
              <template v-else>
                <span class="font-bold text-[#241F1B]">Suhu 28°C</span> &middot; Kelembapan 78% &middot; Hujan 2 mm &middot; Angin 12 km/jam
              </template>
            </div>
          </div>
          <div class="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div class="text-[11px] text-[#8A7A68] bg-[#F9F7F4] px-2.5 py-1 rounded uppercase font-bold tracking-wider border border-[#E5E0D8]">
              Sumber: {{ cuacaReal ? cuacaReal.sumber : 'BMKG' }}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 px-1 -mt-2 text-[#8A7A68]">
          <span class="material-symbols-outlined text-[14px]">info</span>
          <p class="text-[11px] leading-normal font-medium">
            Gunakan data cuaca ini untuk membandingkan kelembapan tanah di lapangan.
          </p>
        </div>

        <!-- 2. INDIKATOR LANGKAH (Step Progress Tabs) -->
        <div v-if="currentStep !== 'loading' && currentStep !== 'success'" class="bg-white rounded-xl p-1.5 shadow-sm border border-[#E5E0D8]">
          <nav aria-label="Tahapan formulir" class="grid grid-cols-3 text-center gap-1">
            <button
              type="button"
              @click="switchStep(1)"
              class="py-2.5 px-2 rounded-lg text-center transition-all duration-200 border-b-2 font-semibold flex items-center justify-center gap-1.5"
              :class="currentStep === 1 ? 'border-[#A8452A] text-[#A8452A] bg-[#FBF2EC]' : 'border-transparent text-[#8A7A68] hover:text-[#241F1B]'"
            >
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono" :class="currentStep === 1 ? 'bg-[#A8452A] text-white' : 'bg-[#E5E0D8] text-[#7E7063]'">1</span>
              <span class="text-xs">Lahan</span>
            </button>
            <button
              type="button"
              @click="switchStep(2)"
              class="py-2.5 px-2 rounded-lg text-center transition-all duration-200 border-b-2 font-semibold flex items-center justify-center gap-1.5"
              :class="currentStep === 2 ? 'border-[#A8452A] text-[#A8452A] bg-[#FBF2EC]' : 'border-transparent text-[#8A7A68] hover:text-[#241F1B]'"
            >
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono" :class="currentStep === 2 ? 'bg-[#A8452A] text-white' : 'bg-[#E5E0D8] text-[#7E7063]'">2</span>
              <span class="text-xs">Kondisi Tanah</span>
            </button>
            <button
              type="button"
              @click="switchStep(3)"
              class="py-2.5 px-2 rounded-lg text-center transition-all duration-200 border-b-2 font-semibold flex items-center justify-center gap-1.5"
              :class="currentStep === 3 ? 'border-[#A8452A] text-[#A8452A] bg-[#FBF2EC]' : 'border-transparent text-[#8A7A68] hover:text-[#241F1B]'"
            >
              <span class="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono" :class="currentStep === 3 ? 'bg-[#A8452A] text-white' : 'bg-[#E5E0D8] text-[#7E7063]'">3</span>
              <span class="text-xs">Periksa</span>
            </button>
          </nav>
        </div>

        <!-- FORM CONTAINER -->
        <div class="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-[#E5E0D8] transition-all duration-300">

          <!-- STEP 1: IDENTITAS & LETAK LAHAN -->
          <section v-if="currentStep === 1" class="space-y-5">
            <div class="space-y-1">
              <h2 class="font-headline-lg text-xl font-bold text-[#243319]">Identitas &amp; Letak Lahan</h2>
              <p class="text-xs text-[#7E7063]">Tentukan blok tanam dan sesuaikan titik koordinat pusat petak.</p>
            </div>

            <div class="space-y-4">
              <!-- Input Nama Lahan -->
              <div class="space-y-1.5">
                <label for="field_name" class="text-xs text-[#241F1B] block font-bold">
                  Nama atau blok lahan <span class="text-[#A8452A]">*</span>
                </label>
                <input
                  id="field_name"
                  v-model="fieldName"
                  type="text"
                  placeholder="Contoh: Blok A - Rojolele"
                  class="w-full h-11 px-3.5 bg-[#F9F7F4] text-[#241F1B] text-sm font-semibold rounded-xl border border-[#E5E0D8] focus:outline-none focus:ring-2 focus:ring-[#A8452A] transition"
                />
              </div>

              <!-- Input Luas Lahan -->
              <div class="space-y-1.5">
                <label for="field_area" class="text-xs text-[#241F1B] block font-bold">
                  Luas lahan (m²) <span class="text-[#A8452A]">*</span>
                </label>
                <div class="relative flex items-center">
                  <input
                    id="field_area"
                    v-model.number="fieldArea"
                    type="number"
                    placeholder="1200"
                    class="w-full h-11 pl-3.5 pr-12 bg-[#F9F7F4] text-[#241F1B] text-sm font-semibold rounded-xl border border-[#E5E0D8] focus:outline-none focus:ring-2 focus:ring-[#A8452A] transition"
                  />
                  <span class="absolute right-3.5 text-[#7E7063] text-xs font-bold pointer-events-none">m²</span>
                </div>
              </div>

              <!-- Peta Preview Interaktif Leaflet -->
              <div class="space-y-2.5 pt-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-[#241F1B] font-bold">Peta Petak Lahan</span>
                  <span class="text-[11px] text-[#7E7063]">Cari desa/lokasi atau seret pin</span>
                </div>

                <!-- Input Pencarian Lokasi Peta Otimatis -->
                <div class="flex items-center gap-2">
                  <div class="relative flex-1">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7E7063] text-[18px]">search</span>
                    <input
                      v-model="searchMapQuery"
                      @keyup.enter="searchLocationOnMap"
                      type="text"
                      placeholder="Cari lokasi desa/blok (misal: Kepuharjo, Argomulyo)..."
                      class="w-full h-10 pl-9 pr-3 bg-[#F9F7F4] text-[#241F1B] text-xs font-semibold rounded-xl border border-[#E5E0D8] focus:outline-none focus:ring-2 focus:ring-[#A8452A] transition"
                    />
                  </div>
                  <button
                    type="button"
                    @click="searchLocationOnMap"
                    :disabled="isSearchingMap"
                    class="h-10 px-3.5 bg-[#243319] hover:bg-[#1b2613] text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0 transition disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <span class="material-symbols-outlined text-[16px]" :class="isSearchingMap ? 'animate-spin' : ''">{{ isSearchingMap ? 'sync' : 'location_searching' }}</span>
                    <span>Cari</span>
                  </button>
                </div>

                <!-- Quick Village Preset Chips -->
                <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span class="text-[11px] text-[#7E7063] font-semibold">Pilih Desa:</span>
                  <button
                    v-for="desa in ['Cangkringan', 'Argomulyo', 'Wukirsari', 'Kepuharjo', 'Glagahharjo', 'Umbulharjo']"
                    :key="desa"
                    type="button"
                    @click="quickSelectDesa(desa)"
                    class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EBF2E5] text-[#243319] hover:bg-[#243319] hover:text-white border border-[#d5e9c3] transition cursor-pointer"
                  >
                    📍 {{ desa }}
                  </button>
                </div>

                <p v-if="searchStatusMsg" class="text-[11px] font-semibold text-[#A8452A] bg-[#FBF2EC] px-3 py-1.5 rounded-lg border border-[#F3ECE0] leading-snug">
                  {{ searchStatusMsg }}
                </p>
                <div class="relative rounded-2xl overflow-hidden shadow-inner h-[320px] bg-[#E5E0D8] border border-[#E5E0D8]">
                  <!-- Leaflet Map Div Container -->
                  <div id="leafletMapContainer" class="w-full h-full z-10"></div>
                  <!-- Floating Geolocation Button -->
                  <button
                    type="button"
                    @click="handleLocateMe"
                    :disabled="isLocating"
                    class="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur text-[#243319] hover:text-[#A8452A] px-3 py-1.5 rounded-xl shadow-md text-xs font-bold transition hover:bg-white border border-[#E5E0D8]"
                  >
                    <span class="material-symbols-outlined text-[16px]" :class="isLocating ? 'animate-spin' : ''">
                      {{ isLocating ? 'sync' : 'my_location' }}
                    </span>
                    <span>{{ locateMsg }}</span>
                  </button>
                </div>
                <!-- Readonly Koordinat Telemetri -->
                <div class="grid grid-cols-2 gap-2.5 pt-1">
                  <div class="bg-[#F9F7F4] px-3 py-2 rounded-xl border border-[#E5E0D8]">
                    <span class="block text-[10px] text-[#7E7063] uppercase font-bold tracking-wider">Garis Lintang (Latitude)</span>
                    <span class="font-mono text-xs font-bold text-[#243319]">{{ coords.lat.toFixed(6) }}</span>
                  </div>
                  <div class="bg-[#F9F7F4] px-3 py-2 rounded-xl border border-[#E5E0D8]">
                    <span class="block text-[10px] text-[#7E7063] uppercase font-bold tracking-wider">Garis Bujur (Longitude)</span>
                    <span class="font-mono text-xs font-bold text-[#243319]">{{ coords.lng.toFixed(6) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tombol Lanjut Step 1 -->
            <div class="pt-3">
              <button
                type="button"
                @click="switchStep(2)"
                class="w-full h-[50px] bg-[#A8452A] hover:bg-[#923c24] text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Lanjut ke Kondisi Tanah</span>
                <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </section>

          <!-- STEP 2: KONDISI TANAH -->
          <section v-if="currentStep === 2" class="space-y-6">
            <div class="space-y-1">
              <h2 class="font-headline-lg text-xl font-bold text-[#243319]">Kondisi &amp; Kadar Tanah</h2>
              <p class="text-xs text-[#7E7063]">Bagaimana kondisi tanah saat ini di petak pengamatan?</p>
            </div>

            <!-- Tiga Kartu Pilihan Kelembapan -->
            <div class="space-y-2">
              <label class="text-xs text-[#241F1B] block font-bold">Keadaan Permukaan Tanah</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <!-- Kering -->
                <div
                  @click="selectMoisture('Kering')"
                  class="cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all border"
                  :class="kondisiTanah === 'Kering' ? 'bg-[#FBF2EC] border-[#A8452A] ring-2 ring-[#A8452A]' : 'bg-[#F9F7F4] border-[#E5E0D8] hover:border-[#3A4A2E]/40'"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="kondisiTanah === 'Kering' ? 'bg-[#A8452A] text-white' : 'bg-white text-[#243319] shadow-sm'">
                      <span class="material-symbols-outlined text-[18px]">wb_sunny</span>
                    </div>
                    <div class="w-4 h-4 rounded-full flex items-center justify-center" :class="kondisiTanah === 'Kering' ? 'bg-[#A8452A]' : 'bg-[#E5E0D8]'">
                      <span v-if="kondisiTanah === 'Kering'" class="w-1.5 h-1.5 rounded-full bg-white"></span>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm font-bold" :class="kondisiTanah === 'Kering' ? 'text-[#A8452A]' : 'text-[#241F1B]'">Kering</p>
                    <p class="text-[11px] text-[#7E7063] leading-snug mt-0.5">Rengkah halus, debu lepas, butuh irigasi.</p>
                  </div>
                </div>

                <!-- Lembab -->
                <div
                  @click="selectMoisture('Lembab')"
                  class="cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all border"
                  :class="kondisiTanah === 'Lembab' ? 'bg-[#FBF2EC] border-[#A8452A] ring-2 ring-[#A8452A]' : 'bg-[#F9F7F4] border-[#E5E0D8] hover:border-[#3A4A2E]/40'"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="kondisiTanah === 'Lembab' ? 'bg-[#A8452A] text-white' : 'bg-white text-[#243319] shadow-sm'">
                      <span class="material-symbols-outlined text-[18px]">water_drop</span>
                    </div>
                    <div class="w-4 h-4 rounded-full flex items-center justify-center" :class="kondisiTanah === 'Lembab' ? 'bg-[#A8452A]' : 'bg-[#E5E0D8]'">
                      <span v-if="kondisiTanah === 'Lembab'" class="w-1.5 h-1.5 rounded-full bg-white"></span>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm font-bold" :class="kondisiTanah === 'Lembab' ? 'text-[#A8452A]' : 'text-[#241F1B]'">Lembab (Ideal)</p>
                    <p class="text-[11px] text-[#7E7063] leading-snug mt-0.5">Gembur dingin, menempel ringan di tangan.</p>
                  </div>
                </div>

                <!-- Basah -->
                <div
                  @click="selectMoisture('Basah')"
                  class="cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all border"
                  :class="kondisiTanah === 'Basah' ? 'bg-[#FBF2EC] border-[#A8452A] ring-2 ring-[#A8452A]' : 'bg-[#F9F7F4] border-[#E5E0D8] hover:border-[#3A4A2E]/40'"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="kondisiTanah === 'Basah' ? 'bg-[#A8452A] text-white' : 'bg-white text-[#243319] shadow-sm'">
                      <span class="material-symbols-outlined text-[18px]">waves</span>
                    </div>
                    <div class="w-4 h-4 rounded-full flex items-center justify-center" :class="kondisiTanah === 'Basah' ? 'bg-[#A8452A]' : 'bg-[#E5E0D8]'">
                      <span v-if="kondisiTanah === 'Basah'" class="w-1.5 h-1.5 rounded-full bg-white"></span>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm font-bold" :class="kondisiTanah === 'Basah' ? 'text-[#A8452A]' : 'text-[#241F1B]'">Basah</p>
                    <p class="text-[11px] text-[#7E7063] leading-snug mt-0.5">Genangan pori, liat lengket berlumpur.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Slider Tingkat pH Tanah -->
            <div class="bg-[#F9F7F4] rounded-2xl p-5 border border-[#E5E0D8] space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-[#241F1B] block">Tingkat Keasaman (pH)</span>
                  <span class="text-[11px] text-[#7E7063]">Uji kertas lakmus atau pH-meter tanah</span>
                </div>
                <div class="flex items-baseline gap-1 bg-white px-3 py-1 rounded-xl border border-[#E5E0D8]">
                  <span class="font-headline-xl text-2xl font-bold text-[#A8452A]">{{ phValue }}</span>
                  <span class="text-xs text-[#7E7063] font-bold">pH</span>
                </div>
              </div>
              <input
                v-model.number="phValue"
                type="range"
                min="4.0"
                max="9.0"
                step="0.1"
                class="tnc-range"
              />
              <!-- Keterangan 3 Zona pH -->
              <div class="flex justify-between items-center text-center pt-1">
                <div class="text-left">
                  <span class="block text-[10px] uppercase tracking-wider text-[#7E7063] font-bold">Rendah</span>
                  <span class="text-[11px] font-semibold text-rose-700">&lt; 6.0 (Asam)</span>
                </div>
                <div class="px-3 py-1 rounded-full bg-[#EBF2E5] text-[#243319] border border-[#d5e9c3]">
                  <span class="block text-[10px] uppercase tracking-wider text-[#243319] font-bold">Optimal</span>
                  <span class="text-[11px] font-bold">6.0 - 7.0 (Netral Subur)</span>
                </div>
                <div class="text-right">
                  <span class="block text-[10px] uppercase tracking-wider text-[#7E7063] font-bold">Tinggi</span>
                  <span class="text-[11px] font-semibold text-[#7E7063]">&gt; 7.0 (Basa)</span>
                </div>
              </div>
            </div>

            <!-- Tiga Slider Unsur Hara (N-P-K) -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-xs text-[#241F1B] font-bold">Kandungan Hara Tanah (Uji Lapangan)</label>
                <span class="text-[11px] text-[#7E7063]">Satuan ppm (mg/kg)</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <!-- N -->
                <div class="bg-[#F9F7F4] rounded-2xl p-4 border border-[#E5E0D8] space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[#243319]">Nitrogen (N)</span>
                    <span class="font-mono text-xs font-bold text-[#A8452A]">{{ nValue }} ppm</span>
                  </div>
                  <input v-model.number="nValue" type="range" min="20" max="300" step="5" class="tnc-range" />
                  <span class="block text-[10px] text-[#7E7063]">Pertumbuhan daun</span>
                </div>
                <!-- P -->
                <div class="bg-[#F9F7F4] rounded-2xl p-4 border border-[#E5E0D8] space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[#243319]">Fosfor (P)</span>
                    <span class="font-mono text-xs font-bold text-[#A8452A]">{{ pValue }} ppm</span>
                  </div>
                  <input v-model.number="pValue" type="range" min="10" max="100" step="1" class="tnc-range" />
                  <span class="block text-[10px] text-[#7E7063]">Akar &amp; bulir padi</span>
                </div>
                <!-- K -->
                <div class="bg-[#F9F7F4] rounded-2xl p-4 border border-[#E5E0D8] space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[#243319]">Kalium (K)</span>
                    <span class="font-mono text-xs font-bold text-[#A8452A]">{{ kValue }} ppm</span>
                  </div>
                  <input v-model.number="kValue" type="range" min="50" max="400" step="5" class="tnc-range" />
                  <span class="block text-[10px] text-[#7E7063]">Daya tahan hama</span>
                </div>
              </div>
            </div>

            <!-- Tombol Aksi Step 2 -->
            <div class="pt-2 flex items-center gap-3">
              <button
                type="button"
                @click="switchStep(1)"
                class="w-1/3 h-[50px] bg-[#F9F7F4] hover:bg-[#E5E0D8] text-[#241F1B] font-bold text-xs rounded-xl border border-[#E5E0D8] flex items-center justify-center gap-1.5 transition"
              >
                <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Kembali</span>
              </button>
              <button
                type="button"
                @click="switchStep(3)"
                class="w-2/3 h-[50px] bg-[#A8452A] hover:bg-[#923c24] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
              >
                <span>Lanjut ke Periksa Data</span>
                <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </section>

          <!-- STEP 3: PERIKSA & KIRIM -->
          <section v-if="currentStep === 3" class="space-y-5">
            <!-- Peringatan Error -->
            <div v-if="errorMessage" class="p-3 sm:p-4 rounded-xl bg-[#FBF0DB] text-[#92400E] border border-[#D97706]/25 flex items-start gap-3">
              <span class="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
              <p class="text-[13px] font-medium leading-relaxed">{{ errorMessage }}</p>
            </div>
            
            <div class="space-y-1">
              <h2 class="font-headline-lg text-xl font-bold text-[#243319]">Periksa Rincian Data</h2>
              <p class="text-xs text-[#7E7063]">Pastikan seluruh data pengamatan telah sesuai sebelum dihitung oleh model cerdas.</p>
            </div>

            <!-- Ringkasan Nilai Terstruktur -->
            <div class="bg-[#F9F7F4] rounded-2xl p-4 sm:p-5 border border-[#E5E0D8] space-y-2.5">
              <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8]">
                <span class="text-xs text-[#7E7063] font-medium">Nama / Blok Lahan</span>
                <span class="text-xs font-bold text-[#241F1B]">{{ fieldName || 'Blok A - Rojolele' }}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8]">
                <span class="text-xs text-[#7E7063] font-medium">Luas Lahan</span>
                <span class="text-xs font-bold text-[#241F1B]">{{ fieldArea.toLocaleString('id-ID') }} m²</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8]">
                <span class="text-xs text-[#7E7063] font-medium">Titik Koordinat</span>
                <span class="font-mono text-xs font-bold text-[#241F1B]">{{ coords.lat.toFixed(6) }}, {{ coords.lng.toFixed(6) }}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8]">
                <span class="text-xs text-[#7E7063] font-medium">Kondisi Tanah</span>
                <span class="text-xs font-bold text-[#241F1B] flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full" :class="phValue >= 6.0 && phValue <= 7.0 ? 'bg-[#243319]' : 'bg-[#A8452A]'"></span>
                  <span>{{ kondisiTanah }} &bull; Status: {{ phStatusNote(phValue) }}</span>
                </span>
              </div>
              <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8]">
                <span class="text-xs text-[#7E7063] font-medium">Nilai Keasaman (pH)</span>
                <span class="font-mono text-xs font-bold text-[#241F1B]">{{ phValue }} ({{ phStatusNote(phValue) }})</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8]">
                <span class="text-xs text-[#7E7063] font-medium">Kadar Hara (N-P-K)</span>
                <span class="font-mono text-xs font-bold text-[#241F1B]">N: {{ nValue }} ppm &middot; P: {{ pValue }} ppm &middot; K: {{ kValue }} ppm</span>
              </div>
            </div>

            <!-- Action Buttons Step 3 -->
            <div class="pt-2 flex items-center gap-3">
              <button
                type="button"
                @click="switchStep(2)"
                class="w-1/3 h-[52px] bg-[#F9F7F4] hover:bg-[#E5E0D8] text-[#241F1B] font-bold text-xs rounded-xl border border-[#E5E0D8] flex items-center justify-center gap-1.5 transition"
              >
                <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Edit Data</span>
              </button>
              <button
                type="button"
                @click="submitData"
                class="w-2/3 h-[52px] bg-[#A8452A] hover:bg-[#923c24] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <span class="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span>Kirim &amp; Minta Prediksi AI</span>
              </button>
            </div>
          </section>

          <!-- STATE LOADING / PROGRESS PREDIKSI -->
          <section v-if="currentStep === 'loading'" class="space-y-6 py-6">
            <div class="text-center space-y-2">
              <div class="w-14 h-14 mx-auto rounded-full bg-[#FBF2EC] flex items-center justify-center text-[#A8452A] shadow-sm border border-[#A8452A]/20">
                <span class="material-symbols-outlined text-[28px] animate-spin">cyclone</span>
              </div>
              <h3 class="font-headline-lg text-2xl font-bold text-[#243319]">Memproses Telemetri Lahan</h3>
              <p class="text-xs text-[#7E7063]">Harap tunggu sebentar, data sedang disinkronkan dengan engine ML Tanacakra.</p>
            </div>

            <!-- Progress Checklist Card -->
            <div class="bg-[#F9F7F4] rounded-2xl p-5 border border-[#E5E0D8] space-y-4">
              <!-- Item 1 -->
              <div class="flex items-center justify-between py-2 transition-all">
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center" :class="progStage >= 1 ? 'bg-[#EBF2E5] text-[#243319]' : 'bg-[#E5E0D8] text-[#7E7063]'">
                    <span class="material-symbols-outlined text-[16px]" :class="progStage === 1 ? 'animate-spin' : ''">
                      {{ progStage > 1 ? 'check' : 'sync' }}
                    </span>
                  </div>
                  <span class="text-sm font-semibold text-[#241F1B]">Memeriksa data tanah...</span>
                </div>
                <span class="text-xs font-mono font-bold" :class="progStage > 1 ? 'text-[#243319]' : 'text-[#7E7063]'">
                  {{ progStage > 1 ? 'Selesai' : 'Sedang berjalan' }}
                </span>
              </div>

              <!-- Item 2 -->
              <div class="flex items-center justify-between py-2 transition-all" :class="progStage < 2 ? 'opacity-40' : ''">
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center" :class="progStage >= 2 ? 'bg-[#EBF2E5] text-[#243319]' : 'bg-[#E5E0D8] text-[#7E7063]'">
                    <span class="material-symbols-outlined text-[16px]" :class="progStage === 2 ? 'animate-spin' : ''">
                      {{ progStage > 2 ? 'check' : 'hourglass_empty' }}
                    </span>
                  </div>
                  <span class="text-sm font-semibold text-[#241F1B]">Menjalankan prediksi AI Random Forest...</span>
                </div>
                <span class="text-xs font-mono font-bold" :class="progStage > 2 ? 'text-[#243319]' : 'text-[#7E7063]'">
                  {{ progStage > 2 ? 'Selesai' : (progStage === 2 ? 'Menghitung model...' : 'Menunggu') }}
                </span>
              </div>

              <!-- Item 3 -->
              <div class="flex items-center justify-between py-2 transition-all" :class="progStage < 3 ? 'opacity-40' : ''">
                <div class="flex items-center gap-3">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center" :class="progStage >= 3 ? 'bg-[#EBF2E5] text-[#243319]' : 'bg-[#E5E0D8] text-[#7E7063]'">
                    <span class="material-symbols-outlined text-[16px]" :class="progStage === 3 ? 'animate-spin' : ''">
                      {{ progStage === 3 ? 'sync' : 'hourglass_empty' }}
                    </span>
                  </div>
                  <span class="text-sm font-semibold text-[#241F1B]">Menyusun rekomendasi agronomis...</span>
                </div>
                <span class="text-xs font-mono font-bold" :class="progStage === 3 ? 'text-[#A8452A]' : 'text-[#7E7063]'">
                  {{ progStage === 3 ? 'Menyusun...' : 'Menunggu' }}
                </span>
              </div>
            </div>

            <p class="text-center text-[11px] text-[#7E7063]">
              Mengintegrasikan data cuaca stasiun BMKG Sleman &amp; peta tanah lereng Merapi.
            </p>
          </section>

          <!-- STATE HASIL SUKSES -->
          <section v-if="currentStep === 'success'" class="space-y-6 py-2 text-center">
            <!-- Badge Sukses Hijau Lumut -->
            <div class="w-16 h-16 mx-auto rounded-full bg-[#EBF2E5] text-[#243319] flex items-center justify-center shadow-sm border border-[#d5e9c3]">
              <span class="material-symbols-outlined text-[36px]">verified</span>
            </div>
            <div class="space-y-2">
              <span class="text-xs uppercase font-bold text-[#243319] tracking-wider bg-[#EBF2E5] px-3.5 py-1 rounded-full border border-[#d5e9c3]">
                Tersimpan di Poktan Cangkringan
              </span>
              <h2 class="font-headline-lg text-2xl md:text-3xl text-[#243319] font-bold">Data tersimpan. Prediksi lahan siap!</h2>
              <p class="text-xs text-[#7E7063] max-w-md mx-auto leading-relaxed">
                Data berhasil dicatat dan sinkron dengan telemetri lereng Merapi. Rekomendasi nutrisi tanam telah siap ditinjau.
              </p>
            </div>

            <!-- Rekomendasi Kilat Teaser Card -->
            <div v-if="mlResult" class="bg-[#F9F7F4] text-left rounded-2xl p-5 border border-[#E5E0D8] space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#A8452A] text-[20px]">psychology</span>
                  <span class="text-xs font-bold text-[#243319]">Hasil Model Prediksi AI</span>
                </div>
                <span class="text-xs px-2.5 py-0.5 bg-[#A8452A]/10 text-[#A8452A] rounded-full font-bold">
                  {{ mlResult.estimasi_hasil_panen_ton_ha || '16.8' }} ton/ha
                </span>
              </div>
              <ul class="space-y-2">
                <li v-for="(rec, idx) in (mlResult.rekomendasi_tindakan || [])" :key="idx" class="flex items-start gap-2 text-xs text-[#241F1B] font-semibold bg-white p-3 rounded-xl border border-[#E5E0D8]">
                  <span class="material-symbols-outlined text-[#243319] text-[18px]">check_circle</span>
                  <span>{{ rec }}</span>
                </li>
              </ul>
              <p class="text-[11px] text-[#7E7063] italic">{{ mlResult.catatan_lokasi }}</p>
            </div>

            <!-- Plotly Visual Schema -->
            <div v-if="plotlySchema" class="bg-[#F9F7F4] rounded-2xl p-3 border border-[#E5E0D8] h-[300px]">
              <PlotlyChart :schema="plotlySchema" />
            </div>

            <!-- Tombol Aksi Akhir -->
            <div class="space-y-2.5 pt-2">
              <button
                type="button"
                @click="router.push('/petani')"
                class="w-full h-[50px] bg-[#243319] hover:bg-[#3A4A2E] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
              >
                <span class="material-symbols-outlined text-[20px]">dashboard</span>
                <span>Buka Panel Dasbor</span>
              </button>
              <button
                type="button"
                @click="resetForm"
                class="w-full h-[46px] bg-transparent hover:bg-[#F9F7F4] text-[#243319] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition border border-[#E5E0D8]"
              >
                <span class="material-symbols-outlined text-[18px]">add</span>
                <span>Catat Lahan Lainnya</span>
              </button>
            </div>
          </section>

        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

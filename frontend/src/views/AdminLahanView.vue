<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { LahanService } from '../services/api'
// Leaflet imports
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AdminSidebar from '../components/AdminSidebar.vue'
import AdminBottomNav from '../components/AdminBottomNav.vue'

const router = useRouter()
const lahanList = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedDesa = ref('all')
const isDrawerOpen = ref(false)
const selectedLahan = ref<any>(null)
// Map state
const showMap = ref(false)
const map = ref<any>(null)

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

const handleLogout = () => {
  localStorage.removeItem('tanacakra_token')
  localStorage.removeItem('tanacakra_user')
  router.push('/')
}

// Map functions
const initMap = () => {
  if (map.value) return
  // Initialize map centered on Cangkringan area
  map.value = L.map('mapLeaflet').setView([-7.65, 110.45], 13)

  // Add OSM tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value)
}

const addMarkers = (list) => {
  if (!map.value) return
  // Clear existing markers (simple approach: recreate map)
  // For simplicity, we'll remove and reinit if markers exist; but we can also manage layer group.
  // We'll just reinitialize map and add markers again.
  map.value.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.value.removeLayer(layer)
    }
  })

  list.forEach((item) => {
    const params = item.input_parameters || {}
    const lat = params.latitude
    const lng = params.longitude
    if (lat && lng) {
      const marker = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(map.value)
      const farmId = params.farm_id || ('LHN-' + item.id)
      const desa = params.desa || 'Cangkringan'
      const ph = params.soil_ph || 'N/A'
      const luas = params.area_ha || 'N/A'
      marker.bindPopup(
        `<b>Lahan ${farmId}</b><br/>Desa: ${desa}<br/>pH: ${ph}<br/>Luas: ${luas} ha`
      )
    }
  })
}

// Watch for map visibility
watch(
  () => showMap.value,
  (val) => {
    if (val) {
      initMap()
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
  <div class="min-h-screen bg-abu-letusan text-abu-vulkanik font-sans flex antialiased selection:bg-genteng/20 selection:text-genteng pb-20 md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden fixed top-0 w-full z-30 bg-abu-letusan/95 backdrop-blur-md border-b border-[#DCD6C9] px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-serif text-xl font-semibold tracking-tight text-abu-vulkanik leading-tight">Manajemen Lahan</h1>
          <p class="text-[11px] text-tanah-subur font-medium">Desa Cangkringan • {{ lahanList.length }} petak terdaftar</p>
        </div>
        <button @click="fetchLahanData" class="p-2 text-abu-vulkanik hover:text-genteng transition-colors rounded-full">
          <span class="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <main class="w-full md:ml-[240px] flex-1 p-4 pt-20 md:pt-8 md:p-8 min-w-0 max-w-7xl">

      <!-- Content Header (Desktop) -->
      <header class="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="font-serif text-2xl md:text-[28px] font-semibold text-abu-vulkanik tracking-tight">Manajemen Lahan Pertanian</h2>
          <p class="text-sm text-tanah-subur/80 mt-1">Inventarisasi {{ lahanList.length }} petak lahan lereng Merapi dan tata kelola pipeline data tanah.</p>
        </div>
        <div class="flex items-center gap-2.5 shrink-0">
          <button @click="fetchLahanData" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white/70 hover:bg-white text-abu-vulkanik border border-[#D8D2C5] rounded shadow-sm transition-colors">
            <span class="material-symbols-outlined text-[16px] text-tanah-subur">refresh</span>
            <span>Refresh Data</span>
          </button>
          <button @click="showMap = !showMap" class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white/70 hover:bg-white text-abu-vulkanik border border-[#D8D2C5] rounded shadow-sm transition-colors">
            <span class="material-symbols-outlined text-[16px] text-tanah-subur">{{ showMap ? 'grid_view' : 'map' }}</span>
            <span>{{ showMap ? 'Tabel Data' : 'Peta Lahan' }}</span>
          </button>
        </div>
      </header>

      <!-- Filter Toolbar -->
      <section class="bg-white/80 backdrop-blur border border-[#D8D2C5] rounded-lg p-3 md:p-3.5 mb-4 md:mb-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:flex-wrap items-center gap-3">
          <div class="w-full md:flex-1 md:min-w-[260px] relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-tanah-subur/60 pointer-events-none">
              <span class="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input v-model="searchQuery" type="text" placeholder="Cari ID lahan (misal: CGK001), nama desa..." class="w-full pl-9 pr-4 py-2 md:py-1.5 text-xs md:text-sm bg-white border border-[#D8D2C5] rounded focus:ring-1 focus:ring-genteng outline-none" />
          </div>
          <div class="hidden md:block w-48">
            <select v-model="selectedDesa" class="w-full py-1.5 px-3 text-xs bg-white border border-[#D8D2C5] rounded focus:ring-1 focus:ring-genteng outline-none">
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
      <div v-if="isLoading" class="text-center py-12 bg-white border border-[#D8D2C5] rounded-lg">
        <span class="material-symbols-outlined animate-spin text-3xl text-tanah-subur">sync</span>
        <p class="text-xs text-abu-vulkanik/70 mt-2">Memuat data 100 lahan Cangkringan dari PostgreSQL...</p>
      </div>

      <!-- Land Data Table (Desktop) -->
      <section v-else class="hidden md:block bg-white border border-[#D8D2C5] rounded-lg shadow-sm overflow-hidden mb-6">
        <div class="overflow-x-auto max-h-[600px]">
          <table class="w-full text-left border-collapse">
            <thead class="bg-[#DFD9CD]/40 border-b border-[#D8D2C5] text-[11px] font-semibold text-tanah-subur tracking-wider sticky top-0 bg-[#E8E2D5] z-10">
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
            <tbody class="divide-y divide-[#D8D2C5] text-xs">
              <tr v-for="item in filteredLahan" :key="item.id" class="hover:bg-[#DFD9CD]/30 transition-colors cursor-pointer" @click="openDrawer(item)">
                <td class="py-3 px-4 font-mono font-semibold text-genteng">{{ item.input_parameters?.farm_id || ('LHN-' + item.id) }}</td>
                <td class="py-3 px-4 font-medium text-abu-vulkanik">{{ item.input_parameters?.desa || 'Cangkringan' }}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold" :class="(item.input_parameters?.soil_ph < 6.0) ? 'bg-bahaya-lahar/10 text-bahaya-lahar' : 'bg-terasering/10 text-terasering'">
                    pH {{ item.input_parameters?.soil_ph || 6.5 }}
                  </span>
                </td>
                <td class="py-3 px-4 text-abu-vulkanik">
                  <div>{{ item.input_parameters?.elevation_m || 600 }} mdpl</div>
                  <div class="text-[10px] text-tanah-subur/70">{{ item.input_parameters?.area_ha || 1.0 }} ha</div>
                </td>
                <td class="py-3 px-4 text-tanah-subur text-[11px]">{{ item.input_parameters?.soil_type || 'Regosol Vulkanik' }}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#DFD9CD] text-tanah-subur">
                    {{ item.input_parameters?.irrigation || 'Teknis' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button class="px-2.5 py-1 text-xs font-medium text-genteng bg-genteng/10 hover:bg-genteng/20 rounded transition-colors" @click.stop="openDrawer(item)">
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
        <article v-for="item in filteredLahan" :key="'mob-' + item.id" class="bg-[#FDFBF7] border border-[#DDD6C9] rounded-xl p-3.5 shadow-sm" @click="openDrawer(item)">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <span class="text-[10px] font-mono font-bold tracking-wider text-genteng">{{ item.input_parameters?.farm_id || ('LHN-' + item.id) }}</span>
              <h2 class="font-semibold text-[14px] text-abu-vulkanik leading-snug">Desa {{ item.input_parameters?.desa || 'Cangkringan' }}</h2>
              <p class="text-[10px] text-tanah-subur">{{ item.input_parameters?.soil_type || 'Regosol Vulkanik' }}</p>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold" :class="(item.input_parameters?.soil_ph < 6.0) ? 'bg-bahaya-lahar/10 text-bahaya-lahar' : 'bg-terasering/10 text-terasering'">
              pH {{ item.input_parameters?.soil_ph || 6.5 }}
            </span>
          </div>
          <div class="bg-abu-letusan/60 rounded-lg p-2.5 my-2 grid grid-cols-2 gap-2 text-[11px] border border-[#E4DDCF]">
            <div>
              <span class="text-[9px] text-tanah-subur block">Luas Lahan</span>
              <span class="font-semibold text-abu-vulkanik">{{ item.input_parameters?.area_ha || 1.0 }} ha</span>
            </div>
            <div>
              <span class="text-[9px] text-tanah-subur block">Elevasi</span>
              <span class="font-semibold text-abu-vulkanik">{{ item.input_parameters?.elevation_m || 600 }} mdpl</span>
            </div>
          </div>
        </article>
      </section>

    </main>

    <!-- Map View (Desktop) -->
    <section v-if="showMap" class="hidden md:block w-full h-[600px]">
      <div id="mapLeaflet" class="w-full h-full"></div>
    </section>

    <!-- Detail Drawer / Bottom Sheet -->
    <div v-if="isDrawerOpen && selectedLahan" class="fixed inset-0 z-50 flex justify-end md:bg-black/20 bg-black/40 backdrop-blur-sm transition-opacity">
      <div class="absolute inset-0" @click="closeDrawer"></div>
      
      <div class="relative w-full md:w-[420px] h-full mt-auto md:mt-0 max-h-[88vh] md:max-h-full bg-white md:border-l border-t md:border-t-0 border-[#D8D2C5] shadow-2xl flex flex-col rounded-t-2xl md:rounded-none">
        <div class="px-4 md:px-5 py-3 md:py-4 border-b border-[#D8D2C5] flex items-center justify-between bg-abu-letusan/40">
          <div>
            <span class="text-[10px] font-mono font-bold text-genteng uppercase">Detail Lahan Cangkringan</span>
            <h3 class="font-serif text-base font-semibold text-abu-vulkanik">{{ selectedLahan.input_parameters?.farm_id }} — {{ selectedLahan.input_parameters?.desa }}</h3>
          </div>
          <button @click="closeDrawer" class="p-1 rounded-full hover:bg-abu-letusan text-tanah-subur">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 text-xs md:text-sm">
          <div class="bg-abu-letusan/30 p-3 rounded-lg border border-[#D8D2C5] space-y-2">
            <div class="flex justify-between"><span class="text-tanah-subur">Tipe Tanah:</span><span class="font-semibold">{{ selectedLahan.input_parameters?.soil_type }}</span></div>
            <div class="flex justify-between"><span class="text-tanah-subur">pH Tanah:</span><span class="font-bold text-genteng">{{ selectedLahan.input_parameters?.soil_ph }}</span></div>
            <div class="flex justify-between"><span class="text-tanah-subur">Karbon Organik:</span><span class="font-semibold">{{ selectedLahan.input_parameters?.organic_carbon }}%</span></div>
            <div class="flex justify-between"><span class="text-tanah-subur">Irigasi:</span><span class="font-semibold">{{ selectedLahan.input_parameters?.irrigation }}</span></div>
            <div class="flex justify-between"><span class="text-tanah-subur">Elevasi:</span><span class="font-semibold">{{ selectedLahan.input_parameters?.elevation_m }} mdpl</span></div>
            <div class="flex justify-between"><span class="text-tanah-subur">Luas Petak:</span><span class="font-semibold">{{ selectedLahan.input_parameters?.area_ha }} ha</span></div>
            <div class="flex justify-between"><span class="text-tanah-subur">Koordinat:</span><span class="font-mono text-[11px]">{{ selectedLahan.input_parameters?.latitude }}, {{ selectedLahan.input_parameters?.longitude }}</span></div>
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

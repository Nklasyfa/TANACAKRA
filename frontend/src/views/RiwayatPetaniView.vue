<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import PetaniSidebar from '../components/PetaniSidebar.vue'
import BottomNav from '../components/BottomNav.vue'
import { LahanService } from '../services/api'

const historyList = ref<any[]>([])
const isLoading = ref(true)
const selectedDesa = ref('all')
const searchQuery = ref('')

const loadHistory = async () => {
  try {
    isLoading.value = true
    const data = await LahanService.getLahanHistory()
    historyList.value = data || []
  } catch (err) {
    console.error('Gagal mengambil riwayat:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadHistory()
})

const filteredHistory = computed(() => {
  return historyList.value.filter((item: any) => {
    const params = item.input_parameters || {}
    const farmId = (params.farm_id || '').toLowerCase()
    const desa = (params.desa || '').toLowerCase()
    const query = searchQuery.value.toLowerCase()

    const matchesQuery = farmId.includes(query) || desa.includes(query)
    const matchesDesa = selectedDesa.value === 'all' || desa === selectedDesa.value.toLowerCase()
    return matchesQuery && matchesDesa
  })
})

const formatDate = (isoStr?: string) => {
  if (!isoStr) return 'Terbaru'
  const d = new Date(isoStr)
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-abu-letusan text-abu-vulkanik font-sans antialiased pb-24 md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden sticky top-0 z-20 bg-[#EFEAE0]/95 backdrop-blur-sm border-b border-[#DFD9CD] px-4 py-3 flex items-center justify-between">
      <div>
        <h1 class="font-serif font-semibold text-[19px] tracking-tight text-genteng leading-none">Tanacakra</h1>
        <p class="text-[11px] text-tanah-subur mt-1 font-medium">Dashboard Petani • Riwayat</p>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <PetaniSidebar />

    <!-- Main Content Area -->
    <main class="md:ml-[240px] flex-1 p-4 md:p-8 lg:p-10 max-w-7xl">
      <header class="mb-5 md:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#D9D3C7] pb-4 md:pb-5">
          <div>
            <h2 class="font-serif text-xl md:text-2xl lg:text-3xl font-semibold text-abu-vulkanik tracking-tight">Riwayat Catatan & Rekomendasi Lahan</h2>
            <p class="text-xs md:text-sm text-abu-vulkanik/80 mt-1">Daftar masukan parameter tanah dan rekomendasi mesin pendukung keputusan (EngineOutput).</p>
          </div>
          <div class="text-[11px] md:text-xs text-abu-vulkanik/70 tabular-nums">
            Total {{ historyList.length }} catatan tersimpan
          </div>
        </div>

        <div class="mt-4 md:mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#E8E3D7] p-3 md:p-3.5 rounded border border-[#D9D3C7]">
          <div class="flex flex-col md:flex-row md:items-center gap-3 text-sm flex-1">
            <div class="flex items-center gap-2 flex-1 max-w-xs">
              <span class="material-symbols-outlined text-[18px] text-abu-vulkanik/70">search</span>
              <input v-model="searchQuery" type="text" placeholder="Cari ID lahan / desa..." class="bg-white border border-[#CCC6B8] rounded px-2.5 py-1 text-xs text-abu-vulkanik w-full focus:outline-none" />
            </div>
            <div class="flex items-center gap-2">
              <label class="text-[11px] md:text-xs font-semibold text-abu-vulkanik whitespace-nowrap">Filter Desa:</label>
              <select v-model="selectedDesa" class="bg-white border border-[#CCC6B8] rounded px-2.5 py-1 text-xs text-abu-vulkanik font-medium focus:outline-none">
                <option value="all">Semua Desa</option>
                <option value="Cangkringan">Cangkringan</option>
                <option value="Umbulharjo">Umbulharjo</option>
                <option value="Kepuharjo">Kepuharjo</option>
                <option value="Glagahharjo">Glagahharjo</option>
                <option value="Wukirsari">Wukirsari</option>
                <option value="Argomulyo">Argomulyo</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="w-full md:w-auto flex items-center justify-center gap-1 bg-white hover:bg-[#F7F4EC] border border-[#CCC6B8] text-abu-vulkanik text-[11px] md:text-xs font-medium px-3 py-1.5 rounded transition-colors">
              <span class="material-symbols-outlined text-[16px]">file_download</span>
              <span>Ekspor Data</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Data Table -->
      <section class="bg-white border border-[#D9D3C7] rounded overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-abu-vulkanik min-w-[700px]">
            <thead class="bg-[#ECE7DC] border-b border-[#D9D3C7] text-xs text-abu-vulkanik font-semibold">
              <tr>
                <th scope="col" class="py-3 px-4 w-40">Tanggal Input</th>
                <th scope="col" class="py-3 px-4 w-44">Petak Lahan</th>
                <th scope="col" class="py-3 px-4 w-48">Parameter Hara</th>
                <th scope="col" class="py-3 px-4">Hasil Rekomendasi ML</th>
                <th scope="col" class="py-3 px-4 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EAE5DA] text-xs">
              <tr v-if="isLoading">
                <td colspan="5" class="py-8 text-center text-abu-vulkanik/60">
                  Memuat riwayat dari PostgreSQL database...
                </td>
              </tr>
              <tr v-else-if="filteredHistory.length === 0">
                <td colspan="5" class="py-8 text-center text-abu-vulkanik/60">
                  Tidak ada catatan lahan yang ditemukan.
                </td>
              </tr>
              <tr v-else v-for="item in filteredHistory" :key="item.id" class="hover:bg-[#FAF8F3] transition-colors">
                <td class="py-3 px-4 font-medium tabular-nums text-abu-vulkanik">
                  {{ formatDate(item.created_at) }}
                </td>
                <td class="py-3 px-4 font-medium text-abu-vulkanik">
                  <div>Petak {{ item.input_parameters?.farm_id || ('CGK' + String(item.id).padStart(3, '0')) }}</div>
                  <div class="text-[11px] text-abu-vulkanik/70 font-normal">Desa {{ item.input_parameters?.desa || 'Cangkringan' }}</div>
                </td>
                <td class="py-3 px-4 tabular-nums">
                  <div class="leading-relaxed">
                    <span class="font-semibold text-tanah-subur">pH:</span> {{ item.input_parameters?.soil_ph || 6.5 }} &nbsp;|&nbsp; 
                    <span class="font-semibold text-tanah-subur">Moisture:</span> {{ item.input_parameters?.moisture || '65%' }}
                    <div class="text-[11px] text-abu-vulkanik/70">NPK: {{ item.input_parameters?.nitrogen || 120 }}-{{ item.input_parameters?.phosphorus || 45 }}-{{ item.input_parameters?.potassium || 70 }}</div>
                  </div>
                </td>
                <td class="py-3 px-4 text-abu-vulkanik">
                  {{ item.engine_output?.prediction_result || 'Kondisi tanah vulkanik ideal. Rekomendasi komoditas: Cabai Merah & Tomat Vulkanik.' }}
                </td>
                <td class="py-3 px-4 text-center">
                  <span 
                    :class="(item.input_parameters?.soil_ph || 6.5) >= 6.0 ? 'bg-[#EEF2E6] text-terasering border-[#D2DEC0]' : 'bg-[#F9EBE8] text-bahaya-lahar border-[#E9C5BE]'"
                    class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border">
                    {{ (item.input_parameters?.soil_ph || 6.5) >= 6.0 ? 'Sehat' : 'Perlu Atensi' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-4 py-3 bg-[#FAF8F3] border-t border-[#D9D3C7] flex flex-col md:flex-row md:items-center justify-between text-xs text-abu-vulkanik gap-3">
          <span>Menampilkan {{ filteredHistory.length }} dari {{ historyList.length }} entri</span>
        </div>
      </section>
    </main>

    <BottomNav />
  </div>
</template>

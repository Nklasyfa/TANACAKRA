<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import PetaniSidebar from '@/components/petani/PetaniSidebar.vue'
import BottomNav from '@/components/petani/BottomNav.vue'
import { useRouter } from 'vue-router'
import { LahanService } from '@/services/api'

const router = useRouter()

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

const statusStats = computed(() => {
  let optimal = 0
  let atensi = 0
  let risiko = 0
  filteredHistory.value.forEach((item: any) => {
    const label = statusLabel(item)
    if (label.toLowerCase().includes('sehat') || label.toLowerCase().includes('optimal')) optimal++
    else if (label.toLowerCase().includes('kritis') || label.toLowerCase().includes('pembenahan') || label.toLowerCase().includes('risiko')) risiko++
    else atensi++
  })
  return { optimal, atensi, risiko }
})

const formatDate = (isoStr?: string) => {
  if (!isoStr) return 'Terbaru'
  const d = new Date(isoStr)
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

const paramsOf = (item: any) => item.input_parameters || {}
const phOf = (item: any) => parseFloat(paramsOf(item).soil_ph ?? paramsOf(item).pH ?? 6.5)
const moistureOf = (item: any) => parseInt(paramsOf(item).kelembapan ?? paramsOf(item).humidity_percent ?? paramsOf(item).moisture ?? 60)
const predictionOf = (item: any) => item.output?.prediction_result || item.engine_output?.prediction_result || null
const farmLabel = (item: any) => paramsOf(item).farm_id || ('CGK' + String(item.id).padStart(3, '0'))
const statusClass = (item: any) => {
  const rec = predictionOf(item)
  if (rec?.status_kesehatan) {
    return rec.status_kesehatan.toLowerCase().includes('kritis') || rec.status_kesehatan.toLowerCase().includes('pembenahan')
      ? 'bg-[#F9EBE8] text-[#93000A] border-[#E9C5BE]'
      : 'bg-[#EEF2E6] text-[#3A4A2E] border-[#D2DEC0]'
  }
  return phOf(item) >= 6.0
    ? 'bg-[#EEF2E6] text-[#3A4A2E] border-[#D2DEC0]'
    : 'bg-[#F9EBE8] text-[#93000A] border-[#E9C5BE]'
}
const statusLabel = (item: any) => {
  const rec = predictionOf(item)
  if (rec?.status_kesehatan) return rec.status_kesehatan
  return phOf(item) >= 6.0 ? 'Sehat' : 'Perlu Atensi'
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-[#fff8f4] text-[#231a10] font-sans antialiased pb-[88px] md:pb-0">

    <header class="md:hidden sticky top-0 z-20 bg-[#fff8f4]/95 backdrop-blur-sm border-b border-[#F0EDE6] px-4 py-3 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-1.5">
          <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto" />
          <img src="@/assets/tanacakra-wordmark.svg" alt="Tanacakra" class="h-4 w-auto" />
        </div>
        <p class="text-[11px] text-[#645d58] mt-1 font-medium">Dashboard Petani &bull; Riwayat</p>
      </div>
    </header>

    <PetaniSidebar />

    <main class="md:ml-[240px] flex-1 w-full px-4 md:px-8 lg:px-12 pt-5 md:pt-8">
      <div class="max-w-[860px] mx-auto w-full pb-12">

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#E8DED7] text-[#4C4641]">Arsip Telemetri</span>
              <span class="text-[#75786F] text-xs">&middot;</span>
              <span class="text-xs font-medium text-[#645D58]">Kecamatan Cangkringan</span>
            </div>
            <h1 class="text-[28px] md:text-[34px] leading-tight font-bold tracking-tight text-[#241F1B]">Riwayat Data Lahan</h1>
            <p class="text-sm md:text-[15px] text-[#6B5B4A]">Semua catatan pengamatan tanah dan riwayat rekomendasi AI petak tani Anda</p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <button @click="router.push('/input-lahan')" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#A8452A] hover:bg-[#8e3820] text-white text-sm font-semibold transition-all shadow-sm">
              <span class="material-symbols-outlined text-[18px]">add_circle</span>
              + Catat Data Baru
            </button>
          </div>
        </div>

        <div class="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#F3ECE0] rounded-xl border border-[#E2D8C7]">
          <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div class="flex items-center gap-2 flex-1 min-w-[200px]">
              <span class="material-symbols-outlined text-[18px] text-[#6B5B4A]">search</span>
              <input v-model="searchQuery" type="text" placeholder="Cari ID lahan / desa..." class="bg-white border border-[#E2D8C7] rounded-lg px-3 py-1.5 text-[13px] text-[#241F1B] w-full focus:outline-none focus:border-[#A8452A] transition" />
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs font-semibold text-[#6B5B4A] whitespace-nowrap">Desa:</label>
              <select v-model="selectedDesa" class="bg-white border border-[#E2D8C7] rounded-lg pl-3 pr-8 py-1.5 text-[13px] text-[#241F1B] font-medium focus:outline-none focus:border-[#A8452A] transition cursor-pointer min-w-[140px]">
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
          <div class="flex items-center gap-4 px-3 text-xs text-[#6B5B4A]">
            <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#16A34A]"></span>Optimal: <strong class="text-[#241F1B]">{{ statusStats.optimal }}</strong></div>
            <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#D97706]"></span>Perhatian: <strong class="text-[#241F1B]">{{ statusStats.atensi }}</strong></div>
            <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#DC2626]"></span>Risiko: <strong class="text-[#241F1B]">{{ statusStats.risiko }}</strong></div>
          </div>
        </div>

        <section class="mt-5 bg-white border border-[#E2D8C7] rounded-xl overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-[#241F1B] min-w-[700px]">
              <thead class="bg-[#F3ECE0] border-b border-[#E2D8C7] text-xs text-[#6B5B4A] font-semibold">
                <tr>
                  <th scope="col" class="py-3 px-4 w-40 uppercase tracking-wider">Tanggal</th>
                  <th scope="col" class="py-3 px-4 w-44 uppercase tracking-wider">Petak Lahan</th>
                  <th scope="col" class="py-3 px-4 w-48 uppercase tracking-wider">Parameter Hara</th>
                  <th scope="col" class="py-3 px-4 uppercase tracking-wider">Hasil Rekomendasi ML</th>
                  <th scope="col" class="py-3 px-4 w-28 text-center uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#F0EDE6] text-xs">
                <tr v-if="isLoading">
                  <td colspan="5" class="py-10 text-center text-[#6B5B4A]">Memuat riwayat data lahan Anda...</td>
                </tr>
                <tr v-else-if="filteredHistory.length === 0">
                  <td colspan="5" class="py-12 text-center text-[#6B5B4A]">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <span class="material-symbols-outlined text-[36px] text-[#A99A87]">landscape</span>
                      <p class="font-bold text-[15px] text-[#241F1B]">Belum Ada Catatan Lahan</p>
                      <p class="text-xs text-[#6B5B4A] max-w-sm">Anda belum memiliki catatan pengamatan lahan. Klik tombol "+ Catat Data Baru" di atas untuk merekam lahan pertama Anda.</p>
                    </div>
                  </td>
                </tr>
                <tr v-else v-for="item in filteredHistory" :key="item.id" class="hover:bg-[#FAF8F3] transition-colors align-top">
                  <td class="py-3 px-4 font-medium tabular-nums text-[#241F1B]">{{ formatDate(item.created_at) }}</td>
                  <td class="py-3 px-4 font-medium text-[#241F1B]">
                    <div>Petak {{ farmLabel(item) }}</div>
                    <div class="text-[11px] text-[#6B5B4A] font-normal">Desa {{ paramsOf(item).desa || 'Cangkringan' }}</div>
                  </td>
                  <td class="py-3 px-4 tabular-nums">
                    <div class="leading-relaxed">
                      <span class="font-semibold text-[#645d58]">pH:</span> {{ phOf(item) }} &nbsp;|&nbsp;
                      <span class="font-semibold text-[#645d58]">Moisture:</span> {{ moistureOf(item) }}%
                      <div class="text-[11px] text-[#6B5B4A]">NPK: {{ paramsOf(item).nitrogen ?? 120 }}-{{ paramsOf(item).fosfor ?? 45 }}-{{ paramsOf(item).kalium ?? 70 }}</div>
                      <div v-if="paramsOf(item).kondisi_tanah" class="text-[11px] text-[#A8452A] font-semibold">Kondisi: {{ paramsOf(item).kondisi_tanah }}</div>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-[#241F1B]">
                    <template v-if="predictionOf(item)">
                      <div class="font-semibold text-[#645d58] mb-1">Hasil Rekomendasi ML:</div>
                      <ul class="space-y-1">
                        <li v-for="(rec, idx) in (predictionOf(item).rekomendasi_tindakan || []).slice(0, 2)" :key="'t-' + idx" class="flex items-start gap-1.5">
                          <span class="material-symbols-outlined text-[#A8452A] text-[14px] mt-0.5">check_circle</span>
                          <span class="leading-relaxed">{{ rec }}</span>
                        </li>
                      </ul>
                      <div class="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#A8452A]/10 text-[#A8452A] text-[11px] font-bold">
                        <span class="material-symbols-outlined text-[13px]">agriculture</span>
                        Estimasi panen: {{ predictionOf(item).estimasi_hasil_panen_ton_ha || '15.5' }} ton/ha
                      </div>
                    </template>
                    <template v-else>
                      <div class="text-xs text-[#241F1B] leading-relaxed">
                        <span class="font-semibold text-[#3A4A2E]">Rekomendasi Pemupukan:</span> Butuh Pupuk NPK Susulan &amp; Pupuk Kandang Organik untuk menstabilkan nutrisi tanah.
                      </div>
                    </template>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span :class="statusClass(item)" class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border text-left">{{ statusLabel(item) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-4 py-3 bg-[#F9F7F4] border-t border-[#E2D8C7] flex flex-col md:flex-row md:items-center justify-between text-xs text-[#6B5B4A] gap-3">
            <span>Menampilkan {{ filteredHistory.length }} dari {{ historyList.length }} entri</span>
          </div>
        </section>

        <section v-if="!isLoading" class="md:hidden space-y-3">
          <p v-if="filteredHistory.length === 0" class="py-8 text-center text-[#6B5B4A] text-xs bg-white border border-[#E2D8C7] rounded-xl">Tidak ada catatan lahan yang ditemukan.</p>
          <article v-for="item in filteredHistory" :key="'mob-r-' + item.id" class="bg-white border border-[#E2D8C7] rounded-xl shadow-sm p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <span class="text-[10px] font-mono font-bold tracking-wider text-[#A8452A]">{{ farmLabel(item) }}</span>
                <h3 class="font-semibold text-[14px] text-[#241F1B] leading-snug">Desa {{ paramsOf(item).desa || 'Cangkringan' }}</h3>
                <p class="text-[10px] text-[#645d58] tabular-nums">{{ formatDate(item.created_at) }}</p>
              </div>
              <span :class="statusClass(item)" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 text-left">{{ statusLabel(item) }}</span>
            </div>

            <div class="bg-[#F9F7F4] rounded-lg p-2.5 my-2 grid grid-cols-3 gap-2 text-[11px] border border-[#F0EDE6]">
              <div>
                <span class="text-[9px] text-[#645d58] block">pH Tanah</span>
                <span class="font-semibold text-[#241F1B]">{{ phOf(item) }}</span>
              </div>
              <div>
                <span class="text-[9px] text-[#645d58] block">Kelembapan</span>
                <span class="font-semibold text-[#241F1B]">{{ moistureOf(item) }}%</span>
              </div>
              <div>
                <span class="text-[9px] text-[#645d58] block">Kondisi</span>
                <span class="font-semibold text-[#A8452A]">{{ paramsOf(item).kondisi_tanah || (moistureOf(item) < 40 ? 'Kering' : moistureOf(item) <= 62 ? 'Lembab' : 'Basah') }}</span>
              </div>
            </div>

            <div v-if="predictionOf(item)" class="rounded-lg border border-[#E2D8C7] bg-white p-2.5">
              <p class="text-[10px] text-[#645d58] font-semibold mb-1">Hasil rekomendasi ML</p>
              <ul class="space-y-1">
                <li v-for="(rec, idx) in (predictionOf(item).rekomendasi_tindakan || []).slice(0, 2)" :key="'mr-' + idx" class="flex items-start gap-1.5 text-[11px] text-[#241F1B]">
                  <span class="material-symbols-outlined text-[#A8452A] text-[14px] mt-0.5">check_circle</span>
                  <span class="leading-relaxed">{{ rec }}</span>
                </li>
              </ul>
              <div class="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#A8452A]/10 text-[#A8452A] text-[11px] font-bold">
                <span class="material-symbols-outlined text-[13px]">agriculture</span>
                Estimasi panen: {{ predictionOf(item).estimasi_hasil_panen_ton_ha || '15.5' }} ton/ha
              </div>
            </div>
          </article>
        </section>

      </div>
    </main>

    <BottomNav />
  </div>
</template>

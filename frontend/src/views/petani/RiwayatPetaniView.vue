<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
watch([searchQuery, selectedDesa], () => { currentPage.value = 1 })
const totalPages = computed(() => Math.max(1, Math.ceil(filteredHistory.value.length / pageSize.value)))
const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredHistory.value.slice(start, start + pageSize.value)
})
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages: (number | '...')[] = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
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
const farmIdOf = (item: any) => {
  const p = paramsOf(item)
  return p.farm_id || ('CGK' + String(item.id || 1).slice(-3).padStart(3, '0'))
}
const fieldNameOf = (item: any) => {
  const p = paramsOf(item)
  return p.field_name || p.nama_lahan || `Petak ${farmIdOf(item)}`
}
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

const fallbackRecommendation = (item: any) => {
  const ph = phOf(item)
  if (ph < 6.0) {
    return 'Tanah asam. Taburkan Kapur Pertanian (Dolomit) yang mengandung Kalsium (Ca) & Magnesium (Mg) untuk menaikkan pH.'
  } else if (ph > 7.0) {
    return 'Tanah basa. Tambahkan unsur Belerang (Sulfur) pertanian untuk menurunkan pH tanah.'
  }
  return 'Kondisi stabil. Gunakan Pupuk NPK Seimbang (contoh: NPK Mutiara 16-16-16) untuk merawat nutrisi.'
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-[#fff8f4] text-[#231a10] font-sans antialiased pb-[88px] md:pb-0">

    <header class="md:hidden fixed top-0 left-0 right-0 z-30 pt-safe bg-[#fff8f4]/95 backdrop-blur-xl border-b border-[#F0EDE6]">
      <div class="h-14 px-4 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-8 w-auto object-contain shrink-0" />
          <div class="flex flex-col leading-none min-w-0">
            <span class="font-display text-[15px] text-[#3A4A2E] tracking-tight leading-none font-bold">Tanacakra</span>
            <span class="text-[11px] text-[#6B5B4A] mt-0.5 truncate font-medium">Lahan &amp; Riwayat</span>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-full text-[#6B5B4A] hover:text-[#241F1B] hover:bg-[#E8DED7] transition-colors" aria-label="Pemberitahuan">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
          </button>
        </div>
      </div>
    </header>

    <PetaniSidebar />

    <main class="md:ml-[240px] flex-1 w-full px-4 md:px-8 lg:px-12 pt-[calc(env(safe-area-inset-top,0px)+72px)] md:pt-8">
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
              Catat Data Baru
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

        <section class="mt-5 bg-white border border-[#E2D8C7] rounded-xl overflow-hidden shadow-sm hidden md:block">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-[#241F1B] min-w-[700px]">
              <thead class="bg-[#F3ECE0] border-b border-[#E2D8C7] text-xs text-[#6B5B4A] font-semibold">
                <tr>
                  <th scope="col" class="py-3 px-4 w-44 uppercase tracking-wider">Tanggal Ditambahkan</th>
                  <th scope="col" class="py-3 px-4 w-48 uppercase tracking-wider">Petak &amp; Nama Lahan</th>
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
                      <p class="text-xs text-[#6B5B4A] max-w-sm">Anda belum memiliki catatan pengamatan lahan. Klik tombol "Catat Data Baru" di atas untuk merekam lahan pertama Anda.</p>
                    </div>
                  </td>
                </tr>
                <tr v-else v-for="item in paginatedHistory" :key="item.id" class="hover:bg-[#FAF8F3] transition-colors align-top">
                  <td class="py-3 px-4 font-medium tabular-nums text-[#241F1B]">
                    <div class="font-bold text-[#243319] flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px] text-[#A8452A]">calendar_today</span>
                      <span>{{ formatDate(item.created_at) }}</span>
                    </div>
                    <div class="text-[10px] text-[#7E7063] mt-0.5 font-normal">Tanggal Ditambahkan</div>
                  </td>
                  <td class="py-3 px-4 font-medium text-[#241F1B]">
                    <div class="font-bold text-[#243319] text-[13px] leading-snug">{{ fieldNameOf(item) }}</div>
                    <div class="text-[11px] text-[#6B5B4A] font-medium flex items-center gap-1.5 mt-0.5">
                      <span class="inline-flex items-center px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-[#F3ECE0] text-[#7E4200] border border-[#E2D8C7]">
                        {{ farmIdOf(item) }}
                      </span>
                      <span>&bull; Desa {{ paramsOf(item).desa || 'Cangkringan' }}</span>
                    </div>
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
                        Estimasi panen: {{ predictionOf(item).estimasi_hasil_panen_ton_ha || '15.5' }} ton/ha/musim
                      </div>
                    </template>
                    <template v-else>
                      <div class="text-xs text-[#241F1B] leading-relaxed">
                        <span class="font-semibold text-[#3A4A2E]">Rekomendasi Pemupukan:</span> {{ fallbackRecommendation(item) }}
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
          <div class="px-4 py-3 bg-[#F9F7F4] border-t border-[#E2D8C7] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <span class="text-xs text-[#6B5B4A]">Menampilkan {{ paginatedHistory.length }} dari {{ filteredHistory.length }} entri</span>
            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center gap-1">
              <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2D8C7] text-[#6B5B4A] hover:bg-[#FDEBDB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <span class="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <template v-for="(page, i) in pageNumbers" :key="i">
                <span v-if="page === '...'" class="w-8 h-8 flex items-center justify-center text-xs text-[#6B5B4A]">…</span>
                <button v-else @click="currentPage = page as number"
                  :class="currentPage === page ? 'bg-[#A8452A] text-white border-[#A8452A]' : 'bg-white text-[#241F1B] border-[#E2D8C7] hover:bg-[#FDEBDB]'"
                  class="w-8 h-8 flex items-center justify-center rounded-lg border text-xs font-semibold transition-colors">
                  {{ page }}
                </button>
              </template>
              <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E2D8C7] text-[#6B5B4A] hover:bg-[#FDEBDB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <span class="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        <section v-if="!isLoading" class="md:hidden space-y-3">
          <p v-if="filteredHistory.length === 0" class="py-8 text-center text-[#6B5B4A] text-xs bg-white border border-[#E2D8C7] rounded-xl">Tidak ada catatan lahan yang ditemukan.</p>
          <article v-for="item in paginatedHistory" :key="'mob-r-' + item.id" class="bg-white border border-[#E2D8C7] rounded-xl shadow-sm p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="inline-flex items-center px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-[#F3ECE0] text-[#7E4200] border border-[#E2D8C7]">
                    {{ farmIdOf(item) }}
                  </span>
                  <span class="text-[11px] text-[#645d58]">Desa {{ paramsOf(item).desa || 'Cangkringan' }}</span>
                </div>
                <h3 class="font-bold text-[14px] text-[#241F1B] leading-snug">{{ fieldNameOf(item) }}</h3>
                <div class="text-[11px] text-[#645d58] font-medium flex items-center gap-1 mt-1 tabular-nums">
                  <span class="material-symbols-outlined text-[13px] text-[#A8452A]">calendar_today</span>
                  <span>Tanggal Ditambahkan:</span>
                  <strong class="text-[#241F1B]">{{ formatDate(item.created_at) }}</strong>
                </div>
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
                Estimasi panen: {{ predictionOf(item).estimasi_hasil_panen_ton_ha || '15.5' }} ton/ha/musim
              </div>
            </div>
            <div v-else class="rounded-lg border border-[#E2D8C7] bg-white p-2.5">
              <p class="text-[10px] text-[#645d58] font-semibold mb-1">Rekomendasi Pemupukan</p>
              <p class="text-[11px] text-[#241F1B] leading-relaxed">{{ fallbackRecommendation(item) }}</p>
            </div>
          </article>
          <!-- Mobile Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-between px-1 pt-2 pb-2">
            <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E2D8C7] bg-white text-[#6B5B4A] hover:bg-[#FDEBDB] disabled:opacity-40 transition-colors">
              <span class="material-symbols-outlined text-[15px]">chevron_left</span> Prev
            </button>
            <span class="text-xs text-[#6B5B4A] font-medium">{{ currentPage }} / {{ totalPages }}</span>
            <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
              class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E2D8C7] bg-white text-[#6B5B4A] hover:bg-[#FDEBDB] disabled:opacity-40 transition-colors">
              Next <span class="material-symbols-outlined text-[15px]">chevron_right</span>
            </button>
          </div>
        </section>

      </div>
    </main>

    <BottomNav />
  </div>
</template>

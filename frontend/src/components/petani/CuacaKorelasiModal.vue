<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const selectedCommodity = ref<'Padi' | 'Cabai Merah' | 'Jagung'>('Padi')

const monthlyData = [
  { month: 'Jan', rain: 340, temp: 23.5, humidity: 86, yieldPadi: 6.8, yieldCabai: 4.2, yieldJagung: 5.1 },
  { month: 'Feb', rain: 310, temp: 23.8, humidity: 85, yieldPadi: 7.1, yieldCabai: 4.5, yieldJagung: 5.4 },
  { month: 'Mar', rain: 280, temp: 24.2, humidity: 83, yieldPadi: 7.4, yieldCabai: 5.8, yieldJagung: 6.0 },
  { month: 'Apr', rain: 190, temp: 24.8, humidity: 80, yieldPadi: 6.9, yieldCabai: 7.2, yieldJagung: 6.4 },
  { month: 'Mei', rain: 120, temp: 24.5, humidity: 76, yieldPadi: 5.8, yieldCabai: 8.5, yieldJagung: 6.8 },
  { month: 'Jun', rain: 75,  temp: 23.9, humidity: 72, yieldPadi: 4.9, yieldCabai: 9.1, yieldJagung: 6.5 },
  { month: 'Jul', rain: 45,  temp: 23.1, humidity: 68, yieldPadi: 4.2, yieldCabai: 9.6, yieldJagung: 5.9 },
  { month: 'Agu', rain: 35,  temp: 23.4, humidity: 66, yieldPadi: 3.8, yieldCabai: 9.8, yieldJagung: 5.7 },
  { month: 'Sep', rain: 60,  temp: 24.6, humidity: 70, yieldPadi: 4.5, yieldCabai: 9.2, yieldJagung: 6.2 },
  { month: 'Okt', rain: 155, temp: 25.1, humidity: 77, yieldPadi: 5.6, yieldCabai: 7.8, yieldJagung: 6.6 },
  { month: 'Nov', rain: 260, temp: 24.3, humidity: 82, yieldPadi: 6.5, yieldCabai: 6.1, yieldJagung: 5.9 },
  { month: 'Des', rain: 325, temp: 23.7, humidity: 85, yieldPadi: 6.7, yieldCabai: 4.8, yieldJagung: 5.2 }
]

const currentYields = computed(() => {
  return monthlyData.map(d => {
    if (selectedCommodity.value === 'Cabai Merah') return d.yieldCabai
    if (selectedCommodity.value === 'Jagung') return d.yieldJagung
    return d.yieldPadi
  })
})

const maxRain = 350
const maxYield = 10

const correlationStats = computed(() => {
  if (selectedCommodity.value === 'Cabai Merah') {
    return {
      r: -0.78,
      type: 'Korelasi Negatif Kuat',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      insight: 'Curah hujan tinggi (>200 mm/bulan) menekan hasil panen cabai merah karena kelembapan memicu antraknosa (patek) dan busuk buah.'
    }
  }
  if (selectedCommodity.value === 'Jagung') {
    return {
      r: +0.45,
      type: 'Korelasi Moderat',
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      insight: 'Jagung membutuhkan suplai air moderat pada masa vegetatif, namun sensitif terhadap genangan berlebih di musim puncak hujan.'
    }
  }
  return {
    r: +0.82,
    type: 'Korelasi Positif Kuat',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    insight: 'Produktivitas padi sawah meningkat tajam pada bulan dengan curah hujan tinggi (ketersediaan air irigasi melimpah di lereng Merapi).'
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div
        class="bg-[#FFF8F4] text-[#231a10] w-full max-w-3xl rounded-2xl shadow-2xl border border-[#E2D8C7] overflow-hidden flex flex-col my-4 max-h-[92vh]"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-[#243319] text-[#FFF8F4] flex items-center justify-between border-b border-[#3A4A2E] shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#3D562B] flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px] text-[#D5E9C3]">insights</span>
            </div>
            <div>
              <h3 class="font-bold text-sm text-white">Riwayat Cuaca &amp; Korelasi Hasil Panen</h3>
              <p class="text-[11px] text-[#C2D7B2]">Analisis hubungan curah hujan BMKG dengan produktivitas lahan Cangkringan</p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="text-[#C2D7B2] hover:text-white p-1 rounded-md transition cursor-pointer"
            title="Tutup"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Commodity Filter -->
        <div class="p-4 bg-[#F5EFE6] border-b border-[#E2D8C7] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-[#645d58] uppercase">Pilih Komoditas:</span>
            <div class="inline-flex rounded-lg border border-[#D5C7B2] bg-white p-0.5">
              <button
                v-for="c in (['Padi', 'Cabai Merah', 'Jagung'] as const)"
                :key="c"
                @click="selectedCommodity = c"
                class="px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                :class="selectedCommodity === c ? 'bg-[#243319] text-white shadow-xs' : 'text-[#645d58] hover:text-[#231a10]'"
              >
                {{ c }}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-md border" :class="correlationStats.color">
              Koefisien r = {{ correlationStats.r }} ({{ correlationStats.type }})
            </span>
          </div>
        </div>

        <!-- Body Content -->
        <div class="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          <!-- Visual Dual-Axis Chart -->
          <div class="bg-white rounded-xl border border-[#E2D8C7] p-4 shadow-sm">
            <div class="flex items-center justify-between mb-3 text-xs">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5 font-medium text-[#243319]">
                  <span class="w-3 h-3 rounded-xs bg-[#4285F4]"></span>
                  <span>Curah Hujan (mm)</span>
                </div>
                <div class="flex items-center gap-1.5 font-medium text-[#A8452A]">
                  <span class="w-3 h-1 bg-[#A8452A] rounded-full"></span>
                  <span>Produktivitas (ton/ha)</span>
                </div>
              </div>
              <span class="text-[11px] text-[#7E7063]">Rata-rata Historis Cangkringan (12 Bulan)</span>
            </div>

            <!-- SVG Dual-Axis Chart -->
            <div class="h-56 w-full relative">
              <svg class="w-full h-full overflow-visible" viewBox="0 0 540 180" preserveAspectRatio="none">
                <!-- Grid Lines -->
                <line x1="30" y1="20" x2="520" y2="20" stroke="#F0EDE6" stroke-dasharray="3,3" />
                <line x1="30" y1="65" x2="520" y2="65" stroke="#F0EDE6" stroke-dasharray="3,3" />
                <line x1="30" y1="110" x2="520" y2="110" stroke="#F0EDE6" stroke-dasharray="3,3" />
                <line x1="30" y1="155" x2="520" y2="155" stroke="#E2D8C7" />

                <!-- Left Axis Label -->
                <text x="24" y="24" text-anchor="end" font-size="9" fill="#7E7063">350</text>
                <text x="24" y="90" text-anchor="end" font-size="9" fill="#7E7063">175</text>
                <text x="24" y="157" text-anchor="end" font-size="9" fill="#7E7063">0mm</text>

                <!-- Right Axis Label -->
                <text x="526" y="24" font-size="9" fill="#A8452A">10t</text>
                <text x="526" y="90" font-size="9" fill="#A8452A">5t</text>
                <text x="526" y="157" font-size="9" fill="#A8452A">0t</text>

                <!-- Bars: Curah Hujan -->
                <g v-for="(d, i) in monthlyData" :key="'bar-' + i">
                  <rect
                    :x="42 + i * 40"
                    :y="155 - (d.rain / maxRain) * 135"
                    width="18"
                    :height="(d.rain / maxRain) * 135"
                    rx="3"
                    fill="#93C5FD"
                    class="hover:fill-[#60A5FA] transition-colors"
                  />
                  <!-- Month Label -->
                  <text
                    :x="51 + i * 40"
                    y="172"
                    text-anchor="middle"
                    font-size="10"
                    fill="#645d58"
                    font-weight="600"
                  >
                    {{ d.month }}
                  </text>
                </g>

                <!-- Line: Harvest Yield -->
                <polyline
                  fill="none"
                  stroke="#A8452A"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :points="monthlyData.map((_d, i) => `${51 + i * 40},${155 - (currentYields[i] / maxYield) * 135}`).join(' ')"
                />

                <!-- Markers: Points -->
                <circle
                  v-for="(_d, i) in monthlyData"
                  :key="'pt-' + i"
                  :cx="51 + i * 40"
                  :cy="155 - (currentYields[i] / maxYield) * 135"
                  r="4"
                  fill="#FFF8F4"
                  stroke="#A8452A"
                  stroke-width="2.5"
                />
              </svg>
            </div>
          </div>

          <!-- Insight Card -->
          <div class="bg-[#FFF1E6] rounded-xl border border-[#FED7AA] p-4 flex items-start gap-3">
            <span class="material-symbols-outlined text-[24px] text-[#C2410C] shrink-0 mt-0.5">psychology</span>
            <div>
              <h4 class="text-xs font-bold text-[#9A3412] uppercase tracking-wider mb-1">
                Wawasan Agroklimat Presisi
              </h4>
              <p class="text-xs text-[#5C4A32] leading-relaxed">
                {{ correlationStats.insight }}
              </p>
            </div>
          </div>

          <!-- Season Strategy Matrix -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div class="bg-white p-3.5 rounded-xl border border-[#E2D8C7] shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#243319] block mb-1">Musim Basah (Nov - Mar)</span>
              <p class="font-bold text-[#231a10] text-[13px]">Curah Hujan: 260 - 340 mm</p>
              <p class="text-[11px] text-[#645d58] mt-1">Fokus tanam padi sawah dengan varietas unggul tahan rebah. Tingkatkan parit drainase pada kebun cabai.</p>
            </div>
            <div class="bg-white p-3.5 rounded-xl border border-[#E2D8C7] shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#7E4200] block mb-1">Peralihan (Apr - Jun)</span>
              <p class="font-bold text-[#231a10] text-[13px]">Curah Hujan: 75 - 190 mm</p>
              <p class="text-[11px] text-[#645d58] mt-1">Waktu optimal menanam palawija, jagung hibrida, dan sayuran semusim di lereng Cangkringan.</p>
            </div>
            <div class="bg-white p-3.5 rounded-xl border border-[#E2D8C7] shadow-2xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#A8452A] block mb-1">Musim Kering (Jul - Sep)</span>
              <p class="font-bold text-[#231a10] text-[13px]">Curah Hujan: 35 - 60 mm</p>
              <p class="text-[11px] text-[#645d58] mt-1">Puncak produksi cabai merah &amp; salak pondoh. Pengairan irigasi tetes atau giliran air wajib dipelihara.</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-[#F5EFE6] border-t border-[#E2D8C7] flex items-center justify-between px-6 shrink-0">
          <p class="text-xs text-[#645d58]">Data telemetri terpadu BMKG Stasiun Klimatologi Sleman &bull; Tanacakra Engine</p>
          <button
            @click="emit('close')"
            class="px-4 py-2 bg-[#243319] hover:bg-[#1A2612] text-white text-xs font-bold rounded-lg transition"
          >
            Tutup Analisis
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

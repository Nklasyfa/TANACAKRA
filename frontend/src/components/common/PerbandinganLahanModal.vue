<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  isOpen: boolean
  allLahan: any[]
  initialSelectedIds?: (string | number)[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const selectedSlot1 = ref<any>(null)
const selectedSlot2 = ref<any>(null)
const selectedSlot3 = ref<any>(null)

// Initialize slots when opened
const initSlots = () => {
  if (!props.allLahan || props.allLahan.length === 0) return
  const ids = props.initialSelectedIds || []
  if (ids.length >= 1) {
    selectedSlot1.value = props.allLahan.find(l => String(l.id) === String(ids[0]) || l.input_parameters?.farm_id === ids[0]) || props.allLahan[0]
  } else {
    selectedSlot1.value = props.allLahan[0]
  }

  if (ids.length >= 2) {
    selectedSlot2.value = props.allLahan.find(l => String(l.id) === String(ids[1]) || l.input_parameters?.farm_id === ids[1]) || props.allLahan[1] || props.allLahan[0]
  } else {
    selectedSlot2.value = props.allLahan[1] || props.allLahan[0]
  }

  if (ids.length >= 3) {
    selectedSlot3.value = props.allLahan.find(l => String(l.id) === String(ids[2]) || l.input_parameters?.farm_id === ids[2]) || null
  } else {
    selectedSlot3.value = null
  }
}

// Watch props.isOpen
import { watch } from 'vue'
watch(() => props.isOpen, (open) => {
  if (open) initSlots()
})

const comparedLands = computed(() => {
  const list = [selectedSlot1.value, selectedSlot2.value]
  if (selectedSlot3.value) list.push(selectedSlot3.value)
  return list.filter(Boolean)
})

const getParams = (l: any) => l?.input_parameters || {}
const getPred = (l: any) => l?.prediction || {}

const getPhStatus = (ph: number) => {
  if (ph < 5.5) return { label: 'Sangat Masam', color: 'text-amber-700 bg-amber-50 border-amber-200' }
  if (ph < 6.5) return { label: 'Agak Masam', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' }
  if (ph <= 7.5) return { label: 'Optimal/Netral', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  return { label: 'Basa', color: 'text-blue-700 bg-blue-50 border-blue-200' }
}

const getYield = (l: any) => {
  const p = getPred(l)
  if (p.estimasi_hasil_panen_ton_ha) return Number(p.estimasi_hasil_panen_ton_ha)
  return +(5.8 + (Number(getParams(l).soil_ph || 6.2) * 0.4)).toFixed(1)
}

const highestYieldLand = computed(() => {
  if (comparedLands.value.length < 2) return null
  return comparedLands.value.reduce((prev, curr) => (getYield(curr) > getYield(prev) ? curr : prev))
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div
        class="bg-[#FFF8F4] text-[#231a10] w-full max-w-5xl rounded-2xl shadow-2xl border border-[#E2D8C7] overflow-hidden flex flex-col my-4 max-h-[92vh]"
      >
        <!-- Header -->
        <div class="px-6 py-4 bg-[#243319] text-[#FFF8F4] flex items-center justify-between border-b border-[#3A4A2E] shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-[#3D562B] flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px] text-[#D5E9C3]">compare_arrows</span>
            </div>
            <div>
              <h3 class="font-bold text-sm text-white">Komparasi Presisi Lahan Tani (Side-by-Side)</h3>
              <p class="text-[11px] text-[#C2D7B2]">Bandingkan karakteristik tanah, elevasi lereng, dan rekomendasi hara antar petak</p>
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

        <!-- Slot Selector Bar -->
        <div class="p-4 bg-[#F5EFE6] border-b border-[#E2D8C7] grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div>
            <label class="block text-[11px] font-bold text-[#645d58] uppercase mb-1">Petak Pertama (A)</label>
            <select
              v-model="selectedSlot1"
              class="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#D5C7B2] bg-white text-[#231a10] focus:ring-1 focus:ring-[#A8452A] outline-none"
            >
              <option v-for="l in allLahan" :key="'s1-' + l.id" :value="l">
                {{ l.input_parameters?.farm_id || 'CGK' }} - {{ l.input_parameters?.field_name || 'Lahan' }} ({{ l.input_parameters?.desa }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-[#645d58] uppercase mb-1">Petak Kedua (B)</label>
            <select
              v-model="selectedSlot2"
              class="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#D5C7B2] bg-white text-[#231a10] focus:ring-1 focus:ring-[#A8452A] outline-none"
            >
              <option v-for="l in allLahan" :key="'s2-' + l.id" :value="l">
                {{ l.input_parameters?.farm_id || 'CGK' }} - {{ l.input_parameters?.field_name || 'Lahan' }} ({{ l.input_parameters?.desa }})
              </option>
            </select>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-[11px] font-bold text-[#645d58] uppercase">Petak Ketiga (Opsional)</label>
              <button
                v-if="selectedSlot3"
                @click="selectedSlot3 = null"
                class="text-[10px] text-[#A8452A] font-semibold hover:underline"
              >
                Hapus
              </button>
            </div>
            <select
              v-model="selectedSlot3"
              class="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#D5C7B2] bg-white text-[#231a10] focus:ring-1 focus:ring-[#A8452A] outline-none"
            >
              <option :value="null">-- Tidak Dipilih --</option>
              <option v-for="l in allLahan" :key="'s3-' + l.id" :value="l">
                {{ l.input_parameters?.farm_id || 'CGK' }} - {{ l.input_parameters?.field_name || 'Lahan' }} ({{ l.input_parameters?.desa }})
              </option>
            </select>
          </div>
        </div>

        <!-- Scrollable Comparison Matrix -->
        <div class="overflow-y-auto p-4 sm:p-6 flex-1">
          <div class="grid" :class="comparedLands.length === 3 ? 'grid-cols-3 gap-4' : 'grid-cols-2 gap-6'">
            <!-- Columns for each compared land -->
            <div
              v-for="(land, index) in comparedLands"
              :key="'comp-' + (land?.id || index)"
              class="bg-white rounded-xl border p-4 shadow-sm flex flex-col relative transition-all"
              :class="highestYieldLand && land.id === highestYieldLand.id ? 'border-[#3D7828] ring-2 ring-[#3D7828]/20' : 'border-[#E2D8C7]'"
            >
              <!-- Best Tag -->
              <div
                v-if="highestYieldLand && land.id === highestYieldLand.id"
                class="absolute -top-2.5 right-3 bg-[#243319] text-[#D5E9C3] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs"
              >
                <span class="material-symbols-outlined text-[12px] text-amber-400">workspace_premium</span>
                <span>Proyeksi Panen Tertinggi</span>
              </div>

              <!-- Top Card Info -->
              <div class="border-b border-[#F0EDE6] pb-3 mb-3">
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[#F3ECE0] text-[#7E4200]">
                    {{ getParams(land).farm_id || 'CGK-001' }}
                  </span>
                  <span class="text-xs text-[#645d58] font-medium">{{ getParams(land).desa || 'Cangkringan' }}</span>
                </div>
                <h4 class="font-bold text-sm text-[#231a10] leading-snug">
                  {{ getParams(land).field_name || 'Petak Lahan Tani' }}
                </h4>
                <div class="mt-1 flex items-center gap-1.5 text-xs text-[#243319] font-semibold">
                  <span class="material-symbols-outlined text-[14px]">eco</span>
                  <span>Komoditas: {{ getParams(land).komoditas || 'Padi' }}</span>
                </div>
              </div>

              <!-- KPI Comparison Stack -->
              <div class="space-y-2.5 text-xs flex-1">
                <!-- Estimasi Panen -->
                <div class="p-2.5 rounded-lg bg-[#F7FBF4] border border-[#D5E9C3] flex items-center justify-between">
                  <span class="text-[#5C4A32] font-medium">Estimasi Panen</span>
                  <span class="text-sm font-black text-[#243319]">{{ getYield(land) }} ton/ha</span>
                </div>

                <!-- Luas Lahan -->
                <div class="flex items-center justify-between py-1 border-b border-[#F0EDE6]">
                  <span class="text-[#645d58]">Luas Petak</span>
                  <span class="font-bold text-[#231a10]">
                    {{ getParams(land).area_ha ? Number(getParams(land).area_ha).toFixed(2) + ' ha' : (getParams(land).area_sqm || 7500) + ' m²' }}
                  </span>
                </div>

                <!-- pH Tanah -->
                <div class="flex items-center justify-between py-1 border-b border-[#F0EDE6]">
                  <span class="text-[#645d58]">pH Tanah</span>
                  <div class="flex items-center gap-1.5">
                    <span class="font-mono font-bold text-[#231a10]">{{ Number(getParams(land).soil_ph || 6.2).toFixed(1) }}</span>
                    <span
                      class="px-1.5 py-0.5 rounded text-[10px] font-bold border"
                      :class="getPhStatus(Number(getParams(land).soil_ph || 6.2)).color"
                    >
                      {{ getPhStatus(Number(getParams(land).soil_ph || 6.2)).label }}
                    </span>
                  </div>
                </div>

                <!-- Bahan Organik -->
                <div class="flex items-center justify-between py-1 border-b border-[#F0EDE6]">
                  <span class="text-[#645d58]">C-Organik</span>
                  <span class="font-bold text-[#231a10]">{{ Number(getParams(land).organic_carbon || 1.8).toFixed(1) }} %</span>
                </div>

                <!-- Elevasi -->
                <div class="flex items-center justify-between py-1 border-b border-[#F0EDE6]">
                  <span class="text-[#645d58]">Elevasi Lereng</span>
                  <span class="font-medium text-[#231a10]">{{ getParams(land).elevation_m || 550 }} mdpl</span>
                </div>

                <!-- Irigasi -->
                <div class="flex items-center justify-between py-1 border-b border-[#F0EDE6]">
                  <span class="text-[#645d58]">Sistem Irigasi</span>
                  <span class="font-medium text-[#231a10]">{{ getParams(land).irrigation || 'Semi-Teknis' }}</span>
                </div>

                <!-- Rekomendasi Pupuk Pokok -->
                <div class="pt-2">
                  <span class="font-bold text-[11px] text-[#645d58] uppercase tracking-wide block mb-1.5">
                    Kebutuhan Pupuk Presisi
                  </span>
                  <div class="grid grid-cols-3 gap-1 text-center font-mono text-[11px]">
                    <div class="bg-[#F3ECE0] p-1.5 rounded">
                      <span class="text-[9px] text-[#7E4200] block font-sans font-bold">Urea</span>
                      <strong class="text-[#241F1B]">{{ Math.round(Number(getParams(land).area_ha || 0.8) * 200) }}kg</strong>
                    </div>
                    <div class="bg-[#F3ECE0] p-1.5 rounded">
                      <span class="text-[9px] text-[#7E4200] block font-sans font-bold">SP-36</span>
                      <strong class="text-[#241F1B]">{{ Math.round(Number(getParams(land).area_ha || 0.8) * 100) }}kg</strong>
                    </div>
                    <div class="bg-[#F3ECE0] p-1.5 rounded">
                      <span class="text-[9px] text-[#7E4200] block font-sans font-bold">KCl</span>
                      <strong class="text-[#241F1B]">{{ Math.round(Number(getParams(land).area_ha || 0.8) * 75) }}kg</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-[#F5EFE6] border-t border-[#E2D8C7] flex items-center justify-between px-6 shrink-0">
          <p class="text-xs text-[#645d58]">
            Sistem perbandingan Tanacakra &bull; Berbasis model agro-ekologi lereng Cangkringan
          </p>
          <button
            @click="emit('close')"
            class="px-4 py-2 bg-[#243319] hover:bg-[#1A2612] text-white text-xs font-bold rounded-lg transition"
          >
            Selesai Komparasi
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

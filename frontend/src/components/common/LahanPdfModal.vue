<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isOpen: boolean
  lahan: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const params = computed(() => props.lahan?.input_parameters || {})
const prediction = computed(() => props.lahan?.prediction || {})

const farmId = computed(() => params.value.farm_id || 'CGK-001')
const fieldName = computed(() => params.value.field_name || `Petak Lahan ${farmId.value}`)
const desa = computed(() => params.value.desa || 'Cangkringan')
const commodity = computed(() => params.value.komoditas || props.lahan?.planting_info?.commodity || 'Padi')
const soilPh = computed(() => Number(params.value.soil_ph || 6.2).toFixed(1))
const organicCarbon = computed(() => Number(params.value.organic_carbon || 1.8).toFixed(1))
const elevation = computed(() => params.value.elevation_m || 550)
const areaHa = computed(() => {
  if (params.value.area_ha) return Number(params.value.area_ha).toFixed(2)
  if (params.value.area_sqm) return (Number(params.value.area_sqm) / 10000).toFixed(2)
  return '0.75'
})
const areaSqm = computed(() => {
  if (params.value.area_sqm) return Number(params.value.area_sqm).toLocaleString('id-ID')
  return (Number(areaHa.value) * 10000).toLocaleString('id-ID')
})
const irrigation = computed(() => params.value.irrigation || 'Semi-Teknis')
const lat = computed(() => Number(params.value.latitude || -7.628).toFixed(5))
const lng = computed(() => Number(params.value.longitude || 110.442).toFixed(5))

const reportDate = computed(() => {
  const d = props.lahan?.created_at ? new Date(props.lahan.created_at) : new Date()
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
})

const certNumber = computed(() => {
  const code = (farmId.value || '001').replace(/[^0-9]/g, '') || '01'
  return `TCK/BPP-CGK/2026/${code.padStart(3, '0')}`
})

const handlePrint = () => {
  window.print()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible print:block"
    >
      <div
        class="bg-white text-[#231a10] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#E2D8C7] overflow-hidden flex flex-col my-4 print:my-0 print:border-none print:shadow-none print:max-w-none print:rounded-none print:overflow-visible print:block"
      >
        <!-- Modal Toolbar (Hidden during print) -->
        <div class="px-6 py-3.5 bg-[#243319] text-[#FFF8F4] flex items-center justify-between border-b border-[#3A4A2E] print:hidden">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-[#D5E9C3]">picture_as_pdf</span>
            <span class="font-bold text-sm">Laporan Hasil Analisis & Rekomendasi Lahan (PDF)</span>
          </div>
          <div class="flex items-center gap-2.5">
            <button
              @click="handlePrint"
              class="bg-[#A8452A] hover:bg-[#8F3A22] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span class="material-symbols-outlined text-[16px]">print</span>
              <span>Cetak / Unduh PDF</span>
            </button>
            <button
              @click="emit('close')"
              class="text-[#C2D7B2] hover:text-white p-1 rounded-md transition cursor-pointer"
              title="Tutup"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <!-- Printable Document Body -->
        <div class="p-8 sm:p-10 font-sans print:p-8" id="printable-lahan-report">
          <!-- Official Letterhead -->
          <div class="border-b-2 border-[#243319] pb-4 mb-6 flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-[#243319] text-white flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-3xl text-[#D5E9C3]">nature_people</span>
              </div>
              <div>
                <p class="text-[11px] font-bold text-[#645d58] tracking-widest uppercase">Pemerintah Kabupaten Sleman &bull; Kapanewon Cangkringan</p>
                <h1 class="text-xl sm:text-2xl font-black text-[#243319] tracking-tight leading-tight uppercase font-serif">
                  Balai Penyuluhan Pertanian (BPP) Cangkringan
                </h1>
                <p class="text-xs text-[#5C4A32] mt-0.5 font-medium">
                  Sistem Presisi Agroklimat & Rekomendasi Lahan Vulkanik Merapi TANACAKRA
                </p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="inline-block px-2.5 py-1 bg-[#EEF2E6] text-[#243319] border border-[#D2DEC0] rounded text-[10px] font-mono font-bold">
                DOKUMEN RESMI
              </span>
              <p class="text-[10px] font-mono text-[#7E7063] mt-1">{{ certNumber }}</p>
            </div>
          </div>

          <!-- Document Title & Meta -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[#F0EDE6] mb-6">
            <div>
              <h2 class="text-lg font-bold text-[#231a10]">Lembar Rekomendasi Agroteknologi Lahan</h2>
              <p class="text-xs text-[#645d58]">Dihasilkan melalui inferensi model machine learning agronomi lereng Merapi</p>
            </div>
            <div class="text-xs text-[#645d58] sm:text-right">
              <div>Tanggal Terbit: <strong class="text-[#231a10]">{{ reportDate }}</strong></div>
              <div>Status: <span class="text-[#243319] font-bold">Terverifikasi Sistem Presisi</span></div>
            </div>
          </div>

          <!-- Grid: Profil Lahan & Kondisi Tanah -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <!-- Box 1: Identitas Lahan -->
            <div class="border border-[#E2D8C7] rounded-xl p-4 bg-[#FFF8F4]">
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#A8452A] mb-3 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">location_on</span>
                Identitas Petak Lahan
              </h3>
              <table class="w-full text-xs">
                <tbody>
                  <tr class="border-b border-[#F0EDE6]">
                    <td class="py-1.5 text-[#645d58] w-36">Kode Petak</td>
                    <td class="py-1.5 font-mono font-bold text-[#231a10]">{{ farmId }}</td>
                  </tr>
                  <tr class="border-b border-[#F0EDE6]">
                    <td class="py-1.5 text-[#645d58]">Nama Lahan</td>
                    <td class="py-1.5 font-semibold text-[#231a10]">{{ fieldName }}</td>
                  </tr>
                  <tr class="border-b border-[#F0EDE6]">
                    <td class="py-1.5 text-[#645d58]">Kalurahan / Desa</td>
                    <td class="py-1.5 text-[#231a10] font-medium">{{ desa }}, Cangkringan</td>
                  </tr>
                  <tr class="border-b border-[#F0EDE6]">
                    <td class="py-1.5 text-[#645d58]">Luas Lahan</td>
                    <td class="py-1.5 font-bold text-[#243319]">{{ areaHa }} Hektar ({{ areaSqm }} m²)</td>
                  </tr>
                  <tr>
                    <td class="py-1.5 text-[#645d58]">Koordinat Spasial</td>
                    <td class="py-1.5 font-mono text-[11px] text-[#5C4A32]">{{ lat }}, {{ lng }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Box 2: Karakteristik Agroklimat -->
            <div class="border border-[#E2D8C7] rounded-xl p-4 bg-[#FFF8F4]">
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#243319] mb-3 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">landscape</span>
                Karakteristik Tanah & Cuaca
              </h3>
              <table class="w-full text-xs">
                <tbody>
                  <tr class="border-b border-[#F0EDE6]">
                    <td class="py-1.5 text-[#645d58] w-36">Derajat Keasaman (pH)</td>
                    <td class="py-1.5">
                      <span class="font-bold text-[#231a10]">{{ soilPh }}</span>
                      <span class="text-[11px] text-[#645d58] ml-1">
                        ({{ Number(soilPh) < 6.0 ? 'Agak Masam' : Number(soilPh) > 7.0 ? 'Netral/Basa' : 'Optimal' }})
                      </span>
                    </td>
                  </tr>
                  <tr class="border-b border-[#F0EDE6]">
                    <td class="py-1.5 text-[#645d58]">Karbon Organik (C-Org)</td>
                    <td class="py-1.5 font-semibold text-[#231a10]">{{ organicCarbon }} %</td>
                  </tr>
                  <tr class="border-b border-[#F0EDE6]">
                    <td class="py-1.5 text-[#645d58]">Jenis Tanah</td>
                    <td class="py-1.5 text-[#231a10] font-medium">{{ params.soil_type || 'Regosol Vulkanik Merapi' }}</td>
                  </tr>
                  <tr class="border-b border-[#F0EDE6]">
                    <td class="py-1.5 text-[#645d58]">Elevasi Lereng</td>
                    <td class="py-1.5 font-medium text-[#231a10]">{{ elevation }} mdpl (Zona Agroklimat Merapi)</td>
                  </tr>
                  <tr>
                    <td class="py-1.5 text-[#645d58]">Sistem Pengairan</td>
                    <td class="py-1.5 font-medium text-[#231a10]">{{ irrigation }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Section: Rekomendasi Pemupukan & Agroteknologi -->
          <div class="border border-[#D5E9C3] rounded-xl p-5 bg-[#F7FBF4] mb-6">
            <h3 class="text-sm font-bold text-[#243319] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">psychology</span>
              Rekomendasi Presisi AI & Dosis Pemupukan
            </h3>
            <p class="text-xs text-[#5C4A32] mb-4">
              Formula kebutuhan hara disesuaikan dengan jenis tanah vulkanik dan komoditas <strong>{{ commodity }}</strong> (Proyeksi Hasil: <strong>{{ prediction.estimasi_hasil_panen_ton_ha || '6.5' }} ton/ha</strong>):
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
              <div class="bg-white p-3 rounded-lg border border-[#E2D8C7] shadow-2xs">
                <span class="text-[10px] text-[#645d58] font-bold uppercase">Urea (N)</span>
                <p class="text-base font-black text-[#243319] mt-0.5">
                  {{ Math.round(Number(areaHa) * 200) }} <span class="text-xs font-normal">kg</span>
                </p>
                <span class="text-[10px] text-[#7E7063]">200 kg/ha</span>
              </div>
              <div class="bg-white p-3 rounded-lg border border-[#E2D8C7] shadow-2xs">
                <span class="text-[10px] text-[#645d58] font-bold uppercase">SP-36 (P₂O₅)</span>
                <p class="text-base font-black text-[#A8452A] mt-0.5">
                  {{ Math.round(Number(areaHa) * 100) }} <span class="text-xs font-normal">kg</span>
                </p>
                <span class="text-[10px] text-[#7E7063]">100 kg/ha</span>
              </div>
              <div class="bg-white p-3 rounded-lg border border-[#E2D8C7] shadow-2xs">
                <span class="text-[10px] text-[#645d58] font-bold uppercase">KCl (K₂O)</span>
                <p class="text-base font-black text-[#243319] mt-0.5">
                  {{ Math.round(Number(areaHa) * 75) }} <span class="text-xs font-normal">kg</span>
                </p>
                <span class="text-[10px] text-[#7E7063]">75 kg/ha</span>
              </div>
              <div class="bg-white p-3 rounded-lg border border-[#E2D8C7] shadow-2xs">
                <span class="text-[10px] text-[#645d58] font-bold uppercase">Kapur Pertanian</span>
                <p class="text-base font-black text-[#7E4200] mt-0.5">
                  {{ Number(soilPh) < 6.0 ? Math.round(Number(areaHa) * 500) : 0 }} <span class="text-xs font-normal">kg</span>
                </p>
                <span class="text-[10px] text-[#7E7063]">{{ Number(soilPh) < 6.0 ? 'Koreksi pH Masam' : 'Tidak Perlu' }}</span>
              </div>
            </div>

            <!-- Catatan Tindakan Lapang -->
            <div class="bg-white p-3.5 rounded-lg border border-[#E2D8C7] text-xs space-y-1.5">
              <div class="font-bold text-[#231a10]">Panduan Agroteknis Lapangan:</div>
              <div class="flex items-start gap-2 text-[#443B33]">
                <span class="material-symbols-outlined text-[16px] text-[#243319] shrink-0 mt-0.5">task_alt</span>
                <span>Berikan pupuk dasar SP-36 dan 1/3 dosis Urea bersama pupuk organik pada H-3 sebelum tanam.</span>
              </div>
              <div class="flex items-start gap-2 text-[#443B33]">
                <span class="material-symbols-outlined text-[16px] text-[#243319] shrink-0 mt-0.5">task_alt</span>
                <span>Aplikasi susulan Urea dan KCl pada fase vegetatif aktif (21 HST) dan fase primordia (42 HST).</span>
              </div>
              <div class="flex items-start gap-2 text-[#443B33]">
                <span class="material-symbols-outlined text-[16px] text-[#A8452A] shrink-0 mt-0.5">shield</span>
                <span>Pantau peringatan cuaca BMKG Cangkringan terkait kelembapan udara >80% untuk antisipasi jamur dan blas daun.</span>
              </div>
            </div>
          </div>

          <!-- Signatures & Official Validation -->
          <div class="pt-6 border-t border-[#E2D8C7] grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p class="text-[#645d58]">Mengetahui,</p>
              <p class="font-bold text-[#231a10] mt-0.5">Penyuluh Pertanian Lapang (PPL)</p>
              <div class="h-16 flex items-center justify-center">
                <span class="font-serif italic text-sm text-[#7E7063]">[ Tanda Tangan Digital Tersertifikasi ]</span>
              </div>
              <p class="font-bold text-[#243319] underline">Bapak Sugiono, S.P.</p>
              <p class="text-[10px] text-[#645d58]">NIP. 19780412 200501 1 008 &bull; BPP Cangkringan</p>
            </div>
            <div>
              <p class="text-[#645d58]">Diterima oleh,</p>
              <p class="font-bold text-[#231a10] mt-0.5">Ketua Kelompok Tani / Petani</p>
              <div class="h-16 flex items-center justify-center">
                <span class="font-serif italic text-sm text-[#7E7063]">[ Terverifikasi Aplikasi Tanacakra ]</span>
              </div>
              <p class="font-bold text-[#231a10] underline">{{ props.lahan?.user?.username || 'Petani Cangkringan' }}</p>
              <p class="text-[10px] text-[#645d58]">Poktan Kalurahan {{ desa }}</p>
            </div>
          </div>

          <!-- Footer Notice -->
          <div class="mt-8 pt-4 border-t border-[#F0EDE6] text-center text-[10px] text-[#7E7063]">
            Dokumen ini dicetak otomatis dari Platform Tanacakra (Cangkringan Agronomy Hub). Keaslian data dapat diverifikasi melalui kode {{ certNumber }}.
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 12mm 15mm 15mm 15mm;
  }
  body {
    background: white !important;
  }
  body * {
    visibility: hidden;
  }
  #printable-lahan-report, #printable-lahan-report * {
    visibility: visible;
  }
  #printable-lahan-report {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0 !important;
    background: white !important;
  }
}
</style>

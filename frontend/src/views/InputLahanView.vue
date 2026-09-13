<script setup lang="ts">
import BottomNav from '../components/BottomNav.vue'
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const route = useRoute()

const phValue = ref(6.5)
const moistureValue = ref(68)
const nValue = ref(82)
const pValue = ref(45)
const kValue = ref(78)
const isSubmitting = ref(false)

const handleLogout = () => {
  router.push('/')
}

const submitData = () => {
  isSubmitting.value = true
  // Simulate processing time
  setTimeout(() => {
    isSubmitting.value = false
    router.push('/petani')
  }, 3000)
}
</script>

<template>
  <div class="min-h-screen bg-abu-letusan text-abu-vulkanik font-sans antialiased flex flex-col md:flex-row pb-24 md:pb-0">

    <!-- Mobile Clean Header -->
    <header class="md:hidden px-5 pt-5 pb-3 border-b border-[#DED7CA]/60 flex items-center justify-between bg-abu-letusan sticky top-0 z-10">
      <div>
        <h1 class="font-serif font-semibold text-lg text-genteng leading-tight">Tanacakra</h1>
        <p class="text-[11px] text-tanah-subur">Desa Cangkringan</p>
      </div>
      <button @click="router.back()" class="text-xs font-semibold text-genteng flex items-center gap-1">
        <span class="material-symbols-outlined text-[16px]">arrow_back</span>
        Kembali
      </button>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <aside class="hidden md:flex w-60 bg-abu-letusan border-r border-tanah-subur/20 flex-col justify-between fixed inset-y-0 left-0 z-30 select-none">
      <div>
        <div class="px-6 pt-7 pb-6">
          <h1 class="font-serif font-semibold text-[21px] text-genteng tracking-tight leading-none">Tanacakra</h1>
          <p class="text-xs text-tanah-subur/80 font-medium mt-1">Dashboard Petani</p>
        </div>

        <nav class="space-y-1">
          <router-link to="/petani" 
            :class="route.path === '/petani' ? 'flex items-center gap-3.5 px-6 py-3 text-sm font-semibold text-genteng bg-abu-letusan-dark border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-abu-letusan-dark/40 transition-colors'">
            <span class="material-symbols-outlined text-[22px]" :class="route.path === '/petani' ? 'fill-1 text-genteng' : 'text-abu-vulkanik/70'">home</span>
            <span>Beranda</span>
          </router-link>

          <router-link to="/input-lahan" 
            :class="route.path === '/input-lahan' ? 'flex items-center gap-3.5 px-6 py-3 text-sm font-semibold text-genteng bg-abu-letusan-dark border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-abu-letusan-dark/40 transition-colors'">
            <span class="material-symbols-outlined text-[22px]" :class="route.path === '/input-lahan' ? 'fill-1 text-genteng' : 'text-abu-vulkanik/70'">edit_square</span>
            <span>Catat</span>
          </router-link>

          <a href="#" class="flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-abu-letusan-dark/40 transition-colors">
            <span class="material-symbols-outlined text-abu-vulkanik/70 text-[22px]">schedule</span>
            <span>Riwayat</span>
          </a>

          <a href="#" class="flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-abu-letusan-dark/40 transition-colors">
            <span class="material-symbols-outlined text-abu-vulkanik/70 text-[22px]">person</span>
            <span>Profil</span>
          </a>
        </nav>
      </div>

      <div class="p-6 border-t border-tanah-subur/15">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-abu-letusan-dark border border-tanah-subur/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-tanah-subur text-[20px]">account_circle</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-abu-vulkanik truncate leading-tight">Suparman Wignyosukarto</p>
            <p class="text-xs text-tanah-subur/80 truncate mt-0.5 leading-tight">Petani Lahan Blok A</p>
          </div>
        </div>
        <button @click="handleLogout" class="w-full flex items-center gap-2.5 text-xs font-medium text-abu-vulkanik/80 hover:text-bahaya-lahar transition-colors pt-1">
          <span class="material-symbols-outlined text-[18px]">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>

    <!-- MAIN CONTENT AREA -->
    <main class="md:ml-60 flex-1 p-5 md:p-8 lg:p-10 max-w-7xl">
      
      <!-- Header -->
      <header class="mb-7">
        <div class="flex items-baseline justify-between flex-wrap gap-2">
          <h2 class="font-serif text-xl md:text-2xl lg:text-[28px] text-abu-vulkanik font-semibold tracking-tight">
            Catat masukan sampel tanah lereng
          </h2>
          <span class="text-[11px] md:text-xs text-tanah-subur/80 font-medium">Petak 14 &bull; Siklus tanam Mei 2024</span>
        </div>
        <p class="text-xs md:text-sm text-abu-vulkanik/80 mt-1 max-w-3xl leading-relaxed">
          Lengkapi parameter fisik dan nutrisi tanah lapangan untuk kalkulasi inferensi Scikit-learn Random Forest posko Cangkringan.
        </p>

        <!-- Multi-step Progress Bar -->
        <div class="mt-4 md:mt-6 bg-white/70 border border-tanah-subur/15 rounded-xl p-3 md:p-4 shadow-sm max-w-4xl">
          <div class="flex items-center justify-between text-[11px] md:text-xs font-semibold mb-2">
            <span class="text-genteng flex items-center gap-1 md:gap-1.5">
              <span class="material-symbols-outlined text-[14px] md:text-[16px]">hourglass_top</span>
              Langkah 2 dari 3: Kondisi Fisik Tanah
            </span>
            <span class="text-tanah-subur/70">66% selesai</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="h-2 rounded-full bg-terasering"></div>
            <div class="h-2 rounded-full bg-genteng"></div>
            <div class="h-2 rounded-full bg-tanah-subur/20"></div>
          </div>
          <div class="grid grid-cols-3 gap-2 text-[9px] md:text-[11px] text-abu-vulkanik/70 mt-2 font-medium">
            <span class="text-terasering font-semibold flex items-center gap-0.5 md:gap-1">
              <span class="material-symbols-outlined text-[11px] md:text-[13px]">check_circle</span> 1. Identitas Lahan
            </span>
            <span class="text-genteng font-semibold">2. Kondisi Fisik</span>
            <span class="text-abu-vulkanik/50">3. Skor Nutrisi N-P-K</span>
          </div>
        </div>
      </header>

      <!-- 2-COLUMN LAYOUT -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 max-w-6xl items-start">
        
        <!-- FORM COLUMN -->
        <div class="lg:col-span-7 space-y-5 md:space-y-6">

          <!-- STEP 1 SUMMARY -->
          <section class="bg-white rounded-2xl border border-tanah-subur/15 p-4 md:p-5 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-tanah-subur/10">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 md:w-6 md:h-6 rounded-full bg-terasering/15 text-terasering flex items-center justify-center text-[10px] md:text-xs font-bold">1</span>
                <h3 class="font-serif text-sm md:text-base font-semibold text-abu-vulkanik">Identitas lahan</h3>
              </div>
              <button type="button" class="text-[11px] md:text-xs font-semibold text-genteng hover:underline flex items-center gap-0.5">
                <span>Ubah data</span>
                <span class="material-symbols-outlined text-[12px] md:text-[14px]">edit</span>
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-3 text-[11px] md:text-xs">
              <div>
                <p class="text-tanah-subur/70 font-medium">Nama / Kode lahan</p>
                <p class="font-semibold text-abu-vulkanik mt-0.5">Lahan Blok A &bull; Petak 14 (Cabai rawit)</p>
              </div>
              <div>
                <p class="text-tanah-subur/70 font-medium">Koordinat titik sampel</p>
                <p class="font-semibold text-abu-vulkanik mt-0.5">-7.5982° LS, 110.4468° BT</p>
              </div>
            </div>
          </section>

          <!-- STEP 2: ACTIVE FORM (Kondisi Fisik) -->
          <section class="bg-white rounded-2xl border-2 border-genteng/40 p-4 md:p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-tanah-subur/10">
              <span class="w-5 h-5 md:w-6 md:h-6 rounded-full bg-genteng text-white flex items-center justify-center text-[10px] md:text-xs font-bold">2</span>
              <div>
                <h3 class="font-serif text-base md:text-lg font-semibold text-abu-vulkanik">Kondisi fisik tanah</h3>
                <p class="text-[10px] md:text-xs text-tanah-subur/80">Masukkan pembacaan instrumen lapang (pH meter portabel & soil moisture)</p>
              </div>
            </div>

            <div class="space-y-6">
              <!-- pH -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label for="ph-slider" class="text-[11px] md:text-xs font-semibold text-abu-vulkanik">
                    Derajat keasaman tanah (pH)
                  </label>
                  <div class="flex items-baseline gap-1 bg-abu-letusan px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg border border-tanah-subur/20">
                    <span class="font-serif text-base md:text-lg font-bold text-genteng">{{ phValue.toFixed(1) }}</span>
                    <span class="text-[9px] md:text-[11px] font-medium text-tanah-subur">pH (Agak Asam)</span>
                  </div>
                </div>
                <input v-model="phValue" id="ph-slider" type="range" min="0" max="14" step="0.1" 
                  class="w-full h-2 md:h-2.5 bg-gradient-to-r from-bahaya-lahar via-terasering to-tanah-subur/50 rounded-lg appearance-none cursor-pointer custom-range">
                <div class="flex justify-between text-[9px] md:text-[11px] text-tanah-subur/70 mt-1.5 font-medium">
                  <span>0 (Sangat Asam)</span>
                  <span class="text-terasering font-semibold">7.0 Netral</span>
                  <span>14 (Sangat Basa)</span>
                </div>
                <p class="text-[9px] md:text-[11px] text-abu-vulkanik/70 mt-1">
                  Ambang batas ideal cabai lereng Merapi: <strong class="text-abu-vulkanik">6.0 – 6.8 pH</strong>.
                </p>
              </div>

              <!-- Kelembapan -->
              <div class="pt-2 border-t border-tanah-subur/10">
                <div class="flex items-center justify-between mb-2">
                  <label for="moisture-slider" class="text-[11px] md:text-xs font-semibold text-abu-vulkanik">
                    Kelembapan lapang (%)
                  </label>
                  <div class="flex items-baseline gap-1 bg-abu-letusan px-2 md:px-2.5 py-0.5 md:py-1 rounded-lg border border-tanah-subur/20">
                    <span class="font-serif text-base md:text-lg font-bold text-genteng">{{ moistureValue }}</span>
                    <span class="text-[9px] md:text-[11px] font-medium text-tanah-subur">% (Optimal)</span>
                  </div>
                </div>
                <input v-model="moistureValue" id="moisture-slider" type="range" min="0" max="100" step="1" 
                  class="w-full h-2 md:h-2.5 bg-tanah-subur/20 rounded-lg appearance-none cursor-pointer custom-range">
                <div class="flex justify-between text-[9px] md:text-[11px] text-tanah-subur/70 mt-1.5 font-medium">
                  <span>0% Kering Kerontang</span>
                  <span class="text-terasering font-semibold">60% – 70% Kapasitas Lapang</span>
                  <span>100% Jenuh Air</span>
                </div>
              </div>
            </div>
          </section>

          <!-- STEP 3: NPK -->
          <section class="bg-white rounded-2xl border border-tanah-subur/15 p-4 md:p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-tanah-subur/10">
              <span class="w-5 h-5 md:w-6 md:h-6 rounded-full bg-tanah-subur/15 text-tanah-subur flex items-center justify-center text-[10px] md:text-xs font-bold">3</span>
              <div>
                <h3 class="font-serif text-sm md:text-base font-semibold text-abu-vulkanik">Skor nutrisi N-P-K (mg/kg)</h3>
                <p class="text-[10px] md:text-xs text-tanah-subur/80">Hasil uji kit cepat hara tanah</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Nitrogen -->
              <div>
                <label for="n-val" class="block text-[11px] md:text-xs font-semibold text-abu-vulkanik mb-1">Nitrogen (N)</label>
                <div class="relative rounded-lg border border-tanah-subur/25 bg-abu-letusan/30 focus-within:border-genteng focus-within:bg-white transition-all">
                  <input v-model="nValue" id="n-val" type="number" class="w-full py-2.5 pl-3 pr-12 text-sm font-semibold text-abu-vulkanik bg-transparent outline-none">
                  <span class="absolute right-3 top-2.5 text-[9px] md:text-[11px] text-tanah-subur/70 pointer-events-none">mg/kg</span>
                </div>
                <span class="inline-block mt-1 text-[9px] md:text-[10px] text-terasering font-medium">Cukup (Ambang >75)</span>
              </div>
              <!-- Fosfor -->
              <div>
                <label for="p-val" class="block text-[11px] md:text-xs font-semibold text-abu-vulkanik mb-1">Fosfor (P)</label>
                <div class="relative rounded-lg border border-tanah-subur/25 bg-abu-letusan/30 focus-within:border-genteng focus-within:bg-white transition-all">
                  <input v-model="pValue" id="p-val" type="number" class="w-full py-2.5 pl-3 pr-12 text-sm font-semibold text-abu-vulkanik bg-transparent outline-none">
                  <span class="absolute right-3 top-2.5 text-[9px] md:text-[11px] text-tanah-subur/70 pointer-events-none">mg/kg</span>
                </div>
                <span class="inline-block mt-1 text-[9px] md:text-[10px] text-bahaya-lahar font-medium">Batas bawah (Target 50)</span>
              </div>
              <!-- Kalium -->
              <div>
                <label for="k-val" class="block text-[11px] md:text-xs font-semibold text-abu-vulkanik mb-1">Kalium (K)</label>
                <div class="relative rounded-lg border border-tanah-subur/25 bg-abu-letusan/30 focus-within:border-genteng focus-within:bg-white transition-all">
                  <input v-model="kValue" id="k-val" type="number" class="w-full py-2.5 pl-3 pr-12 text-sm font-semibold text-abu-vulkanik bg-transparent outline-none">
                  <span class="absolute right-3 top-2.5 text-[9px] md:text-[11px] text-tanah-subur/70 pointer-events-none">mg/kg</span>
                </div>
                <span class="inline-block mt-1 text-[9px] md:text-[10px] text-terasering font-medium">Optimal (Ambang >70)</span>
              </div>
            </div>
          </section>

          <!-- ACTIONS -->
          <div class="bg-white rounded-2xl border border-tanah-subur/15 p-4 md:p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <button type="button" class="text-[11px] md:text-xs font-semibold text-tanah-subur hover:text-abu-vulkanik underline underline-offset-4 transition-colors">
                Simpan Draf (Offline)
              </button>
              <button @click="submitData" :disabled="isSubmitting" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-genteng hover:bg-genteng/90 text-white font-semibold text-sm rounded-xl shadow-sm transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed">
                <template v-if="!isSubmitting">
                  <span class="material-symbols-outlined text-[20px]">send</span>
                  <span>Kirim untuk Diproses</span>
                </template>
                <template v-else>
                  <span class="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  <span>Sedang Diproses...</span>
                </template>
              </button>
            </div>

            <div v-if="isSubmitting" class="p-3.5 rounded-xl bg-abu-letusan border border-tanah-subur/20 flex items-start gap-3 text-[11px] md:text-xs">
              <span class="material-symbols-outlined text-genteng animate-spin text-[20px] flex-shrink-0 mt-0.5">sync</span>
              <div class="text-abu-vulkanik/85 leading-relaxed">
                <p class="font-semibold text-abu-vulkanik">Proses kalkulasi inferensi membutuhkan 3–5 detik</p>
                <p class="text-[10px] md:text-[11px] text-tanah-subur mt-0.5">
                  Model Random Forest membandingkan data sampel tanah vulkanik dengan rekaman cuaca lereng selatan Merapi.
                </p>
              </div>
            </div>
          </div>

        </div>

        <!-- SIDE COLUMN: MAP PREVIEW (Hidden on mobile) -->
        <div class="hidden lg:block lg:col-span-5 space-y-6">
          <section class="bg-white rounded-2xl border border-tanah-subur/15 overflow-hidden shadow-sm">
            <div class="p-4 border-b border-tanah-subur/10 flex items-center justify-between">
              <h3 class="font-serif text-sm font-semibold text-abu-vulkanik">Pratinjau peta titik pengambilan</h3>
            </div>
            <div class="relative h-60 bg-[#e4dcce] overflow-hidden border-b border-tanah-subur/10">
              <svg class="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#5C4A32" stroke-width="0.75" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <path d="M-50,220 Q120,80 320,160 T600,100" fill="none" stroke="#5C4A32" stroke-width="1.5" />
                <path d="M-20,180 Q150,50 350,130 T650,70" fill="none" stroke="#5C4A32" stroke-width="1.2" />
                <path d="M180,-10 Q210,120 260,260" fill="none" stroke="#8C2F1B" stroke-width="2.5" stroke-dasharray="6,4" />
              </svg>
              <div class="absolute top-12 left-16 right-20 bottom-12 border-2 border-terasering/80 bg-terasering/15 rounded-xl flex items-center justify-center pointer-events-none">
                <span class="text-[10px] font-semibold text-tanah-subur bg-white/90 px-2 py-0.5 rounded shadow-sm">
                  Petak 14 &bull; 1.450 m²
                </span>
              </div>
              <div class="absolute top-24 left-36 -translate-x-1/2 -translate-y-full flex flex-col items-center">
                <div class="w-6 h-6 rounded-full bg-genteng border-2 border-white shadow-md flex items-center justify-center text-white">
                  <span class="material-symbols-outlined text-[15px]">location_on</span>
                </div>
                <div class="w-2 h-2 rounded-full bg-abu-vulkanik/40 mt-0.5"></div>
              </div>
            </div>
            <div class="p-4 bg-abu-letusan/40 space-y-2 text-xs">
              <div class="flex justify-between text-abu-vulkanik">
                <span class="text-tanah-subur/80">Ketinggian tanah:</span>
                <span class="font-semibold">650 mdpl</span>
              </div>
              <div class="flex justify-between text-abu-vulkanik">
                <span class="text-tanah-subur/80">Akurasi GPS gawai:</span>
                <span class="font-semibold text-terasering">Presisi tinggi (&plusmn;3 meter)</span>
              </div>
            </div>
          </section>

          <section class="bg-white rounded-2xl border border-tanah-subur/15 p-5 shadow-sm space-y-3">
            <h3 class="font-serif text-sm font-semibold text-abu-vulkanik flex items-center gap-1.5">
              <span class="material-symbols-outlined text-genteng text-[18px]">tips_and_updates</span>
              Pedoman pengambilan sampel
            </h3>
            <ul class="text-xs text-abu-vulkanik/85 space-y-2.5 list-disc pl-4 leading-relaxed">
              <li>Ambil sampel tanah pada kedalaman <strong>15–20 cm</strong> (zona perakaran aktif).</li>
              <li>Hindari mengambil tanah langsung setelah hujan lebat.</li>
            </ul>
          </section>
        </div>

      </div>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.custom-range::-webkit-slider-thumb {
  appearance: none;
  height: 22px;
  width: 22px;
  border-radius: 50%;
  background: #B3542C;
  border: 3px solid #ffffff;
  box-shadow: 0 1px 4px rgba(58,55,51,0.25);
  cursor: pointer;
}
.custom-range::-moz-range-thumb {
  height: 22px;
  width: 22px;
  border-radius: 50%;
  background: #B3542C;
  border: 3px solid #ffffff;
  box-shadow: 0 1px 4px rgba(58,55,51,0.25);
  cursor: pointer;
}
</style>

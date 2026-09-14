<script setup lang="ts">
import BottomNav from '../components/BottomNav.vue'
import PlotlyChart from '../components/PlotlyChart.vue'
import { useRouter, useRoute } from 'vue-router'
import { ref } from 'vue'
import { LahanService, type LandInputPayload } from '../services/api'

const router = useRouter()
const route = useRoute()

const phValue = ref(5.2)
const moistureValue = ref(45)
const nValue = ref(100)
const pValue = ref(35)
const kValue = ref(130)

const isSubmitting = ref(false)
const mlResult = ref<any>(null)
const plotlySchema = ref<any>(null)
const errorMessage = ref('')

const handleLogout = () => {
  localStorage.removeItem('tanacakra_token')
  localStorage.removeItem('tanacakra_user')
  router.push('/')
}

const submitData = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  mlResult.value = null
  plotlySchema.value = null

  const payload: LandInputPayload = {
    pH: parseFloat(phValue.value.toString()),
    kelembapan: parseInt(moistureValue.value.toString()),
    nitrogen: parseInt(nValue.value.toString()),
    fosfor: parseInt(pValue.value.toString()),
    kalium: parseInt(kValue.value.toString())
  }

  try {
    const res = await LahanService.inputLahan('14', payload)
    mlResult.value = res.engine_output?.prediction_result
    plotlySchema.value = res.plotly_schema
  } catch (err: any) {
    console.error('Error submitting land data:', err)
    errorMessage.value = 'Gagal terhubung ke backend Django REST API.'
  } finally {
    isSubmitting.value = false
  }
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
            <span>Catat Lahan</span>
          </router-link>
        </nav>
      </div>

      <div class="p-6 border-t border-tanah-subur/15">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-abu-letusan-dark border border-tanah-subur/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-tanah-subur text-[20px]">account_circle</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-abu-vulkanik truncate leading-tight">Petani Demo</p>
            <p class="text-xs text-tanah-subur/80 truncate mt-0.5 leading-tight">Blok A Cangkringan</p>
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
            Catat Masukan Sampel Tanah Lapangan
          </h2>
          <span class="text-[11px] md:text-xs text-tanah-subur/80 font-medium">Petak 14 &bull; Cangkringan</span>
        </div>
        <p class="text-xs md:text-sm text-abu-vulkanik/80 mt-1 max-w-3xl leading-relaxed">
          Kirim parameter fisik dan nutrisi tanah untuk kalkulasi inferensi **Scikit-learn Random Forest Engine** &amp; grafik **Plotly**.
        </p>
      </header>

      <!-- RESULT PANEL (IF ML Inference Complete) -->
      <div v-if="mlResult" class="mb-8 bg-white border-2 border-terasering rounded-2xl p-6 shadow-md space-y-4">
        <div class="flex items-center justify-between border-b border-tanah-subur/15 pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-terasering text-2xl">auto_awesome</span>
            <h3 class="font-serif text-lg font-bold text-abu-vulkanik">Hasil Rekomendasi Scikit-learn Pipeline</h3>
          </div>
          <span class="text-xs px-2.5 py-1 bg-[#EEF2E6] text-terasering rounded-full font-semibold">
            Status: {{ mlResult.status_kesehatan }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <p class="text-xs text-tanah-subur font-medium">Rekomendasi Tindakan Lapang:</p>
            <ul class="space-y-2">
              <li v-for="(rec, idx) in mlResult.rekomendasi_tindakan" :key="idx" class="flex items-start gap-2 text-xs text-abu-vulkanik font-semibold bg-abu-letusan p-2.5 rounded-lg border border-tanah-subur/20">
                <span class="material-symbols-outlined text-genteng text-[18px]">check_circle</span>
                <span>{{ rec }}</span>
              </li>
            </ul>
            <p class="text-[11px] text-tanah-subur italic">{{ mlResult.catatan_lokasi }}</p>
          </div>

          <!-- Plotly Radar Chart -->
          <div v-if="plotlySchema" class="bg-abu-letusan/50 rounded-xl p-3 border border-tanah-subur/20 min-h-[250px]">
            <PlotlyChart :schema="plotlySchema" />
          </div>
        </div>
      </div>

      <!-- 2-COLUMN LAYOUT FORM -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 max-w-6xl items-start">
        
        <!-- FORM COLUMN -->
        <div class="lg:col-span-7 space-y-5 md:space-y-6">

          <!-- STEP 2: ACTIVE FORM (Kondisi Fisik) -->
          <section class="bg-white rounded-2xl border-2 border-genteng/40 p-4 md:p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-tanah-subur/10">
              <span class="w-5 h-5 md:w-6 md:h-6 rounded-full bg-genteng text-white flex items-center justify-center text-[10px] md:text-xs font-bold">1</span>
              <div>
                <h3 class="font-serif text-base md:text-lg font-semibold text-abu-vulkanik">Kondisi fisik tanah</h3>
                <p class="text-[10px] md:text-xs text-tanah-subur/80">Pembacaan pH meter &amp; kelembapan tanah</p>
              </div>
            </div>

            <div class="space-y-6">
              <!-- pH -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label for="ph-slider" class="text-[11px] md:text-xs font-semibold text-abu-vulkanik">
                    Derajat keasaman tanah (pH)
                  </label>
                  <div class="flex items-baseline gap-1 bg-abu-letusan px-2.5 py-1 rounded-lg border border-tanah-subur/20">
                    <span class="font-serif text-lg font-bold text-genteng">{{ phValue }}</span>
                    <span class="text-[11px] font-medium text-tanah-subur">pH</span>
                  </div>
                </div>
                <input v-model="phValue" id="ph-slider" type="range" min="0" max="14" step="0.1" 
                  class="w-full h-2.5 bg-gradient-to-r from-bahaya-lahar via-terasering to-tanah-subur/50 rounded-lg appearance-none cursor-pointer custom-range">
              </div>

              <!-- Kelembapan -->
              <div class="pt-2 border-t border-tanah-subur/10">
                <div class="flex items-center justify-between mb-2">
                  <label for="moisture-slider" class="text-[11px] md:text-xs font-semibold text-abu-vulkanik">
                    Kelembapan lapang (%)
                  </label>
                  <div class="flex items-baseline gap-1 bg-abu-letusan px-2.5 py-1 rounded-lg border border-tanah-subur/20">
                    <span class="font-serif text-lg font-bold text-genteng">{{ moistureValue }}</span>
                    <span class="text-[11px] font-medium text-tanah-subur">%</span>
                  </div>
                </div>
                <input v-model="moistureValue" id="moisture-slider" type="range" min="0" max="100" step="1" 
                  class="w-full h-2.5 bg-tanah-subur/20 rounded-lg appearance-none cursor-pointer custom-range">
              </div>
            </div>
          </section>

          <!-- STEP 3: NPK -->
          <section class="bg-white rounded-2xl border border-tanah-subur/15 p-4 md:p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-4 pb-3 border-b border-tanah-subur/10">
              <span class="w-5 h-5 md:w-6 md:h-6 rounded-full bg-tanah-subur/15 text-tanah-subur flex items-center justify-center text-[10px] md:text-xs font-bold">2</span>
              <div>
                <h3 class="font-serif text-sm md:text-base font-semibold text-abu-vulkanik">Skor nutrisi N-P-K (mg/kg)</h3>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Nitrogen -->
              <div>
                <label for="n-val" class="block text-xs font-semibold text-abu-vulkanik mb-1">Nitrogen (N)</label>
                <input v-model="nValue" id="n-val" type="number" class="w-full py-2 px-3 text-sm font-semibold text-abu-vulkanik bg-abu-letusan border border-tanah-subur/25 rounded-lg">
              </div>
              <!-- Fosfor -->
              <div>
                <label for="p-val" class="block text-xs font-semibold text-abu-vulkanik mb-1">Fosfor (P)</label>
                <input v-model="pValue" id="p-val" type="number" class="w-full py-2 px-3 text-sm font-semibold text-abu-vulkanik bg-abu-letusan border border-tanah-subur/25 rounded-lg">
              </div>
              <!-- Kalium -->
              <div>
                <label for="k-val" class="block text-xs font-semibold text-abu-vulkanik mb-1">Kalium (K)</label>
                <input v-model="kValue" id="k-val" type="number" class="w-full py-2 px-3 text-sm font-semibold text-abu-vulkanik bg-abu-letusan border border-tanah-subur/25 rounded-lg">
              </div>
            </div>
          </section>

          <!-- ACTIONS -->
          <div class="bg-white rounded-2xl border border-tanah-subur/15 p-4 md:p-5 shadow-sm space-y-4">
            <div class="flex items-center justify-end">
              <button @click="submitData" :disabled="isSubmitting" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-genteng hover:bg-genteng/90 text-white font-semibold text-sm rounded-xl shadow-sm transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed">
                <template v-if="!isSubmitting">
                  <span class="material-symbols-outlined text-[20px]">auto_awesome</span>
                  <span>Proses Rekomendasi ML</span>
                </template>
                <template v-else>
                  <span class="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  <span>Menjalankan Scikit-learn...</span>
                </template>
              </button>
            </div>

            <p v-if="errorMessage" class="text-xs text-bahaya-lahar font-medium text-center">{{ errorMessage }}</p>
          </div>

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

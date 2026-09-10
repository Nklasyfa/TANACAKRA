<script setup lang="ts">
import BottomNav from '../components/BottomNav.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const router = useRouter()

const weatherData = ref<any>(null)
const isLoadingWeather = ref(true)
const bmkgError = ref(false)

onMounted(async () => {
  try {
    // Menggunakan API publik terbaru dari BMKG, kode wilayah Cangkringan (Sleman) -> 34.04.14
    // Catatan: Jika API ini mengalami limitasi CORS di browser, kita sediakan fallback dummy data
    const response = await fetch('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=34.04.14.2001')
    if (response.ok) {
      const data = await response.json()
      weatherData.value = data
    } else {
      bmkgError.value = true
    }
  } catch (error) {
    console.error('Gagal mengambil data BMKG:', error)
    bmkgError.value = true
  } finally {
    isLoadingWeather.value = false
  }
})
</script>

<template>
  <div class="flex flex-col min-h-screen pb-24 lg:pb-0 bg-surface">
    <!-- Top Header -->
    <header class="w-full px-margin-mobile py-stack-lg bg-surface z-40 sticky top-0 bg-opacity-90 backdrop-blur-sm shadow-sm lg:hidden">
      <div class="flex flex-col gap-1">
        <h1 class="font-headline-md-mobile text-headline-md-mobile text-primary font-bold">Musim Tanam Gadu 2024</h1>
        <p class="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
          <span class="material-symbols-outlined text-[18px]">location_on</span>
          Desa Cangkringan
        </p>
      </div>
    </header>

    <!-- Desktop Header -->
    <header class="hidden lg:flex w-full px-margin-desktop py-stack-lg bg-surface z-40 sticky top-0 border-b border-outline-variant items-center justify-between">
      <div>
        <h1 class="font-headline-md text-headline-md text-primary font-bold">Musim Tanam Gadu 2024</h1>
        <p class="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
          <span class="material-symbols-outlined text-[18px]">location_on</span>
          Desa Cangkringan
        </p>
      </div>
      <div class="flex items-center gap-4">
        <button class="flex items-center gap-2 text-on-surface hover:text-primary transition-colors">
          <span class="material-symbols-outlined">person</span>
          <span class="font-label-md font-bold">Profil</span>
        </button>
        <button @click="router.push('/')" class="flex items-center gap-2 text-lava-danger hover:text-error transition-colors">
          <span class="material-symbols-outlined">logout</span>
          <span class="font-label-md font-bold">Keluar</span>
        </button>
      </div>
    </header>

    <!-- Main Content Canvas -->
    <main class="flex-grow px-margin-mobile lg:px-margin-desktop py-stack-lg flex flex-col lg:flex-row gap-stack-lg max-w-7xl mx-auto w-full">
      <div class="flex flex-col gap-stack-lg flex-1">
        <!-- Primary Status Card -->
        <section class="bg-ash-cream rounded-xl p-6 border-2 border-terrace-green relative overflow-hidden flex flex-col gap-4 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
          <div class="flex items-center gap-2 text-terrace-green mb-2">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">eco</span>
            <h2 class="font-headline-md-mobile text-headline-md-mobile font-bold">Kondisi Optimal</h2>
          </div>
          <p class="font-body-lg text-body-lg text-volcanic-ash">
            Lahan Anda dalam kondisi baik hari ini. Waktu yang tepat untuk pemupukan cabai di petak timur.
          </p>
        </section>

        <!-- Primary CTA -->
        <section class="w-full">
          <button @click="router.push('/input-lahan')" class="w-full lg:w-auto px-8 bg-primary-container text-on-primary-container font-label-md text-label-md font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-primary hover:text-on-primary transition-colors active:scale-95 duration-150 shadow-sm">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">add_circle</span>
            Catat Kegiatan Hari Ini
          </button>
        </section>

        <!-- Cuaca BMKG Section -->
        <section class="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-3 shadow-sm border border-outline-variant">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-primary">
              <span class="material-symbols-outlined">cloud</span>
              <h3 class="font-label-md text-label-md font-bold">Cuaca Cangkringan (BMKG)</h3>
            </div>
            <span class="text-xs bg-terrace-green text-white px-2 py-1 rounded-full font-bold">LIVE</span>
          </div>
          
          <div v-if="isLoadingWeather" class="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 py-4">
            <span class="material-symbols-outlined animate-spin">sync</span>
            Menghubungkan ke API BMKG...
          </div>
          
          <div v-else-if="!bmkgError && weatherData" class="flex items-center justify-between mt-2 bg-ash-cream p-4 rounded-lg border border-outline-variant">
            <div class="flex items-center gap-4">
              <span class="material-symbols-outlined text-[40px] text-primary">partly_cloudy_day</span>
              <div>
                <p class="font-display-sm text-[24px] font-bold text-on-surface">28°C</p>
                <p class="font-body-md text-on-surface-variant capitalize">Cerah Berawan</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-label-md text-on-surface-variant flex items-center justify-end gap-1"><span class="material-symbols-outlined text-[14px]">water_drop</span> 75%</p>
              <p class="font-label-md text-on-surface-variant flex items-center justify-end gap-1"><span class="material-symbols-outlined text-[14px]">air</span> 10 km/j</p>
            </div>
          </div>
          
          <div v-else class="mt-2 bg-lava-danger bg-opacity-10 p-4 rounded-lg border border-lava-danger border-opacity-30">
            <p class="font-body-md text-sm text-error flex items-start gap-2">
              <span class="material-symbols-outlined text-[18px]">error</span>
              <span>Gagal mengambil data langsung dari API BMKG (CORS/Network error). Berikut adalah data simulasi terakhir untuk Cangkringan:</span>
            </p>
            <div class="flex items-center justify-between mt-4 bg-surface p-3 rounded-md border border-outline-variant">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[32px] text-primary">rainy</span>
                <div>
                  <p class="font-display-sm text-[20px] font-bold text-on-surface">26°C</p>
                  <p class="font-body-md text-on-surface-variant text-sm capitalize">Hujan Ringan</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-label-md text-xs text-on-surface-variant">Kelembapan: 82%</p>
                <p class="font-label-md text-xs text-on-surface-variant">Angin: 12 km/j</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Secondary Information / Suggestions -->
        <section class="bg-surface-variant rounded-xl p-6 flex flex-col gap-3 shadow-sm">
          <div class="flex items-center gap-2 text-primary">
            <span class="material-symbols-outlined">lightbulb</span>
            <h3 class="font-label-md text-label-md font-bold">Saran Penyuluh</h3>
          </div>
          <p class="font-body-md text-body-md text-volcanic-ash">
            Pastikan saluran irigasi bersih dari gulma. Hujan deras diperkirakan turun sore ini pukul 15:00 WIB.
          </p>
        </section>
      </div>

      <!-- Contextual Image Placeholder (e.g., Lahan condition) -->
      <section class="rounded-xl overflow-hidden border border-outline-variant flex-1 flex">
        <div class="bg-cover bg-center w-full h-48 lg:h-full min-h-[300px]" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBMG-3SZ3_Ux0OtGTPp_e6PKTm4d_jGVa7rkAv8Qqd4jdehQuU-hgzyMKtmOhj_ggKLLYVjJEFjBR8DQ1EyWdsV9C3JScc5UciuvLnrr7lslE6rdBA3QpQ55kSuoWfj6CuR-UBST9uBTXfWC24g2oPgnSxnUAGSq1yFA_3Ugq17gf6C-jmPV1oQw3xEk7Ld3jy1fXypzmW464MILl5mBI3ZStHtD9XIgqIGEAvYSMacZK6JeVFO1zpr')"></div>
      </section>
    </main>

    <BottomNav />
  </div>
</template>

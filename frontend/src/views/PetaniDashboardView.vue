<script setup lang="ts">
import BottomNav from '../components/BottomNav.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
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

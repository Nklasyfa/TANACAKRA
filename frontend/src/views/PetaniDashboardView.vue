<script setup lang="ts">
import PetaniSidebar from '../components/PetaniSidebar.vue'
import BottomNav from '../components/BottomNav.vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Function to handle logout
const handleLogout = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-abu-letusan antialiased text-abu-vulkanik flex flex-col md:flex-row pb-24 md:pb-0 font-sans">
    
    <!-- Mobile Clean Header -->
    <header class="md:hidden px-5 pt-5 pb-3 border-b border-[#DED7CA]/60 flex items-center justify-between bg-abu-letusan sticky top-0 z-10">
      <div>
        <h1 class="font-display font-semibold text-lg text-genteng leading-tight">Tanacakra</h1>
        <p class="text-[11px] text-tanah-subur">Desa Cangkringan</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#DED7CA] text-[11px] text-tanah-subur">
          <span class="w-2 h-2 rounded-full bg-terasering"></span>
          <span>Sensor aktif</span>
        </span>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <PetaniSidebar />

    <!-- Main Content Area -->
    <main class="md:ml-[240px] flex-1 px-5 pt-4 md:p-10 max-w-7xl flex flex-col gap-5 md:gap-8">
      
      <!-- Header sentence -->
      <header class="md:mb-0">
        <h2 class="font-display text-lg md:text-2xl font-semibold text-abu-vulkanik leading-snug">
          Lahan Blok A — data terakhir dimasukkan 12 Mei 2024
        </h2>
        <p class="text-xs md:text-sm text-tanah-subur mt-0.5 md:mt-1">
          <span class="md:hidden">Petak 14 • Suparman Wignyosukarto</span>
          <span class="hidden md:inline">Evaluasi harian kondisi kimia-fisik tanah vulkanik petak lereng Cangkringan.</span>
        </p>
      </header>

      <!-- Grid Layout for Content -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 items-start">
        
        <!-- Primary Left Column (Full on mobile, 7 cols on desktop) -->
        <div class="md:col-span-7 space-y-5 md:space-y-8">
          
          <!-- ONE Large Primary Status Card -->
          <section class="bg-white rounded-xl p-5 md:p-7 border border-[#DED7CA] shadow-sm">
            <div class="flex items-center justify-between pb-3 md:pb-4 border-b border-[#EFEAE0]">
              <div class="flex items-center gap-2 md:gap-2.5">
                <span class="inline-block w-2.5 h-2.5 rounded-full bg-terasering"></span>
                <span class="text-xs font-semibold text-terasering md:tracking-wide">Kondisi tanah optimal</span>
              </div>
              <span class="text-[11px] md:text-xs text-tanah-subur">Cabai rawit<span class="hidden md:inline"> • 1.450 m²</span></span>
            </div>

            <!-- Recommendation Sentence -->
            <div class="py-4 md:py-6">
              <p class="text-[11px] md:text-xs text-tanah-subur mb-1.5 md:mb-2">Rekomendasi tindakan lapangan hari ini</p>
              <p class="font-display text-base md:text-xl font-medium text-abu-vulkanik leading-snug md:leading-relaxed">
                Kondisi tanah optimal untuk pembungaan cabai; berikan pupuk kalium 150 kg/ha dan pertahankan drainase bedengan sebelum intensitas hujan lereng meningkat.
              </p>
              <p class="text-xs md:text-sm text-abu-vulkanik/75 md:text-abu-vulkanik/80 mt-2.5 md:mt-3.5 leading-normal">
                Kadar air pori tanah berada di 68% dengan pH 6.5. Retensi hara stabil untuk 18 hari ke depan selama tidak terjadi limpasan pasir Kali Gendol.
              </p>
            </div>

            <!-- Primary CTA Button -->
            <div class="pt-1 md:pt-2">
              <button @click="router.push('/input-lahan')" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 md:gap-2.5 px-4 md:px-6 py-3 md:py-3.5 rounded-lg bg-genteng hover:bg-genteng-hover text-white text-sm font-semibold tracking-wide transition-all shadow-sm active:scale-[0.99]">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                <span>Catat Kegiatan Hari Ini</span>
              </button>
            </div>
          </section>

          <!-- Ringkasan Parameter (Mobile only layout here, Desktop has it on right col but let's keep it responsive) -->
          <section class="grid grid-cols-3 gap-2.5 md:hidden">
            <div class="bg-white/80 rounded-lg p-3 border border-[#DED7CA]/70 text-center">
              <p class="text-[10px] text-tanah-subur">pH Tanah</p>
              <p class="font-display text-base font-medium text-abu-vulkanik mt-0.5">6.5</p>
              <p class="text-[10px] text-terasering font-medium">Ideal</p>
            </div>
            <div class="bg-white/80 rounded-lg p-3 border border-[#DED7CA]/70 text-center">
              <p class="text-[10px] text-tanah-subur">Kelembapan</p>
              <p class="font-display text-base font-medium text-abu-vulkanik mt-0.5">68%</p>
              <p class="text-[10px] text-terasering font-medium">Optimal</p>
            </div>
            <div class="bg-white/80 rounded-lg p-3 border border-[#DED7CA]/70 text-center">
              <p class="text-[10px] text-tanah-subur">Kalium Lapang</p>
              <p class="font-display text-base font-medium text-genteng mt-0.5">78</p>
              <p class="text-[10px] text-tanah-subur">mg/kg</p>
            </div>
          </section>

          <!-- Aktivitas Terbaru -->
          <section class="bg-white rounded-xl p-5 md:p-7 border border-[#DED7CA] shadow-sm">
            <div class="flex items-center justify-between mb-3 md:mb-4">
              <h3 class="font-display text-sm md:text-base font-semibold text-abu-vulkanik">Aktivitas terbaru</h3>
              <span class="text-[11px] md:text-xs text-tanah-subur">Terakhir dicatat</span>
            </div>

            <div class="divide-y divide-[#EFEAE0]">
              <div class="py-2.5 md:py-3.5 first:pt-1">
                <div class="flex items-baseline justify-between">
                  <p class="text-xs md:text-sm font-semibold md:font-medium text-abu-vulkanik">Input data sampel tanah</p>
                  <span class="text-[10px] md:text-xs text-tanah-subur whitespace-nowrap ml-4">12 Mei, 08:30</span>
                </div>
                <p class="text-[11px] md:text-xs text-tanah-subur mt-0.5">pH 6.5, kelembapan 68%, NPK 120:45:70</p>
              </div>

              <div class="py-2.5 md:py-3.5">
                <div class="flex items-baseline justify-between">
                  <p class="text-xs md:text-sm font-semibold md:font-medium text-abu-vulkanik">Konfirmasi sebar dolomit</p>
                  <span class="text-[10px] md:text-xs text-tanah-subur whitespace-nowrap ml-4">10 Mei, 07:15</span>
                </div>
                <p class="text-[11px] md:text-xs text-tanah-subur mt-0.5">Dosis 150 kg/ha selesai dilaksanakan</p>
              </div>

              <div class="py-2.5 md:py-3.5 last:pb-1">
                <div class="flex items-baseline justify-between">
                  <p class="text-xs md:text-sm font-semibold md:font-medium text-abu-vulkanik">Peringatan siaga lahar</p>
                  <span class="text-[10px] md:text-xs text-bahaya-lahar font-medium whitespace-nowrap ml-4">08 Mei, 16:40</span>
                </div>
                <p class="text-[11px] md:text-xs text-bahaya-lahar mt-0.5">Periksa tanggul saluran pembuang barat</p>
              </div>
            </div>
          </section>

        </div>

        <!-- Secondary Right Column (Hidden on mobile mostly, except combined sections) -->
        <div class="hidden md:block md:col-span-5 space-y-6">
          
          <!-- Tren retensi hara 7 hari -->
          <section class="bg-white rounded-xl p-7 border border-[#DED7CA] shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-display text-base font-semibold text-abu-vulkanik">Tren retensi hara 7 hari</h3>
              <span class="text-xs text-tanah-subur">mg/kg tanah</span>
            </div>
            <p class="text-xs text-tanah-subur leading-relaxed mb-6">
              Kadar kalium harian petak cabai dibandingkan ambang aman serapan akar.
            </p>

            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="font-medium text-abu-vulkanik">Hari ini (12 Mei)</span>
                  <span class="font-semibold text-genteng">78 mg/kg <span class="text-tanah-subur font-normal text-[11px]">(Optimal)</span></span>
                </div>
                <div class="w-full h-3 bg-abu-letusan rounded-sm overflow-hidden flex items-center">
                  <div class="h-full bg-genteng rounded-sm" style="width: 78%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="font-medium text-abu-vulkanik">11 Mei</span>
                  <span class="font-medium text-abu-vulkanik">74 mg/kg</span>
                </div>
                <div class="w-full h-3 bg-abu-letusan rounded-sm overflow-hidden flex items-center">
                  <div class="h-full bg-genteng rounded-sm" style="width: 74%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="font-medium text-abu-vulkanik">10 Mei</span>
                  <span class="font-medium text-abu-vulkanik">82 mg/kg</span>
                </div>
                <div class="w-full h-3 bg-abu-letusan rounded-sm overflow-hidden flex items-center">
                  <div class="h-full bg-genteng rounded-sm" style="width: 82%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-1.5">
                  <span class="font-medium text-abu-vulkanik">09 Mei</span>
                  <span class="font-medium text-abu-vulkanik">65 mg/kg</span>
                </div>
                <div class="w-full h-3 bg-abu-letusan rounded-sm overflow-hidden flex items-center">
                  <div class="h-full bg-tanah-subur rounded-sm" style="width: 65%;"></div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-[#EFEAE0] flex items-center justify-between text-xs text-tanah-subur">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-sm bg-genteng"></span>
                <span>Kadar hara aman (&gt;70)</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-sm bg-tanah-subur"></span>
                <span>Batas minimum (60)</span>
              </div>
            </div>
          </section>

          <!-- Desktop Parameter Lapang Singkat -->
          <section class="bg-surface-card rounded-xl p-6 border border-[#DED7CA]">
            <h4 class="text-xs font-semibold text-tanah-subur uppercase tracking-wider mb-3">Ringkasan parameter tanah</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-tanah-subur">Keasaman (pH)</p>
                <p class="font-display text-lg font-medium text-abu-vulkanik mt-0.5">6.5 pH</p>
                <span class="text-[11px] text-terasering">Ideal cabai</span>
              </div>
              <div>
                <p class="text-xs text-tanah-subur">Kelembapan</p>
                <p class="font-display text-lg font-medium text-abu-vulkanik mt-0.5">68%</p>
                <span class="text-[11px] text-terasering">Kapasitas baik</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>

    <!-- Mobile Bottom Tab Bar -->
    <BottomNav />

  </div>
</template>

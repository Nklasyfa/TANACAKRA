<script setup lang="ts">
import Sidebar from '../components/Sidebar.vue'
</script>

<template>
  <div class="flex min-h-screen bg-surface w-full">
    <Sidebar />

    <main class="flex-grow flex flex-col h-screen overflow-y-auto w-full">
      
      <!-- Top Bar (Desktop) -->
      <header class="hidden lg:flex w-full bg-surface-bright border-b border-outline-variant px-margin-desktop py-4 justify-between items-center sticky top-0 z-40">
        <div>
          <h2 class="font-headline-md text-[24px] text-on-surface font-bold">Dashboard Admin</h2>
          <p class="font-body-md text-on-surface-variant text-sm">Ringkasan aktivitas platform Tanacakra</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-full border border-outline-variant">
            <span class="material-symbols-outlined text-primary">search</span>
            <input type="text" placeholder="Cari data..." class="bg-transparent border-none outline-none focus:ring-0 text-sm font-body-md text-on-surface w-48 placeholder-on-surface-variant">
          </div>
          <button class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors relative border border-outline-variant">
            <span class="material-symbols-outlined">notifications</span>
            <span class="absolute top-2 right-2 w-2 h-2 bg-lava-danger rounded-full"></span>
          </button>
          <div class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
            AD
          </div>
        </div>
      </header>

      <div class="p-margin-mobile lg:p-margin-desktop flex flex-col gap-stack-lg max-w-7xl mx-auto w-full">
        
        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2">
            <div class="flex justify-between items-center text-on-surface-variant">
              <span class="font-label-md">Total Petani</span>
              <span class="material-symbols-outlined text-tertiary">group</span>
            </div>
            <div class="font-display-lg text-[32px] text-on-surface font-bold">1,248</div>
            <div class="text-xs text-terrace-green font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">arrow_upward</span>
              +12% bulan ini
            </div>
          </div>
          <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2">
            <div class="flex justify-between items-center text-on-surface-variant">
              <span class="font-label-md">Luas Lahan Aktif</span>
              <span class="material-symbols-outlined text-tertiary">landscape</span>
            </div>
            <div class="font-display-lg text-[32px] text-on-surface font-bold">3,450 <span class="text-lg">Ha</span></div>
            <div class="text-xs text-terrace-green font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">arrow_upward</span>
              +5% bulan ini
            </div>
          </div>
          <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2">
            <div class="flex justify-between items-center text-on-surface-variant">
              <span class="font-label-md">Prediksi Diproses</span>
              <span class="material-symbols-outlined text-tertiary">analytics</span>
            </div>
            <div class="font-display-lg text-[32px] text-on-surface font-bold">8,920</div>
            <div class="text-xs text-on-surface-variant font-medium flex items-center gap-1">
              Data Science Pipeline
            </div>
          </div>
          <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col gap-2">
            <div class="flex justify-between items-center text-on-surface-variant">
              <span class="font-label-md">Peringatan Sistem</span>
              <span class="material-symbols-outlined text-lava-danger">warning</span>
            </div>
            <div class="font-display-lg text-[32px] text-on-surface font-bold">4</div>
            <div class="text-xs text-lava-danger font-bold flex items-center gap-1">
              Segera periksa log
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
          <!-- Recent Activities -->
          <div class="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col">
            <div class="p-5 border-b border-outline-variant flex justify-between items-center">
              <h3 class="font-headline-md-mobile text-[18px] font-bold text-on-surface">Aktivitas Terakhir</h3>
              <button class="text-primary font-label-md font-bold hover:underline">Lihat Semua</button>
            </div>
            <div class="p-0 flex flex-col">
              <div v-for="i in 5" :key="i" class="p-4 border-b border-outline-variant last:border-0 flex items-start gap-4 hover:bg-surface-container-low transition-colors">
                <div class="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant shrink-0">
                  <span class="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div class="flex-grow">
                  <p class="font-body-md text-on-surface text-sm"><span class="font-bold">Budi Santoso</span> menambahkan data lahan baru di <span class="font-bold text-primary">Desa Sukamaju</span>.</p>
                  <p class="font-label-md text-xs text-on-surface-variant mt-1">{{ i * 15 }} menit yang lalu</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Plotly Visualizations Placeholder -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 flex flex-col gap-4">
            <div class="flex justify-between items-center">
              <h3 class="font-headline-md-mobile text-[18px] font-bold text-on-surface">Analisis Lahan</h3>
              <button class="text-on-surface-variant hover:text-primary">
                <span class="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            <div class="flex-grow bg-ash-cream rounded-lg border border-outline-variant border-dashed flex flex-col items-center justify-center text-on-surface-variant p-6 text-center gap-2 min-h-[250px]">
              <span class="material-symbols-outlined text-[48px] text-outline">bar_chart</span>
              <p class="font-body-md text-sm">Integrasi Plotly akan dirender di sini.</p>
              <p class="font-label-md text-xs">(Data pH & Kelembapan)</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

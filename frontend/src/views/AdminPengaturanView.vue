<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import AdminSidebar from '../components/AdminSidebar.vue'
import AdminBottomNav from '../components/AdminBottomNav.vue'

const router = useRouter()
const route = useRoute()

const handleLogout = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-abu-letusan text-abu-vulkanik font-sans flex antialiased selection:bg-genteng/20 selection:text-genteng pb-20 md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden fixed top-0 w-full z-30 bg-abu-letusan/95 backdrop-blur-md border-b border-[#DCD6C9] px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-serif text-xl font-semibold tracking-tight text-abu-vulkanik leading-tight">Pengaturan</h1>
          <p class="text-[11px] text-tanah-subur font-medium">Pipeline & API Gateway</p>
        </div>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <AdminSidebar />

    <!-- Main Content Area -->
    <main class="w-full md:ml-[240px] flex-1 p-4 pt-20 md:pt-8 md:p-8 min-w-0 md:max-w-4xl">
      
      <header class="hidden md:flex flex-col gap-1.5 mb-8">
        <h2 class="font-serif text-[28px] font-semibold text-abu-vulkanik tracking-tight">Pengaturan & Integrasi Sistem</h2>
        <p class="text-sm text-tanah-subur max-w-3xl leading-relaxed">Konfigurasi parameter pipeline data science dan dokumentasi endpoint REST API Tanacakra.</p>
      </header>

      <div class="flex flex-col gap-6 md:gap-8">
        <!-- Section 1: Konfigurasi Pipeline -->
        <section class="bg-white rounded-xl md:p-8 p-5 border border-[#D8D2C5] shadow-sm flex flex-col gap-5 md:gap-6">
          <div class="flex flex-col gap-1 border-b border-[#D8D2C5] pb-3 md:pb-0 md:border-none">
            <h3 class="font-serif text-[18px] md:text-xl font-semibold text-abu-vulkanik">Konfigurasi pipeline inferensi</h3>
            <p class="text-[11px] md:text-sm text-tanah-subur leading-relaxed mt-0.5">Parameter ambang batas inferensi machine learning (Scikit-learn v2.4).</p>
          </div>

          <form class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5" @submit.prevent>
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] md:text-[13px] font-semibold text-abu-vulkanik flex justify-between items-center">
                <span>Ambang batas pH minimum</span>
                <span class="text-[11px] md:text-[12px] text-genteng">5.5 pH</span>
              </label>
              <input type="range" min="4.0" max="6.5" step="0.1" value="5.5" class="w-full h-1.5 md:h-2 bg-[#D8D2C5] rounded-lg appearance-none cursor-pointer accent-genteng" />
              <span class="text-[10px] md:text-[11px] text-tanah-subur/80 mt-1">Rentang aman tanah lereng cabai Cangkringan.</span>
            </div>
            
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] md:text-[13px] font-semibold text-abu-vulkanik">Ambang batas pH maksimum</label>
              <div class="relative">
                <input type="number" step="0.1" value="7.0" class="w-full px-3 py-2 md:px-3.5 rounded-md md:rounded-lg bg-[#F8F5EE] border border-[#D8D2C5] text-abu-vulkanik text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-genteng focus:border-genteng" />
                <span class="absolute right-3 top-2 md:top-2.5 text-xs text-tanah-subur pointer-events-none">pH</span>
              </div>
              <span class="text-[10px] md:text-[11px] text-tanah-subur/80 mt-0.5">Batas atas netralisasi sebelum timbul klorosis mikro.</span>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] md:text-[13px] font-semibold text-abu-vulkanik">Bobot koreksi retensi kalium lapang</label>
              <input type="number" step="0.01" value="0.78" class="w-full px-3 py-2 md:px-3.5 rounded-md md:rounded-lg bg-[#F8F5EE] border border-[#D8D2C5] text-abu-vulkanik text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-genteng focus:border-genteng" />
              <span class="text-[10px] md:text-[11px] text-tanah-subur/80 mt-0.5">Koefisien infiltrasi aliran air hujan lereng.</span>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] md:text-[13px] font-semibold text-abu-vulkanik">Koefisien erosi pasir vulkanik</label>
              <input type="number" step="0.01" value="1.35" class="w-full px-3 py-2 md:px-3.5 rounded-md md:rounded-lg bg-[#F8F5EE] border border-[#D8D2C5] text-abu-vulkanik text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-genteng focus:border-genteng" />
              <span class="text-[10px] md:text-[11px] text-tanah-subur/80 mt-0.5">Faktor risiko erupsi & lahar dingin.</span>
            </div>

            <div class="flex flex-col gap-2 md:col-span-2 pt-2">
              <span class="text-[12px] md:text-[13px] font-semibold text-abu-vulkanik">Frekuensi inferensi otomatis</span>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label class="flex items-start gap-2.5 p-3 rounded-lg bg-[#F8F5EE] border border-[#D8D2C5] cursor-pointer">
                  <input type="radio" name="inference_freq" value="event" checked class="mt-0.5 accent-genteng w-3.5 h-3.5" />
                  <div class="flex flex-col">
                    <span class="text-[11px] md:text-xs font-semibold text-abu-vulkanik">Tiap input catatan (Event-driven)</span>
                    <span class="text-[10px] text-tanah-subur mt-0.5">Komputasi langsung per log baru</span>
                  </div>
                </label>
                <label class="flex items-start gap-2.5 p-3 rounded-lg bg-[#F8F5EE] border border-[#D8D2C5] cursor-pointer">
                  <input type="radio" name="inference_freq" value="cron" class="mt-0.5 accent-genteng w-3.5 h-3.5" />
                  <div class="flex flex-col">
                    <span class="text-[11px] md:text-xs font-semibold text-abu-vulkanik">Agregasi harian (Batch cron)</span>
                    <span class="text-[10px] text-tanah-subur mt-0.5">Sinkronisasi pukul 04:00 WIB</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="flex flex-col md:flex-row items-center gap-3 pt-3 md:pt-4 md:col-span-2">
              <button type="submit" class="w-full md:w-auto px-5 py-2.5 rounded-lg bg-genteng text-white text-[12px] md:text-sm font-semibold hover:bg-[#994522] transition-colors shadow-sm flex justify-center items-center gap-2">
                <span class="material-symbols-outlined text-[16px] md:text-[18px]">check</span>
                <span>Simpan Konfigurasi</span>
              </button>
              <button type="button" class="w-full md:w-auto px-4 py-2.5 rounded-lg bg-[#F8F5EE] border border-[#D8D2C5] text-abu-vulkanik text-[12px] md:text-sm font-medium hover:bg-[#EFEAE0] transition-colors">
                Kembalikan ke Default
              </button>
            </div>
          </form>
        </section>

        <!-- Section 2: Referensi API -->
        <section class="bg-white rounded-xl md:p-8 p-5 border border-[#D8D2C5] shadow-sm flex flex-col gap-4 md:gap-6">
          <div class="flex flex-col gap-1 border-b border-[#D8D2C5] pb-3 md:pb-0 md:border-none">
            <h3 class="font-serif text-[18px] md:text-xl font-semibold text-abu-vulkanik">Referensi REST API</h3>
            <p class="text-[11px] md:text-sm text-tanah-subur leading-relaxed mt-0.5">Daftar rute layanan backend untuk pengujian integrasi gateway posko.</p>
          </div>

          <div class="bg-[#F8F5EE] border border-[#D8D2C5] p-3 md:p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex flex-col gap-1 min-w-0">
              <span class="text-[10px] md:text-[11px] font-semibold text-tanah-subur">Base URL Gateway</span>
              <span class="font-mono text-[11px] md:text-[13px] text-abu-vulkanik tracking-tight truncate">https://api.tanacakra.merapi.id/v1</span>
            </div>
            <button type="button" class="md:shrink-0 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white border border-[#D8D2C5] text-abu-vulkanik text-[10px] md:text-[11px] font-semibold transition-colors">
              <span class="material-symbols-outlined text-[14px]">content_copy</span>
              <span>Salin URL</span>
            </button>
          </div>

          <div class="flex flex-col gap-3">
            <div class="p-3 md:p-4 rounded-lg bg-[#F8F5EE] border border-[#D8D2C5] flex flex-col gap-2">
              <div class="flex items-baseline gap-2">
                <span class="font-mono font-bold text-genteng text-[11px] md:text-[12px]">POST</span>
                <span class="font-mono text-abu-vulkanik text-[11px] md:text-[13px] font-medium break-all">/api/v1/lahan/{lahan_id}/input</span>
              </div>
              <p class="text-[10px] md:text-[11px] text-tanah-subur leading-snug">Input parameter masukan tanah lapangan oleh petani (pH, kelembapan, NPK).</p>
            </div>
            <div class="p-3 md:p-4 rounded-lg bg-[#F8F5EE] border border-[#D8D2C5] flex flex-col gap-2">
              <div class="flex items-baseline gap-2">
                <span class="font-mono font-bold text-genteng text-[11px] md:text-[12px]">POST</span>
                <span class="font-mono text-abu-vulkanik text-[11px] md:text-[13px] font-medium break-all">/api/v1/pipeline/infer</span>
              </div>
              <p class="text-[10px] md:text-[11px] text-tanah-subur leading-snug">Menjalankan inferensi model Scikit-learn RF untuk rekomendasi pupuk.</p>
            </div>
            <div class="p-3 md:p-4 rounded-lg bg-[#F8F5EE] border border-[#D8D2C5] flex flex-col gap-2">
              <div class="flex items-baseline gap-2">
                <span class="font-mono font-bold text-terasering text-[11px] md:text-[12px]">GET</span>
                <span class="font-mono text-abu-vulkanik text-[11px] md:text-[13px] font-medium break-all">/api/v1/lahan/{lahan_id}/history</span>
              </div>
              <p class="text-[10px] md:text-[11px] text-tanah-subur leading-snug">Mengambil riwayat log data masukan 14 hari terakhir suatu petak.</p>
            </div>
          </div>
        </section>
      </div>

    </main>

    <!-- Admin Bottom Navigation (Mobile) -->
    <AdminBottomNav />

  </div>
</template>

<style scoped>
.fill {
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: #B3542C;
  cursor: pointer;
}
</style>

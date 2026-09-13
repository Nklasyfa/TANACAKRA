<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const handleLogout = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-abu-letusan text-abu-vulkanik font-sans antialiased selection:bg-genteng/20 selection:text-genteng flex flex-col md:flex-row pb-24 md:pb-0">

    <!-- Mobile Top App Bar -->
    <header class="md:hidden sticky top-0 z-20 bg-[#EFEAE0]/95 backdrop-blur-sm border-b border-[#DFD9CD] px-4 py-3 flex items-center justify-between">
      <div>
        <h1 class="font-display font-semibold text-[19px] tracking-tight text-genteng leading-none">Tanacakra</h1>
        <p class="text-[11px] text-tanah-subur mt-1 font-medium">Dashboard Admin • Cangkringan</p>
      </div>
      <div class="flex items-center gap-1">
        <button class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#DFD9CD]/60 text-abu-vulkanik">
          <span class="material-symbols-outlined text-[20px]">notifications</span>
        </button>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <aside class="hidden md:flex w-60 bg-[#EFEAE0] border-r border-[#DFD9CD] flex-col justify-between fixed inset-y-0 left-0 z-30 select-none">
      <div>
        <div class="px-6 pt-7 pb-6">
          <h1 class="font-display font-semibold text-[21px] text-genteng tracking-tight leading-none">Tanacakra</h1>
          <p class="text-xs text-tanah-subur/80 font-medium mt-1">Admin Dashboard</p>
        </div>

        <nav class="space-y-1">
          <router-link to="/admin" 
            :class="route.path === '/admin' ? 'flex items-center gap-3.5 px-6 py-3 text-sm font-semibold text-genteng bg-[#DFD9CD]/50 border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-[#DFD9CD]/40 transition-colors'">
            <span class="material-symbols-outlined text-[22px]" :class="route.path === '/admin' ? 'fill-1 text-genteng' : 'text-abu-vulkanik/70'">dashboard</span>
            <span>Dashboard</span>
          </router-link>

          <a href="#" class="flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-[#DFD9CD]/40 transition-colors">
            <span class="material-symbols-outlined text-abu-vulkanik/70 text-[22px]">grid_view</span>
            <span>Manajemen Lahan</span>
          </a>

          <a href="#" class="flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-[#DFD9CD]/40 transition-colors">
            <span class="material-symbols-outlined text-abu-vulkanik/70 text-[22px]">receipt_long</span>
            <span>Log Aktivitas</span>
          </a>

          <a href="#" class="flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-[#DFD9CD]/40 transition-colors">
            <span class="material-symbols-outlined text-abu-vulkanik/70 text-[22px]">settings</span>
            <span>Pengaturan</span>
          </a>
        </nav>
      </div>

      <div class="p-6 border-t border-[#DFD9CD]/80 space-y-3">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-[#DFD9CD] border border-[#DFD9CD] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-tanah-subur text-[20px]">admin_panel_settings</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-abu-vulkanik truncate">Admin Utama</p>
            <p class="text-[11px] text-tanah-subur/80 truncate">Kelompok Tani Cangkringan</p>
          </div>
        </div>
        <button @click="handleLogout" class="flex items-center gap-2.5 text-xs text-abu-vulkanik/80 hover:text-bahaya-lahar font-medium pt-1 transition-colors w-full text-left">
          <span class="material-symbols-outlined text-[18px] text-abu-vulkanik/70 flex-shrink-0">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>

    <!-- MAIN CONTENT AREA -->
    <main class="md:ml-60 flex-1 p-4 md:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-5 md:space-y-8">

      <!-- Context Sentence & Filter -->
      <div class="bg-[#F7F4EE] rounded-lg md:rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="font-display font-semibold text-lg md:text-2xl text-abu-vulkanik">Sebaran Lahan Desa Cangkringan</h2>
            <p class="text-[13px] md:text-sm text-abu-vulkanik/80 font-medium leading-relaxed mt-1">
              4 Blok, 124 lahan terdaftar di lereng selatan Gunung Merapi.
            </p>
          </div>
          <div class="flex items-center justify-between md:justify-start gap-4 pt-2 md:pt-0 border-t md:border-0 border-[#DFD9CD]/60 text-xs text-tanah-subur font-medium">
            <div class="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#DFD9CD]">
              <span class="material-symbols-outlined text-[16px]">calendar_today</span>
              <span>01 Mei – 15 Mei 2024</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 items-start">
        <!-- Main Column (Map and Chart) -->
        <div class="lg:col-span-8 space-y-5 md:space-y-8">
          
          <!-- HERO ELEMENT: SPATIAL MAP -->
          <div class="bg-[#F7F4EE] rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-[#DFD9CD]/70 mb-3 md:mb-4">
              <div>
                <h2 class="font-display font-semibold text-base md:text-lg text-abu-vulkanik">Peta Sebaran Lahan</h2>
                <p class="text-[11px] md:text-xs text-tanah-subur">Status tanah vulkanik & alur Kali Gendol</p>
              </div>
            </div>

            <!-- Map Legend -->
            <div class="flex items-center gap-4 text-[11px] md:text-xs font-medium pb-2.5 md:pb-4">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-terasering inline-block"></span>
                <span class="text-abu-vulkanik">Sehat (98)</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-bahaya-lahar inline-block"></span>
                <span class="text-abu-vulkanik">Perlu atensi / risiko (26)</span>
              </div>
            </div>

            <!-- SVG Map Placeholder (Same aesthetic logic) -->
            <div class="relative w-full h-[240px] md:h-[350px] bg-[#EFEAE0] rounded-lg border border-[#DFD9CD] overflow-hidden group">
              <svg class="w-full h-full" viewBox="0 0 360 240" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <!-- Topographic Contour Lines -->
                <path d="M-10,30 Q90,20 180,35 T370,25" stroke="#DFD9CD" stroke-width="1.2" fill="none"></path>
                <path d="M-10,75 Q110,60 190,85 T370,70" stroke="#DFD9CD" stroke-width="1.2" fill="none"></path>
                <path d="M-10,120 Q80,105 200,130 T370,115" stroke="#DFD9CD" stroke-width="1.2" fill="none"></path>
                <path d="M-10,165 Q100,150 210,180 T370,160" stroke="#DFD9CD" stroke-width="1.2" fill="none"></path>
                <path d="M-10,210 Q90,200 200,220 T370,205" stroke="#DFD9CD" stroke-width="1.2" fill="none"></path>

                <!-- River / Lahar Trail -->
                <path d="M195,-5 C185,45 175,95 160,140 C150,180 140,215 130,245" stroke="#DFD9CD" stroke-width="7" stroke-linecap="round" fill="none"></path>
                <path d="M195,-5 C185,45 175,95 160,140 C150,180 140,215 130,245" stroke="#8C2F1B" stroke-width="1.2" stroke-opacity="0.4" stroke-dasharray="3 3" fill="none"></path>

                <!-- Annotations -->
                <text x="35" y="45" fill="#5C4A32" font-size="9" font-family="'Plus Jakarta Sans'" font-weight="600" opacity="0.6">Blok A (Utara)</text>
                <text x="240" y="55" fill="#5C4A32" font-size="9" font-family="'Plus Jakarta Sans'" font-weight="600" opacity="0.6">Blok B (Timur)</text>
                <text x="40" y="225" fill="#5C4A32" font-size="9" font-family="'Plus Jakarta Sans'" font-weight="600" opacity="0.6">Blok C (Selatan)</text>
                
                <!-- Some points -->
                <circle cx="75" cy="85" r="4.5" fill="#6B7A4F"></circle>
                <circle cx="115" cy="90" r="4.5" fill="#8C2F1B"></circle>
                <circle cx="150" cy="60" r="4.5" fill="#8C2F1B"></circle>
                <circle cx="230" cy="75" r="4.5" fill="#6B7A4F"></circle>
                <circle cx="130" cy="175" r="4.5" fill="#8C2F1B"></circle>
                <circle cx="285" cy="155" r="4.5" fill="#6B7A4F"></circle>
                <circle cx="240" cy="200" r="4.5" fill="#6B7A4F"></circle>

                <!-- Callout -->
                <g transform="translate(150, 60)">
                  <circle cx="0" cy="0" r="8" fill="#8C2F1B" fill-opacity="0.3" class="animate-pulse"></circle>
                  <rect x="8" y="-28" width="130" height="38" rx="3" fill="#3A3733"></rect>
                  <text x="14" y="-16" fill="#EFEAE0" font-size="9" font-family="'Plus Jakarta Sans'" font-weight="700">Blok B - Petak 14</text>
                  <text x="14" y="-5" fill="#DFD9CD" font-size="8" font-family="'Plus Jakarta Sans'">pH 5.1 • Erosi Pasir</text>
                </g>
              </svg>
            </div>
          </div>

          <!-- TREND CHART -->
          <div class="bg-[#F7F4EE] rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm">
            <div class="flex items-center justify-between pb-2.5 border-b border-[#DFD9CD]/60">
              <div>
                <h3 class="font-display font-semibold text-sm md:text-base text-abu-vulkanik">Tren Harga & Volume Panen</h3>
                <p class="text-[11px] md:text-xs text-tanah-subur">Cabai rawit & salak pondoh mingguan</p>
              </div>
            </div>

            <!-- Legend -->
            <div class="flex items-center gap-3 text-[11px] md:text-xs font-medium pt-2 md:pt-4 pb-1 md:pb-3">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 bg-genteng inline-block"></span>
                <span class="text-abu-vulkanik">Harga (Rp/kg)</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-0.5 bg-tanah-subur inline-block"></span>
                <span class="text-abu-vulkanik">Volume (Kuintal)</span>
              </div>
            </div>

            <div class="w-full h-[160px] md:h-[220px] mt-1 relative border-l border-b border-[#DFD9CD]">
              <svg class="w-full h-full absolute inset-0" viewBox="0 0 320 150" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M35,110 C80,95 120,70 170,55 C220,40 270,30 305,25" stroke="#B3542C" stroke-width="2.5" fill="none"></path>
                <circle cx="35" cy="110" r="4" fill="#B3542C"></circle>
                <circle cx="105" cy="85" r="4" fill="#B3542C"></circle>
                <circle cx="170" cy="55" r="4" fill="#B3542C"></circle>
                <circle cx="240" cy="35" r="4" fill="#B3542C"></circle>
                <circle cx="305" cy="25" r="4" fill="#B3542C"></circle>

                <path d="M35,45 C80,60 120,90 170,105 C220,115 270,95 305,70" stroke="#5C4A32" stroke-width="2.5" fill="none"></path>
                <circle cx="35" cy="45" r="4" fill="#5C4A32"></circle>
                <circle cx="105" cy="75" r="4" fill="#5C4A32"></circle>
                <circle cx="170" cy="105" r="4" fill="#5C4A32"></circle>
                <circle cx="240" cy="110" r="4" fill="#5C4A32"></circle>
                <circle cx="305" cy="70" r="4" fill="#5C4A32"></circle>
              </svg>
              <div class="absolute bottom-0 w-full flex justify-between px-8 text-[10px] md:text-xs text-tanah-subur -mb-5">
                <span>M1 Apr</span>
                <span>M2 Apr</span>
                <span>M3 Apr</span>
                <span>M4 Apr</span>
                <span>M1 Mei</span>
              </div>
            </div>
            <p class="text-[11px] md:text-xs text-tanah-subur mt-8 md:mt-10">
              Harga cabai naik ke Rp 48.500/kg seiring penurunan volume panen lereng.
            </p>
          </div>
        </div>

        <!-- Sidebar Right Column -->
        <div class="lg:col-span-4 space-y-5 md:space-y-8">
          
          <!-- KEY NUMBERS COMPACT -->
          <div class="bg-[#F7F4EE] rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm">
            <h3 class="font-display font-semibold text-sm md:text-base text-abu-vulkanik mb-4">Ringkasan Sistem</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-white border border-[#DFD9CD] rounded-lg">
                <div class="text-[11px] md:text-xs font-medium text-tanah-subur">Total lahan aktif</div>
                <div class="mt-1 flex items-baseline gap-1.5">
                  <span class="font-display text-xl md:text-2xl font-bold text-abu-vulkanik">124</span>
                  <span class="text-[10px] md:text-xs text-terasering font-medium">98 sehat</span>
                </div>
              </div>
              <div class="p-3 bg-white border border-[#DFD9CD] rounded-lg">
                <div class="text-[11px] md:text-xs font-medium text-tanah-subur">Rata-rata pH</div>
                <div class="mt-1 flex items-baseline gap-1.5">
                  <span class="font-display text-xl md:text-2xl font-bold text-abu-vulkanik">6.4</span>
                </div>
              </div>
              <div class="p-3 bg-white border border-[#DFD9CD] rounded-lg">
                <div class="text-[11px] md:text-xs font-medium text-tanah-subur">Kelembapan</div>
                <div class="mt-1 flex items-baseline gap-1.5">
                  <span class="font-display text-xl md:text-2xl font-bold text-abu-vulkanik">68%</span>
                </div>
              </div>
              <div class="p-3 bg-white border border-[#DFD9CD] rounded-lg">
                <div class="text-[11px] md:text-xs font-medium text-tanah-subur">Laporan minggu ini</div>
                <div class="mt-1 flex items-baseline gap-1.5">
                  <span class="font-display text-xl md:text-2xl font-bold text-genteng">42</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RECOMMENDATION FEED -->
          <div class="bg-[#F7F4EE] rounded-xl border border-[#DFD9CD] p-4 md:p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-[#DFD9CD]/60">
              <h3 class="font-display font-semibold text-sm md:text-base text-abu-vulkanik">Rekomendasi Tindakan</h3>
              <span class="text-[11px] md:text-xs font-semibold text-genteng">3 Perlu Tindakan</span>
            </div>

            <!-- Card 1: Urgent -->
            <div class="p-3.5 rounded-lg bg-[#F1E5E1] border border-[#E4D1CA] shadow-sm">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] md:text-xs font-bold text-bahaya-lahar">Prioritas Tinggi • Blok B</span>
                <span class="text-[10px] md:text-xs text-tanah-subur">08:30 WIB</span>
              </div>
              <p class="text-xs md:text-sm text-abu-vulkanik leading-relaxed">
                Lahan Blok B: produktivitas turun 3 bulan berturut, cek irigasi sektor utara dan periksa rembesan endapan pasir kali.
              </p>
              <button class="mt-3 text-[11px] md:text-xs font-semibold text-bahaya-lahar hover:underline block">
                Tugaskan penyuluh lapangan →
              </button>
            </div>

            <!-- Card 2: Moderate -->
            <div class="p-3.5 rounded-lg bg-white border border-[#DFD9CD] shadow-sm">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] md:text-xs font-bold text-genteng">Rekomendasi Pupuk • Blok A</span>
                <span class="text-[10px] md:text-xs text-tanah-subur">Kemarin</span>
              </div>
              <p class="text-xs md:text-sm text-abu-vulkanik leading-relaxed">
                Lahan Blok A menunjukkan retensi hara kalium membaik; sarankan penambahan dolomit 150 kg per hektar sebelum tanam cabai berikutnya.
              </p>
              <button class="mt-3 text-[11px] md:text-xs font-semibold text-genteng hover:underline block">
                Kirim broadcast ke petani →
              </button>
            </div>

            <!-- Card 3: Normal -->
            <div class="p-3.5 rounded-lg bg-white border border-[#DFD9CD] shadow-sm">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] md:text-xs font-bold text-terasering">Kesiapan Panen • Blok D</span>
                <span class="text-[10px] md:text-xs text-tanah-subur">10 Mei 2024</span>
              </div>
              <p class="text-xs md:text-sm text-abu-vulkanik leading-relaxed">
                Komoditas salak pondoh Blok D Glagaharjo memasuki fase panen optimal dalam 5 hari ke depan; koordinasikan jadwal angkut posko tani.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </main>

    <!-- FIXED BOTTOM TAB BAR (Admin) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-[#EFEAE0] border-t border-[#DFD9CD] px-2 py-2 flex items-center justify-around z-30 select-none pb-safe">
      <router-link to="/admin" class="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full bg-[#DFD9CD] text-genteng font-semibold transition-all">
        <span class="material-symbols-outlined fill text-[20px] text-genteng">dashboard</span>
        <span class="text-[10px] leading-tight">Dashboard</span>
      </router-link>

      <a href="#" class="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-abu-vulkanik transition-colors">
        <span class="material-symbols-outlined text-[20px] text-abu-vulkanik opacity-70">grid_view</span>
        <span class="text-[10px] font-medium leading-tight">Lahan</span>
      </a>

      <a href="#" class="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-abu-vulkanik transition-colors">
        <span class="material-symbols-outlined text-[20px] text-abu-vulkanik opacity-70">receipt_long</span>
        <span class="text-[10px] font-medium leading-tight">Log</span>
      </a>

      <a href="#" class="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-abu-vulkanik transition-colors">
        <span class="material-symbols-outlined text-[20px] text-abu-vulkanik opacity-70">settings</span>
        <span class="text-[10px] font-medium leading-tight">Pengaturan</span>
      </a>
    </nav>

  </div>
</template>

<style scoped>
.fill {
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}
</style>

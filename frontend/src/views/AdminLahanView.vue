<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isDrawerOpen = ref(false)

const openDrawer = () => {
  isDrawerOpen.value = true
}

const closeDrawer = () => {
  isDrawerOpen.value = false
}

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
          <h1 class="font-serif text-xl font-semibold tracking-tight text-abu-vulkanik leading-tight">Manajemen Lahan</h1>
          <p class="text-[11px] text-tanah-subur font-medium">Desa Cangkringan • 124 petak terdaftar</p>
        </div>
        <div class="flex items-center space-x-1">
          <button class="p-2 text-abu-vulkanik hover:text-genteng transition-colors rounded-full relative">
            <span class="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <aside class="hidden md:flex w-[240px] fixed inset-y-0 left-0 bg-abu-letusan border-r border-[#D8D2C5] flex-col justify-between z-30 select-none">
      <div>
        <div class="px-6 pt-7 pb-6">
          <h1 class="font-serif text-[22px] font-semibold text-genteng tracking-tight leading-none">Tanacakra</h1>
          <p class="text-xs text-tanah-subur/80 font-medium mt-1">Dashboard Admin</p>
        </div>
        <nav class="space-y-1 mt-2">
          <router-link to="/admin" class="flex items-center gap-3 px-6 py-3 text-sm text-abu-vulkanik hover:bg-[#DFD9CD]/50 transition-colors">
            <span class="material-symbols-outlined text-[20px] opacity-70">dashboard</span>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/admin/lahan" class="flex items-center gap-3 px-6 py-3 text-sm font-semibold bg-[#DFD9CD] text-genteng border-l-[3px] border-tanah-subur transition-colors">
            <span class="material-symbols-outlined text-[20px] text-genteng">grid_view</span>
            <span>Manajemen Lahan</span>
          </router-link>
          <router-link to="/admin/log" class="flex items-center gap-3 px-6 py-3 text-sm text-abu-vulkanik hover:bg-[#DFD9CD]/50 transition-colors">
            <span class="material-symbols-outlined text-[20px] opacity-70">receipt_long</span>
            <span>Log Aktivitas</span>
          </router-link>
          <router-link to="/admin/pengaturan" class="flex items-center gap-3 px-6 py-3 text-sm text-abu-vulkanik hover:bg-[#DFD9CD]/50 transition-colors">
            <span class="material-symbols-outlined text-[20px] opacity-70">settings</span>
            <span>Pengaturan</span>
          </router-link>
        </nav>
      </div>
      <div class="p-4 border-t border-[#D8D2C5] text-sm space-y-3">
        <div class="flex items-center gap-2.5 px-2">
          <div class="w-7 h-7 rounded-full bg-[#DFD9CD] border border-[#D8D2C5] flex items-center justify-center text-tanah-subur">
            <span class="material-symbols-outlined text-[16px]">person</span>
          </div>
          <div class="leading-tight truncate">
            <p class="font-medium text-xs text-abu-vulkanik truncate">Admin Utama</p>
            <p class="text-[11px] text-tanah-subur/70 truncate">Admin/Penyuluh</p>
          </div>
        </div>
        <button @click="handleLogout" class="flex items-center gap-2.5 px-2 text-xs text-abu-vulkanik hover:text-bahaya-lahar transition-colors w-full text-left">
          <span class="material-symbols-outlined text-[16px] opacity-70">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="w-full md:ml-[240px] flex-1 p-4 pt-20 md:pt-8 md:p-8 min-w-0">
      
      <!-- Content Header (Desktop) -->
      <header class="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="font-serif text-2xl md:text-[28px] font-semibold text-abu-vulkanik tracking-tight">Manajemen Lahan Pertanian</h2>
          <p class="text-sm text-tanah-subur/80 mt-1">Inventarisasi 124 petak lahan lereng Merapi dan tata kelola pipeline analisis data tanah.</p>
        </div>
        <div class="flex items-center gap-2.5 shrink-0">
          <button class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white/70 hover:bg-white text-abu-vulkanik border border-[#D8D2C5] rounded shadow-sm transition-colors">
            <span class="material-symbols-outlined text-[16px] text-tanah-subur">file_download</span>
            <span>Ekspor CSV</span>
          </button>
          <button class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-genteng hover:bg-genteng/90 text-white rounded shadow-sm transition-colors">
            <span class="material-symbols-outlined text-[16px]">add</span>
            <span>Tambah Petak Lahan</span>
          </button>
        </div>
      </header>

      <!-- Filter Toolbar (Desktop) / Search & Action (Mobile) -->
      <section class="bg-white/80 backdrop-blur border border-[#D8D2C5] rounded-lg p-3 md:p-3.5 mb-4 md:mb-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:flex-wrap items-center gap-3">
          <div class="w-full md:flex-1 md:min-w-[260px] relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-tanah-subur/60 pointer-events-none">
              <span class="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input type="text" placeholder="Cari ID lahan, nama petani..." class="w-full pl-9 pr-4 py-2 md:py-1.5 text-xs md:text-sm bg-white border border-[#D8D2C5] rounded md:rounded focus:ring-1 focus:ring-genteng focus:border-genteng outline-none" />
          </div>
          <button class="md:hidden w-full flex items-center justify-center gap-2 bg-genteng active:bg-[#994522] text-white py-2.5 px-4 rounded font-medium text-[13px] shadow-sm transition-all">
            <span class="material-symbols-outlined text-[18px]">add</span>
            <span>Tambah Lahan Baru</span>
          </button>
          <div class="hidden md:block w-48">
            <select class="w-full py-1.5 px-3 text-xs bg-white border border-[#D8D2C5] rounded focus:ring-1 focus:ring-genteng outline-none">
              <option value="all">Semua Blok (Lereng Merapi)</option>
              <option value="A">Blok A (Kinahrejo)</option>
            </select>
          </div>
          <div class="hidden md:block w-44">
            <select class="w-full py-1.5 px-3 text-xs bg-white border border-[#D8D2C5] rounded focus:ring-1 focus:ring-genteng outline-none">
              <option value="all">Semua Status Pipeline</option>
              <option value="success">Optimal (v2.4)</option>
            </select>
          </div>
        </div>

        <!-- Mobile Filter Chips -->
        <div class="md:hidden flex items-center gap-2 overflow-x-auto hide-scrollbar pt-3 pb-1 -mx-3 px-3">
          <button class="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-abu-vulkanik text-white whitespace-nowrap shadow-sm">Semua Blok (124)</button>
          <button class="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#FDFBF7] text-abu-vulkanik border border-[#D9D2C5] whitespace-nowrap">Blok A (32)</button>
          <button class="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#DFD9CD] text-genteng border border-genteng/30 whitespace-nowrap">Blok B (38)</button>
        </div>
      </section>

      <!-- Land Data Table (Desktop) -->
      <section class="hidden md:block bg-white border border-[#D8D2C5] rounded-lg shadow-sm overflow-hidden mb-6">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#DFD9CD]/40 border-b border-[#D8D2C5] text-[11px] font-semibold text-tanah-subur tracking-wider">
                <th class="py-3 px-4 w-32">ID Lahan</th>
                <th class="py-3 px-4 w-48">Petani Terkait</th>
                <th class="py-3 px-4 w-48">Koordinat & Blok</th>
                <th class="py-3 px-4 w-32">Komoditas</th>
                <th class="py-3 px-4 w-32">Status Pipeline</th>
                <th class="py-3 px-4 w-36">Terakhir Diproses</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#D8D2C5] text-xs">
              <tr class="hover:bg-[#DFD9CD]/30 transition-colors cursor-pointer bg-[#DFD9CD]/20" @click="openDrawer">
                <td class="py-3 px-4 font-mono font-semibold text-genteng">LHN-MR-014</td>
                <td class="py-3 px-4">
                  <div class="font-medium text-abu-vulkanik">Suparman Wignyosukarto</div>
                  <div class="text-[10px] text-tanah-subur/70">Kelompok Merapi Makmur</div>
                </td>
                <td class="py-3 px-4 text-abu-vulkanik">
                  <div>Blok B (Umbulharjo)</div>
                  <div class="text-[10px] text-tanah-subur/70 font-mono">-7.5982, 110.4412</div>
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#DFD9CD] text-tanah-subur">Cabai Rawit</span>
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-bahaya-lahar/10 text-bahaya-lahar border border-bahaya-lahar/20">
                    <span class="w-1.5 h-1.5 rounded-full bg-bahaya-lahar"></span>Perlu Retrain
                  </span>
                </td>
                <td class="py-3 px-4 text-tanah-subur">12 Mei 2024, 08:30</td>
                <td class="py-3 px-4 text-right">
                  <button class="px-2.5 py-1 text-xs font-medium text-genteng bg-genteng/10 hover:bg-genteng/20 rounded transition-colors" @click.stop="openDrawer">Detail</button>
                </td>
              </tr>
              <tr class="hover:bg-[#DFD9CD]/30 transition-colors cursor-pointer" @click="openDrawer">
                <td class="py-3 px-4 font-mono font-semibold text-abu-vulkanik">LHN-MR-008</td>
                <td class="py-3 px-4">
                  <div class="font-medium text-abu-vulkanik">Marsono Cangkringan</div>
                  <div class="text-[10px] text-tanah-subur/70">Kelompok Sumber Subur</div>
                </td>
                <td class="py-3 px-4 text-abu-vulkanik">
                  <div>Blok A (Kinahrejo)</div>
                  <div class="text-[10px] text-tanah-subur/70 font-mono">-7.5891, 110.4350</div>
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#DFD9CD] text-tanah-subur">Salak Pondoh</span>
                </td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-terasering/10 text-terasering border border-terasering/20">
                    <span class="w-1.5 h-1.5 rounded-full bg-terasering"></span>Optimal (v2.4)
                  </span>
                </td>
                <td class="py-3 px-4 text-tanah-subur">10 Mei 2024, 14:15</td>
                <td class="py-3 px-4 text-right">
                  <button class="px-2.5 py-1 text-xs font-medium text-tanah-subur bg-[#DFD9CD]/60 hover:bg-[#DFD9CD] rounded transition-colors" @click.stop="openDrawer">Detail</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-4 py-2.5 bg-[#DFD9CD]/20 border-t border-[#D8D2C5] flex items-center justify-between text-[11px] text-tanah-subur">
          <p>Menampilkan 1–2 dari 124 petak terdaftar</p>
          <div class="flex items-center gap-1">
            <button class="px-2 py-1 border border-[#D8D2C5] rounded bg-white disabled:opacity-50" disabled>Sebelumnya</button>
            <button class="px-2 py-1 border border-genteng bg-genteng text-white rounded font-medium">1</button>
            <button class="px-2 py-1 border border-[#D8D2C5] rounded bg-white">Selanjutnya</button>
          </div>
        </div>
      </section>

      <!-- Land Cards List (Mobile) -->
      <section class="md:hidden space-y-3 mb-6">
        <!-- Card 1 -->
        <article class="bg-[#FDFBF7] border-2 border-genteng rounded-xl p-3.5 shadow-sm relative overflow-hidden" @click="openDrawer">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-bahaya-lahar"></div>
          <div class="flex items-start justify-between gap-2 mb-2 pl-2">
            <div>
              <span class="text-[10px] font-mono font-bold tracking-wider text-tanah-subur">LHN-MR-014</span>
              <h2 class="font-semibold text-[14px] text-abu-vulkanik leading-snug">Petak 14 • Suparman W.</h2>
              <p class="text-[10px] text-tanah-subur">KT Margo Rukun • Blok B (Umbulharjo)</p>
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#F8E9E7] text-bahaya-lahar border border-bahaya-lahar/20">Perlu Retrain</span>
          </div>
          <div class="bg-abu-letusan/60 rounded-lg p-2.5 my-2.5 grid grid-cols-2 gap-2 text-[11px] border border-[#E4DDCF] ml-1">
            <div>
              <span class="text-[9px] text-tanah-subur block">Komoditas & Luas</span>
              <span class="font-semibold text-abu-vulkanik">Cabai Rawit • 1.200 m²</span>
            </div>
            <div>
              <span class="text-[9px] text-tanah-subur block">Parameter Tanah</span>
              <span class="font-semibold text-abu-vulkanik">pH 5.1 | Lembap 42%</span>
            </div>
          </div>
        </article>

        <!-- Card 2 -->
        <article class="bg-[#FDFBF7] border border-[#DDD6C9] rounded-xl p-3.5 shadow-sm" @click="openDrawer">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <span class="text-[10px] font-mono font-bold tracking-wider text-tanah-subur">LHN-MR-008</span>
              <h2 class="font-semibold text-[14px] text-abu-vulkanik leading-snug">Petak 08 • Marsono C.</h2>
              <p class="text-[10px] text-tanah-subur">KT Sumber Subur • Blok A (Kinahrejo)</p>
            </div>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#EEF2E6] text-terasering border border-terasering/20">Optimal</span>
          </div>
          <div class="bg-abu-letusan/60 rounded-lg p-2.5 my-2.5 grid grid-cols-2 gap-2 text-[11px] border border-[#E4DDCF]">
            <div>
              <span class="text-[9px] text-tanah-subur block">Komoditas & Luas</span>
              <span class="font-semibold text-abu-vulkanik">Salak Pondoh • 800 m²</span>
            </div>
            <div>
              <span class="text-[9px] text-tanah-subur block">Parameter Tanah</span>
              <span class="font-semibold text-abu-vulkanik">pH 6.5 | Lembap 68%</span>
            </div>
          </div>
        </article>
      </section>

      <!-- Quick Stats Strip (Desktop & Mobile) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
        <div class="bg-white p-3 md:p-3.5 rounded-lg border border-[#D8D2C5]">
          <p class="text-[10px] md:text-xs text-tanah-subur/80">Total Petak Aktif</p>
          <p class="text-lg md:text-xl font-serif font-bold text-abu-vulkanik mt-0.5">124 <span class="text-[9px] md:text-xs font-sans font-normal text-terasering">98 normal</span></p>
        </div>
        <div class="bg-white p-3 md:p-3.5 rounded-lg border border-[#D8D2C5]">
          <p class="text-[10px] md:text-xs text-tanah-subur/80">Petak Butuh Kalibrasi</p>
          <p class="text-lg md:text-xl font-serif font-bold text-bahaya-lahar mt-0.5">26 <span class="text-[9px] md:text-xs font-sans font-normal text-tanah-subur">erosi & pH asam</span></p>
        </div>
      </div>
    </main>

    <!-- Detail Pipeline Drawer / Bottom Sheet -->
    <!-- Re-used same component pattern for both Desktop Drawer and Mobile Bottom Sheet -->
    <div v-if="isDrawerOpen" class="fixed inset-0 z-50 flex justify-end md:bg-black/20 bg-black/40 backdrop-blur-sm transition-opacity">
      <div class="absolute inset-0" @click="closeDrawer"></div>
      
      <!-- Drawer Content Panel -->
      <div class="relative w-full md:w-[420px] h-full mt-auto md:mt-0 max-h-[88vh] md:max-h-full bg-white md:border-l border-t md:border-t-0 border-[#D8D2C5] shadow-2xl flex flex-col rounded-t-2xl md:rounded-none transition-transform">
        
        <div class="md:hidden w-12 h-1.5 bg-[#D5CEC2] rounded-full mx-auto mt-3 mb-1"></div>
        
        <div class="px-4 md:px-5 py-3 md:py-4 border-b border-[#D8D2C5] flex items-center justify-between bg-abu-letusan/40 md:bg-transparent">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-genteng hidden md:block"></span>
            <div>
              <span class="text-[10px] md:hidden font-mono font-bold text-genteng uppercase tracking-wide">Konfigurasi Pipeline Model</span>
              <h3 class="font-serif text-[15px] md:text-base font-semibold text-abu-vulkanik leading-tight md:leading-normal">Detail Petak 14 — Blok B</h3>
            </div>
          </div>
          <button @click="closeDrawer" class="p-1 rounded-full hover:bg-abu-letusan text-tanah-subur transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 md:space-y-6 bg-[#FDFBF7] md:bg-white text-xs md:text-sm">
          
          <div class="bg-abu-letusan/60 md:bg-white rounded-xl md:rounded-none p-3 md:p-0 border border-[#E0D9CB] md:border-none">
            <div class="flex items-start justify-between mb-3 md:mb-0">
              <div class="hidden md:block">
                <span class="font-mono text-[10px] px-2 py-0.5 bg-[#DFD9CD] text-tanah-subur rounded font-semibold">LHN-MR-014</span>
                <p class="text-[11px] text-tanah-subur/80 mt-2">Petani: Suparman Wignyosukarto (Merapi Makmur)</p>
              </div>
              <span class="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-bahaya-lahar/10 text-bahaya-lahar border border-bahaya-lahar/20">Perlu Retrain</span>
            </div>

            <div class="grid grid-cols-2 gap-2 md:mt-4 md:p-3 md:bg-abu-letusan/30 rounded md:border border-[#D8D2C5] text-[10px] md:text-[11px]">
              <div>
                <span class="text-tanah-subur/70 block">Luas Lahan</span>
                <span class="font-medium text-abu-vulkanik">1.450 m²</span>
              </div>
              <div>
                <span class="text-tanah-subur/70 block">Elevasi Lereng</span>
                <span class="font-medium text-abu-vulkanik">820 mdpl</span>
              </div>
              <div>
                <span class="text-tanah-subur/70 block">Lapisan Vulkanik</span>
                <span class="font-medium text-abu-vulkanik">Pasir Halus 2010</span>
              </div>
              <div>
                <span class="text-tanah-subur/70 block">Koordinat GPS</span>
                <span class="font-mono text-abu-vulkanik">-7.5982, 110.4412</span>
              </div>
            </div>
          </div>

          <section>
            <h5 class="text-[10px] font-semibold text-tanah-subur uppercase tracking-wider mb-2">Status Metrik Tanah Terakhir</h5>
            <div class="grid grid-cols-3 gap-2">
              <div class="p-2 bg-white border border-[#D8D2C5] rounded text-center">
                <span class="text-[9px] md:text-[10px] text-tanah-subur/70 block">Keasaman</span>
                <span class="text-sm md:text-base font-bold text-bahaya-lahar">pH 5.1</span>
                <span class="text-[9px] text-bahaya-lahar block mt-0.5">Asam lereng</span>
              </div>
              <div class="p-2 bg-white border border-[#D8D2C5] rounded text-center">
                <span class="text-[9px] md:text-[10px] text-tanah-subur/70 block">Kelembapan</span>
                <span class="text-sm md:text-base font-bold text-abu-vulkanik">42%</span>
                <span class="text-[9px] text-tanah-subur/70 block mt-0.5">Kapasitas lapang</span>
              </div>
              <div class="p-2 bg-white border border-[#D8D2C5] rounded text-center">
                <span class="text-[9px] md:text-[10px] text-tanah-subur/70 block">NPK (mg/kg)</span>
                <span class="text-[11px] md:text-xs font-bold text-abu-vulkanik font-mono block mt-1">115-40-65</span>
                <span class="text-[9px] text-tanah-subur/70 block mt-0.5">N stabil</span>
              </div>
            </div>
          </section>

          <section class="border-t border-[#D8D2C5] pt-4">
            <h5 class="text-[10px] font-semibold text-tanah-subur uppercase tracking-wider mb-3">Pengaturan Pipeline Rekomendasi</h5>
            <form class="space-y-4" @submit.prevent>
              <div>
                <label class="block font-medium text-[11px] text-abu-vulkanik mb-1">Ambang Batas Minimum pH Tanah</label>
                <input type="range" min="5.0" max="7.5" step="0.1" value="5.5" class="w-full h-1.5 bg-[#D8D2C5] rounded-lg appearance-none cursor-pointer accent-genteng" />
                <div class="flex justify-between text-[9px] text-tanah-subur/80 mt-1">
                  <span>5.0 (Asam Ekstrem)</span>
                  <span>7.5 (Basa)</span>
                </div>
              </div>
              
              <div class="pt-2 hidden md:block">
                <button type="submit" class="w-full py-2 px-4 bg-genteng hover:bg-[#994522] text-white rounded text-[11px] font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px]">save</span>
                  <span>Simpan Konfigurasi Pipeline</span>
                </button>
              </div>
            </form>
          </section>

        </div>
        
        <!-- Mobile Bottom Buttons -->
        <div class="md:hidden p-4 border-t border-[#EBE4D8] bg-[#FDFBF7] flex flex-col space-y-2 pb-safe">
          <button @click="closeDrawer" class="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-genteng active:bg-[#964320] text-white transition shadow-sm">
            Simpan Parameter
          </button>
          <button @click="closeDrawer" class="w-full py-2.5 px-4 rounded-xl font-semibold text-xs border border-abu-vulkanik/30 text-abu-vulkanik active:bg-abu-letusan transition">
            Uji Pipeline (Dry-Run)
          </button>
        </div>

      </div>
    </div>

    <!-- Admin Bottom Navigation (Mobile) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-abu-letusan border-t border-[#D9D3C7] shadow-lg pb-safe">
      <div class="px-4 py-1.5 flex items-center justify-between">
        <router-link to="/admin" class="flex flex-col items-center justify-center flex-1 py-1 text-abu-vulkanik hover:text-genteng transition-colors">
          <span class="material-symbols-outlined text-[20px] mb-0.5 opacity-80">dashboard</span>
          <span class="text-[10px] font-medium leading-tight">Dashboard</span>
        </router-link>
        <router-link to="/admin/lahan" class="flex flex-col items-center justify-center flex-1 py-1">
          <div class="flex flex-col items-center justify-center px-4 py-1 rounded-full bg-[#DFD9CD] text-genteng">
            <span class="material-symbols-outlined text-[20px] mb-0.5 fill">grid_view</span>
            <span class="text-[10px] font-bold leading-tight">Lahan</span>
          </div>
        </router-link>
        <router-link to="/admin/log" class="flex flex-col items-center justify-center flex-1 py-1 text-abu-vulkanik hover:text-genteng transition-colors">
          <span class="material-symbols-outlined text-[20px] mb-0.5 opacity-80">receipt_long</span>
          <span class="text-[10px] font-medium leading-tight">Log</span>
        </router-link>
        <router-link to="/admin/pengaturan" class="flex flex-col items-center justify-center flex-1 py-1 text-abu-vulkanik hover:text-genteng transition-colors">
          <span class="material-symbols-outlined text-[20px] mb-0.5 opacity-80">settings</span>
          <span class="text-[10px] font-medium leading-tight">Pengaturan</span>
        </router-link>
      </div>
    </nav>

  </div>
</template>

<style scoped>
.fill {
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
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

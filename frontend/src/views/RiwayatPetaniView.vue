<script setup lang="ts">
import BottomNav from '../components/BottomNav.vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const handleLogout = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-abu-letusan text-abu-vulkanik font-sans antialiased pb-24 md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden sticky top-0 z-20 bg-[#EFEAE0]/95 backdrop-blur-sm border-b border-[#DFD9CD] px-4 py-3 flex items-center justify-between">
      <div>
        <h1 class="font-serif font-semibold text-[19px] tracking-tight text-genteng leading-none">Tanacakra</h1>
        <p class="text-[11px] text-tanah-subur mt-1 font-medium">Dashboard Petani • Riwayat</p>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <aside class="hidden md:flex w-[240px] fixed inset-y-0 left-0 bg-[#E8E3D7] border-r border-[#D9D3C7] flex-col justify-between z-30 select-none">
      <div class="flex flex-col">
        <div class="px-6 pt-6 pb-5 border-b border-[#DDD7CB]">
          <h1 class="font-serif font-semibold text-[21px] tracking-tight text-genteng leading-none">Tanacakra</h1>
          <p class="text-xs text-abu-vulkanik/80 mt-1.5 font-medium">Dashboard Petani</p>
        </div>
        <nav class="mt-4 flex flex-col gap-1 px-3">
          <router-link to="/petani" class="flex items-center gap-3 px-3 py-2.5 rounded-sm text-abu-vulkanik hover:bg-[#DDD7CB]/50 transition-colors">
            <span class="material-symbols-outlined text-[20px] opacity-70 text-abu-vulkanik">home</span>
            <span class="text-sm font-medium">Beranda</span>
          </router-link>
          <router-link to="/input-lahan" class="flex items-center gap-3 px-3 py-2.5 rounded-sm text-abu-vulkanik hover:bg-[#DDD7CB]/50 transition-colors">
            <span class="material-symbols-outlined text-[20px] opacity-70 text-abu-vulkanik">edit_note</span>
            <span class="text-sm font-medium">Catat</span>
          </router-link>
          <router-link to="/riwayat" class="flex items-center gap-3 px-3 py-2.5 bg-[#DFD9CD] border-l-[3px] border-tanah-subur text-genteng font-semibold rounded-r-sm shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)]">
            <span class="material-symbols-outlined text-[20px] text-genteng">history</span>
            <span class="text-sm font-semibold text-genteng">Riwayat</span>
          </router-link>
          <router-link to="/profil" class="flex items-center gap-3 px-3 py-2.5 rounded-sm text-abu-vulkanik hover:bg-[#DDD7CB]/50 transition-colors">
            <span class="material-symbols-outlined text-[20px] opacity-70 text-abu-vulkanik">person</span>
            <span class="text-sm font-medium">Profil</span>
          </router-link>
        </nav>
      </div>
      <div class="p-4 border-t border-[#DDD7CB] flex flex-col gap-3">
        <div class="flex items-center gap-2.5 px-2">
          <span class="material-symbols-outlined text-[20px] text-tanah-subur">account_circle</span>
          <div class="flex flex-col leading-tight min-w-0">
            <span class="text-sm font-semibold text-abu-vulkanik truncate">Suparman Wignyosukarto</span>
            <span class="text-xs text-abu-vulkanik/70 font-medium truncate">Petani Lahan Blok A</span>
          </div>
        </div>
        <button @click="handleLogout" class="flex items-center gap-2 px-2 py-1.5 text-xs text-abu-vulkanik hover:text-bahaya-lahar transition-colors w-full text-left font-medium rounded hover:bg-[#DDD7CB]/50">
          <span class="material-symbols-outlined text-[18px] opacity-70">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="md:ml-[240px] flex-1 p-4 md:p-8 lg:p-10 max-w-7xl">
      <header class="mb-5 md:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#D9D3C7] pb-4 md:pb-5">
          <div>
            <h2 class="font-serif text-xl md:text-2xl lg:text-3xl font-semibold text-abu-vulkanik tracking-tight">Riwayat Catatan & Rekomendasi Lahan</h2>
            <p class="text-xs md:text-sm text-abu-vulkanik/80 mt-1">Daftar masukan parameter tanah dan rekomendasi mesin pendukung keputusan (EngineOutput).</p>
          </div>
          <div class="text-[11px] md:text-xs text-abu-vulkanik/70 tabular-nums">
            Total 8 catatan tersimpan
          </div>
        </div>

        <div class="mt-4 md:mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#E8E3D7] p-3 md:p-3.5 rounded border border-[#D9D3C7]">
          <div class="flex flex-col md:flex-row md:items-center gap-3 text-sm">
            <div class="flex items-center gap-2">
              <label class="text-[11px] md:text-xs font-semibold text-abu-vulkanik whitespace-nowrap">Rentang tanggal:</label>
              <div class="flex items-center gap-1.5 bg-white border border-[#CCC6B8] rounded px-2 md:px-2.5 py-1 text-xs flex-1 md:flex-none">
                <span class="material-symbols-outlined text-[14px] md:text-[16px] text-abu-vulkanik/70">calendar_today</span>
                <input type="text" value="01 Mei 2024 - 15 Mei 2024" class="bg-transparent border-none text-abu-vulkanik focus:outline-none w-full md:w-44 font-medium text-[11px] md:text-xs" />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-[11px] md:text-xs font-semibold text-abu-vulkanik whitespace-nowrap">Lahan:</label>
              <select class="bg-white border border-[#CCC6B8] rounded px-2 md:px-2.5 py-1 text-[11px] md:text-xs text-abu-vulkanik font-medium focus:outline-none flex-1 md:flex-none">
                <option>Semua petak lahan</option>
                <option selected>Lahan Blok A (Utara)</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="w-full md:w-auto flex items-center justify-center gap-1 bg-white hover:bg-[#F7F4EC] border border-[#CCC6B8] text-abu-vulkanik text-[11px] md:text-xs font-medium px-3 py-1.5 rounded transition-colors">
              <span class="material-symbols-outlined text-[14px] md:text-[16px]">file_download</span>
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Data Table -->
      <section class="bg-white border border-[#D9D3C7] rounded overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-abu-vulkanik min-w-[700px]">
            <thead class="bg-[#ECE7DC] border-b border-[#D9D3C7] text-xs text-abu-vulkanik font-semibold">
              <tr>
                <th scope="col" class="py-2.5 md:py-3 px-3 md:px-4 w-36 cursor-pointer select-none hover:text-genteng transition-colors">
                  <div class="flex items-center gap-1">
                    <span>Tanggal Input</span>
                    <span class="material-symbols-outlined text-[14px] md:text-[16px]">arrow_downward</span>
                  </div>
                </th>
                <th scope="col" class="py-2.5 md:py-3 px-3 md:px-4 w-32 md:w-40 cursor-pointer select-none hover:text-genteng transition-colors">
                  <div class="flex items-center gap-1">
                    <span>Petak Lahan</span>
                  </div>
                </th>
                <th scope="col" class="py-2.5 md:py-3 px-3 md:px-4 w-40 md:w-44 cursor-pointer select-none hover:text-genteng transition-colors">
                  <div class="flex items-center gap-1">
                    <span>Parameter Singkat</span>
                  </div>
                </th>
                <th scope="col" class="py-2.5 md:py-3 px-3 md:px-4">
                  <span>Hasil Rekomendasi Mesin</span>
                </th>
                <th scope="col" class="py-2.5 md:py-3 px-3 md:px-4 w-24 md:w-28 text-center">
                  <span>Status</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#EAE5DA] text-[11px] md:text-xs">
              <tr class="hover:bg-[#FAF8F3] transition-colors">
                <td class="py-3 px-3 md:px-4 font-medium tabular-nums text-abu-vulkanik">12 Mei 2024, 08:30</td>
                <td class="py-3 px-3 md:px-4 font-medium text-abu-vulkanik">Lahan Blok A (Utara)</td>
                <td class="py-3 px-3 md:px-4 tabular-nums">
                  <div class="leading-relaxed">
                    <span class="font-semibold text-tanah-subur">pH:</span> 6.5 &nbsp;|&nbsp; 
                    <span class="font-semibold text-tanah-subur">Lembap:</span> 68%
                    <div class="text-[10px] md:text-[11px] text-abu-vulkanik/70">NPK: 120-45-70</div>
                  </div>
                </td>
                <td class="py-3 px-3 md:px-4 text-abu-vulkanik">Kondisi tanah optimal untuk pemupukan cabai; berikan pupuk kalium sesuai dosis anjuran minggu ini.</td>
                <td class="py-3 px-3 md:px-4 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] md:text-[11px] font-medium bg-[#EEF2E6] text-terasering border border-[#D2DEC0]">Kondisi baik</span>
                </td>
              </tr>
              <tr class="hover:bg-[#FAF8F3] transition-colors">
                <td class="py-3 px-3 md:px-4 font-medium tabular-nums text-abu-vulkanik">10 Mei 2024, 14:15</td>
                <td class="py-3 px-3 md:px-4 font-medium text-abu-vulkanik">Lahan Blok A (Utara)</td>
                <td class="py-3 px-3 md:px-4 tabular-nums">
                  <div class="leading-relaxed">
                    <span class="font-semibold text-tanah-subur">pH:</span> 6.4 &nbsp;|&nbsp; 
                    <span class="font-semibold text-tanah-subur">Lembap:</span> 42%
                    <div class="text-[10px] md:text-[11px] text-abu-vulkanik/70">NPK: 115-40-65</div>
                  </div>
                </td>
                <td class="py-3 px-3 md:px-4 text-abu-vulkanik">Kelembapan tanah rendah di lapisan olah; segera lakukan pengairan berkala sebelum terik siang hari.</td>
                <td class="py-3 px-3 md:px-4 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] md:text-[11px] font-medium bg-[#F9EBE8] text-bahaya-lahar border border-[#E9C5BE]">Perlu atensi</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-3 md:px-4 py-2.5 md:py-3 bg-[#FAF8F3] border-t border-[#D9D3C7] flex flex-col md:flex-row md:items-center justify-between text-[10px] md:text-xs text-abu-vulkanik gap-3">
          <span>Menampilkan 1–2 dari 8 entri</span>
          <div class="flex items-center gap-1 self-end md:self-auto">
            <button class="px-2 py-1 border border-[#D9D3C7] rounded bg-white hover:bg-[#EFEAE0] transition-colors disabled:opacity-50" disabled>Sebelumnya</button>
            <button class="px-2 py-1 border border-genteng bg-genteng text-white rounded font-medium">1</button>
            <button class="px-2 py-1 border border-[#D9D3C7] rounded bg-white hover:bg-[#EFEAE0] transition-colors">2</button>
            <button class="px-2 py-1 border border-[#D9D3C7] rounded bg-white hover:bg-[#EFEAE0] transition-colors">Selanjutnya</button>
          </div>
        </div>
      </section>
    </main>

    <BottomNav />
  </div>
</template>

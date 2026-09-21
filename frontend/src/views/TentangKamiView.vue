<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PetaniSidebar from '../components/PetaniSidebar.vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import BottomNav from '../components/BottomNav.vue'
import AdminBottomNav from '../components/AdminBottomNav.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const role = ref<'PETANI' | 'ADMIN'>('PETANI')

onMounted(() => {
  try {
    const raw = localStorage.getItem('tanacakra_user')
    if (raw) {
      const u = JSON.parse(raw)
      role.value = u.role === 'ADMIN' ? 'ADMIN' : 'PETANI'
    }
  } catch {
    role.value = 'PETANI'
  }
})

const desaList = [
  'Wukirsari', 'Argomulyo', 'Umbulharjo', 'Kepuharjo', 'Glagaharjo'
]

const komoditasList = [
  { nama: 'Padi', icon: 'grain' },
  { nama: 'Cabai Merah', icon: 'whatshot' },
  { nama: 'Jagung', icon: 'corn' },
  { nama: 'Salak Pondoh', icon: 'eco' },
  { nama: 'Bawang Merah', icon: 'yard' },
  { nama: 'Kacang Tanah', icon: 'nutrition' }
]

const stackList = [
  { nama: 'Vue 3 + Vite', desk: 'Frontend reaktif berbasis TypeScript dengan desain token Tanacakra.', icon: 'code' },
  { nama: 'Django REST API', desk: 'Backend RESTful JSON yang memisahkan logika bisnis dari tampilan.', icon: 'dns' },
  { nama: 'Scikit-learn', desk: 'Mesin inferensi Random Forest untuk rekomendasi tindakan lapang.', icon: 'psychology' },
  { nama: 'Plotly.js', desk: 'Visualisasi interaktif tren harga, radar nutrisi tanah, dan volume panen.', icon: 'monitoring' },
  { nama: 'PostgreSQL / Supabase', desk: 'Database relasional master data 100 petak lahan Cangkringan.', icon: 'storage' }
]
</script>

<template>
  <div class="min-h-screen bg-abu-letusan text-abu-vulkanik font-sans antialiased flex flex-col md:flex-row pb-24 md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden px-5 pt-5 pb-3 border-b border-[#DED7CA]/60 flex items-center justify-between bg-abu-letusan sticky top-0 z-10">
      <div>
        <div class="flex items-center gap-1.5">
          <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto" />
          <img src="@/assets/tanacakra-wordmark.svg" alt="Tanacakra" class="h-4 w-auto" />
        </div>
        <p class="text-[11px] text-tanah-subur">Tentang Kami • Desa Cangkringan</p>
      </div>
      <button @click="router.push(role === 'ADMIN' ? '/admin' : '/petani')" class="text-xs font-semibold text-genteng flex items-center gap-1">
        <span class="material-symbols-outlined text-[16px]">arrow_back</span>
        Kembali
      </button>
    </header>

    <!-- Desktop Sidebar -->
    <PetaniSidebar v-if="role === 'PETANI'" />
    <AdminSidebar v-else />

    <!-- Main Content -->
    <main class="md:ml-[240px] flex-1 w-full px-5 py-6 md:p-10 max-w-6xl mx-auto flex flex-col gap-6 md:gap-8">

      <!-- Hero -->
      <section class="bg-gradient-to-br from-genteng/15 via-[#F7F4EE] to-[#EFEAE0] rounded-2xl border-2 border-genteng/30 shadow-sm p-6 md:p-10 overflow-hidden relative">
        <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-genteng/10 pointer-events-none"></div>
        <div class="flex items-center gap-2 mb-4">
          <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-10 w-auto" />
          <img src="@/assets/tanacakra-wordmark.svg" alt="Tanacakra" class="h-7 w-auto" />
        </div>
        <h1 class="font-display font-bold text-2xl md:text-4xl text-abu-vulkanik leading-tight">
          Tentang <span class="text-genteng">Tanacakra</span>
        </h1>
        <p class="font-display text-sm md:text-lg text-tanah-subur mt-2 max-w-2xl leading-relaxed">
          Sistem pendukung keputusan pengelolaan lahan pertanian berbasis Data Science untuk
          kelompok tani di lereng Gunung Merapi, Kecamatan Cangkringan, Kabupaten Sleman, DIY.
        </p>
        <div class="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-genteng/20 text-xs font-semibold text-tanah-subur">
          <span class="bg-white px-3 py-1.5 rounded-full border border-[#DED7CA]">100 petak lahan terpetakan</span>
          <span class="bg-white px-3 py-1.5 rounded-full border border-[#DED7CA]">480 histori tanam</span>
          <span class="bg-white px-3 py-1.5 rounded-full border border-[#DED7CA]">6 komoditas unggulan</span>
        </div>
      </section>

      <!-- Tujuan -->
      <section class="bg-white rounded-2xl border border-[#DED7CA] shadow-sm p-5 md:p-7">
        <div class="mb-3 pl-3 border-l-4 border-genteng">
          <h2 class="font-display font-semibold text-lg md:text-xl text-abu-vulkanik">Tujuan kami untuk petani Cangkringan</h2>
        </div>
        <p class="text-xs md:text-sm text-abu-vulkanik/85 leading-relaxed">
          Tanacakra dibangun bersama kelompok tani untuk membantu petani mengenali kondisi lahan,
          menerima rekomendasi tindakan yang berbasis data (machine learning Scikit-learn), memantau
          tren harga pasar, serta merencanakan komoditas tanam yang paling menguntungkan. Semua keputusan
          tetap berada di tangan petani; teknologi hanya menyajikan informasi yang jelas dan mudah dipahami.
        </p>
      </section>

      <!-- 5 Desa -->
      <section class="bg-white rounded-2xl border border-[#DED7CA] shadow-sm p-5 md:p-7">
        <div class="mb-4">
          <h2 class="font-display font-semibold text-lg md:text-xl text-abu-vulkanik">Melayani 5 desa di lereng Merapi</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div v-for="d in desaList" :key="d" class="flex items-center gap-2.5 bg-abu-letusan rounded-xl border border-tanah-subur/15 px-3.5 py-3">
            <span class="w-2 h-2 rounded-full bg-terasering shrink-0"></span>
            <span class="text-sm font-semibold text-abu-vulkanik">{{ d }}</span>
          </div>
        </div>
        <p class="text-[11px] md:text-xs text-tanah-subur mt-4">
          Kelima desa berada di lereng barat-selatan Gunung Merapi dengan jenis tanah Regosol Vulkanik
          yang kaya mineral namun rawan erosi lahar.
        </p>
      </section>

      <!-- Komoditas -->
      <section class="bg-white rounded-2xl border border-[#DED7CA] shadow-sm p-5 md:p-7">
        <div class="flex items-center gap-2 mb-4">
          <span class="material-symbols-outlined text-genteng text-[22px]">eco</span>
          <h2 class="font-display font-semibold text-lg md:text-xl text-abu-vulkanik">Komoditas Unggulan</h2>
        </div>
        <div class="flex flex-wrap gap-2.5">
          <span v-for="k in komoditasList" :key="k.nama" class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-abu-letusan border border-tanah-subur/20 text-xs font-semibold text-abu-vulkanik">
            <span class="material-symbols-outlined text-genteng text-[16px]">{{ k.icon }}</span>
            {{ k.nama }}
          </span>
        </div>
      </section>

      <!-- Teknologi -->
      <section class="bg-white rounded-2xl border border-[#DED7CA] shadow-sm p-5 md:p-7">
        <div class="mb-4">
          <h2 class="font-display font-semibold text-lg md:text-xl text-abu-vulkanik">Di balik layar</h2>
          <p class="text-[11px] md:text-xs text-tanah-subur mt-1">Teknologi yang menjalankan Tanacakra.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="s in stackList" :key="s.nama" class="flex items-start gap-3 bg-abu-letusan rounded-xl border border-tanah-subur/15 p-4">
            <span class="material-symbols-outlined text-genteng text-[22px] shrink-0">{{ s.icon }}</span>
            <div>
              <h3 class="text-sm font-bold text-abu-vulkanik">{{ s.nama }}</h3>
              <p class="text-[11px] md:text-xs text-tanah-subur mt-0.5 leading-relaxed">{{ s.desk }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="bg-gradient-to-r from-genteng to-genteng-hover rounded-2xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 class="font-display font-semibold text-lg md:text-xl">Siap memulai bertani berbasis data?</h2>
          <p class="text-xs md:text-sm text-white/85 mt-1">Catat kondisi tanah lahanmu dan terima rekomendasi Scikit-learn secara langsung.</p>
        </div>
        <button @click="router.push('/input-lahan')" class="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-genteng text-xs font-bold tracking-wide transition-transform active:scale-[0.98]">
          <span class="material-symbols-outlined text-[18px]">edit_note</span>
          Catat Sekarang
        </button>
      </section>

      <!-- Footer Info -->
      <footer class="text-center text-[11px] md:text-xs text-tanah-subur pb-2">
        Tanacakra &copy; 2026 — Kelompok Tani Desa Cangkringan, Kecamatan Cangkringan, Kabupaten Sleman, DIY.
      </footer>
    </main>

    <!-- Mobile Bottom Nav -->
    <BottomNav v-if="role === 'PETANI'" />
    <AdminBottomNav v-else />
  </div>
</template>
<script setup lang="ts">
import PetaniSidebar from '../components/PetaniSidebar.vue'
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
        <p class="text-[11px] text-tanah-subur mt-1 font-medium">Dashboard Petani • Profil</p>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <PetaniSidebar />

    <!-- MAIN CONTENT AREA -->
    <main class="md:ml-[240px] flex-1 p-5 md:p-10 max-w-4xl w-full mx-auto">
      <header class="mb-6 md:mb-8">
        <h2 class="font-serif text-xl md:text-2xl font-semibold text-abu-vulkanik">Pengaturan Akun & Profil</h2>
        <p class="text-xs md:text-sm text-abu-vulkanik opacity-80 mt-1">Perbarui data diri, keamanan kata sandi, dan preferensi pemberitahuan lapangan.</p>
      </header>

      <form class="space-y-6 md:space-y-8" @submit.prevent>
        <!-- Info Akun -->
        <section class="bg-[#F8F5EE] border border-[#DDD6C8] rounded-md p-4 md:p-6 shadow-sm">
          <div class="border-b border-[#E3DDD1] pb-3 mb-4 md:mb-5">
            <h3 class="font-serif text-sm md:text-base font-semibold text-abu-vulkanik">Info Akun</h3>
            <p class="text-[11px] md:text-xs text-abu-vulkanik opacity-75 mt-0.5">Informasi identitas yang tercatat di kelompok tani Desa Cangkringan.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div class="md:col-span-2">
              <label class="block text-[11px] md:text-xs font-semibold text-abu-vulkanik mb-1.5">Nama lengkap</label>
              <input type="text" value="Suparman Wignyosukarto" class="w-full bg-[#FFFFFF] border border-[#DDD6C8] rounded px-3 py-2 md:px-3.5 md:py-2.5 text-xs md:text-sm text-abu-vulkanik focus:outline-none focus:border-genteng focus:ring-1 focus:ring-genteng">
            </div>
            <div>
              <label class="block text-[11px] md:text-xs font-semibold text-abu-vulkanik mb-1.5">Alamat email</label>
              <input type="email" value="suparman.w@tanacakra.id" class="w-full bg-[#FFFFFF] border border-[#DDD6C8] rounded px-3 py-2 md:px-3.5 md:py-2.5 text-xs md:text-sm text-abu-vulkanik focus:outline-none focus:border-genteng focus:ring-1 focus:ring-genteng">
            </div>
            <div>
              <label class="block text-[11px] md:text-xs font-semibold text-abu-vulkanik mb-1.5">Nomor telepon / WhatsApp</label>
              <input type="tel" value="081234567890" class="w-full bg-[#FFFFFF] border border-[#DDD6C8] rounded px-3 py-2 md:px-3.5 md:py-2.5 text-xs md:text-sm text-abu-vulkanik focus:outline-none focus:border-genteng focus:ring-1 focus:ring-genteng">
            </div>
            <div class="md:col-span-2 bg-[#EFEAE0] p-3 rounded border border-[#E3DDD1] flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
              <span class="text-abu-vulkanik opacity-80">Wilayah kelolaan terdaftar: <strong class="font-semibold text-abu-vulkanik">Lahan Blok A (Utara), Dusun Kinahrejo</strong></span>
              <span class="text-[10px] md:text-xs font-medium text-terasering bg-[#E4ECD7] px-2 py-0.5 rounded border border-[#C6D8AF] self-start md:self-auto">Terverifikasi BPP</span>
            </div>
          </div>
        </section>

        <!-- Ganti Kata Sandi -->
        <section class="bg-[#F8F5EE] border border-[#DDD6C8] rounded-md p-4 md:p-6 shadow-sm">
          <div class="border-b border-[#E3DDD1] pb-3 mb-4 md:mb-5">
            <h3 class="font-serif text-sm md:text-base font-semibold text-abu-vulkanik">Ganti Kata Sandi</h3>
            <p class="text-[11px] md:text-xs text-abu-vulkanik opacity-75 mt-0.5">Gunakan kombinasi minimal 8 karakter dengan angka atau simbol.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            <div>
              <label class="block text-[11px] md:text-xs font-semibold text-abu-vulkanik mb-1.5">Kata sandi saat ini</label>
              <input type="password" placeholder="••••••••" class="w-full bg-[#FFFFFF] border border-[#DDD6C8] rounded px-3 py-2 md:px-3.5 md:py-2.5 text-xs md:text-sm text-abu-vulkanik focus:outline-none focus:border-genteng focus:ring-1 focus:ring-genteng">
            </div>
            <div>
              <label class="block text-[11px] md:text-xs font-semibold text-abu-vulkanik mb-1.5">Kata sandi baru</label>
              <input type="password" placeholder="Minimal 8 karakter" class="w-full bg-[#FFFFFF] border border-[#DDD6C8] rounded px-3 py-2 md:px-3.5 md:py-2.5 text-xs md:text-sm text-abu-vulkanik focus:outline-none focus:border-genteng focus:ring-1 focus:ring-genteng">
            </div>
            <div>
              <label class="block text-[11px] md:text-xs font-semibold text-abu-vulkanik mb-1.5">Ulangi kata sandi baru</label>
              <input type="password" placeholder="Ulangi sandi baru" class="w-full bg-[#FFFFFF] border border-[#DDD6C8] rounded px-3 py-2 md:px-3.5 md:py-2.5 text-xs md:text-sm text-abu-vulkanik focus:outline-none focus:border-genteng focus:ring-1 focus:ring-genteng">
            </div>
          </div>
        </section>

        <div class="flex flex-col md:flex-row md:items-center justify-between pt-2 gap-4">
          <button type="submit" class="w-full md:w-auto bg-genteng hover:bg-[#9E4723] text-white font-medium px-6 py-2.5 md:py-2.5 rounded text-[13px] md:text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-genteng">
            Simpan Perubahan
          </button>
          <span class="text-[10px] md:text-xs text-abu-vulkanik opacity-75 text-center md:text-left">Perubahan terakhir disimpan: 12 Mei 2024, 09:15 WIB</span>
        </div>
      </form>
    </main>

    <BottomNav />
  </div>
</template>

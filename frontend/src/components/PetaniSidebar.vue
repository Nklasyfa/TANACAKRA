<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const handleLogout = () => {
  localStorage.removeItem('tanacakra_token')
  localStorage.removeItem('tanacakra_user')
  router.push('/')
}
</script>

<template>
  <aside class="hidden md:flex w-[240px] fixed inset-y-0 left-0 bg-abu-letusan border-r border-[#D9D3C7] flex-col justify-between z-30 select-none">
    <div class="flex flex-col">
      <div class="px-6 pt-7 pb-6">
        <h1 class="font-serif text-[21px] font-semibold text-genteng tracking-tight leading-none">Tanacakra</h1>
        <p class="text-xs text-abu-vulkanik mt-1.5 opacity-80">Dashboard Petani</p>
      </div>
      <nav class="flex flex-col mt-2 space-y-1">
        <router-link to="/petani" 
          :class="route.path === '/petani' ? 'flex items-center gap-3 px-6 py-3 text-[14px] font-semibold text-genteng bg-abu-letusan-dark border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3 px-6 py-3 text-[14px] font-medium text-abu-vulkanik hover:bg-black/5 transition-colors'">
          <span class="material-symbols-outlined text-[20px]" :class="route.path === '/petani' ? '' : 'opacity-70'">home</span>
          <span>Beranda</span>
        </router-link>
        <router-link to="/input-lahan" 
          :class="route.path === '/input-lahan' ? 'flex items-center gap-3 px-6 py-3 text-[14px] font-semibold text-genteng bg-abu-letusan-dark border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3 px-6 py-3 text-[14px] font-medium text-abu-vulkanik hover:bg-black/5 transition-colors'">
          <span class="material-symbols-outlined text-[20px]" :class="route.path === '/input-lahan' ? '' : 'opacity-70'">edit_note</span>
          <span>Catat</span>
        </router-link>
        <router-link to="/riwayat" 
          :class="route.path === '/riwayat' ? 'flex items-center gap-3 px-6 py-3 text-[14px] font-semibold text-genteng bg-abu-letusan-dark border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3 px-6 py-3 text-[14px] font-medium text-abu-vulkanik hover:bg-black/5 transition-colors'">
          <span class="material-symbols-outlined text-[20px]" :class="route.path === '/riwayat' ? '' : 'opacity-70'">history</span>
          <span>Riwayat</span>
        </router-link>
        <router-link to="/profil" 
          :class="route.path === '/profil' ? 'flex items-center gap-3 px-6 py-3 text-[14px] font-semibold text-genteng bg-abu-letusan-dark border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3 px-6 py-3 text-[14px] font-medium text-abu-vulkanik hover:bg-black/5 transition-colors'">
          <span class="material-symbols-outlined text-[20px]" :class="route.path === '/profil' ? '' : 'opacity-70'">person</span>
          <span>Profil</span>
        </router-link>
      </nav>
    </div>
    <div class="p-5 border-t border-[#D9D3C7]">
      <div class="flex items-center gap-3 mb-3">
        <span class="material-symbols-outlined text-[24px] text-tanah-subur opacity-80">account_circle</span>
        <div class="flex flex-col min-w-0">
          <span class="text-[13px] font-semibold text-abu-vulkanik truncate">Petani Cangkringan</span>
          <span class="text-[11px] text-abu-vulkanik opacity-75">Sleman, DIY</span>
        </div>
      </div>
      <button @click="handleLogout" class="flex items-center gap-3 text-[13px] text-abu-vulkanik hover:text-bahaya-lahar transition-colors py-1 w-full text-left">
        <span class="material-symbols-outlined text-[18px] opacity-70">logout</span>
        <span>Keluar</span>
      </button>
    </div>
  </aside>
</template>

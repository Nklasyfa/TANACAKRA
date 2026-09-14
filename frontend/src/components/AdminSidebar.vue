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
  <aside class="hidden md:flex w-[240px] fixed inset-y-0 left-0 bg-[#EFEAE0] border-r border-[#DFD9CD] flex-col justify-between z-30 select-none">
    <div>
      <div class="px-6 pt-7 pb-6">
        <h1 class="font-serif font-semibold text-[21px] text-genteng tracking-tight leading-none">Tanacakra</h1>
        <p class="text-xs text-tanah-subur/80 font-medium mt-1">Admin Dashboard</p>
      </div>

      <nav class="space-y-1">
        <router-link to="/admin" 
          :class="route.path === '/admin' ? 'flex items-center gap-3.5 px-6 py-3 text-sm font-semibold text-genteng bg-[#DFD9CD]/50 border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-[#DFD9CD]/40 transition-colors'">
          <span class="material-symbols-outlined text-[22px]" :class="route.path === '/admin' ? 'text-genteng' : 'text-abu-vulkanik/70'">dashboard</span>
          <span>Dashboard</span>
        </router-link>

        <router-link to="/admin/lahan" 
          :class="route.path === '/admin/lahan' ? 'flex items-center gap-3.5 px-6 py-3 text-sm font-semibold text-genteng bg-[#DFD9CD]/50 border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-[#DFD9CD]/40 transition-colors'">
          <span class="material-symbols-outlined text-[22px]" :class="route.path === '/admin/lahan' ? 'text-genteng' : 'text-abu-vulkanik/70'">grid_view</span>
          <span>Manajemen Lahan</span>
        </router-link>

        <router-link to="/admin/log" 
          :class="route.path === '/admin/log' ? 'flex items-center gap-3.5 px-6 py-3 text-sm font-semibold text-genteng bg-[#DFD9CD]/50 border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-[#DFD9CD]/40 transition-colors'">
          <span class="material-symbols-outlined text-[22px]" :class="route.path === '/admin/log' ? 'text-genteng' : 'text-abu-vulkanik/70'">receipt_long</span>
          <span>Log Aktivitas</span>
        </router-link>

        <router-link to="/admin/pengaturan" 
          :class="route.path === '/admin/pengaturan' ? 'flex items-center gap-3.5 px-6 py-3 text-sm font-semibold text-genteng bg-[#DFD9CD]/50 border-l-[3px] border-tanah-subur transition-colors' : 'flex items-center gap-3.5 px-6 py-3 text-sm font-medium text-abu-vulkanik hover:bg-[#DFD9CD]/40 transition-colors'">
          <span class="material-symbols-outlined text-[22px]" :class="route.path === '/admin/pengaturan' ? 'text-genteng' : 'text-abu-vulkanik/70'">settings</span>
          <span>Pengaturan</span>
        </router-link>
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
</template>

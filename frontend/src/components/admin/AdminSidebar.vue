<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = useRouter()
const route = useRoute()

const userName = ref('Admin Utama')
const userEmail = ref('Super Admin')
;(() => {
  try {
    const raw = localStorage.getItem('tanacakra_user')
    if (raw) {
      const u = JSON.parse(raw)
      if (u && u.username) userName.value = u.username
      if (u && u.role) userEmail.value = u.role === 'ADMIN' ? 'Super Admin' : 'Kelompok Tani'
    }
  } catch {
    /* ignore */
  }
})()

const handleLogout = () => {
  supabase.auth.signOut()
  localStorage.removeItem('tanacakra_token')
  localStorage.removeItem('tanacakra_user')
  router.push('/')
}

const isActive = (path: string) => {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

const items = [
  { to: '/admin', icon: 'grid_view', label: 'Dashboard' },
  { to: '/admin/lahan', icon: 'sensors', label: 'Lahan & Sensor' },
  { to: '/admin/log', icon: 'history', label: 'Log Aktivitas' },
  { to: '/kabar-tani', icon: 'storefront', label: 'Warta & Pasar' },
  { to: '/admin/pengaturan', icon: 'tune', label: 'Pengaturan' }
]
</script>

<template>
  <aside class="hidden md:flex w-[240px] fixed inset-y-0 left-0 bg-[#fff8f4] border-r border-[#E5E0D8] flex-col justify-between z-30 select-none">
    <div class="flex flex-col">
      <div class="h-16 px-5 flex items-center gap-2.5 border-b border-[#E5E0D8]/70 bg-[#fff8f4]">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-8 w-auto object-contain" />
        <div class="flex flex-col leading-none">
          <span class="font-display text-[17px] text-[#243319] tracking-tight leading-none font-bold">Tanacakra</span>
          <span class="text-[11px] text-[#7E7063] font-medium mt-0.5">Admin &amp; Poktan Console</span>
        </div>
      </div>

      <div class="px-5 pt-4 pb-1.5 flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Console Admin</span>
        <span class="w-2 h-2 rounded-full bg-[#243319] animate-pulse"></span>
      </div>

      <nav class="flex flex-col gap-1 px-3">
        <router-link
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] transition-all"
          :class="isActive(item.to)
            ? 'bg-[#243319] text-[#d5e9c3] font-semibold shadow-sm'
            : 'text-[#5C4A32] font-medium hover:bg-[#F2EBDC] hover:text-[#231a10]'"
        >
          <span class="material-symbols-outlined text-[20px]" :class="isActive(item.to) ? 'text-[#d5e9c3]' : 'opacity-80'">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </div>

    <div class="p-3 bg-[#fff8f4]">
      <div class="p-3 rounded-xl bg-white border border-[#E5E0D8] shadow-2xs mb-2">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-[#243319] text-white flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[18px]">admin_panel_settings</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-[13px] font-bold text-[#231a10] truncate">{{ userName }}</span>
            <span class="text-[11px] text-[#7E7063] font-semibold truncate uppercase tracking-wider">{{ userEmail }}</span>
          </div>
        </div>
      </div>
      <button @click="handleLogout" class="flex items-center justify-between w-full px-3.5 py-2 rounded-lg text-[#C84C32] hover:bg-rose-50 transition-colors text-[12px] font-bold">
        <span>Keluar Sesi</span>
        <span class="material-symbols-outlined text-[18px]">logout</span>
      </button>
    </div>
  </aside>
</template>

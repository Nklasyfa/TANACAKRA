<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = useRouter()
const route = useRoute()

const userName = ref('Petani Cangkringan')
const userEmail = ref('petani@cangkringan.desa.id')
;(() => {
  try {
    const raw = localStorage.getItem('tanacakra_user')
    if (raw) {
      const u = JSON.parse(raw)
      if (u && u.username) userName.value = u.username
      if (u && u.email) userEmail.value = u.email
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

const items = [
  { to: '/petani', icon: 'grid_view', label: 'Beranda' },
  { to: '/riwayat', icon: 'landscape', label: 'Lahan Saya' },
  { to: '/input-lahan', icon: 'edit_note', label: 'Catat Data' },
  { to: '/prediksi-pasar', icon: 'trending_up', label: 'Prediksi & Pasar' },
  { to: '/kabar-tani', icon: 'newspaper', label: 'Kabar Tani' },
  { to: '/profil', icon: 'manage_accounts', label: 'Pengaturan/Profil' }
]
</script>

<template>
  <aside class="hidden md:flex w-[240px] fixed inset-y-0 left-0 bg-surface-container-low border-r border-[#E5E0D8] flex-col justify-between z-30 select-none">
    <div class="flex flex-col">
      <div class="h-16 px-4 flex items-center gap-2 bg-surface-container-low">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-8 w-auto object-contain" />
        <div class="flex flex-col leading-none">
          <span class="font-display text-[17px] text-primary tracking-tight leading-none">Tanacakra</span>
          <span class="text-[11px] text-secondary mt-0.5">Presisi Tani</span>
        </div>
      </div>

      <div class="px-4 pt-4 pb-1">
        <span class="eyebrow tracking-wider text-outline">Menu Petani</span>
      </div>

      <nav class="flex flex-col gap-1 px-2">
        <router-link
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] transition-colors"
          :class="route.path === item.to
            ? 'bg-primary-container text-on-primary-container font-semibold'
            : 'text-on-surface-variant font-medium hover:bg-surface-container hover:text-on-surface'"
        >
          <span class="material-symbols-outlined text-[20px]" :class="route.path === item.to ? 'msr-fill' : 'opacity-80'">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </div>

    <div class="p-2 bg-surface-container-low">
      <div class="p-3 rounded-lg bg-surface-container-lowest border border-[#E5E0D8] mb-1">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-[14px] font-semibold text-on-surface truncate">{{ userName }}</span>
            <span class="text-[11px] text-secondary truncate">{{ userEmail }}</span>
          </div>
        </div>
        <div class="flex items-center justify-between pt-1 mt-1 rounded px-1.5 py-0.5 bg-surface-container-low/60">
          <span class="text-[11px] text-on-surface-variant">Status IoT</span>
          <span class="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Aktif
          </span>
        </div>
      </div>
      <button @click="handleLogout" class="flex items-center justify-between w-full px-4 py-2 rounded-lg text-error hover:bg-error-container hover:text-on-error-container transition-colors text-[12px] font-semibold">
        <span>Keluar Sesi</span>
        <span class="material-symbols-outlined text-[18px]">logout</span>
      </button>
    </div>
  </aside>
</template>

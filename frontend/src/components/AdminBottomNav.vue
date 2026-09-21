<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { to: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { to: '/admin/lahan', icon: 'grid_view', label: 'Lahan' },
  { to: '/admin/log', icon: 'receipt_long', label: 'Log' },
  { to: '/kabar-tani', icon: 'storefront', label: 'Warta' },
  { to: '/admin/pengaturan', icon: 'settings', label: 'Pengaturan' }
]
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-[#fff8f4] border-t border-[#E5E0D8] px-3 py-2 flex items-center justify-around z-30 select-none pb-safe">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full transition-all"
      :class="route.path === item.to
        ? 'bg-[#243319] text-white shadow-sm'
        : 'text-[#645d58] hover:text-[#241F1B]'"
    >
      <span class="material-symbols-outlined text-[21px]" :class="route.path === item.to ? 'msr-fill' : 'opacity-80'">{{ item.icon }}</span>
      <span class="text-[10px]" :class="route.path === item.to ? 'font-semibold' : 'font-medium'">{{ item.label }}</span>
    </router-link>
  </nav>
</template>
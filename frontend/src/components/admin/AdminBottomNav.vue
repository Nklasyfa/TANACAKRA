<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { to: '/admin', icon: 'grid_view', label: 'Dashboard' },
  { to: '/admin/lahan', icon: 'sensors', label: 'Lahan' },
  { to: '/admin/master-data', icon: 'upload_file', label: 'Excel' },
  { to: '/admin/log', icon: 'receipt_long', label: 'Log' },
  { to: '/kabar-tani', icon: 'storefront', label: 'Warta' },
  { to: '/admin/pengaturan', icon: 'tune', label: 'Setelan' }
]

const isActive = (path: string) => {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFF8F4]/95 backdrop-blur-lg border-t border-[#E2D8C7] px-1 py-1.5 z-40 select-none pb-safe">
    <div class="grid grid-cols-6 gap-0.5 items-center w-full max-w-md mx-auto">
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center py-1 rounded-xl transition-all min-w-0"
      >
        <!-- Icon Active Pill -->
        <div
          class="w-10 h-7 rounded-full flex items-center justify-center transition-all"
          :class="isActive(item.to) ? 'bg-[#243319] text-[#D5E9C3] shadow-xs font-semibold' : 'text-[#7E7063]'"
        >
          <span class="material-symbols-outlined text-[19px]">{{ item.icon }}</span>
        </div>

        <!-- Label -->
        <span
          class="text-[10px] tracking-tight leading-tight mt-0.5 text-center truncate w-full px-0.5"
          :class="isActive(item.to) ? 'font-bold text-[#243319]' : 'font-medium text-[#7E7063]'"
        >
          {{ item.label }}
        </span>
      </router-link>
    </div>
  </nav>
</template>

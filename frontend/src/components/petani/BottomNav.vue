<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const leftItems = [
  { to: '/petani', icon: 'grid_view', label: 'Beranda' },
  { to: '/riwayat', icon: 'landscape', label: 'Lahan' }
]
const rightItems = [
  { to: '/prediksi-pasar', icon: 'trending_up', label: 'Pasar' },
  { to: '/kabar-tani', icon: 'newspaper', label: 'Warta' }
]
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-[#FFF8F4]/95 backdrop-blur-lg border-t border-[#E2D8C7] px-1 py-1.5 select-none">
    <div class="grid grid-cols-5 gap-1 items-center w-full max-w-md mx-auto">
      <router-link
        v-for="item in leftItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center py-1 rounded-xl transition-all min-w-0"
      >
        <div
          class="w-10 h-7 rounded-full flex items-center justify-center transition-all"
          :class="route.path === item.to ? 'bg-[#243319] text-[#D5E9C3] shadow-xs' : 'text-[#7E7063]'"
        >
          <span class="material-symbols-outlined text-[19px]">{{ item.icon }}</span>
        </div>
        <span
          class="text-[10px] tracking-tight leading-tight mt-0.5 text-center truncate w-full px-0.5"
          :class="route.path === item.to ? 'font-bold text-[#243319]' : 'font-medium text-[#7E7063]'"
        >
          {{ item.label }}
        </span>
      </router-link>

      <!-- Center FAB Button for Input Lahan -->
      <router-link to="/input-lahan" class="flex flex-col items-center justify-center -mt-3.5" aria-label="Catat Data">
        <div
          class="w-11 h-11 rounded-full bg-[#243319] text-[#D5E9C3] flex items-center justify-center shadow-lg border-2 border-white transition-transform active:scale-95"
          :class="route.path === '/input-lahan' ? 'ring-2 ring-[#243319]' : ''"
        >
          <span class="material-symbols-outlined text-[24px]">add</span>
        </div>
        <span class="text-[9px] font-bold text-[#243319] mt-0.5">Catat</span>
      </router-link>

      <router-link
        v-for="item in rightItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center py-1 rounded-xl transition-all min-w-0"
      >
        <div
          class="w-10 h-7 rounded-full flex items-center justify-center transition-all"
          :class="route.path === item.to ? 'bg-[#243319] text-[#D5E9C3] shadow-xs' : 'text-[#7E7063]'"
        >
          <span class="material-symbols-outlined text-[19px]">{{ item.icon }}</span>
        </div>
        <span
          class="text-[10px] tracking-tight leading-tight mt-0.5 text-center truncate w-full px-0.5"
          :class="route.path === item.to ? 'font-bold text-[#243319]' : 'font-medium text-[#7E7063]'"
        >
          {{ item.label }}
        </span>
      </router-link>
    </div>
  </nav>
</template>

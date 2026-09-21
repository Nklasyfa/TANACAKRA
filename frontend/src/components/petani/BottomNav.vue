<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const leftItems = [
  { to: '/petani', icon: 'potted_plant', label: 'Beranda' },
  { to: '/riwayat', icon: 'nature', label: 'Lahan' }
]
const rightItems = [
  { to: '/prediksi-pasar', icon: 'storefront', label: 'Pasar' },
  { to: '/profil', icon: 'account_circle', label: 'Profil' }
]
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(36,31,27,0.06)] border-t border-[#E5E0D8]">
    <div class="flex items-center justify-around h-16 px-1">
      <router-link
        v-for="item in leftItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center w-14 h-14 transition-colors"
        :class="route.path === item.to ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
      >
        <span class="material-symbols-outlined text-[22px]" :class="route.path === item.to ? 'msr-fill' : ''">{{ item.icon }}</span>
        <span class="text-[11px] mt-0.5" :class="route.path === item.to ? 'font-semibold' : 'font-medium'">{{ item.label }}</span>
      </router-link>

      <router-link to="/input-lahan" class="flex flex-col items-center justify-center w-14 h-14" aria-label="Catat Data">
        <div
          class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md transition-all active:scale-95"
          :class="route.path === '/input-lahan' ? 'ring-4 ring-[#3A4A2E]/20' : ''"
        >
          <span class="material-symbols-outlined text-[22px]">add</span>
        </div>
      </router-link>

      <router-link
        v-for="item in rightItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center w-14 h-14 transition-colors"
        :class="route.path === item.to ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
      >
        <span class="material-symbols-outlined text-[22px]" :class="route.path === item.to ? 'msr-fill' : ''">{{ item.icon }}</span>
        <span class="text-[11px] mt-0.5" :class="route.path === item.to ? 'font-semibold' : 'font-medium'">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

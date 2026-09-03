<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <nav class="lg:hidden fixed bottom-0 w-full z-50 border-t border-outline-variant bg-surface shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
    <ul class="flex justify-around items-center px-4 py-2 pb-safe bg-surface">
      <!-- Beranda -->
      <li class="flex-1 flex justify-center">
        <router-link to="/petani" :class="['flex flex-col items-center justify-center rounded-xl px-3 py-1 transition-transform w-full max-w-[80px]', route.path === '/petani' ? 'bg-surface-dim text-primary scale-100' : 'text-on-surface-variant hover:bg-surface-variant active:bg-surface-variant']">
          <span class="material-symbols-outlined" :style="route.path === '/petani' ? 'font-variation-settings: \'FILL\' 1;' : ''">home</span>
          <span class="font-label-md text-label-md text-xs mt-1">Beranda</span>
        </router-link>
      </li>
      <!-- Catat -->
      <li class="flex-1 flex justify-center">
        <router-link to="/input-lahan" :class="['flex flex-col items-center justify-center rounded-xl px-3 py-1 transition-colors w-full max-w-[80px]', route.path === '/input-lahan' ? 'bg-surface-dim text-primary scale-100' : 'text-on-surface-variant hover:bg-surface-variant active:bg-surface-variant']">
          <span class="material-symbols-outlined" :style="route.path === '/input-lahan' ? 'font-variation-settings: \'FILL\' 1;' : ''">edit_note</span>
          <span class="font-label-md text-label-md text-xs mt-1">Catat</span>
        </router-link>
      </li>
      <!-- Riwayat -->
      <li class="flex-1 flex justify-center">
        <a href="#" class="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant active:bg-surface-variant rounded-xl transition-colors w-full max-w-[80px]">
          <span class="material-symbols-outlined">history</span>
          <span class="font-label-md text-label-md text-xs mt-1">Riwayat</span>
        </a>
      </li>
      <!-- Profil -->
      <li class="flex-1 flex justify-center">
        <a href="#" class="flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant active:bg-surface-variant rounded-xl transition-colors w-full max-w-[80px]">
          <span class="material-symbols-outlined">person</span>
          <span class="font-label-md text-label-md text-xs mt-1">Profil</span>
        </a>
      </li>
    </ul>
  </nav>
</template>

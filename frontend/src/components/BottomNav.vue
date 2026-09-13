<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-abu-letusan border-t border-[#DED7CA] px-3 py-2 flex items-center justify-around z-30 select-none pb-safe">
    
    <!-- Beranda -->
    <router-link to="/petani" 
      :class="route.path === '/petani' ? 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full bg-abu-letusan-dark text-genteng transition-all' : 'flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-abu-vulkanik hover:text-genteng transition-all'">
      <svg class="w-5 h-5" :class="route.path === '/petani' ? 'text-genteng' : 'text-abu-vulkanik/70'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
      <span class="text-[10px]" :class="route.path === '/petani' ? 'font-semibold text-genteng' : 'font-medium text-abu-vulkanik'">Beranda</span>
    </router-link>

    <!-- Catat -->
    <router-link to="/input-lahan" 
      :class="route.path === '/input-lahan' ? 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full bg-abu-letusan-dark text-genteng transition-all' : 'flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-abu-vulkanik hover:text-genteng transition-all'">
      <svg class="w-5 h-5" :class="route.path === '/input-lahan' ? 'text-genteng' : 'text-abu-vulkanik/70'" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>
      <span class="text-[10px]" :class="route.path === '/input-lahan' ? 'font-semibold text-genteng' : 'font-medium text-abu-vulkanik'">Catat</span>
    </router-link>

    <!-- Riwayat -->
    <a href="#" class="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-abu-vulkanik hover:text-genteng transition-all">
      <svg class="w-5 h-5 text-abu-vulkanik/70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span class="text-[10px] font-medium text-abu-vulkanik">Riwayat</span>
    </a>

    <!-- Profil -->
    <a href="#" class="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-abu-vulkanik hover:text-genteng transition-all">
      <svg class="w-5 h-5 text-abu-vulkanik/70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
      <span class="text-[10px] font-medium text-abu-vulkanik">Profil</span>
    </a>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-[#EFEAE0] border-t border-[#DFD9CD] px-2 py-2 flex items-center justify-around z-30 select-none pb-safe">
    
    <router-link to="/admin" 
      :class="route.path === '/admin' ? 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full bg-[#DFD9CD] text-genteng font-semibold transition-all' : 'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-abu-vulkanik hover:text-genteng transition-colors'">
      <span class="material-symbols-outlined text-[20px]" :class="route.path === '/admin' ? 'text-genteng' : 'opacity-70'">dashboard</span>
      <span class="text-[10px] leading-tight" :class="route.path === '/admin' ? '' : 'font-medium'">Dashboard</span>
    </router-link>

    <router-link to="/admin/lahan" 
      :class="route.path === '/admin/lahan' ? 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full bg-[#DFD9CD] text-genteng font-semibold transition-all' : 'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-abu-vulkanik hover:text-genteng transition-colors'">
      <span class="material-symbols-outlined text-[20px]" :class="route.path === '/admin/lahan' ? 'text-genteng' : 'opacity-70'">grid_view</span>
      <span class="text-[10px] leading-tight" :class="route.path === '/admin/lahan' ? '' : 'font-medium'">Lahan</span>
    </router-link>

    <router-link to="/admin/log" 
      :class="route.path === '/admin/log' ? 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full bg-[#DFD9CD] text-genteng font-semibold transition-all' : 'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-abu-vulkanik hover:text-genteng transition-colors'">
      <span class="material-symbols-outlined text-[20px]" :class="route.path === '/admin/log' ? 'text-genteng' : 'opacity-70'">receipt_long</span>
      <span class="text-[10px] leading-tight" :class="route.path === '/admin/log' ? '' : 'font-medium'">Log</span>
    </router-link>

    <router-link to="/admin/pengaturan" 
      :class="route.path === '/admin/pengaturan' ? 'flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full bg-[#DFD9CD] text-genteng font-semibold transition-all' : 'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-abu-vulkanik hover:text-genteng transition-colors'">
      <span class="material-symbols-outlined text-[20px]" :class="route.path === '/admin/pengaturan' ? 'text-genteng' : 'opacity-70'">settings</span>
      <span class="text-[10px] leading-tight" :class="route.path === '/admin/pengaturan' ? '' : 'font-medium'">Pengaturan</span>
    </router-link>

  </nav>
</template>

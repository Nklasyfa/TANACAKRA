<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
  { name: 'Data Lahan', path: '/admin/lahan', icon: 'landscape' },
  { name: 'Pengguna', path: '/admin/users', icon: 'group' },
  { name: 'Pengaturan', path: '/admin/settings', icon: 'settings' }
]
</script>

<template>
  <aside class="w-64 bg-surface-bright border-r border-outline-variant h-screen sticky top-0 flex flex-col hidden lg:flex shadow-sm">
    <div class="p-stack-md border-b border-outline-variant flex items-center justify-center">
      <h1 class="font-display-lg-mobile text-[24px] text-primary tracking-tight font-bold">Tanacakra</h1>
    </div>
    
    <nav class="flex-grow p-4 flex flex-col gap-2">
      <router-link 
        v-for="item in navItems" :key="item.path" :to="item.path"
        :class="['flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-label-md text-label-md', route.path === item.path ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary']"
      >
        <span class="material-symbols-outlined" :style="route.path === item.path ? 'font-variation-settings: \'FILL\' 1;' : ''">{{ item.icon }}</span>
        {{ item.name }}
      </router-link>
    </nav>
    
    <div class="p-4 border-t border-outline-variant">
      <button @click="router.push('/')" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-lava-danger hover:bg-error-container transition-colors font-label-md text-label-md font-bold">
        <span class="material-symbols-outlined">logout</span>
        Keluar
      </button>
    </div>
  </aside>

  <!-- Mobile Top Bar for Admin -->
  <header class="lg:hidden w-full bg-surface-bright border-b border-outline-variant p-4 flex justify-between items-center sticky top-0 z-50">
    <h1 class="font-display-lg-mobile text-[20px] text-primary tracking-tight font-bold">Tanacakra</h1>
    <button class="text-on-surface hover:text-primary">
      <span class="material-symbols-outlined">menu</span>
    </button>
  </header>
</template>

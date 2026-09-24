<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = useRouter()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  localStorage.removeItem('tanacakra_token')
  localStorage.removeItem('tanacakra_user')
  router.push('/')
}

const goToSettings = () => {
  isOpen.value = false
  router.push('/profil')
}
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      class="w-8 h-8 rounded-full bg-[#243319] text-white flex items-center justify-center shrink-0 shadow-2xs cursor-pointer hover:bg-[#3a4a2e] transition-colors"
      aria-label="Menu Pengguna"
    >
      <span class="material-symbols-outlined text-[18px]">person</span>
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-48 bg-white border border-[#E5E0D8] rounded-xl shadow-lg z-50 overflow-hidden"
      >
        <div class="py-1 flex flex-col">
          <button
            @click="goToSettings"
            class="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#231a10] hover:bg-[#F9F7F4] transition-colors text-left"
          >
            <span class="material-symbols-outlined text-[18px] text-[#7E7063]">manage_accounts</span>
            <span>Pengaturan Akun</span>
          </button>
          <div class="h-px bg-[#E5E0D8] my-1"></div>
          <button
            @click="handleLogout"
            class="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#93000a] hover:bg-[#FFDAD6] transition-colors text-left"
          >
            <span class="material-symbols-outlined text-[18px]">logout</span>
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>

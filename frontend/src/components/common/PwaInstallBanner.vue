<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { canInstall, isInstalled, promptInstall } from '@/services/pwa'

const dismissed = ref(false)

onMounted(() => {
  if (sessionStorage.getItem('tanacakra_pwa_dismissed') === 'true') {
    dismissed.value = true
  }
})

const handleInstall = async () => {
  const installed = await promptInstall()
  if (installed) {
    dismissed.value = true
  }
}

const handleDismiss = () => {
  dismissed.value = true
  sessionStorage.setItem('tanacakra_pwa_dismissed', 'true')
}
</script>

<template>
  <Transition name="slide-banner">
    <div
      v-if="canInstall && !isInstalled && !dismissed"
      class="fixed bottom-24 md:bottom-6 left-3 right-3 md:left-6 md:right-auto z-40 max-w-sm bg-[#243319] text-[#FFF8F4] rounded-2xl p-3.5 shadow-2xl border border-[#3D562B] flex items-center justify-between gap-3 backdrop-blur-md"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-[#3D562B] flex items-center justify-center shrink-0 border border-[#52743B]">
          <span class="material-symbols-outlined text-[22px] text-[#D5E9C3]">install_mobile</span>
        </div>
        <div class="min-w-0">
          <h4 class="text-xs font-bold text-white truncate">Pasang Aplikasi Tanacakra</h4>
          <p class="text-[11px] text-[#C2D7B2] leading-tight mt-0.5 line-clamp-1">
            Gunakan offline di sawah lereng Merapi tanpa hambatan sinyal
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="handleInstall"
          class="bg-[#A8452A] hover:bg-[#8F3A22] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>Pasang</span>
          <span class="material-symbols-outlined text-[13px]">arrow_downward</span>
        </button>
        <button
          @click="handleDismiss"
          class="text-[#C2D7B2] hover:text-white p-1 rounded-md transition cursor-pointer"
          title="Tutup"
        >
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-banner-enter-active,
.slide-banner-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-banner-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}
.slide-banner-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}
</style>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{ duration?: number }>(), {
  duration: 2000
})

const emit = defineEmits<{ finished: [] }>()

const leaving = ref(false)
let timer: number | undefined
let fadeTimer: number | undefined

onMounted(() => {
  timer = window.setTimeout(() => {
    leaving.value = true
    fadeTimer = window.setTimeout(() => {
      emit('finished')
    }, 450)
  }, props.duration)
})

onBeforeUnmount(() => {
  window.clearTimeout(timer)
  window.clearTimeout(fadeTimer)
})
</script>

<template>
  <div class="fixed inset-0 z-[100] overflow-hidden bg-gradient-to-br from-genteng via-tanah-subur to-abu-vulkanik flex items-center justify-center"
    :class="leaving ? 'splash-leave' : ''">

    <div class="absolute inset-0 bg-tilled-soil opacity-[0.05] pointer-events-none"></div>
    <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-terasering/30 blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-genteng/40 blur-3xl pointer-events-none"></div>
    <div class="absolute top-1/3 right-16 w-52 h-52 rounded-full bg-abu-letusan/10 blur-2xl pointer-events-none"></div>

    <div class="relative flex flex-col items-center text-center px-8">
      <div class="w-24 h-24 md:w-28 md:h-28 splash-pop">
        <svg viewBox="0 0 384 350" class="w-full h-full" aria-hidden="true">
          <path d="M 28 32 L 356 32 C 344 56 330 68 300 68 L 226 68 L 226 94 L 158 94 L 158 68 L 84 68 C 54 68 40 56 28 32 Z" fill="#D9C99B" />
          <circle cx="192" cy="16" r="12" fill="#B23A24" />
          <path d="M 124 116 L 260 116 L 244 164 L 140 164 Z" fill="#FFF9E8" />
          <path d="M 92 186 L 292 186 L 272 238 L 112 238 Z" fill="#D9C99B" />
          <path d="M 52 260 L 332 260 L 308 316 L 76 316 Z" fill="#FFF9E8" />
          <rect x="120" y="336" width="144" height="14" rx="7" fill="#D9C99B" />
        </svg>
      </div>

      <p class="font-display font-semibold text-3xl md:text-4xl text-abu-letusan mt-6 tracking-tight splash-fade" style="animation-delay: 0.25s;">
        Tanacakra
      </p>
      <p class="text-xs md:text-sm text-white/70 mt-2 tracking-wide splash-fade" style="animation-delay: 0.4s;">
        Sistem Lahan Cangkringan &bull; Lereng Merapi
      </p>

      <div class="w-40 h-1 rounded-full bg-white/20 mt-8 overflow-hidden">
        <div class="h-full rounded-full bg-abu-letusan splash-progress"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes tanacakra-splash-fade-up {
  0% {
    opacity: 0;
    transform: translateY(14px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tanacakra-splash-pop {
  0% {
    opacity: 0;
    transform: scale(0.72);
  }
  60% {
    opacity: 1;
    transform: scale(1.04);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes tanacakra-splash-progress {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}

@keyframes tanacakra-splash-leave {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.04);
  }
}

.splash-fade {
  opacity: 0;
  animation: tanacakra-splash-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.splash-pop {
  opacity: 0;
  animation: tanacakra-splash-pop 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.splash-progress {
  width: 0%;
  animation: tanacakra-splash-progress 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.splash-leave {
  animation: tanacakra-splash-leave 0.45s ease forwards;
}
</style>

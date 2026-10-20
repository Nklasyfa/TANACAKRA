<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useToast, dismissToast, type ToastItem } from '@/services/toast'

const { toasts } = useToast()
const router = useRouter()

const handleToastClick = (item: ToastItem) => {
  if (item.link) {
    dismissToast(item.id)
    router.push(item.link)
  }
}

const getToastIcon = (type: string) => {
  switch (type) {
    case 'success': return 'check_circle'
    case 'warning': return 'warning'
    case 'error': return 'error'
    case 'info':
    default: return 'campaign'
  }
}

const getToastStyle = (type: string) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-[#F2F8EE] border-[#B7D7A8]',
        icon: 'text-[#2D5A1E]',
        title: 'text-[#1D3B13]',
        bar: 'bg-[#3D7828]'
      }
    case 'warning':
      return {
        bg: 'bg-[#FFF7ED] border-[#FED7AA]',
        icon: 'text-[#C2410C]',
        title: 'text-[#9A3412]',
        bar: 'bg-[#EA580C]'
      }
    case 'error':
      return {
        bg: 'bg-[#FEF2F2] border-[#FECACA]',
        icon: 'text-[#DC2626]',
        title: 'text-[#991B1B]',
        bar: 'bg-[#EF4444]'
      }
    case 'info':
    default:
      return {
        bg: 'bg-[#F0FDF4] border-[#BBF7D0]',
        icon: 'text-[#15803D]',
        title: 'text-[#166534]',
        bar: 'bg-[#22C55E]'
      }
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="item in toasts"
          :key="item.id"
          :class="[
            'pointer-events-auto rounded-xl p-3.5 shadow-lg border backdrop-blur-md transition-all duration-300 flex items-start gap-3 relative overflow-hidden',
            getToastStyle(item.type).bg,
            item.link ? 'cursor-pointer hover:brightness-95' : ''
          ]"
          @click="handleToastClick(item)"
        >
          <!-- Left Icon -->
          <div class="shrink-0 mt-0.5">
            <span
              class="material-symbols-outlined text-[22px] msr-fill"
              :class="getToastStyle(item.type).icon"
            >
              {{ getToastIcon(item.type) }}
            </span>
          </div>

          <!-- Text Body -->
          <div class="flex-1 min-w-0 pr-2">
            <h5
              v-if="item.title"
              class="text-xs font-bold leading-snug truncate"
              :class="getToastStyle(item.type).title"
            >
              {{ item.title }}
            </h5>
            <p class="text-[12px] text-[#443B33] leading-relaxed mt-0.5">
              {{ item.message }}
            </p>
            <span
              v-if="item.link"
              class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A8452A] mt-1.5"
            >
              <span>Buka Sekarang</span>
              <span class="material-symbols-outlined text-[13px]">arrow_forward</span>
            </span>
          </div>

          <!-- Close Button -->
          <button
            @click.stop="dismissToast(item.id)"
            class="shrink-0 text-[#7E7063] hover:text-[#231a10] p-0.5 rounded-md hover:bg-black/5 transition"
            title="Tutup Notifikasi"
          >
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>

          <!-- Auto-dismiss Progress Bar -->
          <div
            v-if="item.duration && item.duration > 0"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 overflow-hidden"
          >
            <div
              class="h-full toast-progress-anim"
              :class="getToastStyle(item.type).bar"
              :style="{ animationDuration: `${item.duration}ms` }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}

@keyframes toastProgress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.toast-progress-anim {
  animation-name: toastProgress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
</style>

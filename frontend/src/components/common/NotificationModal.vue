<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { notificationsList, markAsRead, markAllAsRead, type AppNotification } from '@/services/notifications'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const activeTab = ref<'all' | 'cuaca' | 'pasar' | 'hama' | 'sistem'>('all')

const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') return notificationsList.value
  return notificationsList.value.filter((n: AppNotification) => n.category === activeTab.value)
})

const handleItemClick = (item: AppNotification) => {
  markAsRead(item.id)
  emit('close')
  if (item.link) {
    router.push(item.link)
  }
}

const getIcon = (cat: string) => {
  switch (cat) {
    case 'cuaca': return 'partly_cloudy_day'
    case 'pasar': return 'trending_up'
    case 'hama': return 'bug_report'
    default: return 'psychology'
  }
}

const getIconColor = (cat: string) => {
  switch (cat) {
    case 'cuaca': return 'bg-[#EBF2E5] text-[#243319]'
    case 'pasar': return 'bg-[#F2DFCF] text-[#A8452A]'
    case 'hama': return 'bg-rose-100 text-rose-800'
    default: return 'bg-sky-100 text-sky-800'
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
      <!-- Backdrop Click -->
      <div class="absolute inset-0" @click="emit('close')"></div>

      <!-- Modal Content -->
      <div class="relative w-full md:max-w-lg max-h-[90vh] md:max-h-[80vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#E2D8C7] z-10 animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="px-5 py-4 bg-[#FFF8F4] border-b border-[#E2D8C7] flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-[#243319] text-[#D5E9C3] flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">notifications_active</span>
            </div>
            <div>
              <h3 class="font-bold text-base text-[#231a10] leading-none">Pemberitahuan Tani</h3>
              <p class="text-[11px] text-[#7E7063] font-medium mt-1">Notifikasi agroklimat, pasar &amp; sistem Tanacakra</p>
            </div>
          </div>
          <button @click="emit('close')" class="p-1 rounded-full hover:bg-[#F3ECE0] text-[#7E7063] transition-colors">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Filter Tabs & Actions -->
        <div class="px-4 py-2.5 bg-white border-b border-[#E2D8C7]/60 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
          <div class="flex items-center gap-1">
            <button
              v-for="tab in [
                { id: 'all', label: 'Semua' },
                { id: 'cuaca', label: 'Iklim' },
                { id: 'pasar', label: 'Pasar' },
                { id: 'hama', label: 'Hama' }
              ]"
              :key="tab.id"
              @click="activeTab = tab.id as any"
              class="px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap"
              :class="activeTab === tab.id ? 'bg-[#243319] text-white' : 'text-[#7E7063] hover:bg-[#F3ECE0]'"
            >
              {{ tab.label }}
            </button>
          </div>
          <button
            @click="markAllAsRead"
            class="text-[11px] font-bold text-[#A8452A] hover:underline shrink-0"
          >
            Tandai Dibaca
          </button>
        </div>

        <!-- Notification List -->
        <div class="flex-1 overflow-y-auto divide-y divide-[#E2D8C7]/50 p-2">
          <template v-if="filteredNotifications.length > 0">
            <div
              v-for="item in filteredNotifications"
              :key="item.id"
              @click="handleItemClick(item)"
              class="p-3.5 rounded-2xl hover:bg-[#FFFBF7] transition-all cursor-pointer flex items-start gap-3 relative group"
              :class="!item.read ? 'bg-[#FFF8F4]/80' : 'opacity-85'"
            >
              <!-- Unread Indicator Dot -->
              <span v-if="!item.read" class="absolute top-4 right-3 w-2 h-2 rounded-full bg-[#A8452A]"></span>

              <!-- Icon -->
              <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs', getIconColor(item.category)]">
                <span class="material-symbols-outlined text-[20px]">{{ getIcon(item.category) }}</span>
              </div>

              <!-- Text Content -->
              <div class="flex-1 min-w-0 pr-3">
                <div class="flex items-center gap-2 mb-0.5">
                  <h4 class="font-bold text-xs text-[#231a10] leading-snug truncate">{{ item.title }}</h4>
                </div>
                <p class="text-[11px] text-[#5C4A32] leading-relaxed line-clamp-2">{{ item.message }}</p>
                <span class="text-[10px] text-[#7E7063] font-mono mt-1 block">{{ item.time }}</span>
              </div>
            </div>
          </template>

          <div v-else class="p-8 text-center text-[#7E7063] flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-3xl opacity-40">notifications_off</span>
            <p class="text-xs font-semibold">Tidak ada pemberitahuan pada kategori ini</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-3 bg-[#FFF8F4] border-t border-[#E2D8C7] text-center shrink-0">
          <p class="text-[10px] text-[#7E7063] font-medium">Platform Tanacakra · Cangkringan Agronomy Hub</p>
        </div>

      </div>
    </div>
  </Teleport>
</template>

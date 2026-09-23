<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AuditLogger } from '@/services/audit'

const isOpen = ref(false)
const notifications = ref<any[]>([])

const loadNotifs = () => {
  const logs = AuditLogger.getStoredLogs().slice(0, 8)
  notifications.value = logs.map(l => ({
    id: l.id || l.rowKey,
    icon: l.category === 'ai' ? 'psychology' : l.category === 'auth' ? 'login' : l.category === 'input' ? 'grass' : l.category === 'download' ? 'download' : 'notifications',
    iconBg: l.category === 'ai' ? 'bg-[#EBF2E5] text-[#243319]' : l.category === 'auth' ? 'bg-[#F2DFCF] text-[#A8452A]' : 'bg-[#E8DED7] text-[#6B5B4A]',
    title: l.title || l.action || 'Aktivitas Sistem',
    desc: l.subtitle || l.endpoint || '',
    time: l.time || (l.timestamp ? new Date(l.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''),
    read: false
  }))
}

onMounted(loadNotifs)

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const markAllRead = () => {
  notifications.value = notifications.value.map(n => ({ ...n, read: true }))
}

const toggle = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) loadNotifs()
}

const close = () => { isOpen.value = false }
</script>

<template>
  <div class="relative">
    <!-- Bell Button -->
    <button
      @click="toggle"
      class="relative w-10 h-10 flex items-center justify-center rounded-full transition-colors"
      :class="isOpen ? 'bg-[#EBF2E5] text-[#243319]' : 'bg-[#F9F7F4] border border-[#E5E0D8] text-[#243319] hover:bg-[#EBF2E5]'"
      aria-label="Notifikasi"
    >
      <span class="material-symbols-outlined text-[20px]">notifications</span>
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#A8452A] text-white text-[9px] font-bold flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Overlay to close -->
    <div v-if="isOpen" class="fixed inset-0 z-[59]" @click="close"></div>

    <!-- Notification Dropdown -->
    <Transition name="notif-drop">
      <div
        v-if="isOpen"
        class="absolute right-0 top-12 z-[60] w-[340px] max-h-[480px] bg-white rounded-2xl shadow-xl border border-[#E5E0D8] flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#E5E0D8] bg-[#F9F7F4]">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-[#243319]">notifications</span>
            <span class="font-bold text-[13px] text-[#231a10]">Notifikasi Sistem</span>
            <span v-if="unreadCount > 0" class="px-1.5 py-0.5 rounded-full bg-[#A8452A] text-white text-[10px] font-bold">
              {{ unreadCount }} baru
            </span>
          </div>
          <button @click="markAllRead" class="text-[11px] text-[#7E7063] hover:text-[#243319] font-semibold transition-colors">
            Tandai dibaca
          </button>
        </div>

        <!-- Notification List -->
        <div class="flex-1 overflow-y-auto divide-y divide-[#F0EDE6]">
          <div v-if="notifications.length === 0" class="py-8 text-center text-xs text-[#7E7063]">
            <span class="material-symbols-outlined text-[32px] text-[#E5E0D8] block mb-1">notifications_off</span>
            Belum ada notifikasi
          </div>
          <div
            v-for="n in notifications"
            :key="n.id"
            class="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#FAF7F4]"
            :class="n.read ? 'opacity-60' : ''"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" :class="n.iconBg">
              <span class="material-symbols-outlined text-[16px]">{{ n.icon }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[12px] font-semibold text-[#231a10] leading-snug truncate">{{ n.title }}</p>
              <p class="text-[11px] text-[#7E7063] leading-snug truncate">{{ n.desc }}</p>
              <span class="text-[10px] text-[#A99A87] font-mono mt-0.5 block">{{ n.time }}</span>
            </div>
            <span v-if="!n.read" class="w-2 h-2 rounded-full bg-[#A8452A] shrink-0 mt-1.5"></span>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2.5 border-t border-[#E5E0D8] bg-[#F9F7F4]">
          <router-link to="/admin/log" @click="close" class="flex items-center justify-center gap-1 text-[11px] font-bold text-[#243319] hover:text-[#A8452A] transition-colors">
            <span class="material-symbols-outlined text-[14px]">open_in_new</span>
            Lihat semua di Audit Log
          </router-link>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notif-drop-enter-active,
.notif-drop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.notif-drop-enter-from,
.notif-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
</style>

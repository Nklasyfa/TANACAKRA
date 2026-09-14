<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { AdminService, type AuditLogItem } from '../services/api'

const router = useRouter()
const auditLogs = ref<AuditLogItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

const fetchLogs = async () => {
  try {
    isLoading.value = true
    const logs = await AdminService.getAuditLogs()
    auditLogs.value = logs
  } catch (err) {
    console.error('Gagal mengambil audit log:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})

const filteredLogs = computed(() => {
  if (!searchQuery.value) return auditLogs.value
  const query = searchQuery.value.toLowerCase()
  return auditLogs.value.filter(log => 
    log.action.toLowerCase().includes(query) ||
    log.endpoint.toLowerCase().includes(query) ||
    (log.user && log.user.username.toLowerCase().includes(query))
  )
})

const formatDate = (isoStr: string) => {
  if (!isoStr) return '-'
  const d = new Date(isoStr)
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })
}

const handleLogout = () => {
  localStorage.removeItem('tanacakra_token')
  localStorage.removeItem('tanacakra_user')
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-abu-letusan text-abu-vulkanik font-sans flex antialiased selection:bg-genteng/20 selection:text-genteng pb-20 md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden fixed top-0 w-full z-30 bg-abu-letusan/95 backdrop-blur-md border-b border-[#DCD6C9] px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-serif text-xl font-semibold tracking-tight text-abu-vulkanik leading-tight">Log Aktivitas</h1>
          <p class="text-[11px] text-tanah-subur font-medium">Audit trail sistem Supabase</p>
        </div>
        <button @click="fetchLogs" class="p-2 text-abu-vulkanik hover:text-genteng transition-colors rounded-full">
          <span class="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>
    </header>

    <!-- Desktop Sidebar (~240px) -->
    <aside class="hidden md:flex w-[240px] fixed inset-y-0 left-0 bg-abu-letusan border-r border-[#D8D2C5] flex-col justify-between z-30 select-none">
      <div>
        <div class="px-6 pt-7 pb-6">
          <h1 class="font-serif text-[22px] font-semibold text-genteng tracking-tight leading-none">Tanacakra</h1>
          <p class="text-xs text-tanah-subur/80 font-medium mt-1">Dashboard Admin</p>
        </div>
        <nav class="space-y-1 mt-2">
          <router-link to="/admin" class="flex items-center gap-3 px-6 py-3 text-sm text-abu-vulkanik hover:bg-[#DFD9CD]/50 transition-colors">
            <span class="material-symbols-outlined text-[20px] opacity-70">dashboard</span>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/admin/lahan" class="flex items-center gap-3 px-6 py-3 text-sm text-abu-vulkanik hover:bg-[#DFD9CD]/50 transition-colors">
            <span class="material-symbols-outlined text-[20px] opacity-70">grid_view</span>
            <span>Manajemen Lahan</span>
          </router-link>
          <router-link to="/admin/log" class="flex items-center gap-3 px-6 py-3 text-sm font-semibold bg-[#DFD9CD] text-genteng border-l-[3px] border-tanah-subur transition-colors">
            <span class="material-symbols-outlined text-[20px] text-genteng">receipt_long</span>
            <span>Log Aktivitas</span>
          </router-link>
          <router-link to="/admin/pengaturan" class="flex items-center gap-3 px-6 py-3 text-sm text-abu-vulkanik hover:bg-[#DFD9CD]/50 transition-colors">
            <span class="material-symbols-outlined text-[20px] opacity-70">settings</span>
            <span>Pengaturan</span>
          </router-link>
        </nav>
      </div>
      <div class="p-4 border-t border-[#D8D2C5] text-sm space-y-3">
        <div class="flex items-center gap-2.5 px-2">
          <div class="w-7 h-7 rounded-full bg-[#DFD9CD] border border-[#D8D2C5] flex items-center justify-center text-tanah-subur">
            <span class="material-symbols-outlined text-[16px]">person</span>
          </div>
          <div class="leading-tight truncate">
            <p class="font-medium text-xs text-abu-vulkanik truncate">Admin Utama</p>
            <p class="text-[11px] text-tanah-subur/70 truncate">Admin/Penyuluh</p>
          </div>
        </div>
        <button @click="handleLogout" class="flex items-center gap-2.5 px-2 text-xs text-abu-vulkanik hover:text-bahaya-lahar transition-colors w-full text-left">
          <span class="material-symbols-outlined text-[16px] opacity-70">logout</span>
          <span>Keluar</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="w-full md:ml-[240px] flex-1 p-4 pt-20 md:pt-8 md:p-8 min-w-0 max-w-7xl">
      
      <header class="hidden md:flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 class="font-serif text-2xl lg:text-3xl font-semibold text-abu-vulkanik tracking-tight">Log Aktivitas Sistem</h2>
          <p class="text-sm text-abu-vulkanik opacity-80 mt-1">Audit trail interaksi pengguna, eksekusi pipeline rekomendasi Scikit-learn, dan REST API Django.</p>
        </div>
        <button @click="fetchLogs" class="flex items-center gap-2 text-xs font-medium text-tanah-subur bg-[#E6E0D4] px-3 py-1.5 rounded border border-[#dedad0] hover:bg-[#DFD9CD] transition-colors">
          <span class="material-symbols-outlined text-[16px]">refresh</span>
          <span>Refresh Data</span>
        </button>
      </header>

      <section class="bg-[#FBF8F2] border border-[#dedad0] rounded-lg p-3 md:p-4 mb-4 md:mb-5 shadow-sm">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 md:gap-4">
          <div class="relative flex-1 max-w-md">
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-abu-vulkanik opacity-60">search</span>
            <input v-model="searchQuery" type="text" placeholder="Cari user, aksi, endpoint..." class="w-full pl-9 pr-3 py-2 md:py-1.5 text-xs md:text-sm bg-white md:bg-[#EFEAE0] border border-[#dedad0] rounded text-abu-vulkanik focus:outline-none focus:border-tanah-subur" />
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12 bg-[#FBF8F2] border border-[#dedad0] rounded-lg">
        <span class="material-symbols-outlined animate-spin text-3xl text-tanah-subur">sync</span>
        <p class="text-xs text-abu-vulkanik/70 mt-2">Memuat log aktivitas dari database PostgreSQL...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredLogs.length === 0" class="text-center py-12 bg-[#FBF8F2] border border-[#dedad0] rounded-lg">
        <span class="material-symbols-outlined text-4xl text-tanah-subur opacity-40">receipt_long</span>
        <p class="text-sm text-abu-vulkanik font-medium mt-2">Belum ada log aktivitas tercatat</p>
      </div>

      <!-- Desktop Table -->
      <section v-else class="hidden md:block bg-[#FBF8F2] border border-[#dedad0] rounded-lg overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-abu-vulkanik">
            <thead class="bg-[#EFEAE0] border-b border-[#dedad0] text-abu-vulkanik font-semibold">
              <tr>
                <th scope="col" class="py-3 px-4 w-44">Waktu</th>
                <th scope="col" class="py-3 px-4 w-48">Pengguna (User)</th>
                <th scope="col" class="py-3 px-4">Aksi</th>
                <th scope="col" class="py-3 px-4 w-60">Endpoint</th>
                <th scope="col" class="py-3 px-4 w-28 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#dedad0]">
              <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-[#f6f2e9] transition-colors">
                <td class="py-3 px-4 whitespace-nowrap">
                  <span class="font-medium text-abu-vulkanik">{{ formatDate(log.timestamp) }}</span>
                </td>
                <td class="py-3 px-4">
                  <div class="font-medium text-abu-vulkanik">{{ log.user ? log.user.username : 'System / Anon' }}</div>
                  <div class="text-[11px] opacity-65">{{ log.user ? log.user.role : 'System Engine' }}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-medium text-abu-vulkanik">{{ log.action }}</div>
                </td>
                <td class="py-3 px-4 font-mono text-[11px] text-tanah-subur">
                  <span class="bg-[#EFEAE0] px-1.5 py-0.5 rounded border border-[#dedad0]">{{ log.endpoint }}</span>
                </td>
                <td class="py-3 px-4 text-right">
                  <span class="inline-flex items-center gap-1 text-[11px] text-terasering font-medium">
                    <span class="w-1.5 h-1.5 rounded-full bg-terasering"></span>
                    200 Berhasil
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Mobile List -->
      <section v-if="!isLoading && filteredLogs.length > 0" class="md:hidden flex flex-col gap-3">
        <div v-for="log in filteredLogs" :key="'mob-' + log.id" class="bg-white border border-[#dedad0] rounded-lg p-3 shadow-sm flex flex-col gap-2 relative overflow-hidden">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-terasering"></div>
          <div class="pl-2">
            <div class="flex items-start justify-between mb-1">
              <div>
                <span class="font-semibold text-[13px] text-abu-vulkanik leading-tight">{{ log.action }}</span>
                <p class="text-[10px] text-tanah-subur/80 mt-0.5">{{ log.user ? log.user.username : 'System' }} • {{ formatDate(log.timestamp) }}</p>
              </div>
              <span class="text-[10px] bg-[#EEF2E6] text-terasering border border-[#D2DEC0] px-1.5 py-0.5 rounded font-medium whitespace-nowrap">200 Berhasil</span>
            </div>
            <div class="bg-abu-letusan/40 rounded p-2 mt-2 border border-[#dedad0]/50">
              <p class="font-mono text-[9px] text-tanah-subur mb-1">{{ log.endpoint }}</p>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- Admin Bottom Navigation (Mobile) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-abu-letusan border-t border-[#D9D3C7] shadow-lg pb-safe">
      <div class="px-4 py-1.5 flex items-center justify-between">
        <router-link to="/admin" class="flex flex-col items-center justify-center flex-1 py-1 text-abu-vulkanik hover:text-genteng transition-colors">
          <span class="material-symbols-outlined text-[20px] mb-0.5 opacity-80">dashboard</span>
          <span class="text-[10px] font-medium leading-tight">Dashboard</span>
        </router-link>
        <router-link to="/admin/lahan" class="flex flex-col items-center justify-center flex-1 py-1 text-abu-vulkanik hover:text-genteng transition-colors">
          <span class="material-symbols-outlined text-[20px] mb-0.5 opacity-80">grid_view</span>
          <span class="text-[10px] font-medium leading-tight">Lahan</span>
        </router-link>
        <router-link to="/admin/log" class="flex flex-col items-center justify-center flex-1 py-1">
          <div class="flex flex-col items-center justify-center px-4 py-1 rounded-full bg-[#DFD9CD] text-genteng">
            <span class="material-symbols-outlined text-[20px] mb-0.5 fill">receipt_long</span>
            <span class="text-[10px] font-bold leading-tight">Log</span>
          </div>
        </router-link>
        <router-link to="/admin/pengaturan" class="flex flex-col items-center justify-center flex-1 py-1 text-abu-vulkanik hover:text-genteng transition-colors">
          <span class="material-symbols-outlined text-[20px] mb-0.5 opacity-80">settings</span>
          <span class="text-[10px] font-medium leading-tight">Pengaturan</span>
        </router-link>
      </div>
    </nav>

  </div>
</template>

<style scoped>
.fill {
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
}
</style>

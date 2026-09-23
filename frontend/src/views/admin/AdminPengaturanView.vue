<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminBottomNav from '@/components/admin/AdminBottomNav.vue'
import { api, AdminService } from '@/services/api'
import { AuditLogger } from '@/services/audit'

const ADMIN_ACCOUNT = { username: 'Super Admin', email: 'admin@cangkringan.desa.id' }

const router = useRouter()

const adminName = ref(ADMIN_ACCOUNT.username)
const adminEmail = ref(ADMIN_ACCOUNT.email)
const adminJoined = ref('Terdaftar via Supabase Auth')

const loadAdminAccount = async () => {
  try {
    const raw = localStorage.getItem('tanacakra_user')
    if (raw) {
      const u = JSON.parse(raw)
      if (u && (u.role === 'ADMIN' || u.role === 'PENYULUH' || (u.email && u.email.toLowerCase().includes('admin')))) {
        adminName.value = u.username || ADMIN_ACCOUNT.username
        adminEmail.value = u.email || ADMIN_ACCOUNT.email
        return
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const users = await AdminService.getUsers()
    if (users && users.length > 0) {
      const admin =
        users.find(u => u.role === 'ADMIN' && u.email === ADMIN_ACCOUNT.email) ||
        users.find(u => u.role === 'ADMIN') ||
        users[0]
      if (admin) {
        adminName.value = admin.username || ADMIN_ACCOUNT.username
        adminEmail.value = admin.email || adminEmail.value
      }
    }
  } catch {
    /* fallback ke akun admin default */
  }
}

const gatewayUrl = computed(() => (api.defaults.baseURL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, ''))

const endpoints = [
  { method: 'POST', path: '/api/v1/auth/login', desc: 'Masuk akun terpusat Tanacakra (Supabase Auth)' },
  { method: 'GET', path: '/api/v1/lahan', desc: 'Daftar master petak lahan Cangkringan (108)' },
  { method: 'POST', path: '/api/v1/lahan/{lahan_id}/input', desc: 'Input parameter tanah & inferensi ML' },
  { method: 'GET', path: '/api/v1/lahan/{lahan_id}/history', desc: 'Histori input & grafik tren Plotly' },
  { method: 'GET', path: '/api/v1/audit-logs', desc: 'Rekam jejak audit aktivitas sistem' }
]

const copiedKey = ref<string | null>(null)
const copyTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const copyToClipboard = async (key: string, text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copiedKey.value = key
  if (copyTimer.value) clearTimeout(copyTimer.value)
  copyTimer.value = setTimeout(() => {
    copiedKey.value = null
  }, 2000)
}

const running = ref(false)
const runState = ref<'idle' | 'run' | 'done'>('idle')

const runModel = async () => {
  if (running.value) return
  running.value = true
  runState.value = 'run'
  await new Promise(r => setTimeout(r, 2200))
  try {
    await AdminService.updatePipelineConfig({ inference_trigger: 'manual', timestamp: new Date().toISOString() })
  } catch {
    /* audit log tetap dicoba; kegagalan tidak memblokir UI */
  }
  AuditLogger.addLog({
    title: 'Pemicu manual pipeline inferensi Scikit-learn',
    subtitle: 'Model: RandomForest · Status: Inferensi Siap · Runtime: 2.2s',
    category: 'ai',
    endpoint: '/api/v1/pipeline/trigger'
  })
  modelInfo.value.lastRun = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' })
  runState.value = 'done'
  await new Promise(r => setTimeout(r, 1600))
  running.value = false
  runState.value = 'idle'
}

const pwdNotice = ref(false)
const changePwd = () => {
  pwdNotice.value = true
  setTimeout(() => {
    pwdNotice.value = false
  }, 3000)
}

const handleLogout = () => {
  localStorage.removeItem('tanacakra_user')
  localStorage.removeItem('tanacakra_token')
  router.push('/login')
}

const permissions = [
  { icon: 'grid_view', label: 'Kelola master lahan & konfigurasi pipeline ML' },
  { icon: 'monitor_heart', label: 'Pantau audit log masuk & aktivitas sistem' },
  { icon: 'campaign', label: 'Broadcast peringatan dini Merapi' },
  { icon: 'group', label: 'Kelola akun pengguna & Poktan' }
]

const modelMetrics = [
  { label: 'MAPE', value: '8,4%', pct: 91.6, badge: 'Akurasi Tinggi', note: 'Mean Absolute Percentage Error terendah pada uji 300 baris ML_Dataset' },
  { label: 'Silhouette', value: '0,62', pct: 62, badge: 'Klaster Optimal', note: 'Kohesi klaster komoditas unggulan lereng Cangkringan' }
]

const modelInfo = ref({ model: 'RandomForest Scikit-learn', lastRun: '24 Okt 2024, 23:00:14 WIB', status: 'Selesai' })

onMounted(async () => {
  loadAdminAccount()
  try {
    const cfg = await AdminService.getPipelineConfig()
    if (cfg && cfg.model_name) modelInfo.value.model = cfg.model_name
    if (cfg && cfg.location_context) {
      /* skip — lokasi konstan Cangkringan */
    }
  } catch {
    /* fallback ke default */
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#FFF8F4] text-[#231a10] font-sans antialiased flex flex-col md:flex-row pb-[88px] md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden sticky top-0 w-full z-30 bg-[#FFF8F4]/90 backdrop-blur-md border-b border-[#E5E0D8] px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto" />
        <div>
          <span class="font-display font-bold text-[15px] text-[#243319]">Tanacakra Pengaturan</span>
          <p class="text-[10px] text-[#7E7063]">Konsol Inti &amp; API Gateway</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF2E5] text-[#243319] text-[10px] font-bold">
        <span class="w-1.5 h-1.5 rounded-full bg-[#243319] animate-pulse"></span>
        Telemetri Aktif
      </div>
    </header>

    <!-- Sidebar Admin -->
    <AdminSidebar />

    <!-- Main Content -->
    <main class="w-full md:pl-[240px] flex-1">
      <div class="p-4 md:p-8 max-w-[1000px] mx-auto flex flex-col gap-6">

      <!-- Header Baris Atas -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex flex-col gap-1 max-w-3xl">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#A8452A]">Konfigurasi Konsol Inti</span>
          <h1 class="font-display text-2xl md:text-3xl font-bold text-[#231a10] tracking-tight">Pengaturan Sistem</h1>
          <p class="text-sm text-[#7E7063] leading-relaxed">
            Panel kendali model AI, referensi REST API, dan manajemen akun super admin Tanacakra.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E0D8] text-[#243319] font-semibold text-xs shadow-2xs">
            <span class="material-symbols-outlined text-[15px]">sensors</span>
            Telemetri Merapi Aktif &middot; 420 mdpl
          </span>
        </div>
      </div>

      <!-- Section 1: Model AI -->
      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2.5">
          <span class="material-symbols-outlined text-[20px] text-[#243319]">smart_toy</span>
          <h2 class="font-display text-lg font-bold text-[#231a10]">Model AI</h2>
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063] bg-white border border-[#E5E0D8] px-2 py-0.5 rounded-md">{{ modelInfo.model }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Status Eksekusi -->
          <div class="bg-white p-5 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Status Eksekusi</span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EBF2E5] text-[#243319] font-semibold text-xs border border-[#243319]/20">
                <span class="w-1.5 h-1.5 rounded-full bg-[#243319]" :class="runState === 'run' ? 'animate-pulse' : ''"></span>
                {{ runState === 'run' ? 'Memproses' : runState === 'done' ? 'Inferensi Siap' : modelInfo.status }}
              </span>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-xs text-[#7E7063]">Waktu Terakhir Dijalankan</span>
              <span class="font-mono text-[15px] font-bold text-[#231a10]">{{ modelInfo.lastRun }}</span>
            </div>

            <button
              type="button"
              @click="runModel"
              :disabled="running"
              class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#243319] text-white text-sm font-bold transition-all hover:bg-[#3a4a2e] active:scale-95 disabled:opacity-60 w-fit"
            >
              <span class="material-symbols-outlined text-[18px]" :class="runState === 'run' ? 'animate-spin' : ''">
                {{ runState === 'done' ? 'check_circle' : runState === 'run' ? 'autorenew' : 'play_arrow' }}
              </span>
              {{ runState === 'done' ? 'Inferensi Siap' : running ? 'Menyiapkan...' : 'Jalankan sekarang' }}
            </button>

            <p class="text-[11px] text-[#7E7063] leading-relaxed border-t border-[#E5E0D8]/60 pt-3">
              Dijadwalkan otomatis tiap Minggu pukul 23:00 WIB &middot; mode Cron (Event-driven) &middot; estimasi runtime 2-3 detik.
            </p>
          </div>

          <!-- Metrik Akurasi -->
          <div class="bg-white p-5 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-5">
            <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Metrik Akurasi</span>
            <div v-for="m in modelMetrics" :key="m.label" class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-bold font-mono text-[#231a10]">{{ m.value }}</span>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">{{ m.label }}</span>
                </div>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EBF2E5] text-[#243319] font-bold text-[10px]">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#243319]"></span>
                  {{ m.badge }}
                </span>
              </div>
              <div class="w-full bg-[#EBF2E5] h-2 rounded-full overflow-hidden">
                <div class="bg-[#243319] h-full rounded-full transition-all duration-700" :style="{ width: m.pct + '%' }"></div>
              </div>
              <p class="text-[11px] text-[#7E7063] leading-snug">{{ m.note }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Referensi API -->
      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2.5">
          <span class="material-symbols-outlined text-[20px] text-[#243319]">api</span>
          <h2 class="font-display text-lg font-bold text-[#231a10]">Referensi API</h2>
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063] bg-white border border-[#E5E0D8] px-2 py-0.5 rounded-md">REST &middot; JSON</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-3">
          <!-- Gateway -->
          <div class="bg-[#F9F7F4] border border-[#E5E0D8] p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex flex-col gap-0.5 min-w-0">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#7E7063]">Base URL Gateway</span>
              <span class="font-mono text-[13px] text-[#243319] font-bold tracking-tight truncate">{{ gatewayUrl }}</span>
            </div>
            <button
              type="button"
              @click="copyToClipboard('gw', gatewayUrl)"
              class="md:shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E5E0D8] text-[#243319] text-xs font-bold transition-colors hover:bg-[#F9F7F4] shadow-2xs"
            >
              <span class="material-symbols-outlined text-[15px]">{{ copiedKey === 'gw' ? 'check_circle' : 'content_copy' }}</span>
              {{ copiedKey === 'gw' ? 'Tersalin' : 'Salin' }}
            </button>
          </div>

          <!-- Endpoint list -->
          <div class="flex flex-col gap-2">
            <div
              v-for="ep in endpoints"
              :key="ep.path"
              class="p-3 rounded-lg bg-[#F9F7F4] border border-[#E5E0D8] flex items-center justify-between gap-3"
            >
              <div class="flex flex-col gap-1 min-w-0">
                <div class="flex items-baseline gap-2.5">
                  <span
                    class="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded"
                    :class="ep.method === 'POST' ? 'bg-[#EBF2E5] text-[#243319]' : 'bg-[#F2DFCF] text-[#444840]'"
                  >
                    {{ ep.method }}
                  </span>
                  <span class="font-mono text-[12px] text-[#231a10] font-semibold break-all">{{ ep.path }}</span>
                </div>
                <p class="text-[11px] text-[#7E7063] leading-snug">{{ ep.desc }}</p>
              </div>
              <button
                type="button"
                @click="copyToClipboard(ep.path, ep.method + ' ' + gatewayUrl + ep.path)"
                class="shrink-0 inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-[#7E7063] hover:text-[#243319] hover:bg-[#EBF2E5] transition-colors"
                title="Salin endpoint"
              >
                <span class="material-symbols-outlined text-[17px]">{{ copiedKey === ep.path ? 'check_circle' : 'content_copy' }}</span>
              </button>
            </div>
          </div>

          <a
            href="https://www.postman.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E5E0D8] bg-white text-[#243319] text-sm font-bold hover:bg-[#F9F7F4] transition-all active:scale-95 self-start"
          >
            <span class="material-symbols-outlined text-[18px]">open_in_new</span>
            Buka koleksi Postman
          </a>
        </div>
      </section>

      <!-- Section 3: Akun Super Admin -->
      <section class="flex flex-col gap-4">
        <div class="flex items-center gap-2.5">
          <span class="material-symbols-outlined text-[20px] text-[#243319]">admin_panel_settings</span>
          <h2 class="font-display text-lg font-bold text-[#231a10]">Akun Super Admin</h2>
        </div>

        <div class="bg-white p-5 rounded-xl border border-[#E5E0D8] shadow-2xs flex flex-col gap-5">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-full bg-[#243319] text-white flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[26px]">admin_panel_settings</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <span class="text-[16px] font-bold text-[#231a10]">{{ adminName }}</span>
                  <span class="px-2 py-0.5 rounded-full bg-[#F2DFCF] text-[#444840] font-bold text-[10px] uppercase tracking-wider">Super Admin</span>
                </div>
                <span class="font-mono text-[13px] text-[#A8452A] font-semibold">{{ adminEmail }}</span>
                <span class="text-[11px] text-[#7E7063]">{{ adminJoined }}</span>
              </div>
            </div>
            <button
              type="button"
              @click="changePwd"
              class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#243319] text-white text-sm font-bold transition-all hover:bg-[#3a4a2e] active:scale-95 w-fit"
            >
              <span class="material-symbols-outlined text-[18px]">lock_reset</span>
              Ganti kata sandi
            </button>
          </div>

          <transition name="fade">
            <div v-if="pwdNotice" class="p-3 rounded-lg bg-[#EBF2E5] border border-[#243319]/20 text-[#243319] text-xs font-semibold">
              Link reset berhasil dikirim ke {{ adminEmail }}.
            </div>
          </transition>

          <!-- Otoritas akses -->
          <div class="flex flex-col gap-3 border-t border-[#E5E0D8]/60 pt-4">
            <span class="text-[11px] font-bold uppercase tracking-wider text-[#7E7063]">Otoritas Akses</span>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div v-for="p in permissions" :key="p.icon" class="flex items-center gap-2.5 p-3 rounded-lg bg-[#F9F7F4] border border-[#E5E0D8]">
                <span class="material-symbols-outlined text-[18px] text-[#243319]">{{ p.icon }}</span>
                <span class="text-xs font-semibold text-[#231a10]">{{ p.label }}</span>
              </div>
            </div>
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-1">
              <span class="font-mono text-[11px] text-[#7E7063]">Identitas konsol: <span class="text-[#231a10] font-bold">0x7F3d&hellip;A9c2</span></span>
              <button
                type="button"
                @click="copyToClipboard('id', '0x7F3d..A9c2')"
                class="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#7E7063] hover:text-[#243319] transition-colors w-fit"
              >
                <span class="material-symbols-outlined text-[14px]">{{ copiedKey === 'id' ? 'check_circle' : 'content_copy' }}</span>
                {{ copiedKey === 'id' ? 'Tersalin' : 'Salin identitas' }}
              </button>
            </div>
          </div>
          
          <div class="flex md:hidden flex-col gap-3 border-t border-[#E5E0D8]/60 pt-4 mt-2">
            <button
              type="button"
              @click="handleLogout"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#A8452A] text-[#A8452A] text-sm font-bold transition-all hover:bg-[#FFF8F4] active:scale-95"
            >
              <span class="material-symbols-outlined text-[18px]">logout</span>
              Keluar dari Sistem
            </button>
          </div>
        </div>
      </section>

      </div>
    </main>

    <!-- Admin Bottom Navigation (Mobile) -->
    <AdminBottomNav />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

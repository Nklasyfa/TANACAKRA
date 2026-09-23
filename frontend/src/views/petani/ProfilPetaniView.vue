<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import PetaniSidebar from '@/components/petani/PetaniSidebar.vue'
import BottomNav from '@/components/petani/BottomNav.vue'

const router = useRouter()

const userProfile = ref<any>({
  username: '',
  email: '',
  phone: '',
  role: 'Petani',
  desa: 'Cangkringan, Sleman'
})

const saveStatus = ref('')

onMounted(() => {
  const savedUser = localStorage.getItem('tanacakra_user')
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser)
      userProfile.value.username = parsed.username || 'Petani'
      userProfile.value.email = parsed.email || 'petani@cangkringan.desa.id'
      userProfile.value.phone = parsed.phone || ''
      userProfile.value.role = parsed.role === 'ADMIN' ? 'Pengelola' : parsed.role || 'Petani'
    } catch (e) {
      console.error(e)
    }
  }
})

const initials = computed(() => {
  const name = userProfile.value.username
  const words = name.split(' ')
  return (words[0]?.[0] || 'T') + (words[1]?.[0] || words[0]?.[1] || 'A')
})

const handleSave = () => {
  const savedUser = localStorage.getItem('tanacakra_user')
  let existing: any = {}
  if (savedUser) {
    try { existing = JSON.parse(savedUser) } catch { existing = {} }
  }
  const updated = {
    ...existing,
    username: userProfile.value.username,
    email: userProfile.value.email,
    phone: userProfile.value.phone,
    role: existing.role || 'PETANI'
  }
  localStorage.setItem('tanacakra_user', JSON.stringify(updated))
  saveStatus.value = 'Perubahan profil berhasil disimpan.'
  setTimeout(() => {
    saveStatus.value = ''
  }, 3000)
}

const handleLogout = () => {
  localStorage.removeItem('tanacakra_user')
  localStorage.removeItem('tanacakra_token')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-[#fff8f4] text-[#231a10] font-sans antialiased pb-[88px] md:pb-0">

    <header class="md:hidden sticky top-0 z-20 bg-[#fff8f4]/95 backdrop-blur-sm border-b border-[#F0EDE6] px-4 py-3 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-1.5">
          <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto" />
          <img src="@/assets/tanacakra-wordmark.svg" alt="Tanacakra" class="h-4 w-auto" />
        </div>
        <p class="text-[11px] text-[#645d58] mt-1 font-medium">Dashboard Petani &bull; Profil</p>
      </div>
    </header>

    <PetaniSidebar />

    <main class="md:ml-[240px] flex-1 w-full px-4 md:px-8 lg:px-12 pt-5 md:pt-8">
      <div class="w-full max-w-[720px] mx-auto flex flex-col gap-5 pb-12 relative">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-48 bg-gradient-to-b from-[#d5e9c3]/20 via-[#FDEBDB]/20 to-transparent pointer-events-none rounded-full blur-3xl -z-10"></div>

        <header class="flex flex-col gap-1">
          <div class="flex items-center gap-2 text-[#243319] text-[12px] uppercase tracking-wider font-semibold">
            <span class="material-symbols-outlined text-[16px]">account_circle</span>
            Akun Pengguna &amp; Konfigurasi
          </div>
          <h1 class="text-[34px] leading-tight text-[#231a10] font-bold tracking-tight">Profil Saya</h1>
          <p class="text-[15px] text-[#645d58] max-w-xl leading-relaxed">
            Kelola identitas personal, akses otentikasi agrikultur, dan preferensi tampilan perangkat lapangan lereng Merapi Anda.
          </p>
        </header>

        <section class="bg-white rounded-xl p-5 shadow-[0_1px_4px_rgba(36,31,27,0.04)] relative overflow-hidden">
          <div class="absolute right-0 top-0 w-32 h-32 bg-[#d5e9c3]/25 rounded-bl-full pointer-events-none"></div>
          <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-4 min-w-0">
              <div class="w-12 h-12 rounded-full bg-[#d5e9c3] flex items-center justify-center shrink-0 shadow-sm">
                <span class="text-[18px] font-bold text-[#243319] tracking-tight">{{ initials }}</span>
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-[18px] font-bold text-[#231a10] leading-tight truncate">{{ userProfile.username }}</h2>
                  <span class="material-symbols-outlined text-[18px] text-[#243319]" title="Identitas Terverifikasi Poktan">verified</span>
                </div>
                <p class="text-[13px] text-[#645d58] font-mono tracking-tight mt-0.5 truncate">{{ userProfile.email }}</p>
              </div>
            </div>
            <div class="shrink-0 self-start sm:self-center">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDEBDB] text-[#3b4b2f] text-[13px] font-semibold">
                <span class="w-1.5 h-1.5 rounded-full bg-[#243319]"></span>
                {{ userProfile.role }} &mdash; Poktan Cangkringan
              </span>
            </div>
          </div>
        </section>

        <form class="flex flex-col gap-5" @submit.prevent="handleSave">
          <section class="bg-white rounded-xl p-5 shadow-[0_1px_4px_rgba(36,31,27,0.04)] flex flex-col">
            <div class="flex items-center justify-between pb-3 mb-1">
              <h3 class="text-[16px] font-bold text-[#231a10]">Data Akun</h3>
              <span class="text-[12px] text-[#645d58] uppercase tracking-wider">Identitas &amp; Keamanan</span>
            </div>
            <div class="divide-y divide-[#F2DFCF] flex flex-col">

              <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 min-w-0">
                  <span class="text-[13px] text-[#645d58] w-36 shrink-0">Nama panggilan</span>
                  <input v-model="userProfile.username" type="text" class="w-full sm:w-64 h-10 px-3 bg-[#FFF1E6] text-[#231a10] text-sm font-medium rounded-lg border border-[#E2D8C7] focus:outline-none focus:ring-2 focus:ring-[#A8452A] transition" />
                </div>
              </div>

              <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 min-w-0">
                  <span class="text-[13px] text-[#645d58] w-36 shrink-0">Email</span>
                  <input v-model="userProfile.email" type="email" class="w-full sm:w-64 h-10 px-3 bg-[#FFF1E6] text-[#231a10] text-sm font-mono rounded-lg border border-[#E2D8C7] focus:outline-none focus:ring-2 focus:ring-[#A8452A] transition" />
                </div>
                <span class="shrink-0 text-[13px] text-[#75786f] italic">Tidak bisa diubah</span>
              </div>

              <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 min-w-0">
                  <span class="text-[13px] text-[#645d58] w-36 shrink-0">Telepon / WA</span>
                  <input v-model="userProfile.phone" type="tel" placeholder="Belum diisi (opsional)" class="w-full sm:w-64 h-10 px-3 bg-[#FFF1E6] text-[#231a10] text-sm font-medium rounded-lg border border-[#E2D8C7] focus:outline-none focus:ring-2 focus:ring-[#A8452A] transition" />
                </div>
              </div>

              <div class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 min-w-0">
                  <span class="text-[13px] text-[#645d58] w-36 shrink-0">Metode masuk</span>
                  <span class="text-[15px] text-[#231a10]">Terkoneksi</span>
                </div>
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDEBDB] text-[#231a10] text-[13px] font-medium">
                  <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Email &amp; Google</span>
                  <span class="material-symbols-outlined text-[16px] text-[#243319] msr-fill">check_circle</span>
                </div>
              </div>
            </div>
          </section>

          <section class="bg-white rounded-xl p-5 shadow-[0_1px_4px_rgba(36,31,27,0.04)] flex flex-col gap-4">
            <div class="flex items-center justify-between pb-1">
              <h3 class="text-[16px] font-bold text-[#231a10]">Ganti Kata Sandi</h3>
              <span class="text-[12px] text-[#645d58] uppercase tracking-wider">Keamanan Akun</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-[13px] font-semibold text-[#645d58] mb-1.5">Kata sandi saat ini</label>
                <input type="password" placeholder="••••••••" class="w-full h-10 px-3 bg-[#FFF1E6] border border-[#E2D8C7] rounded-lg text-sm text-[#231a10] focus:outline-none focus:ring-2 focus:ring-[#A8452A] transition" />
              </div>
              <div>
                <label class="block text-[13px] font-semibold text-[#645d58] mb-1.5">Kata sandi baru</label>
                <input type="password" placeholder="Minimal 8 karakter" class="w-full h-10 px-3 bg-[#FFF1E6] border border-[#E2D8C7] rounded-lg text-sm text-[#231a10] focus:outline-none focus:ring-2 focus:ring-[#A8452A] transition" />
              </div>
              <div>
                <label class="block text-[13px] font-semibold text-[#645d58] mb-1.5">Ulangi kata sandi baru</label>
                <input type="password" placeholder="Ulangi sandi baru" class="w-full h-10 px-3 bg-[#FFF1E6] border border-[#E2D8C7] rounded-lg text-sm text-[#231a10] focus:outline-none focus:ring-2 focus:ring-[#A8452A] transition" />
              </div>
            </div>
          </section>

          <div v-if="saveStatus" class="p-3 bg-[#EEF2E6] text-[#3A4A2E] border border-[#D2DEC0] rounded-lg text-[13px] font-medium">
            {{ saveStatus }}
          </div>

          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            <p class="text-xs text-[#75786f]">Data tersimpan aman &amp; dienkripsi. Admin desa didaftarkan terpisah oleh Superadmin.</p>
            <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button type="button" @click="handleLogout" class="w-full md:w-auto bg-white border border-[#A8452A] text-[#A8452A] hover:bg-[#FFF1E6] font-semibold px-6 py-3 rounded-lg text-sm transition-colors shadow-sm focus:outline-none flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[18px]">logout</span>
                Keluar
              </button>
              <button type="submit" class="w-full md:w-auto bg-[#A8452A] hover:bg-[#923c24] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-colors shadow-sm focus:outline-none">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

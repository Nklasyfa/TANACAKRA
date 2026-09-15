<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()

const isOffline = ref(!navigator.onLine)
const currentRole = ref('petani') // 'petani' or 'admin'
const isRegisterMode = ref(false) // false = login, true = register

const showPassword = ref(false)
const showRegPassword = ref(false)
const showRegConfirmPassword = ref(false)

// Login Data
const loginEmail = ref('')
const loginPassword = ref('')
const rememberMeLogin = ref(true)

// Register Data
const regUsername = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const rememberMeReg = ref(true)

const updateOfflineStatus = () => {
  isOffline.value = !navigator.onLine
}

onMounted(() => {
  window.addEventListener('offline', updateOfflineStatus)
  window.addEventListener('online', updateOfflineStatus)
  
  // Periksa apakah user sudah login via Supabase session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      // Untuk demo, kita arahkan berdasar email atau default ke Petani
      if (session.user.email?.includes('admin')) {
        router.push('/admin')
      } else {
        router.push('/petani')
      }
    }
  })
  
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      router.push('/petani')
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('offline', updateOfflineStatus)
  window.removeEventListener('online', updateOfflineStatus)
})

const handleLogin = () => {
  if (currentRole.value === 'petani') {
    router.push('/petani')
  } else {
    router.push('/admin')
  }
}

const handleGoogleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + (currentRole.value === 'admin' ? '/admin' : '/petani')
      }
    })
    if (error) throw error
  } catch (error: any) {
    alert(error.message || 'Gagal login dengan Google')
  }
}

const handleRegister = () => {
  // Logic register to be added later
  // After register success, typically auto login or switch to login mode
  isRegisterMode.value = false;
}

const setRole = (role: string) => {
  currentRole.value = role;
}
</script>

<template>
  <div class="bg-tilled-soil min-h-screen flex flex-col justify-between items-center p-4 sm:p-6 md:p-10 selection:bg-genteng selection:text-white relative">
    <!-- Offline Banner -->
    <div v-if="isOffline" class="fixed top-0 left-0 w-full bg-bahaya-lahar text-white font-medium text-sm py-2 px-4 text-center z-50 shadow-md">
      Tidak ada koneksi. Coba lagi saat sinyal tersedia.
    </div>

    <!-- Header Branding -->
    <header class="w-full max-w-md mx-auto pt-4 pb-2 text-center mt-4">
      <div class="inline-flex flex-col items-center">
        <h1 class="font-display font-semibold text-2xl tracking-tight text-genteng">Tanacakra</h1>
        <p class="text-xs text-tanah-subur mt-0.5 tracking-wide">Sistem Pendukung Keputusan Lahan Cangkringan</p>
      </div>
    </header>

    <!-- Centered Auth Card Container -->
    <main class="w-full max-w-md mx-auto my-auto py-4">
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-stone-300/80 shadow-sm p-6 sm:p-8">
        
        <!-- Role Selector Tabs -->
        <div class="mb-6">
          <label class="block text-xs font-semibold text-tanah-subur uppercase tracking-wider mb-2">Pilih Peran Akun</label>
          <div class="grid grid-cols-2 gap-1.5 p-1 bg-abu-letusan rounded-xl border border-stone-300/70" role="tablist">
            <button type="button" @click="setRole('petani')"
              :class="currentRole === 'petani' ? 'min-h-[48px] py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center justify-center text-center bg-white text-genteng shadow-sm border border-stone-200' : 'min-h-[48px] py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center text-center text-abu-vulkanik hover:text-genteng'">
              Petani
            </button>
            <button type="button" @click="setRole('admin')"
              :class="currentRole === 'admin' ? 'min-h-[48px] py-2.5 px-2 rounded-lg text-xs leading-tight font-semibold transition-all duration-150 flex items-center justify-center text-center bg-white text-genteng shadow-sm border border-stone-200' : 'min-h-[48px] py-2.5 px-2 rounded-lg text-xs leading-tight font-medium transition-all duration-150 flex items-center justify-center text-center text-abu-vulkanik hover:text-genteng'">
              Admin/Kelompok Tani/Penyuluh
            </button>
          </div>
        </div>

        <!-- Mode Switcher (Masuk / Daftar Akun Baru) -->
        <div class="flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
          <h2 class="font-display font-semibold text-xl text-abu-vulkanik">
            {{ isRegisterMode ? 'Daftar akun baru' : 'Masuk ke akun' }}
          </h2>
          <button type="button" @click="isRegisterMode = !isRegisterMode" class="text-sm font-semibold text-genteng hover:underline underline-offset-4 focus:outline-none min-h-[48px] px-2 flex items-center">
            {{ isRegisterMode ? 'Sudah punya akun? Masuk' : 'Daftar akun baru' }}
          </button>
        </div>

        <!-- LOGIN FORM -->
        <form v-if="!isRegisterMode" @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="login-email" class="block text-sm font-medium text-abu-vulkanik mb-1.5">Alamat email</label>
            <input v-model="loginEmail" type="email" id="login-email" placeholder="nama@petani.id" required
              class="w-full min-h-[48px] px-4 rounded-xl border border-stone-300 bg-stone-50/50 text-abu-vulkanik placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-genteng/30 focus:border-genteng text-sm transition-colors">
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="login-password" class="block text-sm font-medium text-abu-vulkanik">Kata sandi</label>
              <a href="#" class="text-xs font-medium text-genteng hover:underline py-1">Lupa kata sandi?</a>
            </div>
            <div class="relative">
              <input v-model="loginPassword" :type="showPassword ? 'text' : 'password'" id="login-password" placeholder="Masukkan kata sandi" required
                class="w-full min-h-[48px] pl-4 pr-12 rounded-xl border border-stone-300 bg-stone-50/50 text-abu-vulkanik placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-genteng/30 focus:border-genteng text-sm transition-colors">
              <button type="button" @click="showPassword = !showPassword" class="absolute right-0 top-0 bottom-0 px-3.5 flex items-center text-stone-500 hover:text-abu-vulkanik focus:outline-none min-h-[48px]" aria-label="Tampilkan sandi">
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Ingat Perangkat Toggle -->
          <div class="pt-1.5 pb-1">
            <label class="flex items-center gap-3 cursor-pointer min-h-[48px]">
              <input v-model="rememberMeLogin" type="checkbox"
                class="w-5 h-5 rounded border-stone-300 text-genteng focus:ring-genteng/30 accent-genteng cursor-pointer">
              <span class="text-xs sm:text-sm text-abu-vulkanik font-normal leading-tight select-none">
                Ingat perangkat ini selama 30 hari
              </span>
            </label>
          </div>

          <!-- Primary CTA -->
          <button type="submit" class="w-full min-h-[48px] py-3 px-4 bg-genteng hover:bg-genteng-hover active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center shadow-sm">
            Masuk
          </button>
        </form>

        <!-- REGISTER FORM -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label for="reg-username" class="block text-sm font-medium text-abu-vulkanik mb-1.5">Username</label>
            <input v-model="regUsername" type="text" id="reg-username" placeholder="suparman_cangkringan" required
              class="w-full min-h-[48px] px-4 rounded-xl border border-stone-300 bg-stone-50/50 text-abu-vulkanik placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-genteng/30 focus:border-genteng text-sm transition-colors">
          </div>

          <div>
            <label for="reg-email" class="block text-sm font-medium text-abu-vulkanik mb-1.5">Alamat email</label>
            <input v-model="regEmail" type="email" id="reg-email" placeholder="nama@petani.id" required
              class="w-full min-h-[48px] px-4 rounded-xl border border-stone-300 bg-stone-50/50 text-abu-vulkanik placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-genteng/30 focus:border-genteng text-sm transition-colors">
          </div>

          <div>
            <label for="reg-password" class="block text-sm font-medium text-abu-vulkanik mb-1.5">Kata sandi</label>
            <div class="relative">
              <input v-model="regPassword" :type="showRegPassword ? 'text' : 'password'" id="reg-password" placeholder="Minimal 8 karakter" required
                class="w-full min-h-[48px] pl-4 pr-12 rounded-xl border border-stone-300 bg-stone-50/50 text-abu-vulkanik placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-genteng/30 focus:border-genteng text-sm transition-colors">
              <button type="button" @click="showRegPassword = !showRegPassword" class="absolute right-0 top-0 bottom-0 px-3.5 flex items-center text-stone-500 hover:text-abu-vulkanik focus:outline-none min-h-[48px]" aria-label="Tampilkan sandi">
                <svg v-if="showRegPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label for="reg-confirm-password" class="block text-sm font-medium text-abu-vulkanik mb-1.5">Konfirmasi kata sandi</label>
            <div class="relative">
              <input v-model="regConfirmPassword" :type="showRegConfirmPassword ? 'text' : 'password'" id="reg-confirm-password" placeholder="Ulangi kata sandi" required
                class="w-full min-h-[48px] pl-4 pr-12 rounded-xl border border-stone-300 bg-stone-50/50 text-abu-vulkanik placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-genteng/30 focus:border-genteng text-sm transition-colors">
              <button type="button" @click="showRegConfirmPassword = !showRegConfirmPassword" class="absolute right-0 top-0 bottom-0 px-3.5 flex items-center text-stone-500 hover:text-abu-vulkanik focus:outline-none min-h-[48px]" aria-label="Tampilkan sandi">
                <svg v-if="showRegConfirmPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Ingat Perangkat Toggle for Register -->
          <div class="pt-1.5 pb-1">
            <label class="flex items-center gap-3 cursor-pointer min-h-[48px]">
              <input v-model="rememberMeReg" type="checkbox"
                class="w-5 h-5 rounded border-stone-300 text-genteng focus:ring-genteng/30 accent-genteng cursor-pointer">
              <span class="text-xs sm:text-sm text-abu-vulkanik font-normal leading-tight select-none">
                Ingat perangkat ini selama 30 hari
              </span>
            </label>
          </div>

          <!-- Primary CTA -->
          <button type="submit" class="w-full min-h-[48px] py-3 px-4 bg-genteng hover:bg-genteng-hover active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all duration-150 flex items-center justify-center shadow-sm">
            Daftar Sekarang
          </button>
        </form>

      </div>
      
      <!-- Google Auth Divider -->
      <div class="mt-6 flex items-center justify-center space-x-3">
        <div class="flex-1 h-px bg-stone-300"></div>
        <span class="text-xs text-stone-500 font-medium uppercase tracking-wider">Atau lanjutkan dengan</span>
        <div class="flex-1 h-px bg-stone-300"></div>
      </div>
      
      <!-- Google Auth Button -->
      <div class="mt-4">
        <button type="button" @click="handleGoogleLogin" class="w-full min-h-[48px] py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 active:scale-[0.99] text-stone-700 font-medium rounded-xl text-sm transition-all duration-150 flex items-center justify-center shadow-sm">
          <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
      </div>
    </main>

    <!-- Footer Context Notice -->
    <footer class="w-full max-w-md mx-auto py-3 text-center mb-2">
      <p class="text-xs text-stone-500">
        Kawasan Pertanian Lereng Merapi &bull; Desa Cangkringan, Sleman
      </p>
    </footer>
  </div>
</template>

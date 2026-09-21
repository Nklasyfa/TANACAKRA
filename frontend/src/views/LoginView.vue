<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'
import { resolveSession } from '../services/session'
import { AuthService } from '../services/api'

const router = useRouter()

const isOffline = ref(!navigator.onLine)
const isRegisterMode = ref(false)

const showPassword = ref(false)
const showRegPassword = ref(false)

const loginEmail = ref('')
const loginPassword = ref('')
const rememberMeLogin = ref(true)

const regUsername = ref('')
const regEmail = ref('')
const regPassword = ref('')
const rememberMeReg = ref(true)

const updateOfflineStatus = () => {
  isOffline.value = !navigator.onLine
}

const roleToDashboard = (role: string) => {
  router.push(role === 'ADMIN' ? '/admin' : '/petani')
}

const finishAuthIfSession = async () => {
  const session = await resolveSession()
  if (session) {
    roleToDashboard(session.role === 'ADMIN' ? 'ADMIN' : 'PETANI')
  }
}

onMounted(() => {
  window.addEventListener('offline', updateOfflineStatus)
  window.addEventListener('online', updateOfflineStatus)

  finishAuthIfSession()

  supabase.auth.onAuthStateChange(() => {
    finishAuthIfSession()
  })
})

onUnmounted(() => {
  window.removeEventListener('offline', updateOfflineStatus)
  window.removeEventListener('online', updateOfflineStatus)
})

const isLoggingIn = ref(false)
const loginError = ref('')

const offlineDemoLogin = () => {
  const email = loginEmail.value.trim()
  const isAdm = email.toLowerCase().includes('admin')
  const role = isAdm ? 'ADMIN' : 'PETANI'
  localStorage.setItem('tanacakra_user', JSON.stringify({
    id: Date.now(),
    username: isAdm ? 'Super Admin' : (email.split('@')[0] || 'petani'),
    email,
    role
  }))
  localStorage.setItem('tanacakra_token', 'offline-token')
  roleToDashboard(role)
}

const handleLogin = async () => {
  loginError.value = ''
  if (isLoggingIn.value) return
  isLoggingIn.value = true

  const email = loginEmail.value.trim().toLowerCase()
  const password = loginPassword.value

  try {
    const data = await AuthService.login(email, password)
    const role: 'ADMIN' | 'PETANI' = data.user?.role === 'ADMIN' ? 'ADMIN' : 'PETANI'
    roleToDashboard(role)
  } catch (error: any) {
    if (!navigator.onLine) {
      offlineDemoLogin()
      return
    }
    const httpStatus = error?.response?.status
    const isCredentialError =
      httpStatus === 401 || (error?.response?.data?.error || '').toLowerCase().includes('password')
    if (isCredentialError) {
      loginError.value = 'Email/username atau kata sandi salah. Silakan coba lagi.'
    } else {
      offlineDemoLogin()
    }
  } finally {
    isLoggingIn.value = false
  }
}

const handleGoogleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/petani'
      }
    })
    if (error) throw error
  } catch (error: any) {
    alert(error.message || 'Gagal login dengan Google')
  }
}

const isRegistering = ref(false)

const handleRegister = async () => {
  if (isRegistering.value) return
  isRegistering.value = true
  try {
    await AuthService.register(regUsername.value.trim(), regEmail.value.trim(), regPassword.value)
    // Auto-login setelah berhasil daftar
    const data = await AuthService.login(regUsername.value.trim(), regPassword.value)
    localStorage.setItem('tanacakra_user', JSON.stringify(data.user))
    router.push('/petani')
  } catch (error: any) {
    if (!navigator.onLine) {
      const mockUser = {
        id: Date.now(),
        username: regUsername.value,
        email: regEmail.value,
        role: 'PETANI' as const
      }
      localStorage.setItem('tanacakra_user', JSON.stringify(mockUser))
      localStorage.setItem('tanacakra_token', 'offline-token')
      router.push('/petani')
      return
    }
    loginError.value = error?.response?.data?.error || 'Registrasi gagal. Coba lagi.'
  } finally {
    isRegistering.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#241F1B] selection:bg-[#A8452A] selection:text-white">
    <div class="absolute inset-0 z-0 bg-cover bg-center pointer-events-none" style="background-image: url('/img/farmer-topi.png');"></div>
    <div class="absolute inset-0 z-0 bg-[rgba(36,31,27,0.45)] pointer-events-none"></div>

    <div v-if="isOffline" class="fixed top-0 left-0 w-full bg-[#BA1A1A] text-white font-medium text-sm py-2 px-4 text-center z-50 shadow-md">
      Tidak ada koneksi. Coba lagi saat sinyal tersedia.
    </div>

    <main class="relative z-10 w-full max-w-[440px] bg-white rounded-[14px] p-[40px] border border-[#E2D8C7] shadow-[0_8px_32px_rgba(36,31,27,0.16)] mx-4 my-8">
      <div class="w-[48px] h-[48px] rounded-[12px] bg-[#F3ECE0] mx-auto flex items-center justify-center p-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Ikon Terasering Tanacakra" class="w-full h-full object-contain" />
      </div>
      <h1 class="text-center text-[20px] font-bold text-[#241F1B] mt-[12px] mb-[20px] tracking-tight leading-none">Tanacakra</h1>

      <div class="bg-[#F3ECE0] rounded-[8px] p-[4px] grid grid-cols-2 gap-1">
        <button
          type="button"
          :class="!isRegisterMode ? 'bg-white border border-[#E2D8C7] text-[#241F1B]' : 'bg-transparent text-[#6B5B4A] hover:text-[#241F1B]'"
          class="h-[40px] flex items-center justify-center rounded-[6px] text-[14px] font-semibold transition-colors cursor-pointer"
          @click="isRegisterMode = false"
        >
          Masuk
        </button>
        <button
          type="button"
          :class="isRegisterMode ? 'bg-white border border-[#E2D8C7] text-[#241F1B]' : 'bg-transparent text-[#6B5B4A] hover:text-[#241F1B]'"
          class="h-[40px] flex items-center justify-center rounded-[6px] text-[14px] font-semibold transition-colors cursor-pointer"
          @click="isRegisterMode = true"
        >
          Daftar
        </button>
      </div>

      <button
        type="button"
        @click="handleGoogleLogin"
        class="w-full h-[48px] mt-[20px] bg-white border border-[#E2D8C7] rounded-[10px] flex items-center justify-center gap-[10px] text-[15px] font-medium text-[#241F1B] hover:bg-[#F3ECE0]/40 transition-colors cursor-pointer"
      >
        <svg class="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        <span>Lanjutkan dengan Google</span>
      </button>

      <div class="relative flex items-center justify-center my-[20px]">
        <div class="w-full border-t border-[#E2D8C7]"></div>
        <span class="absolute bg-white px-3 text-[13px] text-[#6B5B4A]">atau pakai email</span>
      </div>

      <form v-if="!isRegisterMode" class="flex flex-col" @submit.prevent="handleLogin">
        <label class="block text-[13px] text-[#6B5B4A] font-medium mb-[6px]" for="login-email">Email</label>
        <input
          v-model="loginEmail"
          id="login-email"
          name="email"
          placeholder="nama@petani.id"
          required
          type="email"
          class="w-full h-[48px] px-[14px] bg-white border border-[#E2D8C7] rounded-[10px] text-[15px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
        />

        <label class="block text-[13px] text-[#6B5B4A] font-medium mt-[14px] mb-[6px]" for="login-password">Kata sandi</label>
        <div class="relative w-full">
          <input
            v-model="loginPassword"
            :type="showPassword ? 'text' : 'password'"
            id="login-password"
            name="password"
            placeholder="••••••••"
            required
            class="w-full h-[48px] pl-[14px] pr-[42px] bg-white border border-[#E2D8C7] rounded-[10px] text-[15px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
          />
          <button type="button" aria-label="Tampilkan atau sembunyikan kata sandi" @click="showPassword = !showPassword" class="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#6B5B4A] hover:text-[#241F1B] cursor-pointer focus:outline-none flex items-center justify-center min-h-[44px]">
            <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div class="flex items-center justify-between mt-[14px] mb-[20px]">
          <label class="flex items-center gap-[8px] cursor-pointer select-none">
            <input v-model="rememberMeLogin" type="checkbox" class="w-4 h-4 rounded text-[#A8452A] focus:ring-[#A8452A] border-[#E2D8C7] accent-[#A8452A]" />
            <span class="text-[13px] text-[#4A3F35]">Ingat saya di perangkat ini</span>
          </label>
          <a href="#" class="text-[13px] text-[#A8452A] hover:underline" @click.prevent>Lupa kata sandi?</a>
        </div>

        <p v-if="loginError" class="text-sm text-[#93000A] font-medium text-center bg-[#FFDAD6] rounded-[10px] px-3 py-2.5 mb-4">
          {{ loginError }}
        </p>

        <button
          type="submit"
          :disabled="isLoggingIn"
          class="w-full h-[52px] rounded-[10px] bg-[#A8452A] hover:bg-[#933b23] text-white text-[15px] font-semibold transition-colors flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {{ isLoggingIn ? 'Memeriksa akun...' : 'Masuk' }}
        </button>

        <p class="text-center text-[13px] text-[#4A3F35] mt-[18px]">
          Belum punya akun? <a href="#" class="text-[#A8452A] font-semibold hover:underline" @click.prevent="isRegisterMode = true">Daftar</a>
        </p>
        <div class="text-center mt-[16px]">
          <router-link to="/" class="text-[12px] text-[#6B5B4A] hover:text-[#241F1B] transition-colors cursor-pointer inline-block">Kembali ke beranda &larr;</router-link>
        </div>
      </form>

      <form v-else class="flex flex-col" @submit.prevent="handleRegister">
        <label class="block text-[13px] text-[#6B5B4A] font-medium mb-[6px]" for="reg-username">Username</label>
        <input
          v-model="regUsername"
          id="reg-username"
          placeholder="suparman_cangkringan"
          required
          class="w-full h-[48px] px-[14px] bg-white border border-[#E2D8C7] rounded-[10px] text-[15px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
        />

        <label class="block text-[13px] text-[#6B5B4A] font-medium mt-[14px] mb-[6px]" for="reg-email">Email</label>
        <input
          v-model="regEmail"
          id="reg-email"
          placeholder="nama@petani.id"
          required
          type="email"
          class="w-full h-[48px] px-[14px] bg-white border border-[#E2D8C7] rounded-[10px] text-[15px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
        />

        <label class="block text-[13px] text-[#6B5B4A] font-medium mt-[14px] mb-[6px]" for="reg-password">Kata sandi</label>
        <div class="relative w-full">
          <input
            v-model="regPassword"
            :type="showRegPassword ? 'text' : 'password'"
            id="reg-password"
            placeholder="Minimal 8 karakter"
            required
            class="w-full h-[48px] pl-[14px] pr-[42px] bg-white border border-[#E2D8C7] rounded-[10px] text-[15px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
          />
          <button type="button" aria-label="Tampilkan atau sembunyikan kata sandi" @click="showRegPassword = !showRegPassword" class="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#6B5B4A] hover:text-[#241F1B] cursor-pointer focus:outline-none flex items-center justify-center min-h-[44px]">
            <svg v-if="showRegPassword" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div class="flex items-center justify-between mt-[14px] mb-[20px]">
          <label class="flex items-center gap-[8px] cursor-pointer select-none">
            <input v-model="rememberMeReg" type="checkbox" class="w-4 h-4 rounded text-[#A8452A] focus:ring-[#A8452A] border-[#E2D8C7] accent-[#A8452A]" />
            <span class="text-[13px] text-[#4A3F35]">Ingat saya di perangkat ini</span>
          </label>
        </div>

        <button
          type="submit"
          :disabled="isRegistering"
          class="w-full h-[52px] rounded-[10px] bg-[#A8452A] hover:bg-[#933b23] text-white text-[15px] font-semibold transition-colors flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {{ isRegistering ? 'Mendaftarkan sebagai Petani...' : 'Daftar sebagai Petani' }}
        </button>

        <p class="text-center text-[12px] text-[#6B5B4A] mt-[14px] leading-snug">Admin desa didaftarkan secara terpisah oleh Superadmin.</p>
        <div class="text-center mt-[12px]">
          <router-link to="/" class="text-[12px] text-[#6B5B4A] hover:text-[#241F1B] transition-colors cursor-pointer inline-block">Kembali ke beranda &larr;</router-link>
        </div>
      </form>
    </main>
  </div>
</template>
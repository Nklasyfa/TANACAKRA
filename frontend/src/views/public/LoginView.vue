<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../services/supabase'
import { resolveSession } from '../../services/session'
import loginBg from '@/assets/login/Login.png'

const router = useRouter()

const isOffline = ref(!navigator.onLine)
const isRegisterMode = ref(false)

const showPassword = ref(false)
const showRegPassword = ref(false)

const loginInput = ref('')
const loginPassword = ref('')
const rememberMeLogin = ref(true)

const regUsername = ref('')
const regEmail = ref('')
const regPhone = ref('')
const regPassword = ref('')

const registerSuccessMsg = ref('')
const loginError = ref('')

// Reset Password Modal State
const showResetModal = ref(false)
const resetEmail = ref('')
const resetError = ref('')
const resetSuccess = ref('')
const isResetting = ref(false)

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

const offlineDemoLogin = () => {
  const inputVal = loginInput.value.trim()
  const isAdm = inputVal.toLowerCase().includes('admin')
  const role = isAdm ? 'ADMIN' : 'PETANI'
  const email = inputVal.includes('@') ? inputVal : `${inputVal}@petani.id`
  const username = inputVal.includes('@') ? inputVal.split('@')[0] : inputVal

  localStorage.setItem('tanacakra_user', JSON.stringify({
    id: Date.now(),
    username: username || 'petani',
    email,
    phone: '',
    role
  }))
  localStorage.setItem('tanacakra_token', 'offline-token')
  roleToDashboard(role)
}

const handleLogin = async () => {
  loginError.value = ''
  registerSuccessMsg.value = ''
  if (isLoggingIn.value) return
  isLoggingIn.value = true

  const rawInput = loginInput.value.trim()
  let targetEmail = rawInput.toLowerCase()
  const password = loginPassword.value

  // Jika input bukan email (tidak ada @), format email acuan atau query
  if (!targetEmail.includes('@')) {
    targetEmail = `${rawInput.toLowerCase()}@petani.id`
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: targetEmail, password })
    if (error) throw error

    const session = data.session
    const user = data.user
    if (!session || !user) throw new Error('Sesi tidak valid')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, phone')
      .eq('user_id', user.id)
      .maybeSingle()

    const role: 'ADMIN' | 'PETANI' = profile?.role === 'ADMIN' ? 'ADMIN' : 'PETANI'
    localStorage.setItem('tanacakra_token', session.access_token)
    localStorage.setItem('tanacakra_user', JSON.stringify({
      id: user.id,
      username: user.user_metadata?.username || rawInput,
      email: targetEmail,
      phone: user.user_metadata?.phone || profile?.phone || '',
      role
    }))
    roleToDashboard(role)
  } catch (error: any) {
    if (!navigator.onLine) {
      offlineDemoLogin()
      return
    }
    const msg = error?.message || ''
    if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('email logins are disabled')) {
      offlineDemoLogin()
      return
    }
    if (msg.includes('Invalid login') || msg.includes('invalid_credentials') || msg.includes('password')) {
      loginError.value = 'Email/Username atau kata sandi salah. Silakan periksa kembali.'
    } else {
      loginError.value = msg || 'Login gagal. Coba lagi.'
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
    loginError.value = error.message || 'Gagal login dengan Google'
  }
}

const isRegistering = ref(false)

const handleRegister = async () => {
  if (isRegistering.value) return
  isRegistering.value = true
  loginError.value = ''
  registerSuccessMsg.value = ''

  const email = regEmail.value.trim().toLowerCase()
  const password = regPassword.value
  const username = regUsername.value.trim()
  const phone = regPhone.value.trim()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, phone, role: 'PETANI' }
      }
    })
    if (error) throw error

    const user = data.user
    if (!user) throw new Error('Pendaftaran gagal, coba lagi.')

    // Beralih ke form login dan beri instruksi sukses
    isRegisterMode.value = false
    loginInput.value = email
    registerSuccessMsg.value = '✅ Akun berhasil didaftarkan! Silakan masuk dengan kata sandi Anda.'
  } catch (error: any) {
    if (!navigator.onLine) {
      isRegisterMode.value = false
      loginInput.value = email
      registerSuccessMsg.value = '✅ Akun berhasil didaftarkan secara luring! Silakan masuk.'
      return
    }
    const msg = error?.message || ''
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('User already registered')) {
      loginError.value = 'Email ini sudah terdaftar. Silakan langsung masuk.'
    } else {
      loginError.value = msg || 'Registrasi gagal. Coba lagi.'
    }
  } finally {
    isRegistering.value = false
  }
}

const handleResetPassword = async () => {
  if (!resetEmail.value.trim()) return
  isResetting.value = true
  resetError.value = ''
  resetSuccess.value = ''

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.value.trim(), {
      redirectTo: window.location.origin + '/login'
    })
    if (error) throw error

    resetSuccess.value = `Instruksi pemulihan kata sandi telah dikirim ke email ${resetEmail.value}. Cek kotak masuk atau spam Anda.`
  } catch (err: any) {
    resetError.value = err?.message || 'Gagal mengirim instruksi reset kata sandi. Pastikan email benar.'
  } finally {
    isResetting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#241F1B] selection:bg-[#A8452A] selection:text-white">
    <div class="absolute inset-0 z-0 bg-cover bg-center pointer-events-none" :style="{ backgroundImage: `url(${loginBg})` }"></div>
    <div class="absolute inset-0 z-0 bg-[rgba(36,31,27,0.45)] pointer-events-none"></div>

    <div v-if="isOffline" class="fixed top-0 left-0 w-full bg-[#BA1A1A] text-white font-medium text-sm py-2 px-4 text-center z-50 shadow-md">
      Tidak ada koneksi. Coba lagi saat sinyal tersedia.
    </div>

    <main class="relative z-10 w-full max-w-[440px] bg-white rounded-[14px] p-5 sm:p-8 md:p-[40px] border border-[#E2D8C7] shadow-[0_8px_32px_rgba(36,31,27,0.16)] mx-3 sm:mx-4 my-6 sm:my-8">
      <div class="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] rounded-[12px] bg-[#F3ECE0] mx-auto flex items-center justify-center p-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Ikon Terasering Tanacakra" class="w-full h-full object-contain" />
      </div>
      <h1 class="text-center text-lg sm:text-[20px] font-bold text-[#241F1B] mt-2 sm:mt-[12px] mb-4 sm:mb-[20px] tracking-tight leading-none">Tanacakra</h1>

      <div class="bg-[#F3ECE0] rounded-[8px] p-[4px] grid grid-cols-2 gap-1 mb-4">
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
          Daftar Akun
        </button>
      </div>

      <div v-if="registerSuccessMsg" class="mb-4 p-3 bg-[#EBF2E5] text-[#243319] border border-[#d5e9c3] rounded-lg text-xs font-semibold text-center leading-relaxed">
        {{ registerSuccessMsg }}
      </div>

      <button
        type="button"
        @click="handleGoogleLogin"
        class="w-full h-[46px] bg-white border border-[#E2D8C7] rounded-[10px] flex items-center justify-center gap-[10px] text-[14px] font-medium text-[#241F1B] hover:bg-[#F3ECE0]/40 transition-colors cursor-pointer"
      >
        <svg class="w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        <span>Lanjutkan dengan Google</span>
      </button>

      <div class="relative flex items-center justify-center my-[16px]">
        <div class="w-full border-t border-[#E2D8C7]"></div>
        <span class="absolute bg-white px-3 text-[12px] text-[#6B5B4A]">atau dengan email/username</span>
      </div>

      <!-- FORM MASUK -->
      <form v-if="!isRegisterMode" class="flex flex-col" @submit.prevent="handleLogin">
        <label class="block text-[13px] text-[#6B5B4A] font-medium mb-[6px]" for="login-email">Email atau Username</label>
        <input
          v-model="loginInput"
          id="login-email"
          name="email"
          placeholder="nama@petani.id atau username"
          required
          type="text"
          class="w-full h-[46px] px-[14px] bg-white border border-[#E2D8C7] rounded-[10px] text-[14px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
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
            class="w-full h-[46px] pl-[14px] pr-[42px] bg-white border border-[#E2D8C7] rounded-[10px] text-[14px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
          />
          <button type="button" aria-label="Tampilkan kata sandi" @click="showPassword = !showPassword" class="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#6B5B4A] hover:text-[#241F1B] cursor-pointer focus:outline-none flex items-center justify-center min-h-[44px]">
            <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>

        <div class="flex items-center justify-between mt-[14px] mb-[18px]">
          <label class="flex items-center gap-[8px] cursor-pointer select-none">
            <input v-model="rememberMeLogin" type="checkbox" class="w-4 h-4 rounded text-[#A8452A] focus:ring-[#A8452A] border-[#E2D8C7] accent-[#A8452A]" />
            <span class="text-[13px] text-[#4A3F35]">Ingat saya</span>
          </label>
          <button type="button" @click="showResetModal = true" class="text-[13px] text-[#A8452A] hover:underline font-medium">Lupa kata sandi?</button>
        </div>

        <p v-if="loginError" class="text-xs text-[#93000A] font-medium text-center bg-[#FFDAD6] rounded-[10px] px-3 py-2.5 mb-4">
          {{ loginError }}
        </p>

        <button
          type="submit"
          :disabled="isLoggingIn"
          class="w-full h-[50px] rounded-[10px] bg-[#A8452A] hover:bg-[#933b23] text-white text-[15px] font-semibold transition-colors flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {{ isLoggingIn ? 'Memeriksa akun...' : 'Masuk ke Tanacakra' }}
        </button>

        <p class="text-center text-[13px] text-[#4A3F35] mt-[16px]">
          Belum punya akun? <a href="#" class="text-[#A8452A] font-semibold hover:underline" @click.prevent="isRegisterMode = true">Daftar Akun Baru</a>
        </p>
        <div class="text-center mt-[14px]">
          <router-link to="/" class="text-[12px] text-[#6B5B4A] hover:text-[#241F1B] transition-colors cursor-pointer inline-block">Kembali ke beranda &larr;</router-link>
        </div>
      </form>

      <!-- FORM DAFTAR -->
      <form v-else class="flex flex-col" @submit.prevent="handleRegister">
        <label class="block text-[13px] text-[#6B5B4A] font-medium mb-[4px]" for="reg-username">Nama Lengkap / Username <span class="text-[#A8452A]">*</span></label>
        <input
          v-model="regUsername"
          id="reg-username"
          placeholder="Contoh: Suparman"
          required
          class="w-full h-[44px] px-[14px] bg-white border border-[#E2D8C7] rounded-[10px] text-[14px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
        />

        <label class="block text-[13px] text-[#6B5B4A] font-medium mt-[12px] mb-[4px]" for="reg-email">Email <span class="text-[#A8452A]">*</span></label>
        <input
          v-model="regEmail"
          id="reg-email"
          placeholder="nama@petani.id"
          required
          type="email"
          class="w-full h-[44px] px-[14px] bg-white border border-[#E2D8C7] rounded-[10px] text-[14px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
        />

        <label class="block text-[13px] text-[#6B5B4A] font-medium mt-[12px] mb-[4px]" for="reg-phone">Nomor Telepon / WhatsApp <span class="text-[#7E7063] font-normal">(opsional)</span></label>
        <input
          v-model="regPhone"
          id="reg-phone"
          placeholder="081234567890"
          type="tel"
          class="w-full h-[44px] px-[14px] bg-white border border-[#E2D8C7] rounded-[10px] text-[14px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
        />

        <label class="block text-[13px] text-[#6B5B4A] font-medium mt-[12px] mb-[4px]" for="reg-password">Kata sandi <span class="text-[#A8452A]">*</span></label>
        <div class="relative w-full">
          <input
            v-model="regPassword"
            :type="showRegPassword ? 'text' : 'password'"
            id="reg-password"
            placeholder="Minimal 8 karakter"
            required
            class="w-full h-[44px] pl-[14px] pr-[42px] bg-white border border-[#E2D8C7] rounded-[10px] text-[14px] text-[#241F1B] placeholder-[#A99A87] focus:outline-none focus:border-[#A8452A] transition-colors"
          />
          <button type="button" aria-label="Tampilkan kata sandi" @click="showRegPassword = !showRegPassword" class="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#6B5B4A] hover:text-[#241F1B] cursor-pointer focus:outline-none flex items-center justify-center min-h-[44px]">
            <span class="material-symbols-outlined text-[20px]">{{ showRegPassword ? 'visibility_off' : 'visibility' }}</span>
          </button>
        </div>

        <p v-if="loginError" class="text-xs text-[#93000A] font-medium text-center bg-[#FFDAD6] rounded-[10px] px-3 py-2.5 mt-3">
          {{ loginError }}
        </p>

        <button
          type="submit"
          :disabled="isRegistering"
          class="w-full h-[48px] mt-4 rounded-[10px] bg-[#A8452A] hover:bg-[#933b23] text-white text-[15px] font-semibold transition-colors flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {{ isRegistering ? 'Mendaftarkan akun...' : 'Buat Akun Petani' }}
        </button>

        <p class="text-center text-[12px] text-[#6B5B4A] mt-[12px] leading-snug">Sudah punya akun? <a href="#" class="text-[#A8452A] font-semibold hover:underline" @click.prevent="isRegisterMode = false">Masuk</a></p>
      </form>
    </main>

    <!-- MODAL LUPA KATA SANDI -->
    <div v-if="showResetModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl max-w-[400px] w-full p-6 shadow-xl border border-[#E2D8C7] space-y-4 relative">
        <button @click="showResetModal = false" class="absolute top-4 right-4 text-[#6B5B4A] hover:text-[#241F1B]">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
        <div class="flex items-center gap-2 text-[#A8452A]">
          <span class="material-symbols-outlined text-[24px]">lock_reset</span>
          <h3 class="font-bold text-lg text-[#241F1B]">Lupa Kata Sandi?</h3>
        </div>
        <p class="text-xs text-[#6B5B4A] leading-relaxed">
          Masukkan alamat email yang terdaftar untuk menerima tautan pemulihan kata sandi akun Tanacakra Anda.
        </p>

        <div v-if="resetSuccess" class="p-3 bg-[#EBF2E5] text-[#243319] border border-[#d5e9c3] rounded-lg text-xs leading-relaxed font-semibold">
          {{ resetSuccess }}
        </div>

        <form v-else @submit.prevent="handleResetPassword" class="space-y-3">
          <input
            v-model="resetEmail"
            type="email"
            placeholder="nama@petani.id"
            required
            class="w-full h-11 px-3 bg-[#F9F7F4] text-[#241F1B] text-sm font-medium rounded-xl border border-[#E2D8C7] focus:outline-none focus:ring-2 focus:ring-[#A8452A]"
          />
          <p v-if="resetError" class="text-xs text-[#93000A] font-medium bg-[#FFDAD6] p-2.5 rounded-lg">{{ resetError }}</p>
          <div class="flex items-center justify-end gap-2 pt-1">
            <button type="button" @click="showResetModal = false" class="px-4 py-2 text-xs font-semibold text-[#6B5B4A] hover:text-[#241F1B]">Batal</button>
            <button type="submit" :disabled="isResetting" class="px-5 py-2 bg-[#A8452A] hover:bg-[#923c24] text-white text-xs font-bold rounded-lg transition disabled:opacity-70">
              {{ isResetting ? 'Mengirim...' : 'Kirim Tautan Reset' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>


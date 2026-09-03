<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const isOffline = ref(!navigator.onLine)
const currentTab = ref('petani') // 'petani' or 'admin'
const currentForm = ref('login') // 'login' or 'register'
const showPassword = ref(false)
const showRegPassword = ref(false)

const loginEmail = ref('')
const loginPassword = ref('')
const rememberMe = ref(true)

const regName = ref('')
const regEmail = ref('')
const regPhone = ref('')
const regPassword = ref('')
const regConfirmPassword = ref('')
const passwordStrength = ref(0)

const checkStrength = () => {
  let strength = 0;
  if (regPassword.value.length > 5) strength += 1;
  if (regPassword.value.length > 8 && /[A-Z]/.test(regPassword.value)) strength += 1;
  if (regPassword.value.length > 8 && /[0-9]/.test(regPassword.value) && /[^A-Za-z0-9]/.test(regPassword.value)) strength += 1;
  passwordStrength.value = strength;
}

const updateOfflineStatus = () => {
  isOffline.value = !navigator.onLine
}

onMounted(() => {
  window.addEventListener('offline', updateOfflineStatus)
  window.addEventListener('online', updateOfflineStatus)
})

onUnmounted(() => {
  window.removeEventListener('offline', updateOfflineStatus)
  window.removeEventListener('online', updateOfflineStatus)
})

const handleLogin = () => {
  if (currentTab.value === 'petani') {
    router.push('/petani')
  } else {
    router.push('/admin')
  }
}
</script>

<template>
  <div class="tilled-soil-bg min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop font-body-md text-on-surface">
    <!-- Offline Banner -->
    <div v-if="isOffline" class="fixed top-0 left-0 w-full bg-lava-danger text-on-error font-label-md text-label-md py-2 px-4 text-center z-50 shadow-md">
      <span class="material-symbols-outlined align-middle mr-2 text-[18px]">wifi_off</span>
      Tidak ada koneksi. Coba lagi saat sinyal tersedia.
    </div>

    <!-- Main Card Container -->
    <div class="w-full max-w-md bg-surface-container-lowest border-2 border-outline-variant rounded-xl shadow-lg relative overflow-hidden transition-all duration-300">
      
      <!-- Header -->
      <div class="p-gutter md:p-stack-lg border-b-2 border-outline-variant bg-surface-bright text-center">
        <h1 class="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary tracking-tight mb-2">Tanacakra</h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant">Manajemen Pertanian Terpadu</p>
      </div>

      <div class="p-gutter md:p-stack-lg">
        
        <!-- Role Selector Tabs -->
        <div class="flex rounded-lg bg-surface-container-high p-1 mb-stack-lg border border-outline-variant">
          <button 
            @click="currentTab = 'petani'"
            :class="[
              'flex-1 py-3 text-center font-label-md text-label-md rounded-md transition-all',
              currentTab === 'petani' ? 'bg-surface-container-lowest shadow-sm border border-outline-variant text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
            ]">
            Petani
          </button>
          <button 
            @click="currentTab = 'admin'"
            :class="[
              'flex-1 py-3 text-center font-label-md text-label-md rounded-md transition-all',
              currentTab === 'admin' ? 'bg-surface-container-lowest shadow-sm border border-outline-variant text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
            ]">
            Admin / Kelompok Tani
          </button>
        </div>

        <!-- Login Form -->
        <form v-if="currentForm === 'login'" @submit.prevent="handleLogin" class="space-y-stack-md transition-opacity duration-300">
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-2" for="login-email">Email</label>
            <input v-model="loginEmail" type="email" id="login-email" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg px-4 font-body-md text-on-surface placeholder-on-surface-variant" placeholder="Masukkan alamat email" required>
          </div>
          
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-2" for="login-password">Kata Sandi</label>
            <div class="relative">
              <input v-model="loginPassword" :type="showPassword ? 'text' : 'password'" id="login-password" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg pl-4 pr-12 font-body-md text-on-surface placeholder-on-surface-variant" placeholder="Masukkan kata sandi" required>
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 px-4 flex items-center text-on-surface-variant hover:text-primary focus:outline-none">
                <span class="material-symbols-outlined">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <div class="mt-2 text-right">
              <a href="#" class="font-label-md text-label-md text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">Lupa kata sandi?</a>
            </div>
          </div>
          
          <div class="flex items-center mt-4">
            <input v-model="rememberMe" type="checkbox" id="remember-me" class="w-5 h-5 text-primary-container bg-ash-cream border-outline rounded focus:ring-primary focus:ring-2">
            <label for="remember-me" class="ml-3 font-body-md text-body-md text-on-surface-variant">Ingat perangkat ini selama 30 hari</label>
          </div>
          
          <button type="submit" class="w-full h-12 mt-stack-md bg-primary-container hover:bg-primary text-on-primary font-data-tabular text-data-tabular rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            Masuk
            <span class="material-symbols-outlined">login</span>
          </button>
          
          <div class="text-center mt-stack-md pt-stack-sm border-t border-outline-variant">
            <p class="font-body-md text-body-md text-on-surface-variant">
              Belum punya akun? 
              <button type="button" @click="currentForm = 'register'" class="text-primary font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded ml-1">Daftar akun baru</button>
            </p>
          </div>
        </form>

        <!-- Register Form -->
        <form v-if="currentForm === 'register'" @submit.prevent="currentForm = 'login'" class="space-y-stack-md transition-opacity duration-300">
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-2" for="reg-name">Nama Lengkap</label>
            <input v-model="regName" type="text" id="reg-name" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg px-4 font-body-md text-on-surface" placeholder="Nama sesuai KTP" required>
          </div>
          
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-2" for="reg-email">Email</label>
            <input v-model="regEmail" type="email" id="reg-email" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg px-4 font-body-md text-on-surface" placeholder="Email aktif" required>
            <p class="mt-1 font-label-md text-[12px] text-on-surface-variant">Gunakan format email yang valid</p>
          </div>
          
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-2" for="reg-phone">No. HP / WhatsApp</label>
            <input v-model="regPhone" type="tel" id="reg-phone" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg px-4 font-body-md text-on-surface" placeholder="08xxxxxxxxxx" required>
          </div>
          
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-2" for="reg-password">Kata Sandi Baru</label>
            <div class="relative">
              <input v-model="regPassword" @keyup="checkStrength" :type="showRegPassword ? 'text' : 'password'" id="reg-password" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg pl-4 pr-12 font-body-md text-on-surface" placeholder="Minimal 8 karakter" required>
              <button type="button" @click="showRegPassword = !showRegPassword" class="absolute inset-y-0 right-0 px-4 flex items-center text-on-surface-variant hover:text-primary focus:outline-none">
                <span class="material-symbols-outlined">{{ showRegPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <!-- Password Strength -->
            <div class="flex gap-1 mt-2 h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div :class="['h-full w-1/3 transition-colors duration-300', passwordStrength >= 1 ? (passwordStrength >= 3 ? 'bg-terrace-green' : (passwordStrength >= 2 ? 'bg-secondary-fixed-dim' : 'bg-lava-danger')) : 'bg-transparent']"></div>
              <div :class="['h-full w-1/3 transition-colors duration-300', passwordStrength >= 2 ? (passwordStrength >= 3 ? 'bg-terrace-green' : 'bg-secondary-fixed-dim') : 'bg-transparent']"></div>
              <div :class="['h-full w-1/3 transition-colors duration-300', passwordStrength >= 3 ? 'bg-terrace-green' : 'bg-transparent']"></div>
            </div>
          </div>
          
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-2" for="reg-confirm-password">Konfirmasi Kata Sandi</label>
            <div class="relative">
              <input v-model="regConfirmPassword" type="password" id="reg-confirm-password" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg pl-4 pr-12 font-body-md text-on-surface" placeholder="Ulangi kata sandi" required>
            </div>
          </div>
          
          <button type="submit" class="w-full h-12 mt-stack-lg bg-primary-container hover:bg-primary text-on-primary font-data-tabular text-data-tabular rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            Daftar Akun
            <span class="material-symbols-outlined">person_add</span>
          </button>
          
          <div class="text-center mt-stack-md pt-stack-sm border-t border-outline-variant">
            <p class="font-body-md text-body-md text-on-surface-variant">
              Sudah punya akun? 
              <button type="button" @click="currentForm = 'login'" class="text-primary font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded ml-1">Masuk di sini</button>
            </p>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>

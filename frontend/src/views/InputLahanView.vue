<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()

const formData = ref({
  namaLahan: '',
  luasLahan: '',
  phTanah: '',
  kelembapan: '',
  jenisTanaman: 'Padi'
})

const isSubmitting = ref(false)

const submitData = () => {
  isSubmitting.value = true
  // Simulate API call
  setTimeout(() => {
    isSubmitting.value = false
    router.push('/petani')
  }, 1500)
}
</script>

<template>
  <div class="flex flex-col min-h-screen pb-24 lg:pb-0 bg-surface">
    <!-- Top Header -->
    <header class="w-full px-margin-mobile lg:px-margin-desktop py-4 bg-surface z-40 sticky top-0 border-b border-outline-variant flex items-center gap-4">
      <button @click="router.back()" class="w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface transition-colors">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 class="font-headline-md text-[20px] lg:text-[24px] text-on-surface font-bold">Catat Data Lahan</h1>
    </header>

    <main class="flex-grow p-margin-mobile lg:p-margin-desktop max-w-3xl mx-auto w-full flex flex-col gap-stack-lg">
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <p class="font-body-md text-on-surface-variant mb-6">
          Masukkan parameter kondisi lahan Anda untuk mendapatkan rekomendasi pengelolaan menggunakan model Data Science kami.
        </p>

        <form @submit.prevent="submitData" class="space-y-6">
          
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-2" for="nama-lahan">Nama / Lokasi Lahan</label>
            <input v-model="formData.namaLahan" type="text" id="nama-lahan" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg px-4 font-body-md text-on-surface" placeholder="Contoh: Petak Timur Cangkringan" required>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block font-label-md text-label-md text-on-surface mb-2" for="luas-lahan">Luas Lahan (Hektar)</label>
              <input v-model="formData.luasLahan" type="number" step="0.01" id="luas-lahan" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg px-4 font-body-md text-on-surface" placeholder="0.00" required>
            </div>
            <div>
              <label class="block font-label-md text-label-md text-on-surface mb-2" for="jenis-tanaman">Jenis Tanaman</label>
              <select v-model="formData.jenisTanaman" id="jenis-tanaman" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg px-4 font-body-md text-on-surface" required>
                <option value="Padi">Padi</option>
                <option value="Jagung">Jagung</option>
                <option value="Kedelai">Kedelai</option>
                <option value="Cabai">Cabai</option>
              </select>
            </div>
          </div>

          <hr class="border-outline-variant my-4">
          <h3 class="font-label-md font-bold text-primary mb-4">Parameter Tanah (Input Model Scikit-learn)</h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block font-label-md text-label-md text-on-surface mb-2" for="ph-tanah">pH Tanah</label>
              <div class="relative">
                <input v-model="formData.phTanah" type="number" step="0.1" id="ph-tanah" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg px-4 font-body-md text-on-surface" placeholder="0.0 - 14.0" required>
                <span class="absolute right-4 top-3 font-body-md text-on-surface-variant">pH</span>
              </div>
            </div>
            <div>
              <label class="block font-label-md text-label-md text-on-surface mb-2" for="kelembapan">Kelembapan Tanah</label>
              <div class="relative">
                <input v-model="formData.kelembapan" type="number" step="0.1" id="kelembapan" class="w-full h-12 bg-ash-cream border border-outline focus:border-2 focus:border-primary-container focus:ring-0 rounded-lg px-4 font-body-md text-on-surface" placeholder="Persentase" required>
                <span class="absolute right-4 top-3 font-body-md text-on-surface-variant">%</span>
              </div>
            </div>
          </div>

          <div class="pt-6">
            <button type="submit" :disabled="isSubmitting" class="w-full h-14 bg-primary-container hover:bg-primary text-on-primary font-data-tabular text-data-tabular rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              <template v-if="!isSubmitting">
                Proses Data & Lihat Rekomendasi
                <span class="material-symbols-outlined">analytics</span>
              </template>
              <template v-else>
                <span class="material-symbols-outlined animate-spin">sync</span>
                Memproses di Pipeline...
              </template>
            </button>
          </div>

        </form>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

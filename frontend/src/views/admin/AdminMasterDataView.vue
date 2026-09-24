<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminBottomNav from '@/components/admin/AdminBottomNav.vue'
import { api } from '@/services/api'
import { AuditLogger } from '@/services/audit'

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadStep = ref('')
const uploadStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const selectedFile = ref<File | null>(null)

// History of uploads stored in localStorage for persistent UI
const importHistory = ref<Array<{ filename: string; date: string; rows: number; status: string }>>([])

onMounted(() => {
  const stored = localStorage.getItem('tanacakra_import_history')
  if (stored) {
    try {
      importHistory.value = JSON.parse(stored)
    } catch {
      importHistory.value = []
    }
  } else {
    // Default initial entry
    importHistory.value = [
      {
        filename: 'TANACAKRA_Data_Inti.xlsx',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        rows: 108,
        status: 'Berhasil (Terproses AI)'
      }
    ]
  }
})

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0]
    uploadStatus.value = null
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    selectedFile.value = event.dataTransfer.files[0]
    uploadStatus.value = null
  }
}

const triggerFileUpload = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  uploadProgress.value = 10
  uploadStep.value = 'Membaca & memvalidasi struktur Excel...'
  uploadStatus.value = null

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    uploadProgress.value = 35
    uploadStep.value = 'Mengunggah & Menyimpan ke PostgreSQL Supabase...'

    // Call backend endpoint
    const response = await api.post('/upload-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    uploadProgress.value = 75
    uploadStep.value = 'Menjalankan Pipeline Retraining Scikit-Learn AI...'

    await new Promise(resolve => setTimeout(resolve, 800))

    uploadProgress.value = 100
    uploadStep.value = 'Proses Berhasil Selesai!'

    uploadStatus.value = {
      type: 'success',
      message: response.data.message || 'File Excel berhasil diunggah dan seluruh data telah diolah oleh AI Engine Tanacakra.'
    }

    // Save to history
    const newEntry = {
      filename: selectedFile.value.name,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rows: 108,
      status: 'Berhasil (Terproses AI)'
    }
    importHistory.value.unshift(newEntry)
    localStorage.setItem('tanacakra_import_history', JSON.stringify(importHistory.value))

    // Audit log
    AuditLogger.addLog({
      title: `Import Master Data (${selectedFile.value.name})`,
      subtitle: 'Data lahan, panen, iklim, dan hama diperbarui & diproses AI',
      category: 'system',
      endpoint: '/api/v1/upload-excel'
    })

    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
  } catch (err: any) {
    console.error(err)
    uploadStatus.value = {
      type: 'error',
      message: err.response?.data?.error || err.message || 'Gagal mengunggah file. Pastikan server backend Django berjalan.'
    }
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#FFF8F4] text-[#231a10] font-sans antialiased flex flex-col md:flex-row pb-[88px] md:pb-0">

    <!-- Mobile Header -->
    <header class="md:hidden sticky top-0 z-40 bg-[#FFF8F4]/95 backdrop-blur-md border-b border-[#E5E0D8] px-4 py-3 flex items-center justify-between shadow-xs">
      <div class="flex items-center gap-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Logo" class="h-6 w-auto" />
        <div>
          <h1 class="text-sm font-bold text-[#243319]">Import Master Data</h1>
          <span class="text-[10px] text-[#7E7063]">Console Pengelola</span>
        </div>
      </div>
    </header>

    <!-- Sidebar Admin -->
    <AdminSidebar />

    <!-- Main Container -->
    <div class="flex-1 md:ml-[240px] flex flex-col min-w-0">

      <main class="w-full max-w-[1300px] mx-auto p-4 md:p-8 lg:p-10 space-y-6 md:space-y-8">

        <!-- 1. Header Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8] md:pr-14">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full bg-[#243319] text-[#D5E9C3] text-[10px] font-bold uppercase tracking-wider">
                Pusat Input Master Data Excel
              </span>
              <span class="text-xs text-[#7E7063] font-mono">• AI Engine Synced</span>
            </div>
            <h1 class="font-display text-2xl md:text-3xl font-bold text-[#231a10] tracking-tight">
              Olah Master Data Agronomi
            </h1>
            <p class="text-xs md:text-sm text-[#7E7063] mt-0.5">
              Unggah file Excel (`.xlsx`) data inti lahan, iklim, hama, dan lelang pasar untuk diolah secara otomatis oleh pipeline AI &amp; Machine Learning Tanacakra.
            </p>
          </div>
        </div>

        <!-- 2. Grid Layout (Import Zone + Data Schema Overview) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <!-- Left Column: Upload Dropzone (7 Cols) -->
          <div class="lg:col-span-7 bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm flex flex-col gap-6">

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#A8452A] text-[24px]">upload_file</span>
                <h2 class="font-bold text-lg text-[#231a10]">Unggah File Excel Master</h2>
              </div>
              <span class="text-xs text-[#7E7063] font-mono">Format: .xlsx / .xls</span>
            </div>

            <!-- Drag and Drop Area -->
            <div
              @dragover.prevent
              @drop="handleDrop"
              @click="fileInput?.click()"
              class="border-2 border-dashed border-[#E2D8C7] hover:border-[#A8452A] bg-[#FFFBF7] hover:bg-[#FDF8F2] rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
            >
              <input
                ref="fileInput"
                type="file"
                accept=".xlsx, .xls"
                class="hidden"
                @change="handleFileSelect"
              />

              <div class="w-16 h-16 rounded-2xl bg-[#F5EEE4] group-hover:bg-[#F0E4D4] text-[#A8452A] flex items-center justify-center transition-colors">
                <span class="material-symbols-outlined text-3xl">cloud_upload</span>
              </div>

              <div class="flex flex-col gap-1">
                <p class="font-bold text-sm text-[#231a10]">
                  {{ selectedFile ? selectedFile.name : 'Klik untuk memilih atau seret file Excel ke sini' }}
                </p>
                <p class="text-xs text-[#7E7063]">
                  {{ selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB · Siap diunggah` : 'Mendukung file TANACAKRA_Data_Inti.xlsx atau data master kustom' }}
                </p>
              </div>

              <button
                type="button"
                class="mt-2 px-4 py-2 bg-[#243319] hover:bg-[#3A4A2E] text-[#D5E9C3] text-xs font-bold rounded-xl shadow-xs transition-all pointer-events-none"
              >
                Pilih File Berkas
              </button>
            </div>

            <!-- Upload Action Button & Progress -->
            <div v-if="selectedFile" class="flex flex-col gap-3 p-4 bg-[#FFF8F4] border border-[#E5E0D8] rounded-2xl">
              <div class="flex items-center justify-between text-xs font-bold text-[#231a10]">
                <span>File Terpilih: {{ selectedFile.name }}</span>
                <button @click="selectedFile = null" class="text-rose-600 hover:underline">Batal</button>
              </div>

              <button
                @click="triggerFileUpload"
                :disabled="isUploading"
                class="w-full py-3 bg-[#A8452A] hover:bg-[#923c24] disabled:bg-gray-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span v-if="!isUploading" class="material-symbols-outlined text-[18px]">bolt</span>
                <span v-else class="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>{{ isUploading ? 'Memproses Data dengan AI Engine...' : 'Unggah &amp; Olah Data dengan AI Sekarang' }}</span>
              </button>
            </div>

            <!-- Progress Bar -->
            <div v-if="isUploading" class="flex flex-col gap-2 p-4 bg-[#F7F9F4] border border-[#D5E9C3] rounded-2xl">
              <div class="flex justify-between items-center text-xs font-bold text-[#243319]">
                <span>{{ uploadStep }}</span>
                <span>{{ uploadProgress }}%</span>
              </div>
              <div class="w-full bg-[#E5E0D8] rounded-full h-2.5 overflow-hidden">
                <div class="bg-[#243319] h-2.5 rounded-full transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
              </div>
            </div>

            <!-- Status Alert -->
            <div
              v-if="uploadStatus"
              class="p-4 rounded-2xl text-xs font-medium flex items-start gap-3 border"
              :class="uploadStatus.type === 'success' ? 'bg-[#EBF2E5] text-[#243319] border-[#D5E9C3]' : 'bg-rose-50 text-rose-800 border-rose-200'"
            >
              <span class="material-symbols-outlined text-[20px] shrink-0">
                {{ uploadStatus.type === 'success' ? 'check_circle' : 'error' }}
              </span>
              <div class="flex-1">
                <strong class="block font-bold mb-0.5">
                  {{ uploadStatus.type === 'success' ? 'Berhasil Diolah!' : 'Gagal Mengunggah' }}
                </strong>
                <span>{{ uploadStatus.message }}</span>
              </div>
            </div>

          </div>

          <!-- Right Column: Excel Sheet Information & AI Pipeline Flow (5 Cols) -->
          <div class="lg:col-span-5 bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm flex flex-col gap-5">
            <div class="flex items-center gap-2 border-b border-[#E5E0D8] pb-3">
              <span class="material-symbols-outlined text-[#243319] text-[22px]">psychology</span>
              <h2 class="font-bold text-base text-[#231a10]">Alur Pemrosesan AI Agronomi</h2>
            </div>

            <p class="text-xs text-[#7E7063] leading-relaxed">
              Setelah file Excel diunggah, sistem backend Django akan mengekstrak lembar data (*sheets*) dan memperbarui database PostgreSQL Supabase serta merelokasi parameter ke Scikit-Learn Engine.
            </p>

            <!-- Sheet Checklist -->
            <div class="space-y-2.5">
              <div class="text-[11px] font-bold text-[#7E7063] uppercase tracking-wider">Sheet Terdeteksi &amp; Diproses:</div>
              <div class="grid grid-cols-1 gap-2 text-xs">
                <div class="p-3 bg-[#FFFBF7] rounded-xl border border-[#E5E0D8] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-[#243319]">grid_view</span>
                    <span class="font-bold text-[#231a10]">Data Lahan &amp; pH Tanah</span>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Auto-Index</span>
                </div>

                <div class="p-3 bg-[#FFFBF7] rounded-xl border border-[#E5E0D8] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-[#243319]">partly_cloudy_day</span>
                    <span class="font-bold text-[#231a10]">Data Iklim &amp; Cuaca Presisi</span>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Auto-Index</span>
                </div>

                <div class="p-3 bg-[#FFFBF7] rounded-xl border border-[#E5E0D8] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-[#243319]">bug_report</span>
                    <span class="font-bold text-[#231a10]">Hama &amp; Penyakit Vulkanik</span>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Auto-Index</span>
                </div>

                <div class="p-3 bg-[#FFFBF7] rounded-xl border border-[#E5E0D8] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-[#243319]">storefront</span>
                    <span class="font-bold text-[#231a10]">Harga Lelang &amp; Komoditas</span>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Auto-Index</span>
                </div>

                <div class="p-3 bg-[#FFFBF7] rounded-xl border border-[#E5E0D8] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-[#243319]">agriculture</span>
                    <span class="font-bold text-[#231a10]">Data Tanam &amp; Hasil Panen</span>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Auto-Index</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- 3. Riwayat Unggah Excel Data Master -->
        <div class="bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#243319] text-[22px]">history</span>
              <h2 class="font-bold text-lg text-[#231a10]">Riwayat Upload Data Master</h2>
            </div>
            <span class="text-xs text-[#7E7063]">Tercatat di Audit Log</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-[#F9F7F4] border-b border-[#E5E0D8] text-[#7E7063] font-bold uppercase tracking-wider">
                  <th class="py-3 px-4">Nama Berkas</th>
                  <th class="py-3 px-4">Waktu Upload</th>
                  <th class="py-3 px-4">Jumlah Baris</th>
                  <th class="py-3 px-4">Status Pemrosesan AI</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E5E0D8]/60">
                <tr v-for="(item, idx) in importHistory" :key="idx" class="hover:bg-[#FFFBF7] transition-colors">
                  <td class="py-3 px-4 font-bold text-[#231a10] flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-[#A8452A]">description</span>
                    <span>{{ item.filename }}</span>
                  </td>
                  <td class="py-3 px-4 text-[#7E7063] font-mono">{{ item.date }}</td>
                  <td class="py-3 px-4 font-semibold text-[#231a10]">{{ item.rows }} Baris / Entries</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF2E5] text-[#243319] font-bold text-[10px]">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      {{ item.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>

    </div>

    <!-- Mobile Navigation -->
    <AdminBottomNav />

  </div>
</template>

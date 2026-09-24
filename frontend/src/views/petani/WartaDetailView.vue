<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KabarTaniService, type KabarTaniItem, type KabarTaniFeatured } from '@/services/kabarTani'

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const article = ref<KabarTaniItem | KabarTaniFeatured | null>(null)

const loadArticle = async () => {
  const id = route.params.id as string
  if (!id) {
    router.push('/kabar-tani')
    return
  }
  
  try {
    article.value = await KabarTaniService.getById(id)
    if (!article.value) {
      router.push('/kabar-tani')
    }
  } finally {
    isLoading.value = false
  }
}

const formatTime = (iso: string) => {
  if (!iso) return 'Terbaru'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Terbaru'
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
}

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'pasar': return 'Harga Pasar'
    case 'lahan': return 'Kondisi Lahan'
    case 'cuaca': return 'Cuaca Presisi'
    case 'hama': return 'Hama & Penyakit'
    case 'prediksi': return 'Prediksi AI'
    default: return 'Informasi'
  }
}

onMounted(() => {
  loadArticle()
})
</script>

<template>
  <div class="min-h-screen bg-[#FFF8F4] text-[#231a10] font-sans antialiased flex flex-col items-center">
    
    <!-- Header/Nav -->
    <header class="w-full max-w-[900px] px-4 py-4 md:py-6 flex items-center justify-between">
      <button @click="router.back()" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#7E7063] hover:text-[#A8452A] transition-colors">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>Kembali</span>
      </button>
      <div class="flex items-center gap-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Tanacakra" class="h-6 w-auto opacity-70" />
      </div>
    </header>

    <!-- Main Content -->
    <main class="w-full max-w-[900px] px-4 pb-24 flex-1">
      
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
        <span class="material-symbols-outlined text-4xl animate-spin text-[#243319]">sync</span>
        <span class="text-sm text-[#7E7063]">Memuat artikel warta...</span>
      </div>

      <article v-else-if="article" class="bg-white rounded-3xl p-6 md:p-10 border border-[#E5E0D8] shadow-sm flex flex-col gap-6 md:gap-8">
        
        <header class="flex flex-col gap-4 border-b border-[#E5E0D8]/60 pb-6">
          <!-- Metadata -->
          <div class="flex flex-wrap items-center gap-3">
            <span class="px-3 py-1 rounded-full bg-[#EBF2E5] text-[#243319] text-[11px] font-bold uppercase tracking-wider border border-[#4A5B3A]/20">
              Kategori: {{ getCategoryLabel(article.category) }}
            </span>
            <span class="text-xs text-[#7E7063] font-medium flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">schedule</span>
              {{ formatTime(article.timestamp) }}
            </span>
          </div>

          <!-- Title -->
          <h1 class="font-display text-2xl md:text-4xl font-bold text-[#231a10] leading-tight md:leading-snug">
            {{ article.title }}
          </h1>

          <!-- Source -->
          <div class="flex items-center gap-2 text-xs text-[#7E7063] bg-[#F9F7F4] w-fit px-3 py-1.5 rounded-lg border border-[#E5E0D8]">
            <span class="material-symbols-outlined text-[16px]">account_circle</span>
            <span>Ditulis oleh: <strong>{{ (article as any).source || 'Tanacakra Core & AI' }}</strong></span>
          </div>
        </header>

        <!-- Metrics if available -->
        <div v-if="article.metrics && Object.keys(article.metrics).length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FFFBF7] p-4 rounded-2xl border border-[#E5E0D8]/60">
          <div v-for="(val, key) in article.metrics" :key="key" class="flex flex-col">
            <span class="text-[11px] font-bold text-[#7E7063] uppercase tracking-wider">{{ key }}</span>
            <span class="text-sm font-bold text-[#231a10] mt-0.5">{{ val }}</span>
          </div>
        </div>

        <!-- Content -->
        <div class="prose prose-stone max-w-none prose-p:leading-relaxed prose-p:text-[#4A4036] prose-p:text-sm md:prose-p:text-base">
          <p class="whitespace-pre-wrap">{{ article.summary }}</p>
        </div>

        <!-- Call to action block based on category -->
        <div class="mt-4 pt-6 border-t border-[#E5E0D8]/60 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#F7F9F4] p-5 rounded-2xl border border-[#D5E9C3]/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#243319] text-white flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-[#231a10]">Tindak Lanjut & Rekomendasi</h4>
              <p class="text-xs text-[#645d58]">Akses modul terkait untuk melakukan aksi nyata.</p>
            </div>
          </div>
          <router-link :to="article.category === 'pasar' || article.category === 'prediksi' ? '/prediksi-pasar' : (article.category === 'lahan' ? '/input-lahan' : '/kabar-tani')" class="w-full md:w-auto px-5 py-2.5 bg-[#A8452A] hover:bg-[#923c24] text-white text-xs font-bold rounded-xl text-center shadow-sm transition-colors">
            Pergi ke Modul {{ getCategoryLabel(article.category) }}
          </router-link>
        </div>

      </article>

    </main>

  </div>
</template>

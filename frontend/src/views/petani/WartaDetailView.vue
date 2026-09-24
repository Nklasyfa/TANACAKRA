<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KabarTaniService, type KabarTaniItem, type KabarTaniFeatured } from '@/services/kabarTani'

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const article = ref<KabarTaniItem | KabarTaniFeatured | null>(null)

// Filter & search untuk Modul Hama
const pestSearchQuery = ref('')
const selectedCommodityFilter = ref('All')

// Master Dataset Hama sesuai Excel & Rekomendasi Agronomi Cangkringan
const hamaDataset = [
  { komoditas: 'Cabai Merah', hama: 'Wereng', severity: 'Medium', gejala: 'Daun melengkung ke atas, embun jelaga hitam di permukaan bawah.', solusi: 'Semprot larutan sabun kalium (1.5%) atau jamur entomopatogen Metarhizium anisopliae (5g/L air) pada sore hari.' },
  { komoditas: 'Jagung', hama: 'Jamur Daun', severity: 'High', gejala: 'Bercak bercak memanjang abu-abu keperakan pada pelepah & daun.', solusi: 'Pangkas daun bawah yang terinfeksi, aplikasi fungisida tembaga hidroksida / Trichoderma harzianum, tingkatkan sirkulasi udara.' },
  { komoditas: 'Salak Pondoh', hama: 'Wereng', severity: 'Low', gejala: 'Bercak kuning tipis pada sela pelepah salak tua.', solusi: 'Sanitasi rumpun salak, bersihkan pelepah kering, semprot Beauveria bassiana konsentrasi sedang.' },
  { komoditas: 'Tomat', hama: 'Wereng', severity: 'Medium', gejala: 'Vektor kuning keriting, pertumbuhan pucuk terhambat.', solusi: 'Gunakan mulsa perak-perak memantulkan cahaya, pasang perangkap lekat kuning (Yellow Sticky Trap) 35 unit/ha.' },
  { komoditas: 'Bawang Merah', hama: 'Tidak Ada', severity: 'High', gejala: 'Tanaman sehat, pertumbuhan tajuk optimal.', solusi: 'Pertahankan sistem drainase gembur dan aplikasi pupuk hayati rutin.' },
  { komoditas: 'Padi', hama: 'Tidak Ada', severity: 'Medium', gejala: 'Bulir padi menguning merata, rumpun hijau subur.', solusi: 'Lakukan pengairan berselang (intermittent) 3 hari basah 2 hari kering.' },
  { komoditas: 'Cabai Merah', hama: 'Jamur Daun', severity: 'Low', gejala: 'Bercak melingkar cokelat kecil pada daun bagian bawah.', solusi: 'Semprotkan ektrak daun sirih / kunyit 10% atau fungisida tembaga oksida dosis rendah.' },
  { komoditas: 'Jagung', hama: 'Wereng', severity: 'High', gejala: 'Tongkol kerdil, daun menguning cepat sebelum masa panen.', solusi: 'Tanam serentak, taburkan Beauveria bassiana pada pucuk batang, sanitasi sisa tanaman tua.' },
  { komoditas: 'Salak Pondoh', hama: 'Wereng', severity: 'High', gejala: 'Pelepah buah mengering kecokelatan, buah muda gugur.', solusi: 'Kocor perakaran dengan larutan Trichoderma + Beauveria, pangkas rumpun terlalu rapat.' },
  { komoditas: 'Tomat', hama: 'Thrips', severity: 'Medium', gejala: 'Bercak keperakan mengilap pada permukaan bawah daun tomat.', solusi: 'Semprot minyak nimba (Neem Oil) 5ml/L + detergen netral cair 1 ml/L pada pagi hari.' },
  { komoditas: 'Bawang Merah', hama: 'Wereng', severity: 'Medium', gejala: 'Ujung daun menguning melilit kencang.', solusi: 'Penyiraman sprikler otomatis untuk menjatuhkan hama, semprot biopestisida fermentasi babadotan.' },
  { komoditas: 'Padi', hama: 'Jamur Daun', severity: 'Medium', gejala: 'Bercak belah ketupat (Blast) pada helai daun muda.', solusi: 'Kurangi pupuk Urea (Nitrogen) berlebih, tambahkan pupuk Kalium (KCL) & Silica cair.' },
  { komoditas: 'Cabai Merah', hama: 'Ulat Grayak', severity: 'Medium', gejala: 'Daun berlubang besar transparan, bercak gigitan pada buah muda.', solusi: 'Aplikasi Bacillus thuringiensis (Bt) sore hari saat ulat aktif keluar dari tanah.' },
  { komoditas: 'Jagung', hama: 'Wereng', severity: 'Medium', gejala: 'Kuning pucat bergaris pada daun muda jagung.', solusi: 'Rotasi tanaman dengan kedelai/kacang tanah untuk memutus siklus hidup serangga.' },
  { komoditas: 'Salak Pondoh', hama: 'Tidak Ada', severity: 'Medium', gejala: 'Rumpun segar, produksi tandan normal.', solusi: 'Pertahankan penjarangan pelepah rutin dan pemupukan kandang matang.' },
  { komoditas: 'Tomat', hama: 'Wereng', severity: 'Low', gejala: 'Bercak bintik hijau pucat jarang pada daun tua.', solusi: 'Monitoring rutin perangkap kuning, semprot ekstrak tembakau cair.' },
  { komoditas: 'Bawang Merah', hama: 'Thrips', severity: 'Medium', gejala: 'Gurem bercak putih seperti perak pada daun bawang.', solusi: 'Pasang perangkap perekat biru (Blue Sticky Trap) 40 unit/ha.' },
  { komoditas: 'Padi', hama: 'Wereng', severity: 'Low', gejala: 'Rumpun bawah berpopulasi serangga kecil melompat.', solusi: 'Lepaskan musuh alami laba-laba pemburu (Pardosa pseudoannulata), semprot bio-insektisida.' },
  { komoditas: 'Cabai Merah', hama: 'Thrips', severity: 'Medium', gejala: 'Daun mengeriting ke atas keras seperti mangkok.', solusi: 'Semprot Abamektin bahan organik / ekstrak biji mimba rutin 5 hari sekali.' },
  { komoditas: 'Jagung', hama: 'Ulat Grayak', severity: 'Low', gejala: 'Kotoran ulat menumpuk di pupus daun muda.', solusi: 'Taburkan abu dapur dicampur serbuk mimba pada bagian pucuk tanaman.' },
  { komoditas: 'Salak Pondoh', hama: 'Thrips', severity: 'Medium', gejala: 'Kulit buah salak bersisik hitam kusam, pertumbuhan lambat.', solusi: 'Bungkus tandan buah muda dengan kantong berlubang udara, semprot bio-insektisida.' },
  { komoditas: 'Tomat', hama: 'Wereng', severity: 'High', gejala: 'Seluruh pucuk menguning menggulung kaku, buah kerdil.', solusi: 'Eradikasi tanaman terserang parah, semprot Beauveria bassiana + minyak serai wangi.' },
  { komoditas: 'Bawang Merah', hama: 'Wereng', severity: 'Low', gejala: 'Hama melompat di sela umbi bawang.', solusi: 'Tabur kapur dolomit di sela bedengan untuk mengeringkan sarang ulat/wereng.' },
  { komoditas: 'Padi', hama: 'Tidak Ada', severity: 'Medium', gejala: 'Bulir terisi penuh, bebas serangga pembawa penyakit.', solusi: 'Jaga ketinggian air 3-5 cm saat pengisian bulir padi.' },
  { komoditas: 'Cabai Merah', hama: 'Tidak Ada', severity: 'Low', gejala: 'Tajuk cabai lebat, pembungaan lebat.', solusi: 'Jaga kelembapan tanah 60% dan pemupukan NPK seimbang.' },
  { komoditas: 'Jagung', hama: 'Thrips', severity: 'High', gejala: 'Daun menggulung kering dari tepi ke tengah.', solusi: 'Penggenangan parit irigasi selama 2 jam untuk menenggelamkan pupa thrips di tanah.' },
  { komoditas: 'Salak Pondoh', hama: 'Ulat Grayak', severity: 'High', gejala: 'Pelepah muda terkoyak habis digigit ulat.', solusi: 'Pemasangan perangkap feromon (Pheromone Trap) ngengat ulat grayak 15 unit/ha.' },
  { komoditas: 'Tomat', hama: 'Ulat Grayak', severity: 'High', gejala: 'Buah tomat melubang dan membusuk dari dalam.', solusi: 'Petik buah busuk & bakar, aplikasi Bacillus thuringiensis konsentrasi 3 ml/L air.' },
  { komoditas: 'Bawang Merah', hama: 'Ulat Grayak', severity: 'Low', gejala: 'Ujung rongga daun bawang terpotong rapi.', solusi: 'Potong ujung daun berongga yang terinfeksi ulat kecil lalu bakar.' }
]

const filteredHamaList = computed(() => {
  return hamaDataset.filter(item => {
    const matchesCommodity = selectedCommodityFilter.value === 'All' || item.komoditas === selectedCommodityFilter.value
    const query = pestSearchQuery.value.toLowerCase().trim()
    const matchesQuery = !query || item.komoditas.toLowerCase().includes(query) || item.hama.toLowerCase().includes(query) || item.solusi.toLowerCase().includes(query)
    return matchesCommodity && matchesQuery
  })
})

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

const severityBadgeClass = (sev: string) => {
  switch (sev) {
    case 'High': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'Medium': return 'bg-amber-100 text-amber-800 border-amber-200'
    default: return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
}

onMounted(() => {
  loadArticle()
})
</script>

<template>
  <div class="min-h-screen bg-[#FFF8F4] text-[#231a10] font-sans antialiased flex flex-col items-center">
    
    <!-- Header/Nav -->
    <header class="w-full max-w-[960px] px-4 py-4 md:py-6 flex items-center justify-between">
      <button @click="router.back()" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#7E7063] hover:text-[#A8452A] transition-colors">
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>Kembali ke Warta</span>
      </button>
      <div class="flex items-center gap-2">
        <img src="@/assets/tanacakra-icon.svg" alt="Tanacakra" class="h-6 w-auto opacity-70" />
        <span class="text-xs font-bold text-[#243319]">Pusat Integrasi AI Agronomi</span>
      </div>
    </header>

    <!-- Main Content -->
    <main class="w-full max-w-[960px] px-4 pb-24 flex-1">
      
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
        <span class="material-symbols-outlined text-4xl animate-spin text-[#243319]">sync</span>
        <span class="text-sm text-[#7E7063]">Memuat data artikel warta...</span>
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
            <span>Ditulis oleh: <strong>{{ (article as any).source || 'Tanacakra Agronomy AI Engine' }}</strong></span>
          </div>
        </header>

        <!-- Metrics if available -->
        <div v-if="article.metrics && Object.keys(article.metrics).length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FFFBF7] p-4 rounded-2xl border border-[#E5E0D8]/60">
          <div v-for="(val, key) in article.metrics" :key="key" class="flex flex-col">
            <span class="text-[11px] font-bold text-[#7E7063] uppercase tracking-wider">{{ key }}</span>
            <span class="text-sm font-bold text-[#231a10] mt-0.5">{{ val }}</span>
          </div>
        </div>

        <!-- Main Narrative Content -->
        <div class="prose prose-stone max-w-none prose-p:leading-relaxed prose-p:text-[#4A4036] prose-p:text-sm md:prose-p:text-base space-y-4">
          <p class="whitespace-pre-wrap text-justify">{{ article.summary }}</p>
        </div>

        <!-- SECTION KHUSUS: MODUL DATA MITIGASI HAMA & PENYAKIT LENGKAP -->
        <section class="mt-6 pt-6 border-t border-[#E5E0D8] space-y-6">
          <div class="bg-[#FBF2EC] rounded-2xl p-5 border border-[#A8452A]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2 text-[#A8452A] font-bold text-sm">
                <span class="material-symbols-outlined text-[20px]">bug_report</span>
                <span>Modul Analisis Data Hama &amp; Penyakit Real-Time Cangkringan</span>
              </div>
              <p class="text-xs text-[#5C4A32] leading-relaxed">
                Matriks komprehensif penanganan serangga pengganggu &amp; patogen tanaman berdasarkan telemetri aktual lapangan.
              </p>
            </div>
            
            <!-- Filter Komoditas -->
            <div class="flex flex-wrap items-center gap-1.5 shrink-0">
              <button 
                v-for="c in ['All', 'Cabai Merah', 'Jagung', 'Salak Pondoh', 'Tomat', 'Bawang Merah', 'Padi']" 
                :key="c"
                @click="selectedCommodityFilter = c"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border"
                :class="selectedCommodityFilter === c ? 'bg-[#A8452A] text-white border-[#A8452A]' : 'bg-white text-[#5C4A32] border-[#E5E0D8] hover:bg-[#F9F7F4]'"
              >
                {{ c }}
              </button>
            </div>
          </div>

          <!-- Input Search Hama -->
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E7063] text-[18px]">search</span>
            <input 
              v-model="pestSearchQuery"
              type="text" 
              placeholder="Cari hama (Wereng, Thrips, Ulat Grayak, Jamur Daun) atau solusi penanganan..."
              class="w-full h-11 pl-10 pr-4 bg-[#F9F7F4] text-xs font-semibold text-[#231a10] rounded-xl border border-[#E5E0D8] focus:outline-none focus:ring-2 focus:ring-[#A8452A]"
            />
          </div>

          <!-- Desktop Table Matriks Data Hama -->
          <div class="hidden md:block overflow-x-auto rounded-2xl border border-[#E5E0D8] bg-white shadow-xs">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#243319] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th class="py-3 px-4">Komoditas</th>
                  <th class="py-3 px-4">Hama / Penyakit</th>
                  <th class="py-3 px-4 text-center">Tingkat Keparahan</th>
                  <th class="py-3 px-4">Gejala Lapangan</th>
                  <th class="py-3 px-4">Langkah Mitigasi &amp; Agen Hayati</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E5E0D8] text-xs font-medium text-[#231a10]">
                <tr v-for="(item, idx) in filteredHamaList" :key="idx" class="hover:bg-[#FFFBF7] transition-colors">
                  <td class="py-3.5 px-4 font-bold text-[#A8452A] whitespace-nowrap">{{ item.komoditas }}</td>
                  <td class="py-3.5 px-4 font-bold text-[#243319] whitespace-nowrap">{{ item.hama }}</td>
                  <td class="py-3.5 px-4 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border" :class="severityBadgeClass(item.severity)">
                      {{ item.severity }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-[#5C4A32] max-w-[200px] leading-relaxed">{{ item.gejala }}</td>
                  <td class="py-3.5 px-4 text-[#243319] font-semibold leading-relaxed bg-[#FBF2EC]/30">{{ item.solusi }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards Data Hama -->
          <div class="md:hidden space-y-3">
            <div v-for="(item, idx) in filteredHamaList" :key="'m-' + idx" class="bg-white p-4 rounded-2xl border border-[#E5E0D8] space-y-2 shadow-xs">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-[#A8452A] uppercase tracking-wider">{{ item.komoditas }}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border" :class="severityBadgeClass(item.severity)">
                  Intensitas: {{ item.severity }}
                </span>
              </div>
              <h4 class="font-bold text-sm text-[#243319] flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] text-[#A8452A]">warning</span>
                <span>{{ item.hama }}</span>
              </h4>
              <p class="text-xs text-[#5C4A32] bg-[#F9F7F4] p-2.5 rounded-xl border border-[#E5E0D8]">
                <strong>Gejala:</strong> {{ item.gejala }}
              </p>
              <div class="text-xs text-[#243319] bg-[#EBF2E5] p-2.5 rounded-xl border border-[#d5e9c3]">
                <strong>Cara Mengatasi:</strong> {{ item.solusi }}
              </div>
            </div>
          </div>
        </section>

        <!-- CTA Action Footer -->
        <div class="mt-4 pt-6 border-t border-[#E5E0D8]/60 flex flex-col md:flex-row items-center justify-between gap-4 bg-[#F7F9F4] p-5 rounded-2xl border border-[#D5E9C3]/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#243319] text-white flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-[#231a10]">Tindak Lanjut &amp; Rekomendasi AI</h4>
              <p class="text-xs text-[#645d58]">Akses formulir catat lahan untuk mensinkronkan komoditas &amp; kelembapan tanah Anda.</p>
            </div>
          </div>
          <router-link to="/input-lahan" class="w-full md:w-auto px-5 py-2.5 bg-[#A8452A] hover:bg-[#923c24] text-white text-xs font-bold rounded-xl text-center shadow-sm transition-colors">
            Pergi ke Modul Catat Lahan &amp; Hama
          </router-link>
        </div>

      </article>

    </main>

  </div>
</template>

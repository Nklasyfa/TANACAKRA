<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { KabarTaniService, type KabarTaniItem } from '../services/kabarTani'

const router = useRouter()

const scrolled = ref(false)
const onScroll = () => {
  scrolled.value = window.scrollY > 80
}

let revealObserver: IntersectionObserver | null = null
const initReveal = () => {
  const els = document.querySelectorAll('.scroll-fade')
  els.forEach((el) => {
    el.classList.remove('is-visible')
  })
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          revealObserver?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1 }
  )
  els.forEach((el) => revealObserver?.observe(el))
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  initReveal()
  loadWartaItems()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  revealObserver?.disconnect()
})

const hasSession = ref(false)
const sessionRole = ref<'PETANI' | 'ADMIN'>('PETANI')
;(() => {
  try {
    const raw = localStorage.getItem('tanacakra_user')
    if (raw) {
      const u = JSON.parse(raw)
      hasSession.value = !!(u && u.username)
      if (u && u.role === 'ADMIN') sessionRole.value = 'ADMIN'
    }
  } catch {
    hasSession.value = false
  }
})()

const primaryCta = () => {
  if (hasSession.value) {
    router.push(sessionRole.value === 'ADMIN' ? '/admin' : '/petani')
  } else {
    router.push('/login')
  }
}

const wartaItems = ref<KabarTaniItem[]>([])
const wartaLoading = ref(true)

const loadWartaItems = async () => {
  try {
    const items = await KabarTaniService.getItems('all', 3)
    wartaItems.value = items
  } catch (e) {
    console.warn('Failed to load warta items:', e)
  } finally {
    wartaLoading.value = false
  }
}

const formatWartaTime = (iso: string) => {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Terbaru'
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return isToday ? `Hari ini, ${timeStr} WIB` : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + `, ${timeStr} WIB`
}

const getWartaCategoryStyle = (category: string) => {
  switch (category) {
    case 'pasar': return 'bg-white text-[#243319] border border-[#E5E0D8]'
    case 'lahan': return 'bg-[#F8E5D5] text-[#A8452A]'
    case 'cuaca': return 'bg-[#EBF2E5] text-[#243319]'
    case 'hama': return 'bg-[#FBE9E7] text-[#C62828]'
    case 'prediksi': return 'bg-[#E8EAF6] text-[#3F51B5]'
    default: return 'bg-[#F0EDE6] text-[#243319] border border-[#E5E0D8]'
  }
}

const getWartaIcon = (category: string) => {
  switch (category) {
    case 'pasar': return 'trending_up'
    case 'lahan': return 'warning'
    case 'cuaca': return 'wb_twilight'
    case 'hama': return 'bug_report'
    case 'prediksi': return 'psychology'
    default: return 'newspaper'
  }
}

const scrollToFeatures = () => {
  document.getElementById('fitur')?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-[#fff8f4] text-[#231a10] font-sans antialiased selection:bg-[#d5e9c3] selection:text-[#243319]">

    <!-- STICKY HEADER -->
    <header
      class="fixed top-0 inset-x-0 z-40 transition-all duration-300"
      :class="scrolled ? 'bg-[#fff8f4]/95 backdrop-blur-md border-b border-[#E5E0D8] py-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)]' : 'bg-transparent border-b border-transparent py-5'"
    >
      <div class="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-3 cursor-pointer group" @click="router.push('/')">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center p-1 transition-transform group-hover:scale-105" :class="scrolled ? 'bg-[#243319]' : 'bg-white/20 backdrop-blur-md border border-white/30'">
            <img
              src="@/assets/tanacakra-icon.svg"
              alt="Logo Tanacakra"
              class="h-6 w-auto transition-all"
              :class="scrolled ? 'brightness-0 invert' : 'brightness-0 invert'"
            />
          </div>
          <span
            class="font-headline-lg text-2xl font-bold tracking-tight transition-colors flex items-center gap-1"
            :class="scrolled ? 'text-[#243319]' : 'text-white'"
          >
            Tanacakra
            <span class="w-1.5 h-1.5 rounded-full bg-[#A8452A] inline-block"></span>
          </span>
        </div>

        <!-- Navigation Links -->
        <nav class="hidden lg:flex items-center gap-8 text-[14px] font-medium">
          <a
            href="#fitur"
            class="transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#A8452A] hover:after:w-full after:transition-all"
            :class="scrolled ? 'text-[#444840] hover:text-[#243319]' : 'text-white/85 hover:text-white'"
            @click.prevent="scrollToFeatures"
          >
            Fitur Utama
          </a>
          <a
            href="#cara-kerja"
            class="transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#A8452A] hover:after:w-full after:transition-all"
            :class="scrolled ? 'text-[#444840] hover:text-[#243319]' : 'text-white/85 hover:text-white'"
            @click.prevent="scrollToSection('cara-kerja')"
          >
            Cara Kerja
          </a>
          <a
            href="#tentang"
            class="transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#A8452A] hover:after:w-full after:transition-all"
            :class="scrolled ? 'text-[#444840] hover:text-[#243319]' : 'text-white/85 hover:text-white'"
            @click.prevent="scrollToSection('tentang')"
          >
            Tentang Kami
          </a>
          <a
            href="#warta"
            class="transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-[#A8452A] hover:after:w-full after:transition-all"
            :class="scrolled ? 'text-[#444840] hover:text-[#243319]' : 'text-white/85 hover:text-white'"
            @click.prevent="scrollToSection('warta')"
          >
            Warta Tani
          </a>
        </nav>

        <!-- CTA Header Button -->
        <div class="flex items-center gap-3">
          <button
            v-if="!hasSession"
            @click="router.push('/login')"
            class="min-h-[42px] px-6 rounded-full font-semibold text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center gap-2 shadow-sm"
            :class="scrolled ? 'bg-[#243319] text-white hover:bg-[#3A4A2E]' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white'"
          >
            <span class="material-symbols-outlined text-[16px]">login</span>
            Masuk
          </button>
          <button
            v-else
            @click="primaryCta()"
            class="min-h-[42px] px-6 rounded-full font-semibold text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center gap-2"
            :class="scrolled ? 'bg-[#A8452A] text-white hover:bg-[#923c24] shadow-sm' : 'bg-[#A8452A] text-white hover:bg-[#923c24] shadow-md'"
          >
            <span class="material-symbols-outlined text-[16px]">dashboard</span>
            Dashboard
          </button>
        </div>
      </div>
    </header>

    <!-- HERO SECTION -->
    <section class="relative w-full h-[90vh] min-h-[620px] max-h-[860px] overflow-hidden flex flex-col justify-end">
      <!-- Image with overlay -->
      <img
        src="/img/hero-merapi.png"
        alt="Petani di lereng terasering Gunung Merapi pada pagi hari"
        class="absolute inset-0 w-full h-full object-cover select-none transform scale-105 transition-transform duration-1000"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-[#1b1714] via-[#241F1B]/60 to-[#241F1B]/20 pointer-events-none"></div>

      <div class="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 pb-16 pt-[120px] flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div class="max-w-[720px]">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white font-semibold text-xs uppercase tracking-wider mb-6 border border-white/25 shadow-lg">
            <span class="w-2 h-2 rounded-full bg-[#d5e9c3] animate-pulse"></span>
            Telemetri Strata Merapi &bull; Sleman DIY
          </div>
          <h1 class="font-headline-xl text-[44px] sm:text-[56px] md:text-[68px] lg:text-[76px] leading-[1.04] font-normal text-white tracking-tight drop-shadow-sm">
            Keputusan tani dari data, bukan insting.
          </h1>
          <p class="text-base md:text-lg text-white/90 max-w-[520px] mt-6 leading-relaxed font-normal">
            Tanacakra membantu kelompok tani Cangkringan mengoptimalkan rotasi tanaman, analisis hara vulkanik, dan proyeksi nilai jual pasar secara ilmiah.
          </p>
        </div>

        <div class="flex-shrink-0 flex flex-col sm:flex-row gap-4">
          <button
            @click="primaryCta()"
            class="inline-flex items-center justify-center gap-3 bg-white text-[#241F1B] hover:bg-[#fff8f4] px-8 py-4 rounded-full font-bold text-[15px] shadow-2xl hover:shadow-primary-fixed/20 transition-all duration-300 group active:scale-95"
          >
            <span>{{ hasSession ? 'Buka Dashboard Saya' : 'Mulai Sekarang' }}</span>
            <span class="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
          </button>
          <button
            @click="scrollToFeatures"
            class="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-7 py-4 rounded-full font-semibold text-[15px] transition-all active:scale-95"
          >
            <span class="material-symbols-outlined text-[18px]">explore</span>
            Lihat Fitur
          </button>
        </div>
      </div>
    </section>

    <!-- TENTANG / MASALAH SECTION -->
    <section id="tentang-sistem" class="w-full bg-[#F9F7F4] py-20 lg:py-28 scroll-mt-16 scroll-fade">
      <div class="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div class="mb-10">
          <span class="inline-block bg-[#EBF2E5] text-[#243319] text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-bold border border-[#d5e9c3]/50">
            Tentang Sistem
          </span>
          <h2 class="font-headline-xl text-[32px] md:text-[44px] leading-[1.15] font-normal text-[#241F1B] max-w-[720px] mt-4">
            Tanah lereng Merapi subur, tapi cepat berubah.
          </h2>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div class="lg:col-span-5 max-w-[480px]">
            <p class="text-base md:text-lg text-[#4A4036] leading-relaxed font-normal">
              Fluktuasi unsur hara vulkanik, pola curah hujan ekstrem, dan dinamika harga pasar sering kali membuat panen tak menentu. Tanacakra hadir menghubungkan sensor tanah dan data iklim lokal untuk memberi kepastian agronomis.
            </p>
            <div class="mt-8 flex flex-wrap items-center gap-3 text-[#7E7063] text-xs uppercase tracking-wider font-bold">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-md border border-[#E5E0D8]">
                <span class="w-2 h-2 rounded-full bg-[#3A4A2E]"></span> Cangkringan
              </span>
              <span>&middot;</span>
              <span class="px-3 py-1 bg-white rounded-md border border-[#E5E0D8]">Sleman</span>
              <span>&middot;</span>
              <span class="px-3 py-1 bg-white rounded-md border border-[#E5E0D8]">D.I. Yogyakarta</span>
            </div>
          </div>
          <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div class="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E5E0D8] flex flex-col justify-between hover:border-[#3A4A2E]/40 transition-all">
              <div class="flex items-center justify-between text-[#7E7063] mb-4">
                <span class="material-symbols-outlined text-[24px] text-[#243319]">grid_view</span>
                <span class="text-[11px] text-[#243319] bg-[#EBF2E5] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Aktif</span>
              </div>
              <div>
                <div class="font-headline-xl text-[44px] lg:text-[48px] font-bold text-[#241F1B] leading-none">42</div>
                <div class="text-xs text-[#7E7063] mt-2 font-medium">Petak lahan terpantau</div>
              </div>
            </div>
            <div class="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E5E0D8] flex flex-col justify-between hover:border-[#3A4A2E]/40 transition-all">
              <div class="flex items-center justify-between text-[#7E7063] mb-4">
                <span class="material-symbols-outlined text-[24px] text-[#243319]">groups</span>
                <span class="text-[11px] text-[#243319] bg-[#EBF2E5] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Kelompok</span>
              </div>
              <div>
                <div class="font-headline-xl text-[44px] lg:text-[48px] font-bold text-[#241F1B] leading-none">38</div>
                <div class="text-xs text-[#7E7063] mt-2 font-medium">Petani aktif terdaftar</div>
              </div>
            </div>
            <div class="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E5E0D8] flex flex-col justify-between hover:border-[#3A4A2E]/40 transition-all">
              <div class="flex items-center justify-between text-[#7E7063] mb-4">
                <span class="material-symbols-outlined text-[24px] text-[#243319]">timeline</span>
                <span class="text-[11px] text-[#243319] bg-[#EBF2E5] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">ML Presisi</span>
              </div>
              <div>
                <div class="font-headline-xl text-[36px] lg:text-[42px] font-bold text-[#241F1B] leading-none whitespace-nowrap">3 Bulan</div>
                <div class="text-xs text-[#7E7063] mt-2 font-medium">Proyeksi pasar &amp; iklim</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CARA KERJA SECTION -->
    <section id="cara-kerja" class="w-full bg-white py-20 lg:py-28 scroll-mt-16 scroll-fade">
      <div class="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div class="mb-14">
          <span class="inline-block bg-[#EBF2E5] text-[#243319] text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-bold border border-[#d5e9c3]/50">
            Alur Kerja
          </span>
          <h2 class="font-headline-xl text-[32px] md:text-[44px] leading-[1.15] font-normal text-[#241F1B] mt-4">Tiga langkah sederhana.</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="relative bg-[#F9F7F4] rounded-2xl p-8 border border-[#E5E0D8] overflow-hidden flex flex-col justify-between min-h-[270px] group hover:bg-[#F2ECE0] transition-colors duration-300">
            <span class="font-mono text-[72px] font-bold text-[#E2D8C7] group-hover:text-white absolute top-2 right-5 select-none pointer-events-none transition-colors duration-300 leading-none opacity-60">01</span>
            <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#243319] mb-6 shadow-sm border border-[#E5E0D8]">
              <span class="material-symbols-outlined text-[24px]">edit_note</span>
            </div>
            <div>
              <h3 class="text-xl font-bold text-[#241F1B] mb-2">Catat Kondisi Tanah</h3>
              <p class="text-[15px] text-[#4A4036] leading-relaxed">Masukkan data kelembapan, pH, dan elevasi petak sawah Anda dengan mudah lewat formulir presisi.</p>
            </div>
          </div>
          <div class="relative bg-[#F9F7F4] rounded-2xl p-8 border border-[#E5E0D8] overflow-hidden flex flex-col justify-between min-h-[270px] group hover:bg-[#F2ECE0] transition-colors duration-300">
            <span class="font-mono text-[72px] font-bold text-[#E2D8C7] group-hover:text-white absolute top-2 right-5 select-none pointer-events-none transition-colors duration-300 leading-none opacity-60">02</span>
            <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#243319] mb-6 shadow-sm border border-[#E5E0D8]">
              <span class="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <h3 class="text-xl font-bold text-[#241F1B] mb-2">AI &amp; ML Menganalisis</h3>
              <p class="text-[15px] text-[#4A4036] leading-relaxed">Engine Random Forest memadukan riwayat mikroklimat Merapi dan tren permintaan komoditas pasar regional.</p>
            </div>
          </div>
          <div class="relative bg-[#F9F7F4] rounded-2xl p-8 border border-[#E5E0D8] overflow-hidden flex flex-col justify-between min-h-[270px] group hover:bg-[#F2ECE0] transition-colors duration-300">
            <span class="font-mono text-[72px] font-bold text-[#E2D8C7] group-hover:text-white absolute top-2 right-5 select-none pointer-events-none transition-colors duration-300 leading-none opacity-60">03</span>
            <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#243319] mb-6 shadow-sm border border-[#E5E0D8]">
              <span class="material-symbols-outlined text-[24px]">calendar_month</span>
            </div>
            <div>
              <h3 class="text-xl font-bold text-[#241F1B] mb-2">Terima Rekomendasi</h3>
              <p class="text-[15px] text-[#4A4036] leading-relaxed">Dapatkan kalender tanam presisi dan estimasi proyeksi panen ton/ha sebelum bibit pertama ditabur.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FITUR BENTO SECTION -->
    <section id="fitur" class="w-full bg-[#F9F7F4] py-20 lg:py-28 scroll-mt-16 scroll-fade">
      <div class="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div class="mb-12">
          <span class="inline-block bg-[#EBF2E5] text-[#243319] text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-bold border border-[#d5e9c3]/50">
            Ekosistem Fitur
          </span>
          <h2 class="font-headline-xl text-[32px] md:text-[44px] leading-[1.15] font-normal text-[#241F1B] mt-4">Yang bisa Anda lakukan.</h2>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Card 1: Panen & Harga -->
          <div class="lg:col-span-7 rounded-2xl overflow-hidden flex flex-col sm:flex-row border border-[#E5E0D8] shadow-sm bg-white">
            <div class="sm:w-[60%] bg-[#EBF2E5] p-8 flex flex-col justify-between">
              <div>
                <span class="inline-flex items-center gap-1.5 text-[#243319] text-xs font-bold uppercase tracking-wider mb-3">
                  <span class="material-symbols-outlined text-[16px]">query_stats</span> Engine Regresi Panen
                </span>
                <h3 class="font-headline-lg text-[24px] md:text-[28px] leading-tight font-bold text-[#243319]">Prediksi Hasil &amp; Pasar</h3>
                <p class="text-[15px] text-[#4A4036] mt-3 leading-relaxed">Simulasi proyeksi panen otomatis dan estimasi fluktuasi nilai jual komoditas di pasar Sleman &amp; Yogyakarta.</p>
              </div>
              <div class="mt-6 pt-4 border-t border-[#3A4A2E]/15 flex items-center gap-2 text-xs font-semibold text-[#243319]">
                <span class="material-symbols-outlined text-[18px]">verified</span> Data tervalidasi kelompok tani lokal
              </div>
            </div>
            <div class="sm:w-[40%] bg-[#243319] p-8 text-white flex flex-col justify-center items-start">
              <span class="text-xs uppercase tracking-wider text-white/70 font-semibold">Margin Optimasi</span>
              <div class="font-headline-xl text-[54px] lg:text-[60px] font-bold text-white leading-none mt-2">+8%</div>
              <p class="text-sm text-white/80 mt-3 leading-snug">Prediksi harga cabai bulan depan di sentra Pasar Sleman</p>
              <div class="mt-6 inline-flex items-center gap-2 text-[12px] bg-white/10 px-3 py-1.5 rounded-full text-white/90">
                <span class="w-1.5 h-1.5 rounded-full bg-[#d5e9c3]"></span> Tren harga menguat
              </div>
            </div>
          </div>

          <!-- Card 2: Visual Foto Lahan -->
          <div class="lg:col-span-5 bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div class="aspect-[4/3] w-full rounded-xl overflow-hidden mb-5 relative">
                <img src="/img/farmer-portrait.png" alt="Petani memegang hasil panen" class="w-full h-full object-cover" />
                <div class="absolute bottom-2.5 right-2.5 bg-[#241F1B]/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border border-white/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Telemetri IoT Aktif
                </div>
              </div>
              <h3 class="font-headline-lg text-[22px] md:text-[24px] leading-snug font-bold text-[#241F1B]">Peta Lahan &amp; Deteksi Risiko</h3>
              <p class="text-[15px] text-[#4A4036] mt-2 leading-relaxed">Pantau kontur blok sawah secara visual dengan deteksi dini serangan hama dan penurunan kelembapan tanah.</p>
            </div>
          </div>

          <!-- Card 3: Horizontal 3 items -->
          <div class="lg:col-span-12 bg-white border border-[#E5E0D8] rounded-2xl p-8 shadow-sm">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div class="md:border-r md:border-[#E5E0D8] md:pr-6">
                <div class="flex items-center gap-2.5 mb-2">
                  <span class="material-symbols-outlined text-[#243319] text-[22px]">rss_feed</span>
                  <h4 class="text-base font-bold text-[#241F1B]">Kabar Tani Harian</h4>
                </div>
                <p class="text-[15px] text-[#4A4036] leading-relaxed">Pembaruan rutin indikator cuaca BMKG &amp; cuaca terasering Merapi langsung di smartphone Anda.</p>
              </div>
              <div class="md:border-r md:border-[#E5E0D8] md:pr-6">
                <div class="flex items-center gap-2.5 mb-2">
                  <span class="material-symbols-outlined text-[#243319] text-[22px]">history_edu</span>
                  <h4 class="text-base font-bold text-[#241F1B]">Riwayat Lahan Digital</h4>
                </div>
                <p class="text-[15px] text-[#4A4036] leading-relaxed">Dokumentasi perlakuan pupuk, rotasi tanaman, dan tren produktivitas dari musim ke musim.</p>
              </div>
              <div class="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0">
                <div class="flex items-center gap-2 text-[#7E7063]">
                  <span class="material-symbols-outlined text-[24px]">explore</span>
                  <span class="text-xs font-bold uppercase tracking-wider">Modul Terintegrasi</span>
                </div>
                <button @click="primaryCta()" class="inline-flex items-center gap-2 bg-[#A8452A] hover:bg-[#8e3820] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm">
                  <span>Mulai Catat</span>
                  <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TENTANG KAMI & TIM PENGEMBANG UNESA SECTION -->
    <section id="tentang" class="w-full bg-white py-20 lg:py-28 scroll-mt-16 scroll-fade">
      <div class="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <!-- Header Banner: UNESA & VINIX7 Collaboration -->
        <div class="bg-[#F9F7F4] border border-[#E5E0D8] rounded-3xl p-8 md:p-12 mb-16 shadow-sm relative overflow-hidden">
          <div class="absolute -right-12 -bottom-12 w-72 h-72 bg-[#EBF2E5] rounded-full pointer-events-none opacity-60"></div>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div class="lg:col-span-8">
              <div class="flex flex-wrap items-center gap-2 mb-4">
                <span class="inline-flex items-center gap-1.5 bg-[#243319] text-white text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold shadow-sm">
                  <span class="material-symbols-outlined text-[16px] text-[#d5e9c3]">school</span>
                  Mahasiswa Universitas Negeri Surabaya (UNESA)
                </span>
                <span class="inline-flex items-center gap-1.5 bg-[#EBF2E5] text-[#243319] text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider font-bold border border-[#d5e9c3]/60">
                  <span class="material-symbols-outlined text-[16px] text-[#A8452A]">verified</span>
                  Mitra Pelatihan VINIX7
                </span>
              </div>
              <h2 class="font-headline-xl text-[32px] md:text-[44px] leading-[1.15] font-normal text-[#241F1B]">
                Tim Pembuat &amp; Inovator Tanacakra
              </h2>
              <p class="text-[15px] md:text-base text-[#4A4036] mt-4 leading-relaxed max-w-3xl">
                Platform Tanacakra dirancang dan dikembangkan secara independen oleh kolaborasi talenta muda <strong>Mahasiswa Universitas Negeri Surabaya (UNESA)</strong> bersama mitra pelatihan <strong>VINIX7</strong>. Berkomitmen menghadirkan inovasi agrikultur presisi berbasis Data Science &amp; Telemetri tanah untuk memberdayakan kelompok tani lokal Desa Cangkringan.
              </p>
            </div>
            <div class="lg:col-span-4 flex flex-col items-start lg:items-end justify-center">
              <div class="bg-white p-6 rounded-2xl border border-[#E5E0D8] shadow-sm w-full max-w-sm">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-[#243319] text-[#d5e9c3] flex items-center justify-center font-bold shadow-sm">
                    <span class="material-symbols-outlined text-[22px]">groups</span>
                  </div>
                  <div>
                    <span class="text-[11px] font-bold text-[#7E7063] block uppercase tracking-wider">Struktur Tim Pembuat</span>
                    <span class="text-base font-bold text-[#241F1B]">UNESA x VINIX7</span>
                  </div>
                </div>
                <div class="mt-4 pt-3 border-t border-[#E5E0D8] text-xs text-[#4A4036] space-y-2 font-mono">
                  <div class="flex justify-between items-center">
                    <span>Project Manager:</span>
                    <strong class="text-[#243319] bg-[#EBF2E5] px-2 py-0.5 rounded">Tia</strong>
                  </div>
                  <div class="flex justify-between items-center">
                    <span>Data Analyst:</span>
                    <strong class="text-[#243319] bg-[#EBF2E5] px-2 py-0.5 rounded">Shoffie</strong>
                  </div>
                  <div class="flex justify-between items-center">
                    <span>Programmer:</span>
                    <strong class="text-[#243319] bg-[#EBF2E5] px-2 py-0.5 rounded">Nakula</strong>
                  </div>
                  <div class="flex justify-between items-center pt-2 border-t border-dashed border-[#E5E0D8]">
                    <span class="text-[#A8452A]">Mitra Pelatihan:</span>
                    <strong class="text-[#A8452A] bg-[#F8E5D5] px-2 py-0.5 rounded">VINIX7</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tim Cards Section -->
        <div>
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span class="inline-block bg-[#EBF2E5] text-[#243319] text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-bold mb-3 border border-[#d5e9c3]/50">
                Tentang Kami &middot; Profil Tim
              </span>
              <h3 class="font-headline-xl text-[28px] md:text-[38px] font-normal text-[#241F1B]">Mengenal Tim Pembuat Sistem</h3>
              <p class="text-sm text-[#7E7063] mt-2">Peran, kontribusi teknis, dan dedikasi mahasiswa UNESA serta mitra resmi pelatihan VINIX7.</p>
            </div>
          </div>

          <!-- Cards Grid (4 columns) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <!-- Card 1: Tia (PM) -->
            <div class="bg-[#F9F7F4] border border-[#E5E0D8] rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 group hover:border-[#3A4A2E]/40">
              <div>
                <!-- Image Wrapper -->
                <div class="relative w-full aspect-[4/3] bg-[#E5E0D8] overflow-hidden">
                  <img
                    src="/img/team-tia.png"
                    alt="Foto Tia - Project Manager"
                    class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#241F1B]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="absolute top-3 right-3 bg-[#A8452A] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Project Manager
                  </div>
                </div>

                <!-- Content -->
                <div class="p-6">
                  <h4 class="text-xl font-bold text-[#241F1B] group-hover:text-[#A8452A] transition-colors flex items-center justify-between">
                    <span>Tia</span>
                    <span class="material-symbols-outlined text-[20px] text-[#A8452A]">manage_accounts</span>
                  </h4>
                  <p class="text-xs font-bold text-[#243319] mt-1 flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    PM &amp; System Architect &middot; UNESA
                  </p>
                  <p class="text-xs text-[#4A4036] mt-3 leading-relaxed">
                    Mengarahkan alur riset agronomis, merumuskan spesifikasi SRS sistem, mengkoordinasikan tahapan pengembangan, serta memastikan kebutuhan petani Cangkringan terpenuhi secara presisi.
                  </p>

                  <div class="mt-4 flex flex-wrap gap-1.5">
                    <span class="text-[10px] font-semibold bg-white text-[#243319] px-2 py-1 rounded border border-[#E5E0D8]">Agile PM</span>
                    <span class="text-[10px] font-semibold bg-white text-[#243319] px-2 py-1 rounded border border-[#E5E0D8]">SRS Design</span>
                    <span class="text-[10px] font-semibold bg-white text-[#243319] px-2 py-1 rounded border border-[#E5E0D8]">Agronomy Tech</span>
                  </div>
                </div>
              </div>

              <div class="px-6 py-4 bg-white border-t border-[#E5E0D8]/70 flex items-center justify-between text-[11px] font-semibold text-[#7E7063]">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px] text-[#243319]">school</span>
                  Mahasiswa UNESA
                </span>
                <span class="text-[#243319] font-bold">Teknik Informatika</span>
              </div>
            </div>

            <!-- Card 2: Shoffie (Data Analyst) -->
            <div class="bg-[#F9F7F4] border border-[#E5E0D8] rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 group hover:border-[#3A4A2E]/40">
              <div>
                <!-- Image Wrapper -->
                <div class="relative w-full aspect-[4/3] bg-[#E5E0D8] overflow-hidden">
                  <img
                    src="/img/team-shoffie.png"
                    alt="Foto Shoffie - Data Analyst"
                    class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#241F1B]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="absolute top-3 right-3 bg-[#243319] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Data Analyst
                  </div>
                </div>

                <!-- Content -->
                <div class="p-6">
                  <h4 class="text-xl font-bold text-[#241F1B] group-hover:text-[#243319] transition-colors flex items-center justify-between">
                    <span>Shoffie</span>
                    <span class="material-symbols-outlined text-[20px] text-[#243319]">analytics</span>
                  </h4>
                  <p class="text-xs font-bold text-[#243319] mt-1 flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Data Science &amp; ML &middot; UNESA
                  </p>
                  <p class="text-xs text-[#4A4036] mt-3 leading-relaxed">
                    Bertanggung jawab mengolah dataset telemetri tanah lereng Merapi, membangun model inferensi Random Forest (NPK/pH), serta merancang algoritma proyeksi tren harga komoditas pasar.
                  </p>

                  <div class="mt-4 flex flex-wrap gap-1.5">
                    <span class="text-[10px] font-semibold bg-white text-[#243319] px-2 py-1 rounded border border-[#E5E0D8]">Scikit-Learn</span>
                    <span class="text-[10px] font-semibold bg-white text-[#243319] px-2 py-1 rounded border border-[#E5E0D8]">Random Forest</span>
                    <span class="text-[10px] font-semibold bg-white text-[#243319] px-2 py-1 rounded border border-[#E5E0D8]">Pandas/NumPy</span>
                  </div>
                </div>
              </div>

              <div class="px-6 py-4 bg-white border-t border-[#E5E0D8]/70 flex items-center justify-between text-[11px] font-semibold text-[#7E7063]">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px] text-[#243319]">school</span>
                  Mahasiswa UNESA
                </span>
                <span class="text-[#243319] font-bold">Data Science</span>
              </div>
            </div>

            <!-- Card 3: Nakula (Programmer) -->
            <div class="bg-[#F9F7F4] border border-[#E5E0D8] rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 group hover:border-[#3A4A2E]/40">
              <div>
                <!-- Image Wrapper -->
                <div class="relative w-full aspect-[4/3] bg-[#E5E0D8] overflow-hidden">
                  <img
                    src="/img/team-nakula.png"
                    alt="Foto Nakula - Lead Programmer"
                    class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#241F1B]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div class="absolute top-3 right-3 bg-[#243319] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Programmer
                  </div>
                </div>

                <!-- Content -->
                <div class="p-6">
                  <h4 class="text-xl font-bold text-[#241F1B] group-hover:text-[#243319] transition-colors flex items-center justify-between">
                    <span>Nakula</span>
                    <span class="material-symbols-outlined text-[20px] text-[#243319]">terminal</span>
                  </h4>
                  <p class="text-xs font-bold text-[#243319] mt-1 flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Lead Software Eng &middot; UNESA
                  </p>
                  <p class="text-xs text-[#4A4036] mt-3 leading-relaxed">
                    Mengembangkan arsitektur frontend Vue 3 TypeScript, RESTful API backend Django, integrasi Supabase PostgreSQL Auth, serta sistem visualisasi grafik telemetri Plotly.js interaktif.
                  </p>

                  <div class="mt-4 flex flex-wrap gap-1.5">
                    <span class="text-[10px] font-semibold bg-white text-[#243319] px-2 py-1 rounded border border-[#E5E0D8]">Vue 3 TS</span>
                    <span class="text-[10px] font-semibold bg-white text-[#243319] px-2 py-1 rounded border border-[#E5E0D8]">Django REST</span>
                    <span class="text-[10px] font-semibold bg-white text-[#243319] px-2 py-1 rounded border border-[#E5E0D8]">Plotly.js</span>
                  </div>
                </div>
              </div>

              <div class="px-6 py-4 bg-white border-t border-[#E5E0D8]/70 flex items-center justify-between text-[11px] font-semibold text-[#7E7063]">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px] text-[#243319]">school</span>
                  Mahasiswa UNESA
                </span>
                <span class="text-[#243319] font-bold">Software Eng</span>
              </div>
            </div>

            <!-- Card 4: VINIX7 (Mitra Pelatihan) -->
            <div class="bg-[#243319] text-white border border-[#243319] rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative">
              <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-[#d5e9c3]/10 rounded-full pointer-events-none"></div>

              <div>
                <!-- Image Wrapper -->
                <div class="relative w-full aspect-[4/3] bg-[#1a2512] overflow-hidden">
                  <img
                    src="/img/team-vinix7.png"
                    alt="Logo VINIX7 Mitra Pelatihan"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#243319]/80 via-transparent to-transparent"></div>
                  <div class="absolute top-3 right-3 bg-[#d5e9c3] text-[#111f08] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    Mitra Resmi
                  </div>
                </div>

                <!-- Content -->
                <div class="p-6">
                  <h4 class="text-xl font-bold text-white group-hover:text-[#d5e9c3] transition-colors flex items-center justify-between">
                    <span>VINIX7</span>
                    <span class="material-symbols-outlined text-[20px] text-[#d5e9c3]">workspace_premium</span>
                  </h4>
                  <p class="text-xs font-bold text-[#d5e9c3] mt-1 flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-[#d5e9c3] animate-pulse"></span>
                    Training Partner &amp; Inkubator
                  </p>
                  <p class="text-xs text-white/80 mt-3 leading-relaxed">
                    Mitra resmi penyedia program akselerasi pelatihan teknis, pembimbingan kualitas arsitektur software, sertifikasi kapabilitas talenta digital UNESA, serta inkubasi agrikultur Tanacakra.
                  </p>

                  <div class="mt-4 flex flex-wrap gap-1.5">
                    <span class="text-[10px] font-semibold bg-white/10 text-white px-2 py-1 rounded border border-white/20">Training Partner</span>
                    <span class="text-[10px] font-semibold bg-white/10 text-white px-2 py-1 rounded border border-white/20">Incubator</span>
                    <span class="text-[10px] font-semibold bg-white/10 text-white px-2 py-1 rounded border border-white/20">Mentorship</span>
                  </div>
                </div>
              </div>

              <div class="px-6 py-4 bg-[#1b2613] border-t border-white/15 flex items-center justify-between text-[11px] font-semibold text-[#d5e9c3]">
                <span class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px]">verified</span>
                  Mitra Pelatihan
                </span>
                <span class="bg-white/15 px-2 py-0.5 rounded border border-white/20 font-bold text-white">VINIX7</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>

    <!-- WARTA SECTION -->
    <section id="warta" class="w-full bg-[#F9F7F4] py-20 lg:py-28 scroll-mt-16 scroll-fade">
      <div class="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
          <div>
            <span class="inline-block bg-[#EBF2E5] text-[#243319] text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-bold mb-3 border border-[#d5e9c3]/50">
              Warta Agrikultur
            </span>
            <h2 class="font-headline-xl text-[32px] md:text-[44px] leading-[1.15] font-normal text-[#241F1B]">Kabar Hari Ini</h2>
            <p class="text-[15px] text-[#7E7063] mt-2">Diperbarui otomatis dari data pasar, BMKG, dan prediksi AI.</p>
          </div>
          <router-link to="/kabar-tani" class="inline-flex items-center gap-1.5 text-[#243319] text-sm font-bold hover:underline group self-start md:self-auto">
            <span>Lihat semua berita</span>
            <span class="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
          </router-link>
        </div>
        <div v-if="wartaLoading" class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div v-for="i in 3" :key="i" class="bg-white border border-[#E5E0D8] rounded-2xl p-6 animate-pulse">
            <div class="h-4 bg-[#E5E0D8] rounded w-3/4 mb-4"></div>
            <div class="h-6 bg-[#E5E0D8] rounded w-full mb-2"></div>
            <div class="h-6 bg-[#E5E0D8] rounded w-5/6 mb-2"></div>
            <div class="h-6 bg-[#E5E0D8] rounded w-4/6"></div>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div v-for="item in wartaItems" :key="item.id" class="bg-white border border-[#E5E0D8] rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <span class="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider" :class="getWartaCategoryStyle(item.category)">
                <span class="material-symbols-outlined text-[12px] mr-1">{{ getWartaIcon(item.category) }}</span>
                {{ item.category === 'pasar' ? 'Harga Pasar' : item.category === 'lahan' ? 'Kondisi Lahan' : item.category === 'cuaca' ? 'Cuaca BMKG' : item.category === 'hama' ? 'Peringatan Hama' : 'Prediksi AI' }}
              </span>
              <h3 class="text-lg leading-snug font-bold text-[#241F1B]">{{ item.title }}</h3>
              <p class="text-sm text-[#4A4036] mt-3 leading-relaxed">{{ item.summary }}</p>
            </div>
            <div class="text-xs text-[#7E7063] mt-6 pt-4 border-t border-[#E5E0D8]/60 flex items-center justify-between font-mono">
              <span>{{ formatWartaTime(item.timestamp) }}</span>
              <span class="material-symbols-outlined text-[18px]" :class="item.severity === 'danger' ? 'text-amber-600' : item.severity === 'warning' ? 'text-amber-600' : 'text-[#243319]'">{{ getWartaIcon(item.category) }}</span>
            </div>
          </div>
          <div v-if="wartaItems.length < 3" v-for="i in 3 - wartaItems.length" :key="'empty-' + i" class="bg-white border border-[#E5E0D8] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <span class="inline-block bg-[#F0EDE6] text-[#243319] text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider border border-[#E5E0D8]">Berita</span>
              <h3 class="text-lg leading-snug font-bold text-[#241F1B]">Tidak ada berita terbaru saat ini</h3>
              <p class="text-sm text-[#4A4036] mt-3 leading-relaxed">Silakan cek kembali nanti untuk pembaruan terbaru.</p>
            </div>
            <div class="text-xs text-[#7E7063] mt-6 pt-4 border-t border-[#E5E0D8]/60 flex items-center justify-between font-mono">
              <span>—</span>
              <span class="material-symbols-outlined text-[18px] text-[#243319]">newspaper</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PERJALANAN SECTION -->
    <section class="w-full bg-white py-20 lg:py-28 scroll-fade">
      <div class="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div class="mb-14">
          <span class="inline-block bg-[#EBF2E5] text-[#243319] text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-bold border border-[#d5e9c3]/50">
            Peta Jalan
          </span>
          <h2 class="font-headline-xl text-[32px] md:text-[44px] leading-[1.15] font-normal text-[#241F1B] mt-4">Langkah tumbuh bersama petani.</h2>
        </div>
        <div class="relative border-t border-[#E5E0D8] pt-10 mt-12">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            <div class="relative flex flex-col items-start pr-4">
              <span class="w-3.5 h-3.5 rounded-full bg-[#243319] absolute -top-[47px] left-0 ring-4 ring-white"></span>
              <span class="font-headline-xl text-[42px] font-bold text-[#241F1B] leading-none mb-3">2024</span>
              <span class="text-xs uppercase tracking-wider text-[#243319] font-bold mb-1">Tahap 1 &middot; Lapangan</span>
              <p class="text-[15px] text-[#4A4036] leading-relaxed">Riset tanah &amp; sensor awal di 10 petak sawah percontohan Cangkringan.</p>
            </div>
            <div class="relative flex flex-col items-start pr-4">
              <span class="w-3.5 h-3.5 rounded-full bg-[#243319] absolute -top-[47px] left-0 ring-4 ring-white"></span>
              <span class="font-headline-xl text-[42px] font-bold text-[#241F1B] leading-none mb-3">2025</span>
              <span class="text-xs uppercase tracking-wider text-[#243319] font-bold mb-1">Tahap 2 &middot; Publik</span>
              <p class="text-[15px] text-[#4A4036] leading-relaxed">Peluncuran aplikasi cerdas Tanacakra v1.0 untuk kelompok tani terpadu.</p>
            </div>
            <div class="relative flex flex-col items-start pr-4">
              <span class="w-3.5 h-3.5 rounded-full bg-[#7E7063] absolute -top-[47px] left-0 ring-4 ring-white"></span>
              <span class="font-headline-xl text-[42px] font-bold text-[#241F1B]/60 leading-none mb-3">2026</span>
              <span class="text-xs uppercase tracking-wider text-[#7E7063] font-bold mb-1">Tahap 3 &middot; Wilayah</span>
              <p class="text-[15px] text-[#4A4036] leading-relaxed">Integrasi prediksi pasar komoditas se-D.I. Yogyakarta &amp; Jawa bagian tengah.</p>
            </div>
            <div class="relative flex flex-col items-start pr-4">
              <span class="w-3.5 h-3.5 rounded-full bg-[#7E7063] absolute -top-[47px] left-0 ring-4 ring-white"></span>
              <span class="font-headline-xl text-[42px] font-bold text-[#241F1B]/60 leading-none mb-3">2027</span>
              <span class="text-xs uppercase tracking-wider text-[#7E7063] font-bold mb-1">Tahap 4 &middot; Visi</span>
              <p class="text-[15px] text-[#4A4036] leading-relaxed">Ekosistem agrikultur mandiri berbasis telemetri terasering di lereng vulkanik nusantara.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CALL TO ACTION SECTION -->
    <section class="w-full py-12 scroll-fade">
      <div class="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div class="bg-[#243319] text-white rounded-3xl p-10 md:p-16 lg:p-20 text-center relative overflow-hidden shadow-2xl">
          <svg class="absolute inset-0 w-full h-full opacity-10 pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" preserveAspectRatio="none">
            <path d="M-100,200 C200,100 400,300 900,150 L900,400 L-100,400 Z" fill="currentColor"></path>
            <path d="M-100,280 C250,180 500,340 900,220 L900,400 L-100,400 Z" fill="currentColor"></path>
          </svg>
          <div class="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <span class="text-xs font-bold uppercase tracking-wider text-[#d5e9c3] bg-white/10 px-4 py-1.5 rounded-full mb-6 border border-white/15">
              Inisiatif Tani Presisi
            </span>
            <h2 class="font-headline-xl text-[34px] md:text-[46px] lg:text-[52px] font-normal text-white leading-tight">Siap mulai mencatat lahan Anda?</h2>
            <p class="text-base text-white/85 mt-4 leading-relaxed max-w-xl">
              Bergabung bersama puluhan petani Cangkringan lainnya untuk memaksimalkan potensi hasil panen setiap musim dengan panduan tanah ilmiah.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full sm:w-auto">
              <button @click="primaryCta()" class="w-full sm:w-auto inline-flex items-center justify-center bg-white text-[#241F1B] px-8 py-4 rounded-full font-bold text-[15px] hover:bg-[#F9F7F4] shadow-lg transition-all active:scale-95">
                {{ hasSession ? 'Buka Dashboard Saya' : 'Daftar Sekarang' }}
              </button>
              <button @click="router.push('/login')" class="w-full sm:w-auto inline-flex items-center justify-center border border-white/40 text-white px-8 py-4 rounded-full font-semibold text-[15px] hover:bg-white/10 transition-all active:scale-95">
                Masuk Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="w-full bg-[#1b1714] text-white py-16 scroll-fade">
      <div class="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <span class="font-headline-lg text-2xl tracking-tight text-white font-bold">Tanacakra</span>
              <span class="w-2 h-2 rounded-full bg-[#A8452A]"></span>
            </div>
            <p class="text-sm text-[#E5E0D8]/70 leading-relaxed max-w-xs">
              Kecerdasan lanskap agrikultur berbasis kontur bumi dan telemetri strata tanah lereng Gunung Merapi secara terpadu.
            </p>
            <div class="flex items-center gap-2 text-[12px] text-[#E5E0D8]/50 mt-2 font-mono">
              <span class="material-symbols-outlined text-[16px] text-[#d5e9c3]">eco</span> Sleman, D.I. Yogyakarta
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-xs uppercase tracking-wider text-white font-bold mb-1">Fitur Utama</span>
            <ul class="flex flex-col gap-2 text-sm text-[#E5E0D8]/70">
              <li><a href="#fitur" class="hover:text-white transition-colors" @click.prevent="scrollToFeatures">Prediksi Panen &amp; Pasar</a></li>
              <li><a href="#fitur" class="hover:text-white transition-colors" @click.prevent="scrollToFeatures">Peta Lahan &amp; Kontur</a></li>
              <li><a href="#fitur" class="hover:text-white transition-colors" @click.prevent="scrollToFeatures">Indikator Cuaca BMKG</a></li>
              <li><a href="#fitur" class="hover:text-white transition-colors" @click.prevent="scrollToFeatures">Kalender Tanam Merapi</a></li>
            </ul>
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-xs uppercase tracking-wider text-white font-bold mb-1">Akses Petani</span>
            <ul class="flex flex-col gap-2 text-sm text-[#E5E0D8]/70">
              <li><a href="#" class="hover:text-white transition-colors" @click.prevent="router.push('/login')">Masuk Akun</a></li>
              <li><a href="#" class="hover:text-white transition-colors" @click.prevent="router.push('/login')">Pendaftaran Petani</a></li>
              <li><a href="#tentang" class="hover:text-white transition-colors" @click.prevent="scrollToSection('tentang')">Panduan Aplikasi</a></li>
              <li><a href="#tentang" class="hover:text-white transition-colors" @click.prevent="scrollToSection('tentang')">Hubungi Tim Agronomi</a></li>
            </ul>
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-xs uppercase tracking-wider text-white font-bold mb-1">Warta Pertanian</span>
            <p class="text-sm text-[#E5E0D8]/70 leading-normal">Dapatkan ringkasan proyeksi komoditas dan kondisi tanah mingguan.</p>
            <form class="flex flex-col sm:flex-row items-stretch gap-2 mt-2" @submit.prevent>
              <input type="email" placeholder="Alamat email Anda" class="h-11 px-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-[#E5E0D8]/50 text-sm focus:outline-none focus:border-[#d5e9c3] w-full" />
              <button type="submit" class="h-11 px-5 bg-[#A8452A] text-white text-sm font-bold rounded-xl hover:bg-[#923c24] transition-colors whitespace-nowrap">
                Kirim
              </button>
            </form>
          </div>
        </div>
        <div class="mt-12 pt-6 border-t border-white/10 text-xs text-[#E5E0D8]/50 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>Kawasan Pertanian Lereng Merapi &bull; Desa Cangkringan, Sleman, DIY</p>
          <p>&copy; 2026 Tanacakra. Seluruh hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
.scroll-fade {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 400ms ease-out, transform 400ms ease-out;
}
.scroll-fade.is-visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
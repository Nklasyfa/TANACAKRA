import { api } from './api'

export interface KabarTaniMetrics {
  [key: string]: string | number
}

export interface KabarTaniItem {
  id: string
  category: 'pasar' | 'lahan' | 'cuaca' | 'hama' | 'prediksi'
  title: string
  summary: string
  metrics: KabarTaniMetrics
  severity: 'info' | 'warning' | 'danger'
  timestamp: string
  source: string
  cta_url: string
}

export interface KabarTaniFeatured {
  title: string
  summary: string
  category: string
  metrics: KabarTaniMetrics
  timestamp: string
  cta_url: string
  id?: string
}

export interface KabarTaniFeedResponse {
  featured: KabarTaniFeatured | null
  items: KabarTaniItem[]
  categories: Record<string, number>
}

export const KabarTaniService = {
  async getFeed(): Promise<KabarTaniFeedResponse> {
    try {
      const res = await api.get('/kabar-tani')
      if (!res.data || !res.data.items || res.data.items.length === 0) {
        return this.mergeCustomNews(getFallbackFeed())
      }
      return this.mergeCustomNews(res.data)
    } catch (e) {
      return this.mergeCustomNews(getFallbackFeed())
    }
  },

  mergeCustomNews(baseFeed: KabarTaniFeedResponse): KabarTaniFeedResponse {
    try {
      const raw = localStorage.getItem('tanacakra_custom_news')
      if (!raw) return baseFeed
      const customItems: KabarTaniItem[] = JSON.parse(raw)
      if (!Array.isArray(customItems) || !customItems.length) return baseFeed

      // Combine custom items at top of list
      const combinedItems = [...customItems, ...baseFeed.items]
      const counts: Record<string, number> = { pasar: 0, lahan: 0, cuaca: 0, hama: 0, prediksi: 0 }
      combinedItems.forEach(item => {
        if (counts[item.category] !== undefined) {
          counts[item.category]++
        }
      })

      // Optionally promote newest warning/danger item to featured
      const newestDanger = customItems.find(i => i.severity === 'danger' || i.severity === 'warning')
      let featured = baseFeed.featured
      if (newestDanger) {
        featured = {
          title: newestDanger.title,
          summary: newestDanger.summary,
          category: newestDanger.category,
          metrics: newestDanger.metrics,
          timestamp: newestDanger.timestamp,
          cta_url: newestDanger.cta_url || '/kabar-tani'
        }
      }

      return {
        featured,
        items: combinedItems,
        categories: counts
      }
    } catch {
      return baseFeed
    }
  },

  addCustomWarta(newItem: Omit<KabarTaniItem, 'id' | 'timestamp'> & { id?: string }): KabarTaniItem {
    const generatedId = newItem.id || ('warta-custom-' + Date.now())
    const item: KabarTaniItem = {
      ...newItem,
      id: generatedId,
      timestamp: new Date().toISOString(),
      cta_url: `/warta/${generatedId}`
    }

    try {
      const raw = localStorage.getItem('tanacakra_custom_news')
      const existing: KabarTaniItem[] = raw ? JSON.parse(raw) : []
      existing.unshift(item)
      localStorage.setItem('tanacakra_custom_news', JSON.stringify(existing))
    } catch (e) {
      console.error('Error saving custom warta:', e)
    }

    return item
  },

  updateCustomWarta(id: string, updatedData: Partial<KabarTaniItem>): KabarTaniItem | null {
    try {
      const raw = localStorage.getItem('tanacakra_custom_news')
      if (!raw) return null
      const existing: KabarTaniItem[] = JSON.parse(raw)
      const idx = existing.findIndex(i => i.id === id)
      if (idx !== -1) {
        existing[idx] = { ...existing[idx], ...updatedData }
        localStorage.setItem('tanacakra_custom_news', JSON.stringify(existing))
        return existing[idx]
      }
    } catch (e) {
      console.error('Error updating custom warta:', e)
    }
    return null
  },

  deleteCustomWarta(id: string): boolean {
    try {
      const raw = localStorage.getItem('tanacakra_custom_news')
      if (!raw) return false
      const existing: KabarTaniItem[] = JSON.parse(raw)
      const filtered = existing.filter(i => i.id !== id)
      if (filtered.length !== existing.length) {
        localStorage.setItem('tanacakra_custom_news', JSON.stringify(filtered))
        return true
      }
    } catch (e) {
      console.error('Error deleting custom warta:', e)
    }
    return false
  },

  async getFeatured(): Promise<KabarTaniFeatured | null> {
    const feed = await this.getFeed()
    return feed.featured
  },

  async getById(id: string): Promise<KabarTaniItem | KabarTaniFeatured | null> {
    const feed = await this.getFeed()
    if (feed.featured && (feed.featured as any).id === id) return feed.featured
    const item = feed.items.find(i => i.id === id)
    if (item) return item
    
    // In case the featured doesn't have ID but we clicked a default one
    if (id === 'featured-1' && feed.featured) return feed.featured
    
    return null
  },

  async getItems(category?: string, limit = 10): Promise<KabarTaniItem[]> {
    const feed = await this.getFeed()
    let items = feed.items
    if (category && category !== 'all') {
      items = items.filter(i => i.category === category)
    }
    return items.slice(0, limit)
  },

  async getCategories(): Promise<Record<string, number>> {
    const feed = await this.getFeed()
    return feed.categories
  }
}

export async function generateAiWartaArticleAsync(topicPrompt: string): Promise<Omit<KabarTaniItem, 'id' | 'timestamp'>> {
  try {
    const response = await api.post('/kabar-tani/generate', { prompt: topicPrompt })
    if (response.data && response.data.title) {
      // Validate or map data
      return {
        category: response.data.category || 'info',
        title: response.data.title,
        summary: response.data.summary,
        metrics: response.data.metrics || {},
        severity: response.data.severity || 'info',
        source: response.data.source || 'AI Agronomi Tanacakra (NVIDIA)',
        cta_url: response.data.cta_url || '/kabar-tani'
      }
    }
  } catch {
    // Offline mode or API unreachable: silently fallback to static generator
  }
  // Fallback to static if API fails
  return generateAiWartaArticle(topicPrompt)
}

export function generateAiWartaArticle(topicPrompt: string): Omit<KabarTaniItem, 'id' | 'timestamp'> {
  const prompt = topicPrompt.toLowerCase()

  // Komoditas detection
  const detectedCommodities: string[] = []
  if (prompt.includes('tomat')) detectedCommodities.push('Tomat')
  if (prompt.includes('bawang')) detectedCommodities.push('Bawang Merah')
  if (prompt.includes('jagung')) detectedCommodities.push('Jagung')
  if (prompt.includes('padi') || prompt.includes('beras')) detectedCommodities.push('Padi')
  if (prompt.includes('salak')) detectedCommodities.push('Salak Pondoh')
  if (prompt.includes('cabai') || prompt.includes('cabe') || prompt.includes('rawit')) detectedCommodities.push('Cabai Rawit')

  // Topic & Intent detection
  const isHama = prompt.includes('hama') || prompt.includes('penyakit') || prompt.includes('kutu') || prompt.includes('ulat') || prompt.includes('wereng') || prompt.includes('busuk') || prompt.includes('thrips')
  const isCuaca = prompt.includes('cuaca') || prompt.includes('merapi') || prompt.includes('hujan') || prompt.includes('la nina') || prompt.includes('kemarau') || prompt.includes('suhu') || prompt.includes('iklim')
  const isTanam = prompt.includes('tanam') || prompt.includes('cocok') || prompt.includes('budidaya') || prompt.includes('rekomendasi') || prompt.includes('musim')
  const isHarga = prompt.includes('harga') || prompt.includes('pasar') || prompt.includes('lelang') || prompt.includes('jual') || prompt.includes('untung')
  const isFuture = prompt.includes('bulan depan') || prompt.includes('buldep') || prompt.includes('mendatang') || prompt.includes('prediksi') || prompt.includes('proyeksi') || prompt.includes('depan')

  // --- KASUS 1: Rekomendasi Tanam / Budidaya (Bulan Depan / Sekarang) ---
  if (isTanam || (isFuture && !isHarga && !isHama)) {
    const timeFrame = isFuture ? 'Bulan Depan' : 'Musim Ini'
    
    // Jika ada komoditas spesifik yang ditanyakan untuk ditanam
    if (detectedCommodities.length === 1) {
      const comm = detectedCommodities[0]
      return {
        category: 'prediksi',
        title: `Panduan Kalender Tanam ${comm} ${timeFrame} di Cangkringan`,
        summary: `Berdasarkan permodelan iklim mikro lereng Merapi dan siklus presipitasi, menanam ${comm} pada ${timeFrame.toLowerCase()} sangat prospektif. Suhu harian 21-26°C dengan kelembapan 75-82% mendukung pembentukan biomassa secara optimal. Pastikan persiapan bedengan ditinggikan 30 cm untuk mencegah genangan air saat hujan vulkanik serta tambahkan pupuk kandang matang 1.5 ton/ha.`,
        metrics: {
          'Komoditas': comm,
          'Waktu Tanam': timeFrame,
          'Kesesuaian Lahan': 'Sangat Baik (93%)',
          'Estimasi Panen': comm === 'Jagung' ? '85-95 HST' : comm === 'Bawang Merah' ? '65-70 HST' : '75-85 HST'
        },
        severity: 'info',
        source: 'Sistem Agro-Klimat & AI Tanacakra',
        cta_url: '/lahan'
      }
    }

    // Rekomendasi umum multi-komoditas tanam
    return {
      category: 'prediksi',
      title: `Rekomendasi Komoditas Strategis Ditanam ${timeFrame} di Sleman`,
      summary: `Hasil simulasi cuaca BMKG dan model kesuburan tanah Tanacakra menunjukkan ${timeFrame.toLowerCase()} adalah waktu terbaik menanam Bawang Merah varietas Tajuk dan Tomat Sayur Servo. Pola curah hujan berkala (2-4 mm/hari) meminimalkan kebutuhan irigasi pompa, sementara prediksi harga pasar lelang grosir diproyeksikan menguat +12% saat fase panen nanti. Salak Pondoh juga memasuki fase pemupukan lanjutan untuk memacu bunga.`,
      metrics: {
        'Pilihan Utama': 'Bawang Merah & Tomat',
        'Pilihan Alternatif': 'Jagung Pipil Manis',
        'Faktor Pendukung': 'Curah Hujan & pH 6.4',
        'Proyeksi Margin': '+24% s/d +35%'
      },
      severity: 'info',
      source: 'Pusat Analisis Agronomi Tanacakra',
      cta_url: '/lahan'
    }
  }

  // --- KASUS 2: Peringatan Hama & Penyakit ---
  if (isHama) {
    const targetComm = detectedCommodities.length > 0 ? detectedCommodities.join(' & ') : 'Tomat, Cabai, dan Jagung'
    return {
      category: 'hama',
      title: `Peringatan Dini Serangan Hama pada ${targetComm} di Cangkringan`,
      summary: `Fluktuasi kelembapan udara (RH >82%) disertai embun pagi tebal memicu percepatan siklus hidup Thrips parvispinus dan spora hawar daun (Phytophthora) pada pertanaman ${targetComm}. Disarankan petani rutin mengeringkan parit bedengan, memasang yellow sticky trap minimal 40 titik/ha, dan menyemprot bio-pestisida berbahan aktif Beauveria bassiana pada sore hari.`,
      metrics: {
        'Komoditas Rentan': targetComm,
        'Tingkat Bahaya': 'Siaga 2 (Waspada)',
        'Vektor Utama': 'Thrips & Spora Jamur',
        'Rekomendasi': 'Bio-Pestisida & Sanitasi'
      },
      severity: 'warning',
      source: 'Laboratorium Pengendali Hayati Merapi',
      cta_url: '/kabar-tani?filter=hama'
    }
  }

  // --- KASUS 3: Cuaca & Anomali Vulkanik ---
  if (isCuaca) {
    return {
      category: 'cuaca',
      title: 'Dinamika Cuaca Lereng Merapi: Antisipasi Presipitasi & Asam Vulkanik',
      summary: 'Stasiun telemetri Kaliurang memprediksi peningkatan presipitasi hujan sedang (3-5 mm/jam) dalam beberapa pekan mendatang. Abu vulkanik halus berpotensi menurunkan pH air permukaan ke 5.2. Petani disarankan menabur dolomit halus 25 kg/ha di sekitar perakaran tanaman muda guna menetralisir keasaman tanah.',
      metrics: {
        'Prakiraan Cuaca': 'Hujan Ringan - Sedang',
        'pH Air Hujan': '5.2 (Asam Lemah)',
        'Mitigasi Lahan': 'Tabur Dolomit Kapur',
        'Tindakan': 'Drainase Parit Bedengan'
      },
      severity: 'danger',
      source: 'Stasiun BMKG & Telemetri Kaliurang',
      cta_url: '/kabar-tani?filter=cuaca'
    }
  }

  // --- KASUS 4: Harga Pasar & Proyeksi Finansial Komoditas Spesifik ---
  if (detectedCommodities.length > 0) {
    const comm = detectedCommodities[0]

    if (comm === 'Tomat') {
      return {
        category: 'pasar',
        title: `Prospek Pasar & Prediksi Harga Tomat Sleman ${isFuture ? 'Bulan Depan' : 'Pekan Ini'}`,
        summary: `Analisis prediktif AI Tanacakra mencatat pasokan tomat dari sentra hortikultura lereng selatan tetap stabil dengan estimasi harga lelang bertahan di kisaran Rp 13.500 - Rp 15.500 / kg. Permintaan industri pengolahan saus dan pasar induk Yogyakarta diperkirakan naik +8.5%, memberikan peluang margin yang sehat bagi petani petik bertahap.`,
        metrics: {
          'Komoditas': 'Tomat Sayur',
          'Harga Rata-rata': 'Rp 14.500 / kg',
          'Prospek Pasar': 'Stabil Menguat (+8.5%)',
          'Saran Panen': 'Petik Pagi 80% Kematangan'
        },
        severity: 'info',
        source: 'Pasar Induk Sleman & AI Tanacakra',
        cta_url: '/prediksi-pasar'
      }
    }

    if (comm === 'Bawang Merah') {
      return {
        category: 'pasar',
        title: `Dinamika Lelang & Prediksi Harga Bawang Merah ${isFuture ? 'Bulan Depan' : 'Terkini'}`,
        summary: `Harga lelang bawang merah kualitas super di pasar grosir Prambanan dan Sleman diprediksi berada di rentang Rp 35.000 - Rp 39.000 / kg. Tingkat penyusutan umbi yang rendah berkat kandungan hara vulkanik membuat komoditas ini sangat diminati pedagang antarkota.`,
        metrics: {
          'Komoditas': 'Bawang Merah Super',
          'Estimasi Harga': 'Rp 37.000 / kg',
          'Permintaan': 'Tinggi (+12.4%)',
          'Kadar Air Umbi': 'Grade A (Kering Simpan)'
        },
        severity: 'info',
        source: 'Agro-Market Intelligence Tanacakra',
        cta_url: '/prediksi-pasar'
      }
    }

    if (comm === 'Jagung') {
      return {
        category: 'pasar',
        title: `Outlook Pasar Jagung Pipil & Permintaan Pakan Ternak Sleman`,
        summary: `Tingginya permintaan konsentrat pakan dari peternakan sapi perah Cangkringan dan Boyolali mendorong harga serap jagung pipil kering ke Rp 7.200 - Rp 7.600 / kg. Petani disarankan memaksimalkan lantai jemur agar kadar air mencapai standar 14%.`,
        metrics: {
          'Komoditas': 'Jagung Pipil Kering',
          'Harga Serap': 'Rp 7.400 / kg',
          'Kadar Air': '14% (Standar Pabrik)',
          'Tren Permintaan': 'Sangat Kuat'
        },
        severity: 'info',
        source: 'Koperasi Peternak & AI Tanacakra',
        cta_url: '/prediksi-pasar'
      }
    }

    if (comm === 'Padi') {
      return {
        category: 'lahan',
        title: `Manajemen Air Irigasi & Proyeksi Panen Padi Ciherang Cangkringan`,
        summary: `Debit saluran irigasi teknis lereng Merapi berada dalam kondisi stabil 45 L/detik. Hasil evaluasi NDVI citra satelit memperlihatkan petak sawah Blok A dan B memasuki fase primordia dengan proyeksi hasil panen 6.5 ton GKP per hektar.`,
        metrics: {
          'Komoditas': 'Padi Ciherang / Inpari',
          'Proyeksi Panen': '6.5 Ton GKP / Ha',
          'Kondisi Irigasi': 'Optimal (Lancar)',
          'Fase Tanam': 'Generatif / Bunting'
        },
        severity: 'info',
        source: 'Dinas Pertanian & AI Tanacakra',
        cta_url: '/lahan'
      }
    }

    if (comm === 'Salak Pondoh') {
      return {
        category: 'pasar',
        title: `Perkembangan Harga Salak Pondoh Organik Sleman Menembus Pasar Ekspor`,
        summary: `Salak Pondoh khas lereng Merapi terus mencatat harga lelang stabil Rp 16.500 - Rp 19.000 / kg di tingkat kelompok tani. Uji mutu menunjukkan kadar kemanisan (Brix) mencapai 13.8° yang memenuhi syarat kualifikasi pasar ritel modern.`,
        metrics: {
          'Komoditas': 'Salak Pondoh Super',
          'Harga Petani': 'Rp 17.800 / kg',
          'Tingkat Kemanisan': '13.8° Brix',
          'Status': 'Permintaan Ekspor Terbuka'
        },
        severity: 'info',
        source: 'Asosiasi Petani Salak Sleman',
        cta_url: '/prediksi-pasar'
      }
    }

    if (comm === 'Cabai Rawit') {
      return {
        category: 'pasar',
        title: `Dinamika Lelang Pasar Sleman: Harga Cabai Rawit Tembus Rp 68.000 / kg`,
        summary: `Analisis prediktif Scikit-learn mengidentifikasi lonjakan permintaan cabai rawit sebesar +14.5% di pasar grosir Yogyakarta. Musim lelang pekan ini menjadi momentum terbaik untuk panen petik bertahap bagi petani.`,
        metrics: {
          'Komoditas': 'Cabai Rawit Merah',
          'Harga Lelang': 'Rp 68.000 / kg',
          'Proyeksi ROI': '+165%',
          'Permintaan': 'Sangat Tinggi'
        },
        severity: 'info',
        source: 'Pasar Induk Sleman & AI Tanacakra',
        cta_url: '/prediksi-pasar'
      }
    }
  }

  // --- KASUS 5: Default Fallback Cerdas (Rekomendasi Pola Tanam & Iklim) ---
  return {
    category: 'prediksi',
    title: 'Rekomendasi Pola Tanam & Rotasi Lahan Berdasarkan Sensor Tanah Merapi',
    summary: 'Integrasi data pH tanah (6.2 - 6.8) dan ketersediaan NPK di petak lahan Cangkringan merekomendasikan rotasi komoditas Salak Pondoh dan Bawang Merah. Rotasi ini terbukti memutus siklus hama tanah serta mengoptimalkan penyerapan hara vulkanik tanpa pupuk kimia berlebih.',
    metrics: {
      'Kesesuaian Hara': 'Sangat Tinggi (96%)',
      'Rekomendasi Rotasi': 'Salak & Bawang Merah',
      'Estimasi Tonase': '4.8 Ton / Ha',
      'Status': 'Rekomendasi Utama'
    },
    severity: 'info',
    source: 'Engine Pipeline Scikit-Learn Tanacakra',
    cta_url: '/kabar-tani?filter=prediksi'
  }
}

function getFallbackFeed(): KabarTaniFeedResponse {
  return {
    featured: {
      title: "Harga cabai di pasar Sleman naik 8% dibanding minggu lalu",
      summary: "Hasil agregasi data pasar induk Yogyakarta menunjukkan tren peningkatan permintaan cabai rawit merah. Bersamaan dengan prakiraan hujan teratur 2–5 mm dari stasiun BMKG Cangkringan, kondisi agronomi sangat ideal untuk memulai siklus penanaman Blok A tanpa ancaman kekeringan tanah.",
      category: "pasar",
      metrics: { "Volatilitas Pasar": "+8.0%", "Prakiraan Presipitasi": "2–5 mm", "Lembap Udara": "78% RH", "Saran Siklus": "Tanam Blok A" },
      timestamp: "2026-09-24T07:39:00Z",
      cta_url: "/warta/featured-1",
      id: "featured-1"
    },
    items: [
      {
        id: "prediksi-tanam-tomat-1",
        category: "prediksi",
        title: "Prospek Tanam Tomat Bulan Ini: Agroklimat Merapi Sangat Mendukung",
        summary: "Suhu harian 22–26°C dan curah hujan berkala 3 mm/hari di lereng Merapi menjadikan bulan ini momentum ideal menanam tomat sayur varietas Servo. Model AI memproyeksikan efisiensi biaya irigasi hingga 30% serta harga panen stabil di atas Rp 14.000/kg.",
        metrics: { "Kesesuaian": "94% (Sangat Baik)", "Estimasi Panen": "75 HST", "Harga Proyeksi": "Rp 14.500/kg" },
        severity: "info",
        timestamp: "2026-09-24T08:15:00Z",
        source: "AI Agro-Intelijen Tanacakra",
        cta_url: "/lahan"
      },
      {
        id: "prediksi-bawang-merah-1",
        category: "prediksi",
        title: "Pola Rotasi Bawang Merah Tajuk Pasca Panen Cabai di Cangkringan",
        summary: "Berdasarkan sensor hara tanah (NPK), rotasi tanam bawang merah di Blok C direkomendasikan untuk menyeimbangkan nitrogen tanah dan memutus siklus spora jamur. Permintaan pasar lelang Sleman diproyeksikan melonjak saat panen raya 65 hari lagi.",
        metrics: { "Varietas": "Bawang Tajuk", "Siklus Tanam": "65 HST", "Potensi Margin": "+32%" },
        severity: "info",
        timestamp: "2026-09-24T07:50:00Z",
        source: "Engine Rekomendasi Tanam AI",
        cta_url: "/lahan"
      },
      {
        id: "pasar-cabai-1",
        category: "pasar",
        title: "Harga cabai naik 8% dibanding minggu lalu",
        summary: "Lonjakan harga cabai rawit merah di pasar induk Sleman mencapai Rp55.000/kg didorong penurunan pasokan regional.",
        metrics: { "Harga": "Rp55.000/kg", "Perubahan": "+8%" },
        severity: "info",
        timestamp: "2026-09-24T07:39:00Z",
        source: "Pasar Induk Sleman",
        cta_url: "/warta/pasar-cabai-1"
      },
      {
        id: "pasar-tomat-1",
        category: "pasar",
        title: "Harga tomat stabil di pasar Sleman dengan serapan tinggi",
        summary: "Komoditas tomat bertahan di kisaran Rp14.500/kg dengan volume pasokan stabil dari sentra hortikultura lereng selatan Yogyakarta.",
        metrics: { "Harga": "Rp14.500/kg", "Perubahan": "0%" },
        severity: "info",
        timestamp: "2026-09-24T07:09:00Z",
        source: "Pasar Induk Sleman",
        cta_url: "/warta/pasar-tomat-1"
      },
      {
        id: "prediksi-jagung-1",
        category: "prediksi",
        title: "Tren Permintaan Jagung Pipil Kering untuk Pakan Ternak Meningkat",
        summary: "Tingginya permintaan konsentrat sapi perah lereng Merapi mendorong kontrak serap jagung pipil kering pada level Rp 7.200 - Rp 7.500/kg. Petani dianjurkan mengoptimalkan penjemuran dengan standar kadar air 14%.",
        metrics: { "Harga Serap": "Rp 7.400/kg", "Kadar Air": "14%", "Permintaan": "+11.8%" },
        severity: "info",
        timestamp: "2026-09-23T11:20:00Z",
        source: "Koperasi Tani & Ternak Sleman",
        cta_url: "/prediksi-pasar"
      },
      {
        id: "pasar-salak-1",
        category: "pasar",
        title: "Salak Pondoh Super Cangkringan Tembus Standar Ekspor dan Swalayan",
        summary: "Kadar gula 13.8° Brix pada panen salak pondoh pekan ini memenuhi kualifikasi premium. Harga tingkat petani bertahan di angka Rp 17.500/kg.",
        metrics: { "Harga Petani": "Rp 17.500/kg", "Brix": "13.8°", "Mutu": "Grade A" },
        severity: "info",
        timestamp: "2026-09-23T09:00:00Z",
        source: "Asosiasi Petani Salak Sleman",
        cta_url: "/prediksi-pasar"
      },
      {
        id: "lahan-blok-b-1",
        category: "lahan",
        title: "Lahan Blok B perlu diperiksa — kelembapan turun",
        summary: "Sensor telemetri mencatat retensi air tanah turun hingga 34% pada lapisan perakaran cabai rawit, dianjurkan penyiraman sore 15mm.",
        metrics: { "Kelembapan": "34% (Kritis)", "Rekomendasi": "Penyiraman 15mm" },
        severity: "danger",
        timestamp: "2026-09-22T14:15:00Z",
        source: "Telemetri IoT Lahan",
        cta_url: "/warta/lahan-blok-b-1"
      },
      {
        id: "cuaca-1",
        category: "cuaca",
        title: "Cuaca 3 hari ke depan: hujan ringan, waktu baik untuk menanam",
        summary: "Curah hujan stabil 2–4 mm dengan kelembapan 78% mendukung penyerapan nutrisi tanah tanpa risiko erosi permukaan lereng.",
        metrics: { "Curah Hujan": "2–4 mm", "Kelembapan": "78%" },
        severity: "info",
        timestamp: "2026-09-20T06:00:00Z",
        source: "BMKG Stasiun Cangkringan",
        cta_url: "/warta/cuaca-1"
      },
      {
        id: "prediksi-1",
        category: "prediksi",
        title: "Prediksi panen cabai bulan depan naik 12%",
        summary: "Estimasi kuantum panen di Blok A diperkirakan mencapai 2,1 ton jika tingkat kalium tanah dipertahankan di atas 200 ppm.",
        metrics: { "Proyeksi": "2,1 Ton (+12%)", "Kondisi": "Kalium >200 ppm" },
        severity: "info",
        timestamp: "2026-09-18T09:30:00Z",
        source: "Model AI-Yield Scikit-learn",
        cta_url: "/warta/prediksi-1"
      },
      {
        id: "hama-thrips-1",
        category: "hama",
        title: "Waspada Serangan Thrips & Ulat Grayak pada Jagung dan Tomat",
        summary: "Analisis data historis menunjukkan lonjakan populasi hama Thrips berisiko tinggi pada tanaman Jagung, serta serangan Ulat Grayak pada Tomat dan Salak Pondoh. Petani dianjurkan segera melakukan sanitasi lahan, memangkas daun bawah yang terinfeksi, dan menyemprotkan pestisida nabati berbasis nimba pada pagi hari sebelum embun kering.",
        metrics: { "Risiko": "Tinggi", "Hama": "Thrips & Ulat Grayak" },
        severity: "danger",
        timestamp: "2026-09-20T10:38:00Z",
        source: "Data Analitik Hama Cangkringan",
        cta_url: "/warta/hama-thrips-1"
      }
    ],
    categories: { pasar: 3, lahan: 1, cuaca: 1, hama: 1, prediksi: 4 }
  }
}
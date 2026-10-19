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
  } catch (e) {
    console.error("AI Generation failed, falling back to static", e)
  }
  // Fallback to static if API fails
  return generateAiWartaArticle(topicPrompt)
}

export function generateAiWartaArticle(topicPrompt: string): Omit<KabarTaniItem, 'id' | 'timestamp'> {
  const prompt = topicPrompt.toLowerCase()

  // Komoditas detection
  const isTomat = prompt.includes('tomat')
  const isBawang = prompt.includes('bawang')
  const isJagung = prompt.includes('jagung')
  const isPadi = prompt.includes('padi') || prompt.includes('beras')
  const isSalak = prompt.includes('salak')
  const isCabai = prompt.includes('cabai') || prompt.includes('cabe') || prompt.includes('rawit')

  // Topic detection
  const isHama = prompt.includes('hama') || prompt.includes('penyakit') || prompt.includes('kutu') || prompt.includes('ulat') || prompt.includes('wereng') || prompt.includes('busuk')
  const isCuaca = prompt.includes('cuaca') || prompt.includes('merapi') || prompt.includes('hujan') || prompt.includes('la nina') || prompt.includes('kemarau')
  const isHargaPasar = prompt.includes('harga') || prompt.includes('pasar') || prompt.includes('lelang') || prompt.includes('prediksi') || prompt.includes('tren') || prompt.includes('bulan depan')

  // 1. Spesisik Tomat
  if (isTomat) {
    if (isHama) {
      return {
        category: 'hama',
        title: 'Mitigasi Hawar Daun & Ulat Buah pada Budidaya Tomat Cangkringan',
        summary: 'Peningkatan kelembapan malam hari di lereng Merapi memicu spora hawar daun (Phytophthora infestans) dan ulat buah Helicoverpa armigera pada pertanaman tomat. Disarankan aplikasi fungisida tembaga terukur serta pemangkasan daun bawah penopang buah.',
        metrics: {
          'Komoditas': 'Tomat Sayur & Buah',
          'Faktor Pemicu': 'RH >85% & Embun Tebal',
          'Tingkat Risiko': 'Moderat (Siaga 3)',
          'Tindakan': 'Pemangkasan & Sanitasi Daun'
        },
        severity: 'warning',
        source: 'Sistem Deteksi Dini AI Tanacakra',
        cta_url: '/kabar-tani?filter=hama'
      }
    }
    // Default or Harga/Pasar Tomat
    return {
      category: 'pasar',
      title: 'Prospek Pasar & Prediksi Harga Tomat Sleman Bulan Depan',
      summary: 'Analisis prediktif deret waktu AI Tanacakra mengindikasikan stabilisasi harga tomat sayur di kisaran Rp 12.500 - Rp 15.000 / kg pada awal bulan depan. Peningkatan permintaan industri olahan dan pasokan stabil dari kawasan lereng Merapi menjadi pendorong stabilitas margin laba petani.',
      metrics: {
        'Komoditas': 'Tomat Segar',
        'Estimasi Harga': 'Rp 14.500 / kg',
        'Tren Permintaan': '+9.2% (Meningkat)',
        'Model AI': 'RandomForest R²=0.89'
      },
      severity: 'info',
      source: 'Pasar Induk Sleman & AI Tanacakra',
      cta_url: '/prediksi-pasar'
    }
  }

  // 2. Spesifik Bawang Merah
  if (isBawang) {
    return {
      category: isHama ? 'hama' : 'pasar',
      title: isHama ? 'Antisipasi Ulat Grayak & Bercak Ungu (Alternaria) Bawang Merah' : 'Dinamika Pasokan & Harga Bawang Merah Cangkringan',
      summary: isHama 
        ? 'Deteksi lapangan mendeteksi populasi Spodoptera exigua pada fase pembentukan umbi bawang merah. Diperlukan rotasi insektisida hayati dan sanitasi gulma sekitar pematang.'
        : 'Analisis pasar komoditas mencatat harga lelang bawang merah stabil di kisaran Rp 34.000 - Rp 38.000 / kg didukung kualitas umbi padat hasil abu vulkanik lereng Merapi.',
      metrics: {
        'Komoditas': 'Bawang Merah',
        'Harga Rata-rata': 'Rp 36.500 / kg',
        'Kualitas Umbi': 'Grade A (Super)',
        'Status': 'Rekomendasi Panen Terukur'
      },
      severity: isHama ? 'warning' : 'info',
      source: 'Agro-Market Intelligence Tanacakra',
      cta_url: '/prediksi-pasar'
    }
  }

  // 3. Spesifik Jagung
  if (isJagung) {
    return {
      category: isHama ? 'hama' : 'pasar',
      title: isHama ? 'Kewaspadaan Serangan Ulat Grayak Jagung (FAW) Lereng Merapi' : 'Outlook Panen Jagung Pipil & Fluktuasi Permintaan Pakan Ternak',
      summary: isHama
        ? 'Fall Armyworm (Spodoptera frugiperda) teridentifikasi pada pucuk tanaman jagung umur 20-35 HST. Petani diimbau memasang perangkap feromon dan monitoring berkala.'
        : 'Proyeksi permintaan jagung pipil kering melonjak +11% dari sentra peternakan Sleman dan Boyolali dengan kisaran harga serap Rp 6.800 - Rp 7.500 / kg.',
      metrics: {
        'Komoditas': 'Jagung Pipil',
        'Estimasi Serap': 'Rp 7.200 / kg',
        'Kadar Air Optimal': '14 - 15%',
        'Model Prediksi': 'XGBoost Regressor'
      },
      severity: isHama ? 'warning' : 'info',
      source: 'Data Pasar & AI Tanacakra',
      cta_url: '/prediksi-pasar'
    }
  }

  // 4. Spesifik Padi
  if (isPadi) {
    return {
      category: isHama ? 'hama' : (isCuaca ? 'cuaca' : 'lahan'),
      title: 'Optimalisasi Pola Air & Siklus Tanam Padi Sawah Cangkringan',
      summary: 'Ketersediaan debit air dari hulu Kali Boyong dan Kali Kuning stabil untuk mendukung fase bunting padi varietas Ciherang dan Inpari. Disarankan pemupukan berimbang NPK dan silika vulkanik.',
      metrics: {
        'Komoditas': 'Padi Sawah',
        'Debit Irigasi': 'Optimal (45 L/detik)',
        'Fase Tanam': 'Generatif / Bunting',
        'Prediksi Hasil': '6.4 Ton GKP / Ha'
      },
      severity: 'info',
      source: 'Balai Penyuluhan Pertanian & AI Tanacakra',
      cta_url: '/kabar-tani'
    }
  }

  // 5. Spesifik Salak Pondoh
  if (isSalak) {
    return {
      category: 'pasar',
      title: 'Perkembangan Lelang Buah Salak Pondoh Sleman & Rantai Ekspor',
      summary: 'Permintaan salak pondoh organik lereng Merapi mengalami penguatan di pasar swalayan dan gerai ekspor Yogyakarta. Harga tingkat petani bertahan di Rp 16.000 - Rp 19.000 / kg.',
      metrics: {
        'Komoditas': 'Salak Pondoh',
        'Harga Petani': 'Rp 17.500 / kg',
        'Kadar Gula (Brix)': '13.5° (Manis Optimal)',
        'Status Pasar': 'Permintaan Tinggi'
      },
      severity: 'info',
      source: 'Koperasi Tani Sleman & AI Tanacakra',
      cta_url: '/prediksi-pasar'
    }
  }

  // 6. Generic Topics (Hama, Cuaca, Cabai / Harga umum)
  if (isHama) {
    return {
      category: 'hama',
      title: 'Peringatan Dini Agronomi: Potensi Serangan Hama di Lahan Cangkringan',
      summary: 'Berdasarkan data analitik historis pertanian lereng Merapi, kelembapan tinggi memicu perkembangbiakan vektor hama. Para petani diimbau untuk segera menerapkan sanitasi gulma dan bio-pestisida secara berkala.',
      metrics: {
        'Tingkat Risiko': 'Tinggi (Siaga 2)',
        'Komoditas Rentan': 'Cabai, Tomat, Jagung',
        'Hama Utama': 'Thrips, Ulat Grayak',
        'Rekomendasi': 'Sanitasi & Bio-Pestisida'
      },
      severity: 'warning',
      source: 'Data Analitik & Rekomendasi AI Tanacakra',
      cta_url: '/kabar-tani?filter=hama'
    }
  }

  if (isCuaca) {
    return {
      category: 'cuaca',
      title: 'Prakiraan Presipitasi & Asam Vulkanik: Antisipasi Cuaca Lereng Merapi',
      summary: 'Stasiun telemetri Kaliurang mencatat potensi hujan vulkanik skala sedang (3.5 mm/jam) dalam 48 jam mendatang. Hasil simulasi hidrologi menyarankan perbaikan saluran drainase bedengan.',
      metrics: {
        'Curah Hujan': '3.5 mm/jam',
        'pH Air Hujan': '5.2 (Asam)',
        'Mitigasi': 'Tambah Dolomit 25kg/ha',
        'Status': 'Perlu Tindakan'
      },
      severity: 'danger',
      source: 'Stasiun BMKG & Telemetri Kaliurang',
      cta_url: '/kabar-tani?filter=cuaca'
    }
  }

  if (isHargaPasar || isCabai) {
    return {
      category: 'pasar',
      title: 'Dinamika Lelang Pasar Sleman: Harga Cabai Rawit Tembus Rp 68.000 / kg',
      summary: 'Analisis prediktif Scikit-learn mengidentifikasi lonjakan permintaan cabai rawit sebesar +14.5% di pasar grosir Yogyakarta. Musim lelang pekan ini menjadi momentum terbaik untuk panen petik parsial di Blok B.',
      metrics: {
        'Harga Lelang': 'Rp 68.000 / kg',
        'Proyeksi ROI': '+165%',
        'Permintaan': 'Sangat Tinggi',
        'Model AI': 'RandomForest R²=0.91'
      },
      severity: 'info',
      source: 'Pasar Induk Sleman & AI Tanacakra',
      cta_url: '/prediksi-pasar'
    }
  }

  // Default Fallback
  return {
    category: 'prediksi',
    title: 'Rekomendasi Optimalisasi Pola Tanam Musim Gadu Cangkringan',
    summary: 'Berdasarkan integrasi data pH tanah (6.2 - 6.8) dan ketersediaan NPK di 108 petak lahan, model AI Tanacakra merekomendasikan rotasi komoditas Salak Pondoh dan Bawang Merah untuk menjaga ketersediaan hara organik.',
    metrics: {
      'Kesesuaian Hara': 'Sangat Tinggi (96%)',
      'Rotasi Komoditas': 'Salak & Bawang',
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
        title: "Harga tomat stabil di pasar Sleman",
        summary: "Komoditas tomat bertahan di kisaran Rp14.500/kg dengan volume pasokan stabil dari sentra hortikultura lereng selatan.",
        metrics: { "Harga": "Rp14.500/kg", "Perubahan": "0%" },
        severity: "info",
        timestamp: "2026-09-24T07:09:00Z",
        source: "Pasar Induk Sleman",
        cta_url: "/warta/pasar-tomat-1"
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
        summary: "Curah hujan stabil 2 mm dengan kelembapan 78% mendukung penyerapan nutrisi tanah tanpa risiko erosi permukaan.",
        metrics: { "Curah Hujan": "2 mm", "Kelembapan": "78%" },
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
        summary: "Analisis data historis menunjukkan lonjakan populasi hama Thrips berisiko tinggi pada tanaman Jagung, serta serangan Ulat Grayak pada Tomat dan Salak Pondoh. Petani dianjurkan segera melakukan sanitasi lahan, memangkas daun bawah yang terinfeksi, dan menyemprotkan pestisida nabati berbasis nimba pada pagi hari sebelum embun kering. Hama ini bisa menyebar sangat cepat akibat fluktuasi kelembapan di wilayah lereng Merapi.",
        metrics: { "Risiko": "Tinggi", "Hama": "Thrips & Ulat Grayak" },
        severity: "danger",
        timestamp: "2026-09-20T10:38:00Z",
        source: "Data Analitik Hama Cangkringan",
        cta_url: "/warta/hama-thrips-1"
      }
    ],
    categories: { pasar: 2, lahan: 1, cuaca: 1, hama: 1, prediksi: 1 }
  }
}
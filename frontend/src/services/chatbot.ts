import { ref } from 'vue'
import { api } from './api'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
  category?: 'hama' | 'pupuk' | 'cuaca' | 'pasar' | 'agronomi'
  suggestions?: string[]
}

const CHAT_STORAGE_KEY = 'tanacakra_chat_history'

// Curated agronomic knowledge engine for Cangkringan & Mount Merapi slopes
const AGRONOMIC_KNOWLEDGE: { keywords: string[]; category: 'hama' | 'pupuk' | 'cuaca' | 'pasar' | 'agronomi'; response: string; suggestions?: string[] }[] = [
  {
    keywords: ['ph', 'asam', 'masam', 'kapur', 'dolomit'],
    category: 'pupuk',
    response: `Tanah di lereng Merapi Cangkringan didominasi jenis **Regosol Vulkanik**. Jika pH tanah di bawah 6.0 (masam):
1. **Aplikasi Dolomit**: Berikan kapur dolomit (*CaMg(CO3)2*) sekitar 1-2 ton/ha (atau 100-200 gram/m²) 2-3 minggu sebelum tanam.
2. **Kandungan Magnesium**: Dolomit sekaligus mensuplai Mg yang esensial untuk pembentukan klorofil pada tanah pasca-erupsi.
3. **Pemberian Kompos Organik**: Campurkan pupuk kandang sapi/kambing yang matang (5-10 ton/ha) untuk meningkatkan kapasitas tukar kation (KTK).`,
    suggestions: ['Berapa dosis pupuk NPK untuk padi?', 'Cara menguji pH tanah sendiri?', 'Rekomendasi pupuk dasar cabai']
  },
  {
    keywords: ['pupuk', 'dosis', 'urea', 'npk', 'sp-36', 'kcl', 'pemupukan'],
    category: 'pupuk',
    response: `Panduan pemupukan berimbang untuk lahan Cangkringan:
- **Padi Sawah (Per Hektar)**:
  - Dasar (H-1 tanam): 100 kg SP-36 + 50 kg Urea + pupuk organik.
  - Susulan I (14-21 HST): 100 kg Urea + 50 kg Phonska.
  - Susulan II (35-42 HST): 50 kg Urea + 50 kg KCl.
- **Cabai Merah**:
  - Berikan NPK 16-16-16 secara kocor per 7-10 hari sekali (2-3 kg / 200 liter air untuk 1.000 tanaman).
  - Tambahkan kalsium nitrat untuk mencegah busuk ujung buah (*blossom end rot*).`,
    suggestions: ['Penyebab daun cabai menguning?', 'Cara mengatasi tanah gembur cepat kering', 'Kebutuhan kapur per petak']
  },
  {
    keywords: ['patek', 'antraknosa', 'jamur', 'hama', 'busuk', 'wereng', 'ulat'],
    category: 'hama',
    response: `Pengendalian terpadu hama & penyakit lereng Merapi:
- **Antraknosa / Patek Cabai (Colletotrichum)**:
  - Sering merebak saat kelembapan udara >80% di musim penghujan Cangkringan.
  - Bersihkan buah yang terinfeksi dan bakar/kubur jauh dari lahan.
  - Semprot fungisida berbahan aktif mankozeb, klorotalonil, atau difenokonazol secara rotasi.
  - Lebarkan jarak tanam (minimal 60x70 cm) agar sirkulasi udara optimal.
- **Wereng Batang Coklat Padi**:
  - Keringkan petakan sawah secara berkala (irigasi berselang / intermitten).
  - Gunakan agen hayati jamur *Beauveria bassiana* pada fase awal.`,
    suggestions: ['Fungisida terbaik musim hujan', 'Jadwal tanam cabai optimal', 'Prakiraan cuaca Cangkringan']
  },
  {
    keywords: ['cuaca', 'hujan', 'angin', 'kemarau', 'bmkg', 'kabut'],
    category: 'cuaca',
    response: `Karakteristik agroklimat wilayah Cangkringan (ketinggian 450 - 900 mdpl):
- **Suhu Rata-rata**: 21°C - 26°C dengan kelembapan relatif tinggi (75% - 90%).
- **Musim Tanam I (Oktober - Februari)**: Curah hujan tertinggi, sangat ideal untuk budidaya padi sawah.
- **Musim Tanam II (Maret - Juni)**: Cocok untuk rotasi palawija dan jagung.
- **Musim Tanam III (Juli - September)**: Bulan terkering, terbaik untuk cabai merah dan salak pondoh namun wajib didukung irigasi teratur.`,
    suggestions: ['Analisis korelasi curah hujan', 'Varietas padi tahan cuaca dingin', 'Cara kerja irigasi tetes']
  },
  {
    keywords: ['pasar', 'harga', 'jual', 'tengkulak', 'panen', 'salak', 'cabai', 'padi'],
    category: 'pasar',
    response: `Tren komoditas pasar Cangkringan & Pasar Agribisnis Sleman:
- **Cabai Merah Keriting**: Fluktuasi tinggi; harga cenderung mencapai puncak pada bulan November-Desember dan menjelang Ramadhan/Lebaran.
- **Beras Mentik Wangi / Rojolele Merapi**: Memiliki harga premium stabil (Rp 15.000 - Rp 18.000/kg) karena aroma harum dari tanah vulkanik.
- **Salak Pondoh Cangkringan**: Permintaan ekspor dan pasar lokal stabil, panen raya biasanya pada bulan Desember - Februari.`,
    suggestions: ['Buka menu Prediksi Pasar', 'Estimasi keuntungan per hektar', 'Rekomendasi komoditas bulan ini']
  },
  {
    keywords: ['vulkanik', 'merapi', 'abu', 'lahar', 'kesuburan', 'regosol'],
    category: 'agronomi',
    response: `Keunggulan dan tantangan tanah vulkanik Merapi:
- **Keunggulan**: Kaya akan mineral hara primer (P, K, Ca, Mg) yang dilepaskan secara bertahap saat abu vulkanik mengalami pelapukan.
- **Tantangan**: Tanah regosol memiliki tekstur berpasir dengan daya ikat air (*water holding capacity*) yang rendah, sehingga pupuk nitrogen mudah tercuci (*leaching*) oleh air hujan.
- **Solusi**: Tingkatkan bahan organik tanah dengan pupuk hijau dan mulsa jerami untuk memperlambat penguapan air.`,
    suggestions: ['Cara membuat kompos jerami', 'Dosis pupuk Urea untuk tanah berpasir', 'Uji kesuburan tanah petak']
  }
]

function getInitialChat(): ChatMessage[] {
  return [
    {
      id: 'init-msg',
      role: 'assistant',
      text: 'Halo Bapak/Ibu Petani! Saya **Cakra AI**, asisten agronomi presisi Tanacakra untuk wilayah Cangkringan lereng Merapi. Ada yang bisa saya bantu terkait pupuk, hama, cuaca, atau kondisi lahan Anda hari ini?',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      category: 'agronomi',
      suggestions: [
        'Cara menaikkan pH tanah masam di Cangkringan?',
        'Dosis pemupukan padi sawah yang tepat?',
        'Pengendalian antraknosa / patek cabai',
        'Waktu tanam terbaik berdasarkan cuaca'
      ]
    }
  ]
}

export const chatMessages = ref<ChatMessage[]>(loadChatHistory())
export const isAiThinking = ref(false)

function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return getInitialChat()
}

function saveChatHistory() {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages.value))
  } catch {}
}

export function clearChatHistory() {
  chatMessages.value = getInitialChat()
  saveChatHistory()
}

export async function sendChatMessage(userText: string): Promise<void> {
  const clean = userText.trim()
  if (!clean) return

  const userMsg: ChatMessage = {
    id: 'user-' + Date.now(),
    role: 'user',
    text: clean,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }
  chatMessages.value.push(userMsg)
  saveChatHistory()

  isAiThinking.value = true

  try {
    // Attempt backend LLM query first if online
    let answerText = ''
    let answerCategory: ChatMessage['category'] = 'agronomi'
    let answerSuggestions: string[] | undefined = undefined

    if (navigator.onLine && localStorage.getItem('tanacakra_force_offline') !== 'true') {
      try {
        const res = await api.post('/kabar-tani/generate', {
          prompt: `Pertanyaan petani Cangkringan lereng Merapi: "${clean}". Berikan jawaban praktis, ilmiah, ramah petani dalam bahasa Indonesia singkat padat.`
        }, { timeout: 6000 })

        if (res.data && res.data.summary) {
          answerText = `${res.data.summary}\n\n**Rekomendasi Tindakan:**\n${Object.entries(res.data.metrics || {}).map(([k, v]) => `• ${k}: ${v}`).join('\n')}`
          answerCategory = res.data.category || 'agronomi'
        }
      } catch {
        // Fallback to local expert agronomic engine
      }
    }

    if (!answerText) {
      // Simulate realistic typing delay for local agronomy engine
      await new Promise(r => setTimeout(r, 650))
      const lower = clean.toLowerCase()
      const match = AGRONOMIC_KNOWLEDGE.find(item => item.keywords.some(k => lower.includes(k)))

      if (match) {
        answerText = match.response
        answerCategory = match.category
        answerSuggestions = match.suggestions
      } else {
        answerText = `Mengenai pertanyaan Anda tentang *"${clean}"*, untuk kondisi spesifik tanah regosol vulkanik di Cangkringan:
1. Pastikan drainase petakan lancar guna mencegah penyakit tular tanah saat kelembapan tinggi.
2. Lakukan pengecekan pH tanah secara berkala (kisaran ideal 6.0 - 7.0).
3. Anda juga dapat berkonsultasi langsung dengan Penyuluh BPP Cangkringan melalui Poktan Kalurahan setempat.

Silakan pilih topik terkait di bawah untuk panduan lebih lanjut:`
        answerCategory = 'agronomi'
        answerSuggestions = [
          'Cara menaikkan pH tanah masam di Cangkringan?',
          'Dosis pemupukan padi sawah yang tepat?',
          'Pengendalian antraknosa / patek cabai'
        ]
      }
    }

    const aiMsg: ChatMessage = {
      id: 'ai-' + Date.now(),
      role: 'assistant',
      text: answerText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      category: answerCategory,
      suggestions: answerSuggestions
    }

    chatMessages.value.push(aiMsg)
    saveChatHistory()
  } finally {
    isAiThinking.value = false
  }
}

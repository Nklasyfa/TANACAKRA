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

// Curated conversational intents (greetings, identity, thanks, assistance)
const CONVERSATIONAL_INTENTS = [
  {
    matches: (t: string) => /^(hai|halo|helo|hello|hi|hei|hay|pagi|siang|sore|malam|assalamu|salam|tes|test|ping)\b/i.test(t),
    response: `Halo Bapak/Ibu Petani! 👋 Senang bisa menyapa Anda.

Saya **Cakra AI**, asisten agronomi presisi Tanacakra untuk wilayah Cangkringan lereng Merapi. Ada yang bisa saya bantu hari ini seputar kondisi tanah, pemupukan berimbang, penanganan hama, atau perkiraan panen di petak lahan Anda?`,
    suggestions: [
      'Berapa dosis pupuk NPK untuk padi?',
      'Cara mengatasi patek (antraknosa) cabai?',
      'Cara menaikkan pH tanah masam dengan dolomit?',
      'Prakiraan cuaca & musim tanam Cangkringan'
    ]
  },
  {
    matches: (t: string) => /(siapa kamu|kamu siapa|apa itu cakra|tentang cakra|bisa apa|fitur apa|kemampuanmu)/i.test(t),
    response: `Saya adalah **Cakra AI**, asisten cerdas agronomi presisi lereng Merapi yang dikembangkan mendampingi petani dan Penyuluh BPP Kapanewon Cangkringan.

Saya dapat membantu Anda dalam:
1. **Rekomendasi Pemupukan**: Menghitung takaran pupuk N-P-K, Urea, SP-36, dan Dolomit per petak.
2. **Klinik Hama & Penyakit**: Deteksi dan solusi pengendalian antraknosa (patek), wereng, thrips, dan penyakit tular tanah.
3. **Agroklimat & Cuaca**: Panduan musim tanam dan kalender irigasi berdasarkan telemetri BMKG lereng Merapi.
4. **Analisis Lahan & Pasar**: Estimasi tonase panen dan dinamika harga lelang komoditas di Kabupaten Sleman.`,
    suggestions: [
      'Dosis pemupukan dasar cabai',
      'Karakteristik tanah regosol vulkanik',
      'Gejala kekurangan kalium pada padi',
      'Prediksi pasar komoditas minggu ini'
    ]
  },
  {
    matches: (t: string) => /(makasih|terima kasih|matur nuwun|thanks|thank you|makasi)/i.test(t),
    response: `Sama-sama Bapak/Ibu! Senang sekali bisa membantu Anda. 🙏

Semoga usaha taninya selalu lancar, tanahnya subur lestari, dan hasil panennya melimpah berkah. Jika ada kendala lain di petak sawah atau kebun, jangan ragu untuk bertanya lagi ya!`,
    suggestions: [
      'Buka menu Riwayat Lahan',
      'Cek estimasi panen di Beranda',
      'Lihat rekomendasi warta tani'
    ]
  },
  {
    matches: (t: string) => /^(ok|oke|siap|baik|mantap|bagus|yoi|sip)\b/i.test(t),
    response: `Siap! Semoga panduan tersebut bermanfaat di lapangan. Apakah ada hal lain seputar lahan, bibit, atau pemupukan yang ingin Anda diskusikan?`,
    suggestions: [
      'Waktu aplikasi pupuk susulan kedua',
      'Cara membuat pupuk kompos jerami',
      'Penyebab buah cabai busuk ujung'
    ]
  }
]

// Curated agronomic knowledge engine for Cangkringan & Mount Merapi slopes
const AGRONOMIC_KNOWLEDGE: {
  keywords: string[]
  category: 'hama' | 'pupuk' | 'cuaca' | 'pasar' | 'agronomi'
  response: string
  suggestions?: string[]
}[] = [
  {
    keywords: ['ph', 'asam', 'masam', 'kapur', 'dolomit', 'keasaman'],
    category: 'pupuk',
    response: `Tanah lereng Merapi Cangkringan didominasi jenis **Regosol Vulkanik**. Jika pH tanah di bawah 6.0 (masam):
1. **Aplikasi Kapur Dolomit (*CaMg(CO₃)₂*)**: Berikan sekitar 1-2 ton/ha (atau 100-200 gram/m²) pada saat pengolahan tanah (2-3 minggu sebelum tanam).
2. **Kandungan Magnesium (Mg)**: Dolomit sekaligus mensuplai Mg yang esensial untuk klorofil daun pada tanah abu vulkanik.
3. **Pupuk Organik Matang**: Tambahkan kompos atau pupuk kandang sapi/kambing yang telah matang sempurna (5-10 ton/ha) guna menaikkan Kapasitas Tukar Kation (KTK) tanah berpasir.`,
    suggestions: ['Berapa dosis pupuk NPK untuk padi?', 'Cara menguji pH tanah sendiri?', 'Rekomendasi pupuk dasar cabai']
  },
  {
    keywords: ['pupuk', 'dosis', 'urea', 'npk', 'sp-36', 'sp36', 'kcl', 'pemupukan', 'phonska', 'mutiara'],
    category: 'pupuk',
    response: `Panduan dosis pemupukan berimbang spesifik Cangkringan:
- **Padi Sawah (Per Hektar)**:
  - *Dasar (H-1 tanam)*: 100 kg SP-36 + 50 kg Urea + pupuk organik matang.
  - *Susulan I (14-21 HST)*: 100 kg Urea + 50 kg NPK Phonska.
  - *Susulan II (35-42 HST)*: 50 kg Urea + 50 kg KCl saat bunting muda.
- **Cabai Merah**:
  - Berikan NPK 16-16-16 secara kocor per 7-10 hari sekali (2-3 kg dalam 200 liter air untuk 1.000 tanaman).
  - Tambahkan kalsium nitrat (CNG) untuk mempertebal dinding sel dan mencegah busuk pantat buah (*blossom end rot*).`,
    suggestions: ['Penyebab daun cabai menguning?', 'Cara menaikkan pH tanah masam', 'Kebutuhan kapur per petak']
  },
  {
    keywords: ['patek', 'antraknosa', 'jamur', 'busuk', 'bercak', 'blas', 'pathek'],
    category: 'hama',
    response: `Pengendalian terpadu penyakit Antraknosa (Patek) pada cabai:
1. **Sanitasi Petak**: Petik buah yang bergejala awal bercak melingkar, masukkan kantong plastik lalu kubur/bakar jauh dari kebun. Jangan biarkan membusuk di parit.
2. **Pengaturan Drainase**: Pada musim hujan Cangkringan dengan kelembapan >80%, buat guludan tinggi (minimal 40 cm) dan jarak tanam longgar (60x70 cm) agar angin leluasa bersirkulasi.
3. **Aplikasi Fungisida**: Rotasikan fungisida kontak berbahan aktif Mankozeb/Propineb dengan fungisida sistemik berbahan aktif Difenokonazol atau Azoksistrobin seminggu sekali.`,
    suggestions: ['Fungisida terbaik musim hujan', 'Jadwal tanam cabai optimal', 'Prakiraan cuaca Cangkringan']
  },
  {
    keywords: ['wereng', 'thrips', 'kutu', 'kebul', 'ulat', 'grayak', 'penggerek', 'hama'],
    category: 'hama',
    response: `Strategi pengendalian hama hortikultura & pangan lereng Merapi:
- **Thrips & Kutu Kebul (Penyebab Daun Keriting Cabai)**:
  - Pasang perangkap kuning (*yellow sticky trap*) 40 lembar/ha.
  - Semprot insektisida berbahan aktif Abamektin atau Imidakloprid pada sore hari ketika hama aktif di bawah permukaan daun.
- **Penggerek Batang / Sundep Beluk Padi**:
  - Gunakan agen hayati jamur *Beauveria bassiana* atau *Trichoderma* pada persemaian.
  - Pasang lampu perangkap (*light trap*) untuk menangkap ngengat dewasa.`,
    suggestions: ['Cara membuat pestisida nabati tembakau', 'Dosis pupuk NPK cabai', 'Pencegahan patek musim hujan']
  },
  {
    keywords: ['cuaca', 'hujan', 'angin', 'kemarau', 'bmkg', 'kabut', 'iklim'],
    category: 'cuaca',
    response: `Karakteristik agroklimat wilayah Cangkringan (elevasi 450 - 900 mdpl):
- **Suhu Harian**: 21°C - 26°C dengan kelembapan relatif tinggi (75% - 90%).
- **Musim Tanam I (Oktober - Februari)**: Puncak curah hujan (260 - 340 mm/bln), sangat ideal untuk budidaya padi sawah varietas Mentik Wangi atau Rojolele.
- **Musim Tanam II (Maret - Juni)**: Masa peralihan (75 - 190 mm/bln), waktu terbaik menanam jagung hibrida dan palawija.
- **Musim Tanam III (Juli - September)**: Bulan kemarau sejuk (35 - 60 mm/bln), produktivitas panen cabai merah dan salak pondoh tertinggi asalkan irigasi terjaga.`,
    suggestions: ['Buka Analisis Iklim & Korelasi', 'Varietas padi tahan cuaca dingin', 'Cara kerja irigasi tetes']
  },
  {
    keywords: ['pasar', 'harga', 'jual', 'tengkulak', 'panen', 'salak', 'cabai', 'padi', 'jagung', 'tomat'],
    category: 'pasar',
    response: `Dinamika pasar & komoditas unggulan lereng Merapi:
- **Cabai Merah Keriting**: Memiliki volatilitas tinggi. Harga cenderung melonjak pada bulan November-Desember (menjelang tahun baru) dan saat curah hujan ekstrem menekan suplai.
- **Beras Aromatik Merapi (Mentik Wangi & Rojolele)**: Komoditas bernilai tinggi dengan harga stabil di kisaran Rp 16.000 - Rp 18.500/kg berkat sertifikasi lahan vulkanik Sleman.
- **Salak Pondoh Cangkringan**: Panen raya pada Desember-Februari; ekspor dan pasar swalayan menyerap produk berkualitas grade A dengan stabil.`,
    suggestions: ['Buka menu Prediksi Pasar', 'Estimasi keuntungan per hektar', 'Rekomendasi komoditas bulan ini']
  },
  {
    keywords: ['vulkanik', 'merapi', 'abu', 'lahar', 'kesuburan', 'regosol', 'pasir'],
    category: 'agronomi',
    response: `Karakteristik tanah abu vulkanik Merapi (Regosol):
- **Kelebihan**: Sangat kaya akan mineral primer hara makro dan mikro (Fosfor, Kalium, Kalsium, Magnesium) yang terus terurai secara bertahap.
- **Tantangan**: Struktur tanah berbutir tunggal (berpasir kasar) menyebabkan kemampuan menahan air (*water holding capacity*) rendah dan pupuk nitrogen mudah tercuci ke lapisan bawah (*leaching*).
- **Solusi**: Aplikasikan pupuk Urea bertahap (3 kali aplikasi) dan perbanyak bahan organik jerami padi atau pupuk kandang matang guna membentuk agregat remah tanah.`,
    suggestions: ['Cara membuat kompos jerami', 'Dosis pupuk Urea tanah berpasir', 'Uji kesuburan tanah petak']
  },
  {
    keywords: ['salak', 'pondoh', 'tomat', 'bawang', 'jagung'],
    category: 'agronomi',
    response: `Panduan komoditas hortikultura spesifik lereng Cangkringan:
- **Salak Pondoh**: Memerlukan naungan pohon (seperti lamtoro atau dadap) dan drainase bebas genangan. Bersihkan pelepah kering dan lakukan penjarangan tongkol betina untuk memaksimalkan ukuran buah.
- **Tomat**: Sangat rentan layu bakteri *Ralstonia*. Hindari menanam tomat berturut-turut pada lahan bekas cabai/terong tanpa jeda rotasi tanaman jagung.
- **Jagung Hibrida**: Paling cocok ditanam pada awal April (MT 2). Kebutuhan pupuk kalium (KCl) yang cukup akan memperkokoh batang terhadap terpaan angin lereng.`,
    suggestions: ['Pengendalian hama penggerek jagung', 'Cara stek salak pondoh', 'Rekomendasi rotasi tanaman']
  }
]

function getInitialChat(): ChatMessage[] {
  return [
    {
      id: 'init-msg',
      role: 'assistant',
      text: 'Halo Bapak/Ibu Petani! 👋 Saya **Cakra AI**, asisten agronomi presisi Tanacakra untuk wilayah Cangkringan lereng Merapi. Ada yang bisa saya bantu terkait pupuk, hama penyakit, cuaca, atau kondisi lahan Anda hari ini?',
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
    let answerText = ''
    let answerCategory: ChatMessage['category'] = 'agronomi'
    let answerSuggestions: string[] | undefined = undefined

    // 1. Check conversational intents first (greetings, thanks, identity, small talk)
    const lower = clean.toLowerCase()
    const convIntent = CONVERSATIONAL_INTENTS.find(ci => ci.matches(lower))
    if (convIntent) {
      await new Promise(r => setTimeout(r, 450))
      answerText = convIntent.response
      answerCategory = 'agronomi'
      answerSuggestions = convIntent.suggestions
    }

    // 2. Check agronomic knowledge base
    if (!answerText) {
      const agronomicMatch = AGRONOMIC_KNOWLEDGE.find(item =>
        item.keywords.some(k => lower.includes(k))
      )
      if (agronomicMatch) {
        await new Promise(r => setTimeout(r, 600))
        answerText = agronomicMatch.response
        answerCategory = agronomicMatch.category
        answerSuggestions = agronomicMatch.suggestions
      }
    }

    // 3. Fallback to backend AI endpoint if available and online
    if (!answerText && navigator.onLine && localStorage.getItem('tanacakra_force_offline') !== 'true') {
      try {
        const res = await api.post('/kabar-tani/generate', {
          prompt: `Pertanyaan agronomi petani Cangkringan lereng Merapi: "${clean}". Berikan solusi praktis, ramah, dan ilmiah dalam bahasa Indonesia singkat padat.`
        }, { timeout: 6000 })

        if (res.data && res.data.summary) {
          answerText = `${res.data.summary}\n\n**Rekomendasi Agronomi:**\n${Object.entries(res.data.metrics || {}).map(([k, v]) => `• **${k}**: ${v}`).join('\n')}`
          answerCategory = res.data.category || 'agronomi'
          answerSuggestions = ['Kebutuhan dosis pupuk hara', 'Prakiraan cuaca tanam', 'Cek riwayat data lahan']
        }
      } catch {
        // Fallback to contextual agricultural response
      }
    }

    // 4. Contextual smart fallback if no direct keyword matched
    if (!answerText) {
      await new Promise(r => setTimeout(r, 550))
      answerText = `Terima kasih atas pertanyaannya mengenai topik tersebut.

Untuk pengelolaan pertanian di wilayah Kalurahan Cangkringan (lereng Merapi):
1. **Analisis Kondisi Lahan**: Pastikan drainase guludan lancar dan kadar air tanah terjaga di kisaran 50–70%.
2. **Keseimbangan pH**: Untuk tanah abu vulkanik regosol, pertahankan pH ideal di angka **6.0 – 7.0** agar penyerapan hara N-P-K optimal.
3. **Konsultasi Petugas**: Anda juga dapat berkonsultasi langsung dengan petugas Penyuluh Pertanian Lapang (PPL) di Kantor BPP Kapanewon Cangkringan.

Silakan pilih topik panduan praktis berikut:`
      answerCategory = 'agronomi'
      answerSuggestions = [
        'Berapa dosis pupuk NPK untuk padi?',
        'Cara mengatasi patek (antraknosa) cabai?',
        'Pengaruh curah hujan terhadap hasil panen',
        'Cara menaikkan pH tanah masam'
      ]
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

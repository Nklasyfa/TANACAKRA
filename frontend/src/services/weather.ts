export interface CuacaInfo {
  kondisi: string
  emoji: string
  label: string
  message: string
  suhu: number
  kelembaban: number
  lokasi: string
  sumber: string
}

const BMKG_ADM4 = '34.04.17.2001'
const BMKG_URL = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${BMKG_ADM4}`
const IBMX_URL = 'https://ibnux.github.io/BMKG-importer/cuaca/501187.json'

const IS_SERVER = typeof window === 'undefined'

function bukaPesan(kondisi: string): string {
  const k = kondisi.toLowerCase()
  if (k.includes('hujan')) {
    return 'Waspadai hujan. Jaga saluran air agar lahan tidak tergenang.'
  }
  if (k.includes('petir') || k.includes('badai')) {
    return 'Berpotensi hujan petir. Tunda kegiatan lapang yang tidak mendesak.'
  }
  if (k.includes('berawan')) {
    return 'Cuaca berawan, waktu yang nyaman untuk kegiatan tanam dan perawatan.'
  }
  if (k.includes('cerah')) {
    return 'Cuaca cerah. Cocok untuk pengolahan tanah dan penjemuran hasil panen.'
  }
  if (k.includes('kabut')) {
    return 'Berkabut dan lembab. Hati-hati di jalan menuju lahan.'
  }
  return 'Kondisi cuaca hari ini cukup aman untuk aktivitas bertani.'
}

function bukaEmoji(kondisi: string): string {
  const k = kondisi.toLowerCase()
  if (k.includes('petir') || k.includes('badai')) return '⛈️'
  if (k.includes('hujan lebat')) return '🌧️'
  if (k.includes('hujan sedang')) return '🌧️'
  if (k.includes('hujan')) return '🌦️'
  if (k.includes('berawan') && k.includes('cerah')) return '⛅'
  if (k.includes('berawan')) return '☁️'
  if (k.includes('kabut')) return '🌫️'
  if (k.includes('cerah') || k.includes('terang')) return '☀️'
  return '🌤️'
}

function parseLokal(waktu: string): Date {
  const normal = waktu.replace(' ', 'T')
  return new Date(normal.includes('+') || normal.endsWith('Z') ? normal : normal + '+07:00')
}

interface BmkgEntry {
  t: number
  hu: number
  weather_desc: string
  local_datetime: string
}

async function cobaBmkg(): Promise<CuacaInfo | null> {
  const res = await fetch(BMKG_URL, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`BMKG HTTP ${res.status}`)
  const json = await res.json()

  const desa: string = json?.lokasi?.desa || 'Argomulyo'
  const kecamatan: string = json?.lokasi?.kecamatan || 'Cangkringan'
  const daftar: BmkgEntry[] = (json?.data?.[0]?.cuaca || []).flat()

  if (!daftar.length) return null

  const now = Date.now()
  let best = daftar[0]
  let bestDiff = Infinity
  for (const e of daftar) {
    const diff = Math.abs(parseLokal(e.local_datetime).getTime() - now)
    if (diff < bestDiff) {
      bestDiff = diff
      best = e
    }
  }

  const kondisi = best.weather_desc || 'Cerah'
  const suhu = Math.round(Number(best.t) || 0)
  const kelembaban = Math.round(Number(best.hu) || 0)

  return {
    kondisi,
    emoji: bukaEmoji(kondisi),
    label: `${kondisi} · ${suhu}°C`,
    message: bukaPesan(kondisi),
    suhu,
    kelembaban,
    lokasi: `${desa}, Kec. ${kecamatan}`,
    sumber: 'BMKG'
  }
}

interface IbnuxEntry {
  jamCuaca: string
  cuaca: string
  tempC: number
  humidity: number
}

async function cobaIbnux(): Promise<CuacaInfo | null> {
  const res = await fetch(IBMX_URL, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`ibnux HTTP ${res.status}`)
  const daftar = (await res.json()) as IbnuxEntry[]
  if (!daftar.length) return null

  const nowHour = new Date().getHours()
  let best = daftar[0]
  let bestDiff = Infinity
  for (const e of daftar) {
    const diff = Math.abs(Number(e.jamCuaca.split(':')[0]) - nowHour)
    if (diff < bestDiff) {
      bestDiff = diff
      best = e
    }
  }

  const kondisi = best.cuaca || 'Cerah'
  const suhu = Math.round(Number(best.tempC) || 0)
  const kelembaban = Math.round(Number(best.humidity) || 0)

  return {
    kondisi,
    emoji: bukaEmoji(kondisi),
    label: `${kondisi} · ${suhu}°C`,
    message: bukaPesan(kondisi),
    suhu,
    kelembaban,
    lokasi: 'Sleman, DIY',
    sumber: 'BMKG'
  }
}

export async function fetchCuacaCangkringan(): Promise<CuacaInfo | null> {
  if (IS_SERVER) return null
  for (const coba of [cobaBmkg, cobaIbnux]) {
    try {
      const hasil = await coba()
      if (hasil) return hasil
    } catch {
      continue
    }
  }
  return null
}
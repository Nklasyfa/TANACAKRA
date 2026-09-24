import axios from 'axios'
export * from './notifications'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 detik: inferensi Scikit-learn + skema Plotly butuh waktu
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

const isOfflineMode = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL.includes('127.0.0.1') || import.meta.env.VITE_API_BASE_URL.includes('localhost')

// Attach token if present in localStorage, or reject if offline to prevent console ERR_CONNECTION_REFUSED
api.interceptors.request.use((config) => {
  if (isOfflineMode) {
    return Promise.reject(new Error('Offline mode: Bypassing backend network request to prevent connection errors.'))
  }
  const token = localStorage.getItem('tanacakra_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface User {
  id: number
  username: string
  email: string
  role: 'PETANI' | 'ADMIN' | 'PENYULUH'
}

export interface AuditLogItem {
  id: number
  user: User | null
  action: string
  endpoint: string
  timestamp: string
}

export interface LandInputPayload {
  pH: number
  kelembapan: number
  nitrogen: number
  fosfor: number
  kalium: number
  komoditas?: string
}

export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return
  const headers = Object.keys(rows[0])
  const escapeValue = (val: any): string => {
    if (val === null || val === undefined) return '""'
    if (typeof val === 'object') {
      try {
        val = JSON.stringify(val)
      } catch {
        val = String(val)
      }
    }
    const strVal = String(val)
    return `"${strVal.replace(/"/g, '""')}"`
  }

  const headerLine = headers.map(h => escapeValue(h)).join(',')
  const dataLines = rows.map(row =>
    headers.map(h => escapeValue(row[h])).join(',')
  )

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`

  // \uFEFF = UTF-8 BOM, sep=, = Explicit MS Excel column separator directive
  const csvContent = '\uFEFFsep=,\r\n' + [headerLine, ...dataLines].join('\r\n')
  const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent)

  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', cleanFilename)
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ============================================================
// FALLBACK DATA: Data riil Cangkringan untuk offline/no-backend
// ============================================================
const DESA_LIST = ['Wukirsari', 'Argomulyo', 'Glagaharjo', 'Kepuharjo', 'Umbulharjo']
const DESA_COORDS: Record<string, [number, number]> = {
  'Wukirsari':   [-7.6280, 110.4420],
  'Argomulyo':   [-7.6350, 110.4350],
  'Glagaharjo':  [-7.6200, 110.4500],
  'Kepuharjo':   [-7.6150, 110.4550],
  'Umbulharjo':  [-7.6450, 110.4280]
}

function generateFallbackLahan() {
  const COMMODITIES = ['Cabai Merah', 'Jagung', 'Salak Pondoh', 'Tomat', 'Bawang Merah', 'Padi']
  return Array.from({ length: 108 }, (_, i) => {
    const desa = DESA_LIST[i % 5]
    const [baseLat, baseLng] = DESA_COORDS[desa]
    const ph = +(5.2 + Math.random() * 2.3).toFixed(1) // 5.2 - 7.5
    const sampleFieldNames = [
      'Blok A - Rojolele',
      'Blok B - Mentik Wangi',
      'Blok C - Pandanwangi',
      'Blok D - Sawah Pari',
      'Blok E - Lereng Merapi',
      'Blok F - UmbulHarjo',
      'Blok G - Kebun Salak'
    ]
    const fieldName = sampleFieldNames[i % sampleFieldNames.length]
    const commodity = COMMODITIES[i % COMMODITIES.length]
    return {
      id: i + 1,
      input_parameters: {
        farm_id: 'CGK' + String(i + 1).padStart(3, '0'),
        field_name: fieldName,
        komoditas: commodity,
        desa,
        soil_type: 'Regosol Vulkanik',
        soil_ph: ph,
        organic_carbon: +(1.2 + Math.random() * 2.5).toFixed(1),
        elevation_m: Math.round(450 + Math.random() * 350),
        area_ha: +(0.3 + Math.random() * 2.2).toFixed(1),
        irrigation: ['Tadah Hujan', 'Semi-Teknis', 'Teknis'][i % 3],
        latitude: baseLat + (Math.random() - 0.5) * 0.025,
        longitude: baseLng + (Math.random() - 0.5) * 0.025
      },
      planting_info: {
        commodity: commodity,
        variety: i % 2 === 0 ? 'Lokal Cangkringan' : 'Unggul Merapi'
      },
      created_at: new Date(2024, i % 12, 1 + (i % 28)).toISOString()
    }
  })
}

function generatePlotlySchema(trends: any[], volumeTrends?: any[], activeCommodities?: string[]) {
  if (!trends || !trends.length) return null
  const MONTH_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const months = trends.map(t => {
    const ym = t.month || ''
    if (typeof ym === 'string' && ym.includes('-')) {
      const [, m] = ym.split('-')
      return MONTH_ID[parseInt(m) - 1] ?? ym
    }
    return ym
  })

  const keyColors: Record<string, string> = {
    'Cabai Merah': '#C84C32',
    'Salak Pondoh': '#4A5B3A',
    'Bawang Merah': '#8B3A62',
    'Padi': '#D99B26',
    'Jagung': '#E07A5F',
    'Kacang Tanah': '#7E5A3C',
    'Tomat': '#E63946'
  }
  const fallbackColors = ['#C84C32', '#4A5B3A', '#8B3A62', '#D99B26', '#E07A5F', '#7E5A3C', '#E63946']

  // Extract all commodity keys present in trends (excluding metadata fields)
  const allKeys = Object.keys(trends[0] || {}).filter(k => k !== 'month' && k !== 'volume_ton')
  const keysToDisplay = (activeCommodities && activeCommodities.length > 0)
    ? allKeys.filter(k => activeCommodities.includes(k))
    : allKeys

  const data: any[] = keysToDisplay.map((key, idx) => {
    const color = keyColors[key] || fallbackColors[idx % fallbackColors.length]
    return {
      x: months,
      y: trends.map(t => t[key] ?? 0),
      type: 'scatter',
      mode: 'lines+markers',
      name: `${key} (Rp/kg)`,
      line: { color, width: 2.5, shape: 'spline' },
      marker: { size: 6, color },
      hovertemplate: `<b>%{x}</b><br>${key}: Rp %{y:,.0f}/kg<extra></extra>`
    }
  })

  const volSource = volumeTrends && volumeTrends.length ? volumeTrends : trends
  data.push({
    x: volSource.map(v => {
      const ym = v.month ?? v
      if (typeof ym === 'string' && ym.includes('-')) {
        const [, m] = ym.split('-')
        return MONTH_ID[parseInt(m) - 1] ?? ym
      }
      return ym
    }),
    y: volSource.map(v => v.volume_ton ?? 300 + Math.round(Math.random() * 200)),
    type: 'bar',
    name: 'Volume Panen (Ton)',
    yaxis: 'y2',
    opacity: 0.25,
    marker: { color: '#4A5B3A' },
    hovertemplate: '<b>%{x}</b><br>Panen: %{y} Ton<extra></extra>'
  })

  return {
    data,
    layout: {
      autosize: true,
      margin: { l: 60, r: 50, t: 25, b: 100 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0.5,
        xanchor: 'center',
        y: -0.3,
        font: { family: 'Plus Jakarta Sans', size: 11, color: '#4A3F35' }
      },
      xaxis: {
        tickfont: { family: 'Plus Jakarta Sans', size: 11, color: '#645d58' },
        tickangle: -45,
        automargin: true,
        showgrid: true,
        gridcolor: '#F2DFCF',
        zeroline: false
      },
      yaxis: {
        title: { text: 'Harga (Rp/kg)', font: { family: 'Plus Jakarta Sans', size: 11, color: '#A8452A' } },
        tickfont: { family: 'Plus Jakarta Sans', size: 11, color: '#A8452A' },
        automargin: true,
        showgrid: true,
        gridcolor: '#F2DFCF',
        zeroline: false,
        tickprefix: 'Rp '
      },
      yaxis2: {
        title: { text: 'Volume (Ton)', font: { family: 'Plus Jakarta Sans', size: 11, color: '#4A5B3A' } },
        tickfont: { family: 'Plus Jakarta Sans', size: 11, color: '#4A5B3A' },
        automargin: true,
        overlaying: 'y',
        side: 'right',
        showgrid: false,
        zeroline: false,
        ticksuffix: ' T'
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#241F1B',
        bordercolor: '#241F1B',
        font: { family: 'Plus Jakarta Sans', color: '#FFFFFF', size: 12 }
      },
      font: { color: '#2C2622', family: 'Plus Jakarta Sans, sans-serif' }
    }
  }
}

export { generatePlotlySchema }

const FALLBACK_TRENDS = [
  // === 2022 ===
  { month: '2022-01', 'Cabai Merah': 38200, 'Salak Pondoh': 42100, 'Padi': 4800, 'Jagung': 4200, 'Bawang Merah': 26500, 'Kacang Tanah': 19800 },
  { month: '2022-02', 'Cabai Merah': 52400, 'Salak Pondoh': 45300, 'Padi': 4850, 'Jagung': 4300, 'Bawang Merah': 27200, 'Kacang Tanah': 20100 },
  { month: '2022-03', 'Cabai Merah': 31600, 'Salak Pondoh': 38700, 'Padi': 4750, 'Jagung': 4150, 'Bawang Merah': 28100, 'Kacang Tanah': 19500 },
  { month: '2022-04', 'Cabai Merah': 44800, 'Salak Pondoh': 36200, 'Padi': 4700, 'Jagung': 4400, 'Bawang Merah': 28800, 'Kacang Tanah': 20300 },
  { month: '2022-05', 'Cabai Merah': 48500, 'Salak Pondoh': 33100, 'Padi': 4900, 'Jagung': 4600, 'Bawang Merah': 29500, 'Kacang Tanah': 20800 },
  { month: '2022-06', 'Cabai Merah': 55200, 'Salak Pondoh': 39800, 'Padi': 4950, 'Jagung': 4350, 'Bawang Merah': 27800, 'Kacang Tanah': 20100 },
  { month: '2022-07', 'Cabai Merah': 41300, 'Salak Pondoh': 44600, 'Padi': 4800, 'Jagung': 4250, 'Bawang Merah': 26900, 'Kacang Tanah': 19700 },
  { month: '2022-08', 'Cabai Merah': 36100, 'Salak Pondoh': 48900, 'Padi': 4700, 'Jagung': 4500, 'Bawang Merah': 28500, 'Kacang Tanah': 20500 },
  { month: '2022-09', 'Cabai Merah': 42700, 'Salak Pondoh': 46200, 'Padi': 4850, 'Jagung': 4400, 'Bawang Merah': 29200, 'Kacang Tanah': 20200 },
  { month: '2022-10', 'Cabai Merah': 58900, 'Salak Pondoh': 41500, 'Padi': 4950, 'Jagung': 4550, 'Bawang Merah': 30100, 'Kacang Tanah': 20900 },
  { month: '2022-11', 'Cabai Merah': 64300, 'Salak Pondoh': 38200, 'Padi': 5050, 'Jagung': 4650, 'Bawang Merah': 30800, 'Kacang Tanah': 21300 },
  { month: '2022-12', 'Cabai Merah': 71500, 'Salak Pondoh': 35600, 'Padi': 5100, 'Jagung': 4700, 'Bawang Merah': 31500, 'Kacang Tanah': 21800 },
  // === 2023 ===
  { month: '2023-01', 'Cabai Merah': 45200, 'Salak Pondoh': 47300, 'Padi': 5200, 'Jagung': 4700, 'Bawang Merah': 29000, 'Kacang Tanah': 21500 },
  { month: '2023-02', 'Cabai Merah': 62800, 'Salak Pondoh': 52100, 'Padi': 5300, 'Jagung': 4800, 'Bawang Merah': 28500, 'Kacang Tanah': 22000 },
  { month: '2023-03', 'Cabai Merah': 25400, 'Salak Pondoh': 28600, 'Padi': 5150, 'Jagung': 4650, 'Bawang Merah': 30200, 'Kacang Tanah': 21200 },
  { month: '2023-04', 'Cabai Merah': 39800, 'Salak Pondoh': 33400, 'Padi': 5100, 'Jagung': 4900, 'Bawang Merah': 31500, 'Kacang Tanah': 22100 },
  { month: '2023-05', 'Cabai Merah': 51200, 'Salak Pondoh': 30800, 'Padi': 5350, 'Jagung': 5100, 'Bawang Merah': 32800, 'Kacang Tanah': 22800 },
  { month: '2023-06', 'Cabai Merah': 63500, 'Salak Pondoh': 37200, 'Padi': 5450, 'Jagung': 4950, 'Bawang Merah': 31200, 'Kacang Tanah': 22200 },
  { month: '2023-07', 'Cabai Merah': 43100, 'Salak Pondoh': 43800, 'Padi': 5250, 'Jagung': 4850, 'Bawang Merah': 30100, 'Kacang Tanah': 21600 },
  { month: '2023-08', 'Cabai Merah': 37500, 'Salak Pondoh': 51400, 'Padi': 5150, 'Jagung': 5050, 'Bawang Merah': 32100, 'Kacang Tanah': 22500 },
  { month: '2023-09', 'Cabai Merah': 46800, 'Salak Pondoh': 49200, 'Padi': 5300, 'Jagung': 4900, 'Bawang Merah': 33200, 'Kacang Tanah': 22100 },
  { month: '2023-10', 'Cabai Merah': 61200, 'Salak Pondoh': 44100, 'Padi': 5400, 'Jagung': 5100, 'Bawang Merah': 34100, 'Kacang Tanah': 23000 },
  { month: '2023-11', 'Cabai Merah': 69800, 'Salak Pondoh': 40500, 'Padi': 5550, 'Jagung': 5200, 'Bawang Merah': 34800, 'Kacang Tanah': 23400 },
  { month: '2023-12', 'Cabai Merah': 78200, 'Salak Pondoh': 37800, 'Padi': 5700, 'Jagung': 5250, 'Bawang Merah': 35500, 'Kacang Tanah': 23800 },
  // === 2024 ===
  { month: '2024-01', 'Cabai Merah': 49957, 'Salak Pondoh': 50587, 'Padi': 5800, 'Jagung': 5200, 'Bawang Merah': 32000, 'Kacang Tanah': 24000 },
  { month: '2024-02', 'Cabai Merah': 73305, 'Salak Pondoh': 74571, 'Padi': 5900, 'Jagung': 5300, 'Bawang Merah': 31000, 'Kacang Tanah': 24500 },
  { month: '2024-03', 'Cabai Merah': 19110, 'Salak Pondoh': 22389, 'Padi': 5700, 'Jagung': 5150, 'Bawang Merah': 33500, 'Kacang Tanah': 22800 },
  { month: '2024-04', 'Cabai Merah': 42500, 'Salak Pondoh': 31200, 'Padi': 5600, 'Jagung': 5500, 'Bawang Merah': 34000, 'Kacang Tanah': 23500 },
  { month: '2024-05', 'Cabai Merah': 55800, 'Salak Pondoh': 28900, 'Padi': 5850, 'Jagung': 5800, 'Bawang Merah': 35500, 'Kacang Tanah': 24200 },
  { month: '2024-06', 'Cabai Merah': 68200, 'Salak Pondoh': 35600, 'Padi': 5950, 'Jagung': 5450, 'Bawang Merah': 33800, 'Kacang Tanah': 23800 },
  { month: '2024-07', 'Cabai Merah': 45300, 'Salak Pondoh': 42100, 'Padi': 5750, 'Jagung': 5350, 'Bawang Merah': 32200, 'Kacang Tanah': 23200 },
  { month: '2024-08', 'Cabai Merah': 38700, 'Salak Pondoh': 55200, 'Padi': 5650, 'Jagung': 5600, 'Bawang Merah': 34500, 'Kacang Tanah': 24100 },
  { month: '2024-09', 'Cabai Merah': 52100, 'Salak Pondoh': 52800, 'Padi': 5800, 'Jagung': 5400, 'Bawang Merah': 35200, 'Kacang Tanah': 23600 },
  { month: '2024-10', 'Cabai Merah': 66400, 'Salak Pondoh': 47500, 'Padi': 5950, 'Jagung': 5600, 'Bawang Merah': 36100, 'Kacang Tanah': 24500 },
  { month: '2024-11', 'Cabai Merah': 74800, 'Salak Pondoh': 43200, 'Padi': 6100, 'Jagung': 5700, 'Bawang Merah': 36800, 'Kacang Tanah': 24900 },
  { month: '2024-12', 'Cabai Merah': 82100, 'Salak Pondoh': 40100, 'Padi': 6250, 'Jagung': 5800, 'Bawang Merah': 37500, 'Kacang Tanah': 25300 },
  // === 2025 ===
  { month: '2025-01', 'Cabai Merah': 54200, 'Salak Pondoh': 55100, 'Padi': 6300, 'Jagung': 5700, 'Bawang Merah': 34500, 'Kacang Tanah': 25500 },
  { month: '2025-02', 'Cabai Merah': 78500, 'Salak Pondoh': 78900, 'Padi': 6400, 'Jagung': 5800, 'Bawang Merah': 33800, 'Kacang Tanah': 26000 },
  { month: '2025-03', 'Cabai Merah': 22300, 'Salak Pondoh': 25600, 'Padi': 6200, 'Jagung': 5650, 'Bawang Merah': 35800, 'Kacang Tanah': 24500 },
  { month: '2025-04', 'Cabai Merah': 46700, 'Salak Pondoh': 34500, 'Padi': 6100, 'Jagung': 6000, 'Bawang Merah': 36500, 'Kacang Tanah': 25200 },
  { month: '2025-05', 'Cabai Merah': 60100, 'Salak Pondoh': 31800, 'Padi': 6350, 'Jagung': 6300, 'Bawang Merah': 38200, 'Kacang Tanah': 25800 },
  { month: '2025-06', 'Cabai Merah': 72400, 'Salak Pondoh': 38200, 'Padi': 6450, 'Jagung': 5950, 'Bawang Merah': 36500, 'Kacang Tanah': 25400 },
  { month: '2025-07', 'Cabai Merah': 49800, 'Salak Pondoh': 45500, 'Padi': 6250, 'Jagung': 5850, 'Bawang Merah': 35000, 'Kacang Tanah': 24800 },
  { month: '2025-08', 'Cabai Merah': 42100, 'Salak Pondoh': 58400, 'Padi': 6150, 'Jagung': 6100, 'Bawang Merah': 37200, 'Kacang Tanah': 25600 },
  { month: '2025-09', 'Cabai Merah': 56300, 'Salak Pondoh': 55900, 'Padi': 6300, 'Jagung': 5900, 'Bawang Merah': 38000, 'Kacang Tanah': 25100 },
  { month: '2025-10', 'Cabai Merah': 70100, 'Salak Pondoh': 50200, 'Padi': 6450, 'Jagung': 6100, 'Bawang Merah': 39000, 'Kacang Tanah': 26100 },
  { month: '2025-11', 'Cabai Merah': 79500, 'Salak Pondoh': 46800, 'Padi': 6600, 'Jagung': 6200, 'Bawang Merah': 39800, 'Kacang Tanah': 26500 },
  { month: '2025-12', 'Cabai Merah': 87200, 'Salak Pondoh': 43500, 'Padi': 6750, 'Jagung': 6300, 'Bawang Merah': 40500, 'Kacang Tanah': 26900 },
  // === 2026 (Jan – Sep) ===
  { month: '2026-01', 'Cabai Merah': 58900, 'Salak Pondoh': 59200, 'Padi': 6800, 'Jagung': 6200, 'Bawang Merah': 37200, 'Kacang Tanah': 27100 },
  { month: '2026-02', 'Cabai Merah': 84200, 'Salak Pondoh': 83500, 'Padi': 6900, 'Jagung': 6300, 'Bawang Merah': 36500, 'Kacang Tanah': 27600 },
  { month: '2026-03', 'Cabai Merah': 26500, 'Salak Pondoh': 29800, 'Padi': 6700, 'Jagung': 6150, 'Bawang Merah': 38500, 'Kacang Tanah': 26200 },
  { month: '2026-04', 'Cabai Merah': 50800, 'Salak Pondoh': 37900, 'Padi': 6600, 'Jagung': 6500, 'Bawang Merah': 39200, 'Kacang Tanah': 26800 },
  { month: '2026-05', 'Cabai Merah': 64500, 'Salak Pondoh': 35200, 'Padi': 6850, 'Jagung': 6800, 'Bawang Merah': 41000, 'Kacang Tanah': 27500 },
  { month: '2026-06', 'Cabai Merah': 77800, 'Salak Pondoh': 41500, 'Padi': 6950, 'Jagung': 6450, 'Bawang Merah': 39500, 'Kacang Tanah': 27100 },
  { month: '2026-07', 'Cabai Merah': 53200, 'Salak Pondoh': 49100, 'Padi': 6750, 'Jagung': 6350, 'Bawang Merah': 38000, 'Kacang Tanah': 26500 },
  { month: '2026-08', 'Cabai Merah': 46500, 'Salak Pondoh': 62300, 'Padi': 6650, 'Jagung': 6600, 'Bawang Merah': 40200, 'Kacang Tanah': 27300 },
  { month: '2026-09', 'Cabai Merah': 61800, 'Salak Pondoh': 59500, 'Padi': 6800, 'Jagung': 6400, 'Bawang Merah': 41200, 'Kacang Tanah': 26800 }
]

const FALLBACK_VOLUME = [
  // 2022
  { month: '2022-01', volume_ton: 245 }, { month: '2022-02', volume_ton: 280 },
  { month: '2022-03', volume_ton: 310 }, { month: '2022-04', volume_ton: 275 },
  { month: '2022-05', volume_ton: 230 }, { month: '2022-06', volume_ton: 210 },
  { month: '2022-07', volume_ton: 255 }, { month: '2022-08', volume_ton: 270 },
  { month: '2022-09', volume_ton: 295 }, { month: '2022-10', volume_ton: 325 },
  { month: '2022-11', volume_ton: 340 }, { month: '2022-12', volume_ton: 310 },
  // 2023
  { month: '2023-01', volume_ton: 280 }, { month: '2023-02', volume_ton: 330 },
  { month: '2023-03', volume_ton: 365 }, { month: '2023-04', volume_ton: 310 },
  { month: '2023-05', volume_ton: 260 }, { month: '2023-06', volume_ton: 235 },
  { month: '2023-07', volume_ton: 285 }, { month: '2023-08', volume_ton: 305 },
  { month: '2023-09', volume_ton: 335 }, { month: '2023-10', volume_ton: 360 },
  { month: '2023-11', volume_ton: 380 }, { month: '2023-12', volume_ton: 350 },
  // 2024
  { month: '2024-01', volume_ton: 320 }, { month: '2024-02', volume_ton: 380 },
  { month: '2024-03', volume_ton: 410 }, { month: '2024-04', volume_ton: 350 },
  { month: '2024-05', volume_ton: 290 }, { month: '2024-06', volume_ton: 260 },
  { month: '2024-07', volume_ton: 315 }, { month: '2024-08', volume_ton: 340 },
  { month: '2024-09', volume_ton: 370 }, { month: '2024-10', volume_ton: 395 },
  { month: '2024-11', volume_ton: 415 }, { month: '2024-12', volume_ton: 385 },
  // 2025
  { month: '2025-01', volume_ton: 355 }, { month: '2025-02', volume_ton: 420 },
  { month: '2025-03', volume_ton: 450 }, { month: '2025-04', volume_ton: 385 },
  { month: '2025-05', volume_ton: 320 }, { month: '2025-06', volume_ton: 290 },
  { month: '2025-07', volume_ton: 345 }, { month: '2025-08', volume_ton: 375 },
  { month: '2025-09', volume_ton: 405 }, { month: '2025-10', volume_ton: 430 },
  { month: '2025-11', volume_ton: 455 }, { month: '2025-12', volume_ton: 420 },
  // 2026
  { month: '2026-01', volume_ton: 390 }, { month: '2026-02', volume_ton: 460 },
  { month: '2026-03', volume_ton: 495 }, { month: '2026-04', volume_ton: 425 },
  { month: '2026-05', volume_ton: 355 }, { month: '2026-06', volume_ton: 320 },
  { month: '2026-07', volume_ton: 380 }, { month: '2026-08', volume_ton: 410 },
  { month: '2026-09', volume_ton: 440 }
]

// ============================================================
// LOCAL EDIT STORE: override & deletes untuk master/offline lahan
// ============================================================
function getLocalLahan(): any[] {
  try { return JSON.parse(localStorage.getItem('tanacakra_offline_lahan') || '[]') }
  catch { return [] }
}
function saveLocalLahan(list: any[]) {
  try { localStorage.setItem('tanacakra_offline_lahan', JSON.stringify(list)) } catch { /* quota */ }
}
function getLahanOverrides(): any[] {
  try { return JSON.parse(localStorage.getItem('tanacakra_lahan_overrides') || '[]') }
  catch { return [] }
}
function saveLahanOverrides(list: any[]) {
  try { localStorage.setItem('tanacakra_lahan_overrides', JSON.stringify(list)) } catch { /* quota */ }
}
function getLahanDeleted(): string[] {
  try { return JSON.parse(localStorage.getItem('tanacakra_lahan_deleted') || '[]') }
  catch { return [] }
}
function saveLahanDeleted(list: string[]) {
  try { localStorage.setItem('tanacakra_lahan_deleted', JSON.stringify(list)) } catch { /* quota */ }
}
function farmIdOf(item: any): string {
  return String(item?.input_parameters?.farm_id || '')
}
function applyLocalEdits(list: any[]): any[] {
  const deleted = new Set(getLahanDeleted())
  const overrides = getLahanOverrides()
  return list
    .filter((it: any) => {
      const fid = farmIdOf(it)
      return !fid || !deleted.has(fid)
    })
    .map((it: any) => {
      const fid = farmIdOf(it)
      if (!fid) return it
      const ov = overrides.find(o => o.farm_id === fid)
      if (!ov) return it
      return {
        ...it,
        input_parameters: { ...it.input_parameters, ...ov.input_parameters },
        _edited_at: ov.edited_at
      }
    })
}

export function generateFallbackDashboard() {
  const trends = FALLBACK_TRENDS
  return {
    total_lahan: 108,
    sehat_count: 72,
    perlu_atensi_count: 36,
    avg_ph: 6.4,
    avg_moisture: '68%',
    weekly_reports: 42,
    total_tanam: 480,
    total_panen: 480,
    total_harga: 360,
    total_biaya: 240,
    total_produksi_ton: 4236.6,
    commodities: ['Padi', 'Cabai Merah', 'Jagung', 'Salak Pondoh', 'Bawang Merah', 'Kacang Tanah'],
    best_commodity: {
      title: 'Cabai Merah & Salak Pondoh',
      badge: 'Rekomendasi Utama ML Scikit-Learn',
      avg_price: 'Rp 52.082 / kg',
      roi_estimate: '+145%',
      reason: 'Harga tren pasar stabil naik (hingga Rp 73.305/kg) dengan kecocokan hara Regosol Vulkanik Cangkringan (pH 6.0-6.8). Tanah vulkanik lereng Merapi kaya mineral ideal untuk komoditas dataran tinggi.',
      expected_yield: '4.5 Ton / Ha',
      total_tanam_count: 480,
      total_panen_ton: 4236.6
    },
    price_trends: trends,
    volume_trends: FALLBACK_VOLUME,
    plotly_chart_schema: generatePlotlySchema(trends, FALLBACK_VOLUME)
  }
}

// ============================================================
// SERVICE EXPORTS (with automatic fallback)
// ============================================================
export const AuthService = {
  async login(username: string, password: string) {
    const res = await api.post('/auth/login', { username, password })
    if (res.data.token) {
      localStorage.setItem('tanacakra_token', res.data.token)
      localStorage.setItem('tanacakra_user', JSON.stringify(res.data.user))
    }
    return res.data
  },
  async register(username: string, email: string, password: string) {
    const res = await api.post('/auth/register', { username, email, password })
    return res.data
  }
}

export const LahanService = {
  async inputLahan(lahanId: string, parameters: LandInputPayload) {
    try {
      const res = await api.post(`/lahan/${lahanId}/input`, { parameters })
      return res.data
    } catch (err) {
      // Offline fallback: save to localStorage to persist data
      const localHistory = JSON.parse(localStorage.getItem('tanacakra_offline_lahan') || '[]')
      
      // Auto-generate unique farm ID if lahanId is empty or duplicate
      let finalFarmId = lahanId
      const existingMatches = localHistory.filter((it: any) => it.input_parameters?.farm_id === lahanId)
      if (existingMatches.length > 0 || !finalFarmId) {
        finalFarmId = 'CGK' + String(localHistory.length + 1).padStart(3, '0')
      }

      const userStr = localStorage.getItem('tanacakra_user')
      let userObj = { id: 1, username: 'petani_demo', email: '', role: 'PETANI' }
      if (userStr) {
        try { userObj = JSON.parse(userStr) } catch {}
      }

      const newEntry = {
        id: Date.now(),
        user: userObj,
        input_parameters: { ...parameters, farm_id: finalFarmId },
        created_at: new Date().toISOString(),
        output: {
          prediction_result: {
            estimasi_hasil_panen_ton_ha: '16.8',
            status_kesehatan: parameters.pH < 6.0 ? 'Perlu Pembenahan pH' : 'Sangat Baik',
            catatan_lokasi: `Lokasi lahan ${finalFarmId} Cangkringan.`,
            rekomendasi_tindakan: [
              parameters.pH < 6.0 
                ? 'Taburkan Kapur Pertanian (Dolomit) yang mengandung Kalsium (Ca) & Magnesium (Mg) untuk menaikkan pH tanah.' 
                : parameters.pH > 7.0
                  ? 'Tambahkan unsur Belerang (Sulfur) pertanian untuk menurunkan pH tanah yang basa.'
                  : 'Gunakan Pupuk NPK Seimbang (contoh: NPK Mutiara 16-16-16) untuk menjaga nutrisi.',
              'Jaga penyiraman & kelembapan tanah di tingkat ideal (50-70%).'
            ]
          }
        }
      }
      localHistory.unshift(newEntry)
      localStorage.setItem('tanacakra_offline_lahan', JSON.stringify(localHistory))
      
      return {
        message: 'Tersimpan Luring',
        dataset_id: newEntry.id,
        engine_output: newEntry.output,
        plotly_schema: null
      }
    }
  },
  async getHistory(lahanId: string) {
    try {
      const res = await api.get(`/lahan/${lahanId}/history`)
      return res.data
    } catch {
      const localHistory = getLocalLahan()
      const filtered = applyLocalEdits(localHistory.filter((it: any) => farmIdOf(it) === lahanId))
      return { lahan_id: lahanId, history: filtered, trend_chart_schema: null }
    }
  },
  async getLahanHistory() {
    try {
      const res = await api.get('/lahan')
      const local = getLocalLahan()
      return applyLocalEdits([...local, ...(res.data || [])])
    } catch {
      const local = getLocalLahan()
      // Ensure unique farm_ids for offline entries if saved with identical CGK001
      const farmCounts: Record<string, number> = {}
      const sanitizedLocal = local.map((item: any, idx: number) => {
        const farmId = item.input_parameters?.farm_id || 'CGK001'
        farmCounts[farmId] = (farmCounts[farmId] || 0) + 1
        if (farmCounts[farmId] > 1) {
          const newCode = `CGK${String(idx + 1).padStart(3, '0')}`
          return {
            ...item,
            input_parameters: { ...item.input_parameters, farm_id: newCode }
          }
        }
        return item
      })
      return applyLocalEdits([...sanitizedLocal, ...generateFallbackLahan()])
    }
  },
  async getAllLahan() {
    try {
      const res = await api.get('/lahan')
      const local = getLocalLahan()
      return applyLocalEdits([...local, ...res.data])
    } catch {
      const local = getLocalLahan()
      const farmCounts: Record<string, number> = {}
      const sanitizedLocal = local.map((item: any, idx: number) => {
        const farmId = item.input_parameters?.farm_id || 'CGK001'
        farmCounts[farmId] = (farmCounts[farmId] || 0) + 1
        if (farmCounts[farmId] > 1) {
          const newCode = `CGK${String(idx + 1).padStart(3, '0')}`
          return {
            ...item,
            input_parameters: { ...item.input_parameters, farm_id: newCode }
          }
        }
        return item
      })
      return applyLocalEdits([...sanitizedLocal, ...generateFallbackLahan()])
    }
  },
  async updateLahan(farmId: string, params: Record<string, any>) {
    // Simpan override lokal agar edit bertahan (master 108 lahan + entri user)
    const currentOverrides = getLahanOverrides()
    const override = {
      farm_id: farmId,
      input_parameters: params,
      edited_at: new Date().toISOString()
    }
    const idx = currentOverrides.findIndex(o => o.farm_id === farmId)
    if (idx >= 0) currentOverrides[idx] = override
    else currentOverrides.unshift(override)
    saveLahanOverrides(currentOverrides)

    // Jika farm_id berasal dari entri user (offline), perbarui juga datanya
    const local = getLocalLahan()
    const li = local.findIndex((it: any) => farmIdOf(it) === farmId)
    if (li >= 0) {
      local[li] = { ...local[li], input_parameters: { ...local[li].input_parameters, ...params }, _edited_at: override.edited_at }
      saveLocalLahan(local)
    }

    try {
      if (!isOfflineMode) {
        await api.patch(`/lahan/${farmId}`, { parameters: params })
      }
    } catch { /* offline */ }

    return { message: 'Data lahan berhasil diperbarui', farm_id: farmId }
  },
  async deleteLahan(farmId: string) {
    const deleted = getLahanDeleted()
    if (!deleted.includes(farmId)) {
      deleted.unshift(farmId)
      saveLahanDeleted(deleted)
    }
    const local = getLocalLahan().filter((it: any) => farmIdOf(it) !== farmId)
    saveLocalLahan(local)

    try {
      if (!isOfflineMode) {
        await api.delete(`/lahan/${farmId}`)
      }
    } catch { /* offline */ }

    return { message: 'Data lahan berhasil dihapus', farm_id: farmId }
  }
}

export const TindakanService = {
  async confirm(tindakanId: string) {
    try {
      const res = await api.post('/tindakan/confirm', { tindakan_id: tindakanId })
      return res.data
    } catch {
      return { message: `Tindakan ${tindakanId} berhasil dikonfirmasi (offline)` }
    }
  }
}

export const AdminService = {
  async getAuditLogs(): Promise<AuditLogItem[]> {
    try {
      const res = await api.get('/audit-logs')
      return res.data
    } catch {
      return []
    }
  },
  async getDashboardTrends() {
    try {
      const res = await api.get('/dashboard/trends')
      // Ensure plotly schema exists even from backend
      if (res.data && !res.data.plotly_chart_schema && res.data.price_trends) {
        res.data.plotly_chart_schema = generatePlotlySchema(res.data.price_trends, res.data.volume_trends)
      }
      return res.data
    } catch {
      return generateFallbackDashboard()
    }
  },
  async getUsers(): Promise<User[]> {
    const defaultUsers: User[] = [
      { id: 3, username: 'Super Admin', email: 'admin@cangkringan.desa.id', role: 'ADMIN' }
    ]
    try {
      const res = await api.get('/users')
      if (res.data && Array.isArray(res.data) && res.data.length > 0) return res.data
    } catch {
      /* ignore */
    }

    try {
      const raw = localStorage.getItem('tanacakra_all_users')
      if (raw) {
        const stored = JSON.parse(raw)
        if (Array.isArray(stored) && stored.length > 0) return stored
      }
    } catch {
      /* ignore */
    }

    return defaultUsers
  },

  async addUser(newUser: { username: string; email: string; role: 'ADMIN' | 'PETANI' | 'PENYULUH' }): Promise<User[]> {
    const current = await this.getUsers()
    const created: User = {
      id: Date.now(),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    }
    const updated = [created, ...current]
    try {
      localStorage.setItem('tanacakra_all_users', JSON.stringify(updated))
    } catch {
      /* ignore */
    }
    return updated
  },

  async toggleUserRole(userId: number): Promise<User[]> {
    const current = await this.getUsers()
    const updated = current.map(u => {
      if (u.id === userId) {
        return { ...u, role: (u.role === 'ADMIN' ? 'PETANI' : 'ADMIN') as 'ADMIN' | 'PETANI' }
      }
      return u
    })
    try {
      localStorage.setItem('tanacakra_all_users', JSON.stringify(updated))
    } catch {
      /* ignore */
    }
    return updated
  },

  async deleteUser(userId: number): Promise<User[]> {
    const current = await this.getUsers()
    const updated = current.filter(u => u.id !== userId)
    try {
      localStorage.setItem('tanacakra_all_users', JSON.stringify(updated))
    } catch {
      /* ignore */
    }
    return updated
  },
  async getPipelineConfig() {
    try {
      const res = await api.get('/pipeline/config')
      return res.data
    } catch {
      return {
        ph_threshold_min: 5.5,
        ph_threshold_max: 7.0,
        kalium_weight: 0.78,
        erosion_coef: 1.35,
        inference_freq: 'event'
      }
    }
  },
  async updatePipelineConfig(configData: Record<string, any>) {
    try {
      const res = await api.post('/pipeline/config', configData)
      return res.data
    } catch {
      return { message: 'Konfigurasi pipeline ML berhasil diperbarui (offline)', updated_config: configData }
    }
  }
}

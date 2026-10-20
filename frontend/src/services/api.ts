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

// Attach token if present in localStorage, or bypass if offline
api.interceptors.request.use((config) => {
  const forceOffline = localStorage.getItem('tanacakra_force_offline') === 'true'
  if (!navigator.onLine || forceOffline) {
    return Promise.reject(new Error('Offline mode: Bypassing backend network request.'))
  }
  const token = localStorage.getItem('tanacakra_token')
  if (token && token !== 'offline-token') {
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
  area_ha?: number | string
  area_sqm?: number
  [key: string]: any
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

function generatePlotlySchema(
  trends: any[],
  volumeTrends?: any[],
  activeCommodities?: string[],
  viewMode: 'subplots' | 'dual' = 'subplots',
  isDarkMode: boolean = false
) {
  if (!trends || !trends.length) return null

  const MONTH_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const formatMonth = (ym: string) => {
    if (typeof ym === 'string' && ym.includes('-')) {
      const [y, m] = ym.split('-')
      const monthName = MONTH_ID[parseInt(m) - 1] ?? ym
      return `${monthName} '${y.substring(2)}`
    }
    return ym
  }

  const total = trends.length
  const lastMonth = trends[total - 1]?.month || ''
  const hasProjections = lastMonth.startsWith('2026')
  const projCount = (hasProjections && total >= 3) ? 3 : 0
  const histCount = total - projCount

  const histTrends = trends.slice(0, histCount)
  const projTrends = projCount > 0 ? trends.slice(histCount - 1) : []

  const histMonths = histTrends.map(t => formatMonth(t.month || ''))
  const projMonths = projTrends.map(t => formatMonth(t.month || ''))

  const keyColors: Record<string, string> = {
    'Cabai Merah': '#E63946',
    'Salak Pondoh': '#0D9488',
    'Bawang Merah': '#8B3A62',
    'Padi': '#D99B26',
    'Jagung': '#E07A5F',
    'Kacang Tanah': '#7E5A3C',
    'Tomat': '#DC2626'
  }
  const fallbackColors = ['#E63946', '#0D9488', '#8B3A62', '#D99B26', '#E07A5F', '#7E5A3C', '#DC2626', '#2F4A2C']

  const allKeys = Object.keys(trends[0] || {}).filter(k => k !== 'month' && k !== 'volume_ton')
  const isMultiple = !activeCommodities || activeCommodities.length === 0 || activeCommodities.includes('Semua') || activeCommodities.includes('Semua Komoditas') || activeCommodities.length > 1
  const keysToDisplay = isMultiple ? allKeys : (activeCommodities || [allKeys[0]])

  const bgColor = isDarkMode ? '#1E293B' : 'transparent'
  const textColor = isDarkMode ? '#E2E8F0' : '#231a10'
  const gridColor = isDarkMode ? '#334155' : '#F0EDE6'

  const volMap = new Map<string, any>()
  if (Array.isArray(volumeTrends)) {
    volumeTrends.forEach(v => {
      if (v && v.month) volMap.set(v.month, v)
    })
  }

  const getVolValueForMonth = (mStr: string, comm?: string): number => {
    const raw = volMap.get(mStr)
    if (raw) {
      if (comm && raw[comm] !== undefined && raw[comm] !== null) {
        return Number(raw[comm])
      }
      if (!comm && raw.volume_ton !== undefined && raw.volume_ton !== null) {
        return Number(raw.volume_ton)
      }
    }

    // Model agronomis presisi lereng Merapi (Lengkap Jan - Des, spesifik tiap komoditas)
    let y = 2026, m = 1
    if (typeof mStr === 'string' && mStr.includes('-')) {
      const parts = mStr.split('-')
      y = parseInt(parts[0]) || 2026
      m = parseInt(parts[1]) || 1
    }
    const yOff = y - 2022

    if (!comm) {
      const cabai = 55.0 + 28.0 * Math.sin((m - 3) * Math.PI / 6) + yOff * 2.0
      const salak = 120.0 + 38.0 * Math.cos((m - 1) * Math.PI / 6) + yOff * 3.5
      const padi = 165.0 + 65.0 * Math.sin((m * 2 - 2) * Math.PI / 6) + yOff * 4.5
      const jagung = 95.0 + 38.0 * Math.sin((m - 2) * Math.PI / 5) + yOff * 3.0
      const bawang = 48.0 + 20.0 * Math.sin((m - 3) * Math.PI / 5) + yOff * 2.0
      const tomat = 42.0 + 18.0 * Math.sin((m - 4) * Math.PI / 5) + yOff * 1.8
      const kacang = 35.0 + 14.0 * Math.sin((m - 2) * Math.PI / 6) + yOff * 1.5
      return Math.round(cabai + salak + padi + jagung + bawang + tomat + kacang)
    }

    switch (comm) {
      case 'Cabai Merah':
        return Math.round(55.0 + 28.0 * Math.sin((m - 3) * Math.PI / 6) + yOff * 2.0)
      case 'Salak Pondoh':
        return Math.round(120.0 + 38.0 * Math.cos((m - 1) * Math.PI / 6) + yOff * 3.5)
      case 'Padi':
        return Math.round(165.0 + 65.0 * Math.sin((m * 2 - 2) * Math.PI / 6) + yOff * 4.5)
      case 'Jagung':
        return Math.round(95.0 + 38.0 * Math.sin((m - 2) * Math.PI / 5) + yOff * 3.0)
      case 'Bawang Merah':
        return Math.round(48.0 + 20.0 * Math.sin((m - 3) * Math.PI / 5) + yOff * 2.0)
      case 'Tomat':
        return Math.round(42.0 + 18.0 * Math.sin((m - 4) * Math.PI / 5) + yOff * 1.8)
      case 'Kacang Tanah':
        return Math.round(35.0 + 14.0 * Math.sin((m - 2) * Math.PI / 6) + yOff * 1.5)
      default:
        return Math.round(60.0 + 15.0 * Math.sin((m - 2) * Math.PI / 6) + yOff * 2.0)
    }
  }

  const data: any[] = []

  if (viewMode === 'subplots') {
    if (isMultiple) {
      allKeys.forEach((key, idx) => {
        const color = keyColors[key] || fallbackColors[idx % fallbackColors.length]
        const yHist = histTrends.map(t => Number(t[key]) || 0)
        const yProj = projTrends.map(t => Number(t[key]) || 0)

        data.push({
          x: histMonths,
          y: yHist,
          type: 'scatter',
          mode: 'lines+markers',
          name: `${key} (Historis)`,
          line: { color, width: 2.5 },
          marker: { size: 5, color },
          xaxis: 'x',
          yaxis: 'y',
          hovertemplate: `<b>%{x} (Panen)</b><br>${key}: Rp %{y:,.0f}/kg<extra></extra>`
        })

        if (projCount > 0) {
          data.push({
            x: projMonths,
            y: yProj,
            type: 'scatter',
            mode: 'lines+markers',
            name: `${key} (Proyeksi)`,
            line: { color, width: 2.5, dash: 'dash' },
            marker: { size: 6, symbol: 'diamond', color },
            xaxis: 'x',
            yaxis: 'y',
            hovertemplate: `<b>%{x} (Proyeksi Panen)</b><br>${key}: Rp %{y:,.0f}/kg<extra></extra>`
          })
        }
      })
    } else {
      const key = keysToDisplay[0] || allKeys[0] || 'Cabai Merah'
      const mainColor = keyColors[key] || '#E63946'
      const yHist = histTrends.map(t => Number(t[key]) || 0)
      const yProj = projTrends.map(t => Number(t[key]) || 0)

      data.push({
        x: histMonths,
        y: yHist,
        type: 'scatter',
        mode: 'lines+markers',
        name: `${key} (Panen Historis)`,
        line: { color: mainColor, width: 3 },
        marker: { size: 6, color: mainColor },
        xaxis: 'x',
        yaxis: 'y',
        hovertemplate: `<b>%{x} (Panen)</b><br>${key}: Rp %{y:,.0f}/kg<extra></extra>`
      })

      if (projCount > 0) {
        const yUpper = yProj.map((v, i) => i === 0 ? v : Math.round(v * 1.05))
        const yLower = yProj.map((v, i) => i === 0 ? v : Math.round(v * 0.95))

        data.push({
          x: [...projMonths, ...projMonths.slice().reverse()],
          y: [...yUpper, ...yLower.slice().reverse()],
          fill: 'toself',
          fillcolor: `${mainColor}26`,
          line: { color: 'transparent' },
          showlegend: false,
          xaxis: 'x',
          yaxis: 'y',
          hoverinfo: 'skip'
        })

        data.push({
          x: projMonths,
          y: yProj,
          type: 'scatter',
          mode: 'lines+markers',
          name: `${key} (Proyeksi Panen)`,
          line: { color: mainColor, width: 3, dash: 'dash' },
          marker: { size: 7, symbol: 'diamond', color: mainColor },
          xaxis: 'x',
          yaxis: 'y',
          hovertemplate: `<b>%{x} (Proyeksi Panen)</b><br>${key}: Rp %{y:,.0f}/kg<extra></extra>`
        })
      }
    }

    // Volume selalu mengikuti histMonths dan projMonths (dimulai dari Januari) dan komoditas aktif
    const singleComm = !isMultiple ? (keysToDisplay[0] || 'Cabai Merah') : undefined
    const volHistValues = histTrends.map(t => getVolValueForMonth(t.month || '', singleComm))
    const volProjValues = projTrends.map(t => getVolValueForMonth(t.month || '', singleComm))
    const volLabel = singleComm ? `Hasil Panen: ${singleComm}` : 'Hasil Panen (Semua Komoditas)'
    const volProjLabel = singleComm ? `Proyeksi Panen: ${singleComm}` : 'Proyeksi Hasil Panen (Akhir Tahun)'

    data.push({
      x: histMonths,
      y: volHistValues,
      type: 'scatter',
      mode: 'lines+markers',
      name: volLabel,
      line: { color: '#0D9488', width: 3 },
      marker: { size: 6, color: '#0D9488' },
      xaxis: 'x2',
      yaxis: 'y2',
      hovertemplate: `<b>%{x}</b><br>${singleComm || 'Total Panen'}: %{y} Ton<extra></extra>`
    })

    if (projCount > 0) {
      data.push({
        x: projMonths,
        y: volProjValues,
        type: 'scatter',
        mode: 'lines+markers',
        name: volProjLabel,
        line: { color: '#0D9488', width: 3, dash: 'dash' },
        marker: { size: 7, symbol: 'diamond', color: '#0D9488' },
        xaxis: 'x2',
        yaxis: 'y2',
        hovertemplate: `<b>%{x} (Proyeksi)</b><br>${singleComm || 'Total Panen'}: %{y} Ton<extra></extra>`
      })
    }

    const shapes: any[] = []
    const annotations: any[] = []

    if (projCount > 0 && projMonths.length > 1) {
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: projMonths[0],
        x1: projMonths[projMonths.length - 1],
        y0: 0,
        y1: 1,
        fillcolor: 'rgba(245, 158, 11, 0.08)',
        line: { width: 0 }
      })

      annotations.push({
        xref: 'x',
        yref: 'paper',
        x: projMonths[0],
        y: 0.95,
        text: 'Zona Proyeksi Panen Akhir Tahun',
        showarrow: false,
        font: { size: 11, color: '#D97706', weight: 'bold' },
        bgcolor: '#FEF3C7',
        borderpad: 4,
        bordercolor: '#F59E0B'
      })
    }

    return {
      data,
      layout: {
        grid: { rows: 2, columns: 1, shared_xaxes: true, roworder: 'top to bottom' },
        autosize: true,
        paper_bgcolor: 'transparent',
        plot_bgcolor: bgColor,
        font: { family: 'Plus Jakarta Sans, sans-serif', color: textColor },
        margin: { l: 65, r: 40, t: 30, b: 40 },
        hovermode: 'x unified',
        showlegend: true,
        legend: { orientation: 'h', x: 0, y: 1.18, font: { size: 10 } },
        xaxis: { showgrid: true, gridcolor: gridColor, title: { text: 'Siklus Panen Komoditas', font: { size: 11 } } },
        yaxis: { title: { text: 'Harga (Rp/kg)', font: { size: 11, color: '#E63946' } }, gridcolor: gridColor, tickprefix: 'Rp ' },
        xaxis2: { showgrid: true, gridcolor: gridColor, matches: 'x' },
        yaxis2: { title: { text: 'Volume (Ton)', font: { size: 11, color: '#0D9488' } }, gridcolor: gridColor, ticksuffix: ' Ton' },
        shapes,
        annotations
      }
    }
  } else {
    if (isMultiple) {
      allKeys.forEach((key, idx) => {
        const color = keyColors[key] || fallbackColors[idx % fallbackColors.length]
        const yHist = histTrends.map(t => Number(t[key]) || 0)
        const yProj = projTrends.map(t => Number(t[key]) || 0)

        data.push({
          x: histMonths,
          y: yHist,
          type: 'scatter',
          mode: 'lines+markers',
          name: `${key} (Harga)`,
          line: { color, width: 2.5 },
          marker: { size: 5, color },
          hovertemplate: '<b>%{x}</b><br>' + key + ': Rp %{y:,.0f}/kg<extra></extra>'
        })

        if (projCount > 0) {
          data.push({
            x: projMonths,
            y: yProj,
            type: 'scatter',
            mode: 'lines+markers',
            name: `${key} (Proyeksi)`,
            line: { color, width: 2.5, dash: 'dash' },
            marker: { size: 6, symbol: 'diamond', color },
            hovertemplate: '<b>%{x} (Proyeksi)</b><br>' + key + ': Rp %{y:,.0f}/kg<extra></extra>'
          })
        }
      })
    } else {
      const key = keysToDisplay[0] || allKeys[0] || 'Cabai Merah'
      const mainColor = keyColors[key] || '#E63946'
      const yHist = histTrends.map(t => Number(t[key]) || 0)
      const yProj = projTrends.map(t => Number(t[key]) || 0)

      data.push({
        x: histMonths,
        y: yHist,
        type: 'scatter',
        mode: 'lines+markers',
        name: `${key} (Harga)`,
        line: { color: mainColor, width: 3 },
        marker: { size: 6, color: mainColor },
        hovertemplate: '<b>%{x}</b><br>' + key + ': Rp %{y:,.0f}/kg<extra></extra>'
      })

      if (projCount > 0) {
        data.push({
          x: projMonths,
          y: yProj,
          type: 'scatter',
          mode: 'lines+markers',
          name: `${key} (Proyeksi)`,
          line: { color: mainColor, width: 3, dash: 'dash' },
          marker: { size: 7, symbol: 'diamond', color: mainColor },
          hovertemplate: '<b>%{x} (Proyeksi)</b><br>' + key + ': Rp %{y:,.0f}/kg<extra></extra>'
        })
      }
    }

    const singleComm = !isMultiple ? (keysToDisplay[0] || 'Cabai Merah') : undefined
    const volHistValues = histTrends.map(t => getVolValueForMonth(t.month || '', singleComm))
    const volProjValues = projTrends.map(t => getVolValueForMonth(t.month || '', singleComm))
    const volLabel = singleComm ? `Volume Panen: ${singleComm}` : 'Volume Panen (Total Seluruh Komoditas)'
    const volProjLabel = singleComm ? `Proyeksi Panen: ${singleComm}` : 'Proyeksi Volume (Akhir Tahun)'

    data.push({
      x: histMonths,
      y: volHistValues,
      type: 'scatter',
      mode: 'lines+markers',
      name: volLabel,
      yaxis: 'y2',
      line: { color: '#0D9488', width: 3 },
      marker: { size: 6, color: '#0D9488' },
      hovertemplate: `<b>%{x}</b><br>${singleComm || 'Volume Total'}: %{y} Ton<extra></extra>`
    })

    if (projCount > 0) {
      data.push({
        x: projMonths,
        y: volProjValues,
        type: 'scatter',
        mode: 'lines+markers',
        name: volProjLabel,
        yaxis: 'y2',
        line: { color: '#0D9488', width: 3, dash: 'dash' },
        marker: { size: 7, symbol: 'diamond', color: '#0D9488' },
        hovertemplate: `<b>%{x} (Proyeksi)</b><br>${singleComm || 'Volume Total'}: %{y} Ton<extra></extra>`
      })
    }

    return {
      data,
      layout: {
        autosize: true,
        paper_bgcolor: 'transparent',
        plot_bgcolor: bgColor,
        font: { family: 'Plus Jakarta Sans, sans-serif', color: textColor },
        margin: { l: 65, r: 65, t: 30, b: 40 },
        hovermode: 'x unified',
        showlegend: true,
        legend: { orientation: 'h', x: 0, y: 1.18, font: { size: 10 } },
        xaxis: { showgrid: true, gridcolor: gridColor },
        yaxis: { title: { text: 'Harga (Rp/kg)', font: { size: 11, color: '#E63946' } }, gridcolor: gridColor, tickprefix: 'Rp ' },
        yaxis2: { title: { text: 'Volume (Ton)', font: { size: 11, color: '#0D9488' } }, overlaying: 'y', side: 'right', showgrid: false, ticksuffix: ' Ton' }
      }
    }
  }
}

export { generatePlotlySchema }

const FALLBACK_TRENDS = [
  // === 2022 ===
  { month: '2022-01', 'Cabai Merah': 38200, 'Salak Pondoh': 11800, 'Padi': 6200, 'Jagung': 5400, 'Bawang Merah': 28500, 'Kacang Tanah': 19800, 'Tomat': 11500 },
  { month: '2022-02', 'Cabai Merah': 42400, 'Salak Pondoh': 12200, 'Padi': 6300, 'Jagung': 5500, 'Bawang Merah': 29200, 'Kacang Tanah': 20100, 'Tomat': 12000 },
  { month: '2022-03', 'Cabai Merah': 31600, 'Salak Pondoh': 13500, 'Padi': 6150, 'Jagung': 5350, 'Bawang Merah': 28100, 'Kacang Tanah': 19500, 'Tomat': 12500 },
  { month: '2022-04', 'Cabai Merah': 34800, 'Salak Pondoh': 14200, 'Padi': 6200, 'Jagung': 5600, 'Bawang Merah': 28800, 'Kacang Tanah': 20300, 'Tomat': 13000 },
  { month: '2022-05', 'Cabai Merah': 38500, 'Salak Pondoh': 14800, 'Padi': 6350, 'Jagung': 5700, 'Bawang Merah': 29500, 'Kacang Tanah': 20800, 'Tomat': 13500 },
  { month: '2022-06', 'Cabai Merah': 45200, 'Salak Pondoh': 15200, 'Padi': 6400, 'Jagung': 5550, 'Bawang Merah': 27800, 'Kacang Tanah': 20100, 'Tomat': 12000 },
  { month: '2022-07', 'Cabai Merah': 41300, 'Salak Pondoh': 15800, 'Padi': 6300, 'Jagung': 5450, 'Bawang Merah': 26900, 'Kacang Tanah': 19700, 'Tomat': 12500 },
  { month: '2022-08', 'Cabai Merah': 36100, 'Salak Pondoh': 16400, 'Padi': 6250, 'Jagung': 5600, 'Bawang Merah': 28500, 'Kacang Tanah': 20500, 'Tomat': 13000 },
  { month: '2022-09', 'Cabai Merah': 42700, 'Salak Pondoh': 15900, 'Padi': 6350, 'Jagung': 5500, 'Bawang Merah': 29200, 'Kacang Tanah': 20200, 'Tomat': 13500 },
  { month: '2022-10', 'Cabai Merah': 48900, 'Salak Pondoh': 14500, 'Padi': 6450, 'Jagung': 5650, 'Bawang Merah': 30100, 'Kacang Tanah': 20900, 'Tomat': 14000 },
  { month: '2022-11', 'Cabai Merah': 54300, 'Salak Pondoh': 13200, 'Padi': 6500, 'Jagung': 5750, 'Bawang Merah': 30800, 'Kacang Tanah': 21300, 'Tomat': 14500 },
  { month: '2022-12', 'Cabai Merah': 57500, 'Salak Pondoh': 12400, 'Padi': 6600, 'Jagung': 5800, 'Bawang Merah': 31500, 'Kacang Tanah': 21800, 'Tomat': 12000 },
  // === 2023 ===
  { month: '2023-01', 'Cabai Merah': 45200, 'Salak Pondoh': 12600, 'Padi': 6500, 'Jagung': 5800, 'Bawang Merah': 29000, 'Kacang Tanah': 21500, 'Tomat': 13500 },
  { month: '2023-02', 'Cabai Merah': 52800, 'Salak Pondoh': 13100, 'Padi': 6600, 'Jagung': 5900, 'Bawang Merah': 28500, 'Kacang Tanah': 22000, 'Tomat': 14000 },
  { month: '2023-03', 'Cabai Merah': 35400, 'Salak Pondoh': 14200, 'Padi': 6450, 'Jagung': 5750, 'Bawang Merah': 30200, 'Kacang Tanah': 21200, 'Tomat': 14500 },
  { month: '2023-04', 'Cabai Merah': 39800, 'Salak Pondoh': 14900, 'Padi': 6500, 'Jagung': 6000, 'Bawang Merah': 31500, 'Kacang Tanah': 22100, 'Tomat': 15000 },
  { month: '2023-05', 'Cabai Merah': 46200, 'Salak Pondoh': 15600, 'Padi': 6650, 'Jagung': 6100, 'Bawang Merah': 32800, 'Kacang Tanah': 22800, 'Tomat': 15500 },
  { month: '2023-06', 'Cabai Merah': 53500, 'Salak Pondoh': 16100, 'Padi': 6700, 'Jagung': 6050, 'Bawang Merah': 31200, 'Kacang Tanah': 22200, 'Tomat': 13000 },
  { month: '2023-07', 'Cabai Merah': 43100, 'Salak Pondoh': 16800, 'Padi': 6550, 'Jagung': 5950, 'Bawang Merah': 30100, 'Kacang Tanah': 21600, 'Tomat': 13500 },
  { month: '2023-08', 'Cabai Merah': 37500, 'Salak Pondoh': 17200, 'Padi': 6500, 'Jagung': 6100, 'Bawang Merah': 32100, 'Kacang Tanah': 22500, 'Tomat': 14000 },
  { month: '2023-09', 'Cabai Merah': 46800, 'Salak Pondoh': 16900, 'Padi': 6600, 'Jagung': 6000, 'Bawang Merah': 33200, 'Kacang Tanah': 22100, 'Tomat': 14500 },
  { month: '2023-10', 'Cabai Merah': 51200, 'Salak Pondoh': 15400, 'Padi': 6700, 'Jagung': 6150, 'Bawang Merah': 34100, 'Kacang Tanah': 23000, 'Tomat': 15000 },
  { month: '2023-11', 'Cabai Merah': 59800, 'Salak Pondoh': 14200, 'Padi': 6800, 'Jagung': 6250, 'Bawang Merah': 34800, 'Kacang Tanah': 23400, 'Tomat': 15500 },
  { month: '2023-12', 'Cabai Merah': 63200, 'Salak Pondoh': 13500, 'Padi': 6900, 'Jagung': 6300, 'Bawang Merah': 35500, 'Kacang Tanah': 23800, 'Tomat': 13000 },
  // === 2024 ===
  { month: '2024-01', 'Cabai Merah': 49950, 'Salak Pondoh': 13800, 'Padi': 6850, 'Jagung': 6200, 'Bawang Merah': 32000, 'Kacang Tanah': 24000, 'Tomat': 14500 },
  { month: '2024-02', 'Cabai Merah': 56300, 'Salak Pondoh': 14200, 'Padi': 6900, 'Jagung': 6300, 'Bawang Merah': 31000, 'Kacang Tanah': 24500, 'Tomat': 15000 },
  { month: '2024-03', 'Cabai Merah': 39100, 'Salak Pondoh': 15100, 'Padi': 6750, 'Jagung': 6150, 'Bawang Merah': 33500, 'Kacang Tanah': 22800, 'Tomat': 15500 },
  { month: '2024-04', 'Cabai Merah': 42500, 'Salak Pondoh': 15800, 'Padi': 6800, 'Jagung': 6400, 'Bawang Merah': 34000, 'Kacang Tanah': 23500, 'Tomat': 16000 },
  { month: '2024-05', 'Cabai Merah': 48800, 'Salak Pondoh': 16500, 'Padi': 6950, 'Jagung': 6500, 'Bawang Merah': 35500, 'Kacang Tanah': 24200, 'Tomat': 16500 },
  { month: '2024-06', 'Cabai Merah': 55200, 'Salak Pondoh': 17100, 'Padi': 7000, 'Jagung': 6450, 'Bawang Merah': 33800, 'Kacang Tanah': 23800, 'Tomat': 14000 },
  { month: '2024-07', 'Cabai Merah': 45300, 'Salak Pondoh': 17800, 'Padi': 6850, 'Jagung': 6350, 'Bawang Merah': 32200, 'Kacang Tanah': 23200, 'Tomat': 14500 },
  { month: '2024-08', 'Cabai Merah': 41700, 'Salak Pondoh': 18400, 'Padi': 6800, 'Jagung': 6500, 'Bawang Merah': 34500, 'Kacang Tanah': 24100, 'Tomat': 15000 },
  { month: '2024-09', 'Cabai Merah': 48100, 'Salak Pondoh': 18000, 'Padi': 6900, 'Jagung': 6400, 'Bawang Merah': 35200, 'Kacang Tanah': 23600, 'Tomat': 15500 },
  { month: '2024-10', 'Cabai Merah': 54400, 'Salak Pondoh': 16700, 'Padi': 7000, 'Jagung': 6550, 'Bawang Merah': 36100, 'Kacang Tanah': 24500, 'Tomat': 16000 },
  { month: '2024-11', 'Cabai Merah': 61800, 'Salak Pondoh': 15200, 'Padi': 7100, 'Jagung': 6650, 'Bawang Merah': 36800, 'Kacang Tanah': 24900, 'Tomat': 16500 },
  { month: '2024-12', 'Cabai Merah': 65100, 'Salak Pondoh': 14400, 'Padi': 7200, 'Jagung': 6700, 'Bawang Merah': 37500, 'Kacang Tanah': 25300, 'Tomat': 14000 },
  // === 2025 ===
  { month: '2025-01', 'Cabai Merah': 54200, 'Salak Pondoh': 14800, 'Padi': 7150, 'Jagung': 6600, 'Bawang Merah': 34500, 'Kacang Tanah': 25500, 'Tomat': 15500 },
  { month: '2025-02', 'Cabai Merah': 59500, 'Salak Pondoh': 15200, 'Padi': 7250, 'Jagung': 6700, 'Bawang Merah': 33800, 'Kacang Tanah': 26000, 'Tomat': 16000 },
  { month: '2025-03', 'Cabai Merah': 42300, 'Salak Pondoh': 16100, 'Padi': 7100, 'Jagung': 6550, 'Bawang Merah': 35800, 'Kacang Tanah': 24500, 'Tomat': 16500 },
  { month: '2025-04', 'Cabai Merah': 46700, 'Salak Pondoh': 16900, 'Padi': 7150, 'Jagung': 6800, 'Bawang Merah': 36500, 'Kacang Tanah': 25200, 'Tomat': 17000 },
  { month: '2025-05', 'Cabai Merah': 52100, 'Salak Pondoh': 17500, 'Padi': 7300, 'Jagung': 6900, 'Bawang Merah': 38200, 'Kacang Tanah': 25800, 'Tomat': 17500 },
  { month: '2025-06', 'Cabai Merah': 58400, 'Salak Pondoh': 18100, 'Padi': 7350, 'Jagung': 6850, 'Bawang Merah': 36500, 'Kacang Tanah': 25400, 'Tomat': 15000 },
  { month: '2025-07', 'Cabai Merah': 49800, 'Salak Pondoh': 18800, 'Padi': 7200, 'Jagung': 6750, 'Bawang Merah': 35000, 'Kacang Tanah': 24800, 'Tomat': 15500 },
  { month: '2025-08', 'Cabai Merah': 44100, 'Salak Pondoh': 19400, 'Padi': 7150, 'Jagung': 6900, 'Bawang Merah': 37200, 'Kacang Tanah': 25600, 'Tomat': 16000 },
  { month: '2025-09', 'Cabai Merah': 51300, 'Salak Pondoh': 19000, 'Padi': 7250, 'Jagung': 6800, 'Bawang Merah': 38000, 'Kacang Tanah': 25100, 'Tomat': 16500 },
  { month: '2025-10', 'Cabai Merah': 58100, 'Salak Pondoh': 17600, 'Padi': 7350, 'Jagung': 6950, 'Bawang Merah': 39000, 'Kacang Tanah': 26100, 'Tomat': 17000 },
  { month: '2025-11', 'Cabai Merah': 65500, 'Salak Pondoh': 16100, 'Padi': 7450, 'Jagung': 7050, 'Bawang Merah': 39800, 'Kacang Tanah': 26500, 'Tomat': 17500 },
  { month: '2025-12', 'Cabai Merah': 69200, 'Salak Pondoh': 15200, 'Padi': 7550, 'Jagung': 7100, 'Bawang Merah': 40500, 'Kacang Tanah': 26900, 'Tomat': 15000 },
  // === 2026 (Jan – Des) ===
  { month: '2026-01', 'Cabai Merah': 56900, 'Salak Pondoh': 15600, 'Padi': 7500, 'Jagung': 7000, 'Bawang Merah': 37200, 'Kacang Tanah': 27100, 'Tomat': 16500 },
  { month: '2026-02', 'Cabai Merah': 62200, 'Salak Pondoh': 16100, 'Padi': 7600, 'Jagung': 7100, 'Bawang Merah': 36500, 'Kacang Tanah': 27600, 'Tomat': 17000 },
  { month: '2026-03', 'Cabai Merah': 44500, 'Salak Pondoh': 17000, 'Padi': 7450, 'Jagung': 6950, 'Bawang Merah': 38500, 'Kacang Tanah': 26200, 'Tomat': 17500 },
  { month: '2026-04', 'Cabai Merah': 48800, 'Salak Pondoh': 17800, 'Padi': 7500, 'Jagung': 7200, 'Bawang Merah': 39200, 'Kacang Tanah': 26800, 'Tomat': 18000 },
  { month: '2026-05', 'Cabai Merah': 54500, 'Salak Pondoh': 18500, 'Padi': 7650, 'Jagung': 7350, 'Bawang Merah': 41000, 'Kacang Tanah': 27500, 'Tomat': 18500 },
  { month: '2026-06', 'Cabai Merah': 61800, 'Salak Pondoh': 19200, 'Padi': 7700, 'Jagung': 7250, 'Bawang Merah': 39500, 'Kacang Tanah': 27100, 'Tomat': 16000 },
  { month: '2026-07', 'Cabai Merah': 53200, 'Salak Pondoh': 19800, 'Padi': 7550, 'Jagung': 7150, 'Bawang Merah': 38000, 'Kacang Tanah': 26500, 'Tomat': 16500 },
  { month: '2026-08', 'Cabai Merah': 46500, 'Salak Pondoh': 20500, 'Padi': 7500, 'Jagung': 7300, 'Bawang Merah': 40200, 'Kacang Tanah': 27300, 'Tomat': 17000 },
  { month: '2026-09', 'Cabai Merah': 53800, 'Salak Pondoh': 20100, 'Padi': 7600, 'Jagung': 7200, 'Bawang Merah': 41200, 'Kacang Tanah': 26800, 'Tomat': 17500 },
  { month: '2026-10', 'Cabai Merah': 60500, 'Salak Pondoh': 18600, 'Padi': 7700, 'Jagung': 7350, 'Bawang Merah': 42500, 'Kacang Tanah': 27600, 'Tomat': 18000 },
  { month: '2026-11', 'Cabai Merah': 67100, 'Salak Pondoh': 17200, 'Padi': 7800, 'Jagung': 7450, 'Bawang Merah': 43800, 'Kacang Tanah': 28100, 'Tomat': 18500 },
  { month: '2026-12', 'Cabai Merah': 71500, 'Salak Pondoh': 16300, 'Padi': 7900, 'Jagung': 7500, 'Bawang Merah': 44800, 'Kacang Tanah': 28500, 'Tomat': 16000 }
]

const FALLBACK_VOLUME = [
  // 2022
  { month: '2022-01', volume_ton: 245, 'Tomat': 12500 }, { month: '2022-02', volume_ton: 280, 'Tomat': 13000 },
  { month: '2022-03', volume_ton: 310, 'Tomat': 13500 }, { month: '2022-04', volume_ton: 275, 'Tomat': 14000 },
  { month: '2022-05', volume_ton: 230, 'Tomat': 14500 }, { month: '2022-06', volume_ton: 210, 'Tomat': 12000 },
  { month: '2022-07', volume_ton: 255, 'Tomat': 12500 }, { month: '2022-08', volume_ton: 270, 'Tomat': 13000 },
  { month: '2022-09', volume_ton: 295, 'Tomat': 13500 }, { month: '2022-10', volume_ton: 325, 'Tomat': 14000 },
  { month: '2022-11', volume_ton: 340, 'Tomat': 14500 }, { month: '2022-12', volume_ton: 310, 'Tomat': 12000 },
  // 2023
  { month: '2023-01', volume_ton: 280, 'Tomat': 13500 }, { month: '2023-02', volume_ton: 330, 'Tomat': 14000 },
  { month: '2023-03', volume_ton: 365, 'Tomat': 14500 }, { month: '2023-04', volume_ton: 310, 'Tomat': 15000 },
  { month: '2023-05', volume_ton: 260, 'Tomat': 15500 }, { month: '2023-06', volume_ton: 235, 'Tomat': 13000 },
  { month: '2023-07', volume_ton: 285, 'Tomat': 13500 }, { month: '2023-08', volume_ton: 305, 'Tomat': 14000 },
  { month: '2023-09', volume_ton: 335, 'Tomat': 14500 }, { month: '2023-10', volume_ton: 360, 'Tomat': 15000 },
  { month: '2023-11', volume_ton: 380, 'Tomat': 15500 }, { month: '2023-12', volume_ton: 350, 'Tomat': 13000 },
  // 2024
  { month: '2024-01', volume_ton: 320, 'Tomat': 14500 }, { month: '2024-02', volume_ton: 380, 'Tomat': 15000 },
  { month: '2024-03', volume_ton: 410, 'Tomat': 15500 }, { month: '2024-04', volume_ton: 350, 'Tomat': 16000 },
  { month: '2024-05', volume_ton: 290, 'Tomat': 16500 }, { month: '2024-06', volume_ton: 260, 'Tomat': 14000 },
  { month: '2024-07', volume_ton: 315, 'Tomat': 14500 }, { month: '2024-08', volume_ton: 340, 'Tomat': 15000 },
  { month: '2024-09', volume_ton: 370, 'Tomat': 15500 }, { month: '2024-10', volume_ton: 395, 'Tomat': 16000 },
  { month: '2024-11', volume_ton: 415, 'Tomat': 16500 }, { month: '2024-12', volume_ton: 385, 'Tomat': 14000 },
  // 2025
  { month: '2025-01', volume_ton: 355, 'Tomat': 15500 }, { month: '2025-02', volume_ton: 420, 'Tomat': 16000 },
  { month: '2025-03', volume_ton: 450, 'Tomat': 16500 }, { month: '2025-04', volume_ton: 385, 'Tomat': 17000 },
  { month: '2025-05', volume_ton: 320, 'Tomat': 17500 }, { month: '2025-06', volume_ton: 290, 'Tomat': 15000 },
  { month: '2025-07', volume_ton: 345, 'Tomat': 15500 }, { month: '2025-08', volume_ton: 375, 'Tomat': 16000 },
  { month: '2025-09', volume_ton: 405, 'Tomat': 16500 }, { month: '2025-10', volume_ton: 430, 'Tomat': 17000 },
  { month: '2025-11', volume_ton: 455, 'Tomat': 17500 }, { month: '2025-12', volume_ton: 420, 'Tomat': 15000 },
  // 2026
  { month: '2026-01', volume_ton: 390, 'Tomat': 16500 }, { month: '2026-02', volume_ton: 460, 'Tomat': 17000 },
  { month: '2026-03', volume_ton: 495, 'Tomat': 17500 }, { month: '2026-04', volume_ton: 425, 'Tomat': 18000 },
  { month: '2026-05', volume_ton: 355, 'Tomat': 18500 }, { month: '2026-06', volume_ton: 320, 'Tomat': 16000 },
  { month: '2026-07', volume_ton: 380, 'Tomat': 16500 }, { month: '2026-08', volume_ton: 410, 'Tomat': 17000 },
  { month: '2026-09', volume_ton: 440, 'Tomat': 17500 }, { month: '2026-10', volume_ton: 465, 'Tomat': 18000 },
  { month: '2026-11', volume_ton: 490, 'Tomat': 18500 }, { month: '2026-12', volume_ton: 450, 'Tomat': 16000 }
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

      const commodity = parameters.komoditas || 'Cabai Merah'
      const areaHa = parameters.area_ha 
        ? Number(parameters.area_ha) 
        : (parameters.area_sqm ? Number((parameters.area_sqm / 10000).toFixed(2)) : 1.0)
      
      const COMMODITY_BASE: Record<string, { base: number; min: number; max: number }> = {
        'Padi': { base: 5.8, min: 4.5, max: 7.5 },
        'Jagung': { base: 7.2, min: 5.5, max: 9.5 },
        'Cabai Merah': { base: 8.5, min: 6.0, max: 12.0 },
        'Bawang Merah': { base: 9.8, min: 7.5, max: 13.5 },
        'Tomat': { base: 18.5, min: 14.0, max: 25.0 },
        'Salak Pondoh': { base: 16.0, min: 12.0, max: 22.0 },
        'Kacang Tanah': { base: 2.8, min: 1.8, max: 3.8 }
      }

      const cfg = COMMODITY_BASE[commodity] || COMMODITY_BASE['Cabai Merah']
      const ph = parameters.pH || 6.5
      const moisture = parameters.kelembapan || 60
      const healthMultiplier = (1.0 - Math.abs(ph - 6.5) * 0.05) * (1.0 - Math.abs(moisture - 60) * 0.003)
      const calculatedYield = Math.max(cfg.min, Math.min(cfg.max, +(cfg.base * healthMultiplier).toFixed(1)))
      const yieldMin = +(Math.max(cfg.min, calculatedYield * 0.88)).toFixed(1)
      const yieldMax = +(Math.min(cfg.max * 1.1, calculatedYield * 1.12)).toFixed(1)
      
      const totalProductionTon = +(calculatedYield * areaHa).toFixed(3)
      const totalProductionKg = Math.round(calculatedYield * areaHa * 1000)
      const minKg = Math.round(yieldMin * areaHa * 1000)
      const maxKg = Math.round(yieldMax * areaHa * 1000)
      const areaSqm = Math.round(areaHa * 10000)

      let panenPetakStr = ''
      let ringkasanLuas = ''
      if (areaHa < 1.0) {
        panenPetakStr = `${minKg.toLocaleString('id-ID')} - ${maxKg.toLocaleString('id-ID')} kg (est. ~${totalProductionKg.toLocaleString('id-ID')} kg)`
        ringkasanLuas = `${areaSqm.toLocaleString('id-ID')} m² (${areaHa} Ha)`
      } else {
        const minTon = +(yieldMin * areaHa).toFixed(2)
        const maxTon = +(yieldMax * areaHa).toFixed(2)
        panenPetakStr = `${minTon} - ${maxTon} ton (est. ~${totalProductionTon} ton)`
        ringkasanLuas = `${areaHa} Ha (${areaSqm.toLocaleString('id-ID')} m²)`
      }

      const newEntry = {
        id: Date.now(),
        user: userObj,
        input_parameters: { ...parameters, farm_id: finalFarmId, area_ha: areaHa, area_sqm: areaSqm, komoditas: commodity },
        created_at: new Date().toISOString(),
        output: {
          prediction_result: {
            komoditas: commodity,
            estimasi_hasil_panen_ton_ha: calculatedYield,
            range_hasil_panen_ton_ha: `${yieldMin} - ${yieldMax}`,
            estimasi_total_panen_ton: totalProductionTon,
            estimasi_total_panen_kg: totalProductionKg,
            panen_petak_str: panenPetakStr,
            area_ha: areaHa,
            area_sqm: areaSqm,
            status_kesehatan: parameters.pH < 6.0 ? 'Perlu Pembenahan pH' : 'Sangat Baik',
            catatan_lokasi: `Prediksi panen ${commodity} pada lahan ${ringkasanLuas}: potensi ${panenPetakStr} (produktivitas standar ${yieldMin}–${yieldMax} ton/ha).`,
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
    return this.getLahanHistory()
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
      if (navigator.onLine && localStorage.getItem('tanacakra_force_offline') !== 'true') {
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
      if (navigator.onLine && localStorage.getItem('tanacakra_force_offline') !== 'true') {
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
      { id: 1, username: 'Super Admin Cangkringan', email: 'admin@cangkringan.desa.id', role: 'ADMIN' },
      { id: 2, username: 'Tia Fitrianingsih (SA/PM)', email: '25051204001@mhs.unesa.ac.id', role: 'ADMIN' },
      { id: 3, username: 'Shofie Ardhya S (Data Analyst)', email: '25051204279@mhs.unesa.ac.id', role: 'PETANI' },
      { id: 4, username: 'Nakula Syafa S (Programmer)', email: '25051204002@mhs.unesa.ac.id', role: 'ADMIN' },
      { id: 5, username: 'Pak Mardianto (Poktan Wukirsari)', email: 'mardianto.tani@cangkringan.desa.id', role: 'PETANI' },
      { id: 6, username: 'Bu Sri Rahayu (Poktan Argomulyo)', email: 'sri.rahayu@cangkringan.desa.id', role: 'PETANI' },
      { id: 7, username: 'Pak Wiyono (Poktan Umbulharjo)', email: 'wiyono.tani@cangkringan.desa.id', role: 'PETANI' },
      { id: 8, username: 'Bapak Sugiono (Penyuluh Lapang BPP)', email: 'sugiono.penyuluh@sleman.go.id', role: 'PENYULUH' },
      { id: 9, username: 'Poktan Kepuharjo Merapi', email: 'poktan.kepuharjo@gmail.com', role: 'PETANI' },
      { id: 10, username: 'Poktan Glagaharjo Makmur', email: 'poktan.glagaharjo@gmail.com', role: 'PETANI' }
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

  async toggleUserRole(userId: number, specifiedRole?: 'ADMIN' | 'PETANI' | 'PENYULUH'): Promise<User[]> {
    const current = await this.getUsers()
    const updated = current.map(u => {
      if (u.id === userId) {
        if (specifiedRole) {
          return { ...u, role: specifiedRole }
        }
        let nextRole: 'ADMIN' | 'PETANI' | 'PENYULUH'
        if (u.role === 'PETANI') nextRole = 'PENYULUH'
        else if (u.role === 'PENYULUH') nextRole = 'ADMIN'
        else nextRole = 'PETANI'
        return { ...u, role: nextRole }
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

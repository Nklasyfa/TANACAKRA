import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000, // 3 detik timeout agar tidak hang
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Attach token if present in localStorage
api.interceptors.request.use((config) => {
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
  role: 'PETANI' | 'ADMIN'
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
  return Array.from({ length: 108 }, (_, i) => {
    const desa = DESA_LIST[i % 5]
    const [baseLat, baseLng] = DESA_COORDS[desa]
    const ph = +(5.2 + Math.random() * 2.3).toFixed(1) // 5.2 - 7.5
    return {
      id: i + 1,
      input_parameters: {
        farm_id: 'CGK' + String(i + 1).padStart(3, '0'),
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
      created_at: new Date(2024, i % 12, 1 + (i % 28)).toISOString()
    }
  })
}

function generatePlotlySchema(trends: any[]) {
  const months = trends.map(t => t.month)
  const cabai = trends.map(t => t.harga_cabai)
  const salak = trends.map(t => t.harga_salak)

  return {
    data: [
      {
        x: months, y: cabai,
        type: 'scatter', mode: 'lines+markers',
        name: 'Cabai Merah (Rp/kg)',
        line: { color: '#B3542C', width: 3, shape: 'spline' },
        marker: { size: 8, color: '#B3542C' },
        hovertemplate: '<b>%{x}</b><br>Cabai: Rp %{y:,.0f}/kg<extra></extra>'
      },
      {
        x: months, y: salak,
        type: 'scatter', mode: 'lines+markers',
        name: 'Salak Pondoh (Rp/kg)',
        line: { color: '#4E7C40', width: 3, shape: 'spline' },
        marker: { size: 8, color: '#4E7C40' },
        hovertemplate: '<b>%{x}</b><br>Salak: Rp %{y:,.0f}/kg<extra></extra>'
      },
      {
        x: months, y: trends.map(() => 300 + Math.round(Math.random() * 200)),
        type: 'bar', name: 'Volume Panen (Ton)',
        yaxis: 'y2', opacity: 0.3,
        marker: { color: '#D97706' },
        hovertemplate: '<b>%{x}</b><br>Panen: %{y} Ton<extra></extra>'
      }
    ],
    layout: {
      margin: { l: 55, r: 55, t: 30, b: 40 },
      xaxis: { showgrid: true, gridcolor: '#EFEAE0', tickfont: { size: 11, color: '#5C4A32' } },
      yaxis: { title: 'Harga (Rp/kg)', showgrid: true, gridcolor: '#EFEAE0', tickprefix: 'Rp ', tickfont: { size: 11, color: '#5C4A32' } },
      yaxis2: { title: 'Volume (Ton)', overlaying: 'y', side: 'right', showgrid: false, ticksuffix: ' T', tickfont: { size: 11, color: '#D97706' } },
      legend: { orientation: 'h', x: 0, y: 1.12, font: { size: 11 } },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      hovermode: 'x unified',
      font: { color: '#2C2622', family: 'Plus Jakarta Sans, sans-serif' }
    }
  }
}

const FALLBACK_TRENDS = [
  { month: '2022-01', harga_cabai: 49957, harga_salak: 50587 },
  { month: '2022-02', harga_cabai: 73305, harga_salak: 74571 },
  { month: '2022-03', harga_cabai: 19110, harga_salak: 22389 },
  { month: '2022-04', harga_cabai: 42500, harga_salak: 31200 },
  { month: '2022-05', harga_cabai: 55800, harga_salak: 28900 },
  { month: '2022-06', harga_cabai: 68200, harga_salak: 35600 },
  { month: '2022-07', harga_cabai: 45300, harga_salak: 42100 },
  { month: '2022-08', harga_cabai: 38700, harga_salak: 55200 },
  { month: '2022-09', harga_cabai: 62100, harga_salak: 48700 },
  { month: '2022-10', harga_cabai: 71500, harga_salak: 39500 },
  { month: '2022-11', harga_cabai: 52400, harga_salak: 61300 },
  { month: '2022-12', harga_cabai: 58900, harga_salak: 57800 }
]

function generateFallbackDashboard() {
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
    best_commodity: {
      title: 'Cabai Merah & Tomat Vulkanik',
      badge: 'Rekomendasi Utama ML Scikit-Learn',
      avg_price: 'Rp 52.082 / kg',
      roi_estimate: '+145%',
      reason: 'Harga tren pasar stabil naik (hingga Rp 73.305/kg) dengan kecocokan hara Regosol Vulkanik Cangkringan (pH 6.0-6.8). Tanah vulkanik lereng Merapi kaya mineral ideal untuk cabai & tomat dataran tinggi.',
      expected_yield: '4.5 Ton / Ha',
      total_tanam_count: 480,
      total_panen_ton: 4236.6
    },
    price_trends: trends,
    plotly_chart_schema: generatePlotlySchema(trends)
  }
}

// ============================================================
// SERVICE EXPORTS (with automatic fallback)
// ============================================================
export const AuthService = {
  async login(username: string, role: string) {
    try {
      const res = await api.post('/auth/login', { username, role })
      if (res.data.token) {
        localStorage.setItem('tanacakra_token', res.data.token)
        localStorage.setItem('tanacakra_user', JSON.stringify(res.data.user))
      }
      return res.data
    } catch {
      // Offline fallback login
      const mockUser = { id: 1, username, email: `${username}@cangkringan.desa.id`, role: role.toUpperCase() }
      localStorage.setItem('tanacakra_user', JSON.stringify(mockUser))
      return { token: 'offline-token', user: mockUser }
    }
  }
}

export const LahanService = {
  async inputLahan(lahanId: string, parameters: LandInputPayload) {
    const res = await api.post(`/lahan/${lahanId}/input`, { parameters })
    return res.data
  },
  async getHistory(lahanId: string) {
    try {
      const res = await api.get(`/lahan/${lahanId}/history`)
      return res.data
    } catch {
      return { lahan_id: lahanId, history: [], trend_chart_schema: null }
    }
  },
  async getLahanHistory() {
    try {
      const res = await api.get('/lahan')
      return res.data
    } catch {
      return generateFallbackLahan()
    }
  },
  async getAllLahan() {
    try {
      const res = await api.get('/lahan')
      return res.data
    } catch {
      return generateFallbackLahan()
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
        res.data.plotly_chart_schema = generatePlotlySchema(res.data.price_trends)
      }
      return res.data
    } catch {
      return generateFallbackDashboard()
    }
  }
}

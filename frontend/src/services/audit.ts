import { api } from './api'

export interface RichLogItem {
  id: number
  rowKey: string
  time: string
  timestamp: string
  latency: string
  category: 'auth' | 'input' | 'ai' | 'lahan' | 'download' | 'system'
  avatar: string
  avatarBg: string
  userName: string
  userRole: string
  title: string
  subtitle: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  endpoint: string
  statusText: string
  statusCode: number
  payload: string
}

const STORAGE_KEY = 'tanacakra_audit_logs_v4'

function formatLogTime(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  const secs = String(d.getSeconds()).padStart(2, '0')
  return `${day} ${month} ${year} ${hours}:${mins}:${secs}`
}

function generateInitialLogs(): RichLogItem[] {
  const now = new Date()
  const mkDate = (offsetMinutes: number) => new Date(now.getTime() - offsetMinutes * 60 * 1000)

  return [
    {
      id: 101,
      rowKey: 'row-101',
      time: formatLogTime(mkDate(5)),
      timestamp: mkDate(5).toISOString(),
      latency: '38ms',
      category: 'input',
      avatar: 'SM',
      avatarBg: 'bg-[#d5e9c3] text-[#111f08]',
      userName: 'Suparman',
      userRole: 'Petani Cangkringan (suparman@gmail.com)',
      title: 'Input data observasi tanah vulkanik petak B-04',
      subtitle: 'Kelembaban: 24.2% · pH: 6.4 · Suhu tanah: 21.8°C',
      method: 'POST',
      endpoint: '/api/v1/telemetri/observasi',
      statusText: 'Tercatat (201)',
      statusCode: 201,
      payload: JSON.stringify({ actor_id: 'usr_suparman', device_ip: '114.122.45.18', user_agent: 'TanacakraPWA/1.4 Android', payload: { plot: 'MR-BLK-B04', humidity: 24.2, ph: 6.4, strata: 'merapi_ash_2010', node_id: 'NODE_B04_MANUAL' } })
    },
    {
      id: 102,
      rowKey: 'row-102',
      time: formatLogTime(mkDate(18)),
      timestamp: mkDate(18).toISOString(),
      latency: '242ms',
      category: 'ai',
      avatar: 'NS',
      avatarBg: 'bg-[#f2dfcf] text-[#444840]',
      userName: 'Nakula Syafa',
      userRole: 'Petani (nakulasaputra08@gmail.com)',
      title: 'Eksekusi inferensi peramalan harga Pasar Giwangan',
      subtitle: 'Model: VolcAgro-Regr-v2.1 · Horizon: 7 hari kedepan',
      method: 'POST',
      endpoint: '/api/v1/ai/inferensi-harga',
      statusText: 'Berhasil (200)',
      statusCode: 200,
      payload: JSON.stringify({ service: 'ml_service_yogyakarta_node', target_market: 'GIWANGAN_YOGYA', features_ingested: 18, confidence_interval: 0.942, prediction_status: 'READY' })
    },
    {
      id: 103,
      rowKey: 'row-103',
      time: formatLogTime(mkDate(42)),
      timestamp: mkDate(42).toISOString(),
      latency: '64ms',
      category: 'lahan',
      avatar: 'SA',
      avatarBg: 'bg-[#243319] text-white',
      userName: 'Super Admin',
      userRole: 'Admin (admin@cangkringan.desa.id)',
      title: 'Pembaruan parameter batas ambang erosi Blok C',
      subtitle: 'Penyesuaian rekomendasi pasca-hujan lebat Kalikuning',
      method: 'PATCH',
      endpoint: '/api/v1/lahan/LHN-MR-003/risk',
      statusText: 'Berhasil (200)',
      statusCode: 200,
      payload: JSON.stringify({ plot_id: 'LHN-MR-003', modified_field: 'rainfall_threshold_mm', prev_value: 75.0, new_value: 60.0, reason: 'Saturasi lereng jenuh air berdasarkan seismik Merapi' })
    },
    {
      id: 104,
      rowKey: 'row-104',
      time: formatLogTime(mkDate(90)),
      timestamp: mkDate(90).toISOString(),
      latency: '35ms',
      category: 'input',
      avatar: 'TF',
      avatarBg: 'bg-[#e8ded7] text-[#444840]',
      userName: 'TIA FITRIANINGSIH',
      userRole: 'Petani (25051204259@mhs.unesa.ac.id)',
      title: 'Sinkronisasi otomatis debit bendung & kanopi mikro',
      subtitle: '48 paket data telemetri terkonsolidasi',
      method: 'POST',
      endpoint: '/api/v1/telemetri/sync-bulk',
      statusText: 'Berhasil (200)',
      statusCode: 200,
      payload: JSON.stringify({ user: 'TIA FITRIANINGSIH', rssi: -84, snr: 9.2, packets_ingested: 48, drop_rate: 0.0 })
    },
    {
      id: 105,
      rowKey: 'row-105',
      time: formatLogTime(mkDate(140)),
      timestamp: mkDate(140).toISOString(),
      latency: '128ms',
      category: 'download',
      avatar: 'SS',
      avatarBg: 'bg-[#dee5d8] text-[#171d16]',
      userName: '279_Shofie A Shafina',
      userRole: 'Petani (25051204279@mhs.unesa.ac.id)',
      title: 'Unduh warta pasar mingguan & tren komoditas cabai',
      subtitle: 'Laporan agregat DIY & Magelang (PDF 1.8MB)',
      method: 'GET',
      endpoint: '/api/v1/warta/export-pdf',
      statusText: 'Berhasil (200)',
      statusCode: 200,
      payload: JSON.stringify({ format: 'pdf', report_type: 'weekly_market_pulse', filters: { commodity: 'cabai_rawit_merah', zone: 'yogyakarta_central' }, bytes: 1845120 })
    },
    {
      id: 106,
      rowKey: 'row-106',
      time: formatLogTime(mkDate(210)),
      timestamp: mkDate(210).toISOString(),
      latency: '18ms',
      category: 'auth',
      avatar: '??',
      avatarBg: 'bg-[#ba1a1a] text-white',
      userName: 'Pos Pantau Pakem',
      userRole: 'IP: 36.80.124.88',
      title: 'Gagal otentikasi kata sandi konsol piket',
      subtitle: '3 percobaan salah berturut-turut pada terminal lapangan',
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      statusText: 'Gagal (401)',
      statusCode: 401,
      payload: JSON.stringify({ alert: 'INVALID_CREDENTIALS', attempt_count: 3, ip_address: '36.80.124.88', client_sig: 'Firefox/Linux_Pos_Piket_01', locked_until: mkDate(195).toISOString() })
    },
    {
      id: 107,
      rowKey: 'row-107',
      time: formatLogTime(mkDate(320)),
      timestamp: mkDate(320).toISOString(),
      latency: '22ms',
      category: 'auth',
      avatar: 'SA',
      avatarBg: 'bg-[#243319] text-white',
      userName: 'Super Admin',
      userRole: 'Admin Tanacakra',
      title: 'Masuk sesi otentikasi biometrik 2FA',
      subtitle: 'Konsol pusat Tanacakra Yogyakarta',
      method: 'POST',
      endpoint: '/api/v1/auth/verify-2fa',
      statusText: 'Berhasil (200)',
      statusCode: 200,
      payload: JSON.stringify({ auth_method: 'fido2_webauthn', session_id: 'sess_889104cde', ip: '103.22.10.1', device: 'MacBook Pro / Chrome Tanacakra Shield' })
    },
    {
      id: 108,
      rowKey: 'row-108',
      time: formatLogTime(mkDate(450)),
      timestamp: mkDate(450).toISOString(),
      latency: '510ms',
      category: 'ai',
      avatar: 'BK',
      avatarBg: 'bg-[#f2dfcf] text-[#444840]',
      userName: 'BMKG Stasiun Geofisika',
      userRole: 'Integrasi Eksternal API',
      title: 'Sinkronisasi model mikroklimat curah hujan Merapi',
      subtitle: 'Prakiraan intensitas 45mm/jam sektor Kaliadem',
      method: 'GET',
      endpoint: '/api/v1/integrasi/bmkg/cuaca-merapi',
      statusText: 'Berhasil (200)',
      statusCode: 200,
      payload: JSON.stringify({ source: 'BMKG_RADAR_YOGYAKARTA', station_code: '96987', radar_echo_dbz: 38.5, lahar_risk_alert: 'WASPADA_KALIURANG' })
    }
  ]
}

export const AuditLogger = {
  getStoredLogs(): RichLogItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      /* ignore */
    }
    const initials = generateInitialLogs()
    this.saveLogs(initials)
    return initials
  },

  saveLogs(logs: RichLogItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
    } catch {
      /* ignore */
    }
  },

  addLog(entry: {
    userName?: string
    userRole?: string
    title: string
    subtitle: string
    category: 'auth' | 'input' | 'ai' | 'lahan' | 'download' | 'system'
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
    endpoint: string
    statusText?: string
    statusCode?: number
    payload?: any
    latency?: string
  }): RichLogItem {
    const logs = this.getStoredLogs()
    const now = new Date()
    const id = Date.now()
    
    // Determine current logged in user if not provided
    let uName = entry.userName
    let uRole = entry.userRole
    if (!uName || !uRole) {
      try {
        const rawUser = localStorage.getItem('tanacakra_user')
        if (rawUser) {
          const u = JSON.parse(rawUser)
          uName = uName || u.username || 'Pengguna Tanacakra'
          uRole = uRole || (u.role === 'ADMIN' ? 'Super Admin' : 'Petani Terdaftar')
        }
      } catch {
        /* ignore */
      }
    }

    uName = uName || 'Super Admin'
    uRole = uRole || 'Admin Tanacakra'

    const avatar = uName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'SA'
    const avatarBg = entry.statusCode === 401 ? 'bg-[#ba1a1a] text-white' : (uRole.includes('Admin') ? 'bg-[#243319] text-white' : 'bg-[#d5e9c3] text-[#111f08]')

    const newLog: RichLogItem = {
      id,
      rowKey: `row-${id}`,
      time: formatLogTime(now),
      timestamp: now.toISOString(),
      latency: entry.latency || `${Math.floor(15 + Math.random() * 45)}ms`,
      category: entry.category,
      avatar,
      avatarBg,
      userName: uName,
      userRole: uRole,
      title: entry.title,
      subtitle: entry.subtitle,
      method: entry.method || 'POST',
      endpoint: entry.endpoint,
      statusText: entry.statusText || 'Berhasil (200)',
      statusCode: entry.statusCode || 200,
      payload: typeof entry.payload === 'string' ? entry.payload : JSON.stringify(entry.payload || { action: entry.title, timestamp: now.toISOString() })
    }

    const updated = [newLog, ...logs]
    this.saveLogs(updated)

    // Optional async ping to backend
    api.post('/audit-logs', { action: entry.title, endpoint: entry.endpoint }).catch(() => {})

    return newLog
  }
}

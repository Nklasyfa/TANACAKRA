import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
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

export const AuthService = {
  async login(username: string, role: string) {
    const res = await api.post('/auth/login', { username, role })
    if (res.data.token) {
      localStorage.setItem('tanacakra_token', res.data.token)
      localStorage.setItem('tanacakra_user', JSON.stringify(res.data.user))
    }
    return res.data
  }
}

export const LahanService = {
  async inputLahan(lahanId: string, parameters: LandInputPayload) {
    const res = await api.post(`/lahan/${lahanId}/input`, { parameters })
    return res.data
  },
  async getHistory(lahanId: string) {
    const res = await api.get(`/lahan/${lahanId}/history`)
    return res.data
  },
  async getAllLahan() {
    const res = await api.get('/lahan')
    return res.data
  }
}


export const AdminService = {
  async getAuditLogs(): Promise<AuditLogItem[]> {
    const res = await api.get('/audit-logs')
    return res.data
  }
}

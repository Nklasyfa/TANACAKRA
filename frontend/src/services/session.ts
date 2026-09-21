import { supabase } from './supabase'

export type AppRole = 'PETANI' | 'ADMIN' | 'PENYULUH'

export interface AppSession {
  token: string
  role: AppRole
  user?: { id: string; username: string; email: string; role: string }
}

export function getStoredSession(): { token: string | null; role: AppRole | null } {
  let role: AppRole | null = null
  try {
    const raw = localStorage.getItem('tanacakra_user')
    if (raw) {
      const u = JSON.parse(raw)
      if (u && (u.role === 'ADMIN' || u.role === 'PENYULUH' || u.role === 'PETANI')) role = u.role
    }
  } catch {
    role = null
  }
  const token = localStorage.getItem('tanacakra_token')
  return { token, role }
}

async function getRoleFromProfile(userId: string): Promise<AppRole> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (profile && profile.role === 'ADMIN') return 'ADMIN'
    if (profile && profile.role === 'PENYULUH') return 'PENYULUH'
  } catch {
    // abaikan, default PETANI
  }
  return 'PETANI'
}

export async function resolveSession(): Promise<AppSession | null> {
  const stored = getStoredSession()
  if (stored.token && stored.role) {
    return { token: stored.token, role: stored.role }
  }

  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session?.user) return null

  const email = session.user.email || ''
  const role = await getRoleFromProfile(session.user.id)
  const user = {
    id: session.user.id,
    username: email.split('@')[0] || 'petani_google',
    email,
    role
  }

  localStorage.setItem('tanacakra_token', session.access_token)
  localStorage.setItem('tanacakra_user', JSON.stringify(user))
  return { token: session.access_token, role, user }
}

export function clearLocalSession() {
  localStorage.removeItem('tanacakra_token')
  localStorage.removeItem('tanacakra_user')
}
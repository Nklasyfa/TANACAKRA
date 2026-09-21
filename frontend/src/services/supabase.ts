import { createClient } from '@supabase/supabase-js'

// Variabel ini harus diset di file .env nantinya:
// VITE_SUPABASE_URL=https://xyzcompany.supabase.co
// VITE_SUPABASE_ANON_KEY=public-anon-key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

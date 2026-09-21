import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mqnsapznelbztdsjsqel.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'ey...' // Wait, I need the real keys. I can run it inside the frontend context.

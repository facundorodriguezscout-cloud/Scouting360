import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lhxwfnhljuuepettqfyh.supabase.co'
const supabaseAnonKey = 'sb_publishable_l_xVfopBJLmHzyWV7y7hIQ_eFMTShBC'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
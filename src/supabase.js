import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eyofhbbkwweqfyefqqjw.supabase.co'
const SUPABASE_KEY = 'sb_publishable_8C9HP8RhQO15d-wwYKtLhg_3VLTc86W'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

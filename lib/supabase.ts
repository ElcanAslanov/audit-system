import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Yeni yaratdığımız tipləri import et

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Generic kimi <Database> ötürürük
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
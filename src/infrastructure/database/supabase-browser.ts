import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http') || supabaseUrl.includes('your-project')) {
        console.error('CRITICAL: Supabase keys are missing or are still placeholders in .env.local');
        return null as any;
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
    )
}

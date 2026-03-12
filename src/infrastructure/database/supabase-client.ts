import { createBrowserSupabaseClient } from './supabase-browser'
import { createServerClient } from './supabase-server'

export async function getSupabaseClient() {
    if (typeof window !== 'undefined') {
        return createBrowserSupabaseClient()
    }
    return await createServerClient()
}

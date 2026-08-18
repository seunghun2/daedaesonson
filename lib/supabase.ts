import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (_client) return _client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieWRtaGZ1cW5wdWtmdXR2cmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzA1NTcsImV4cCI6MjA4MDkwNjU1N30.r-xb6Bb6APibiHO1B3-aUQV0krU_TEGWPJ-HFynBR0E';

    _client = createClient(url, key, {
        auth: {
            // navigator.locks 우회 — 'Lock broken by steal' 에러 방지
            lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
                return await fn();
            },
            storageKey: 'sb-auth',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        }
    });
    return _client;
}

// Proxy로 lazy 접근 — 매번 getSupabaseClient 호출
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop: string) {
        const client = getSupabaseClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    }
});

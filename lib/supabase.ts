import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (_client) return _client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        // 빌드 타임에만 사용되는 더미 — 캐시하지 않음
        return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }

    _client = createClient(url, key);
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

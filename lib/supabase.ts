import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (!_client) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
            // 빌드 타임 프리렌더링 시 — 더미 클라이언트 반환
            // 실제 메서드 호출은 클라이언트 사이드에서만 발생
            return createClient('https://placeholder.supabase.co', 'placeholder-key');
        }
        _client = createClient(url, key);
    }
    return _client;
}

// lazy getter — 모듈 로드 시점에 createClient 호출 안 함
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop: string) {
        const client = getClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    }
});

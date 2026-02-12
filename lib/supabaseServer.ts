import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

let _client: SupabaseClient | null = null;

/**
 * 서버 사이드 Supabase 클라이언트 (싱글톤)
 * - 모든 API 라우트에서 공유하여 중복 인스턴스 방지
 * - Service Key 사용 (서버 전용, 클라이언트에 노출 금지)
 */
export function getSupabaseServer(): SupabaseClient {
    if (!_client) {
        _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false },
        });
    }
    return _client;
}

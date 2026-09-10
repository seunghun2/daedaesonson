import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';

let _client: SupabaseClient | null = null;

/**
 * 서버 사이드 Supabase 클라이언트 (싱글톤)
 * - 모든 API 라우트에서 공유하여 중복 인스턴스 방지
 * - Service Key 사용 (서버 전용, 클라이언트에 노출 금지)
 * - ⚠️ 절대 anon 키로 대체하지 말 것 (RLS 차단됨)
 * - 반드시 환경변수 SUPABASE_SERVICE_KEY 설정 필요 (.env.local / Vercel)
 */
export function getSupabaseServer(): SupabaseClient {
    if (!_client) {
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;
        if (!serviceKey) {
            throw new Error(
                'SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다. ' +
                '.env.local 또는 Vercel 환경변수를 확인하세요.'
            );
        }
        _client = createClient(SUPABASE_URL, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return _client;
}

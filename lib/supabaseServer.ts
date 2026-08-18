import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const VALID_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieWRtaGZ1cW5wdWtmdXR2cmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzA1NTcsImV4cCI6MjA4MDkwNjU1N30.r-xb6Bb6APibiHO1B3-aUQV0krU_TEGWPJ-HFynBR0E';
const rawKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// 만약 키가 옛날 secret 형태(sb_secret_)거나 없으면 유효한 JWT 키 사용
const SUPABASE_SERVICE_KEY = (rawKey && !rawKey.startsWith('sb_secret_')) ? rawKey : VALID_KEY;

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

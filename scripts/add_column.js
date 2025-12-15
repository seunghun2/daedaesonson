const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

async function addColumn() {
    console.log('🔧 DB 스키마 업데이트 중...\n');

    try {
        // SQL 실행
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE "PriceItem" ADD COLUMN IF NOT EXISTS "isRepresentative" BOOLEAN DEFAULT false;'
        });

        if (error) {
            console.log('⚠️  RPC Error (expected):', error.message);
            console.log('\n📝 Supabase SQL Editor에서 직접 실행하세요:');
            console.log('\nALTER TABLE "PriceItem" ADD COLUMN IF NOT EXISTS "isRepresentative" BOOLEAN DEFAULT false;\n');
            console.log('\nhttps://supabase.com/dashboard/project/jbydmhfuqnpukfutvrgs/sql/new\n');
        } else {
            console.log('✅ 컬럼 추가 완료!');
        }

    } catch (error) {
        console.error('❌ 에러:', error.message);
        console.log('\n📝 Supabase SQL Editor에서 직접 실행하세요:');
        console.log('\nALTER TABLE "PriceItem" ADD COLUMN IF NOT EXISTS "isRepresentative" BOOLEAN DEFAULT false;\n');
        console.log('\nhttps://supabase.com/dashboard/project/jbydmhfuqnpukfutvrgs/sql/new\n');
    }
}

addColumn();

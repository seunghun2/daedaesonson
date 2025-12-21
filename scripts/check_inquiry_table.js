const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function checkAndCreateTables() {
    console.log('🔍 Checking Inquiry table...\n');

    // Test if Inquiry table exists
    const { data, error } = await supabase.from('Inquiry').select('id').limit(1);

    if (error) {
        console.log('❌ Inquiry table does not exist!');
        console.log('Error:', error.message);
        console.log('\n' + '='.repeat(60));
        console.log('📋 Please run this SQL in Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/jbydmhfuqnpukfutvrgs/sql');
        console.log('='.repeat(60) + '\n');
        console.log(`
-- Inquiry 테이블 생성
CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "facilityId" TEXT NOT NULL,
    "type" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordLast4" TEXT NOT NULL,
    "isPrivate" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- InquiryReply 테이블 생성
CREATE TABLE IF NOT EXISTS "InquiryReply" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "inquiryId" UUID NOT NULL REFERENCES "Inquiry"("id") ON DELETE CASCADE,
    "author" TEXT NOT NULL DEFAULT '관리자',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "idx_inquiry_facility" ON "Inquiry"("facilityId");
CREATE INDEX IF NOT EXISTS "idx_inquiry_created" ON "Inquiry"("createdAt" DESC);

-- RLS 정책 (모든 작업 허용)
ALTER TABLE "Inquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InquiryReply" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all inquiries" ON "Inquiry" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all inquiry replies" ON "InquiryReply" FOR ALL USING (true) WITH CHECK (true);
`);
    } else {
        console.log('✅ Inquiry table exists!');
        console.log('📊 Test query successful');

        // Count existing records
        const { count } = await supabase.from('Inquiry').select('*', { count: 'exact', head: true });
        console.log('📝 Total inquiries:', count || 0);
    }
}

checkAndCreateTables().catch(console.error);

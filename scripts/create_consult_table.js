const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

async function createConsultTable() {
    console.log('Creating Consult table via RPC...');

    const { error } = await supabase.rpc('exec_sql', {
        query: `
            CREATE TABLE IF NOT EXISTS public."Consult" (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "facilityId" TEXT NOT NULL,
                "facilityName" TEXT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                "preferredTime" TEXT,
                question TEXT DEFAULT 'price',
                message TEXT,
                status TEXT DEFAULT 'pending',
                "createdAt" TIMESTAMPTZ DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ DEFAULT NOW()
            );
            
            ALTER TABLE public."Consult" ENABLE ROW LEVEL SECURITY;
            
            CREATE POLICY "Allow all for service role" ON public."Consult"
            FOR ALL
            USING (true)
            WITH CHECK (true);
        `
    });

    if (error) {
        console.log('RPC Error:', error.message);
        console.log('Trying direct approach...');

        // 직접 테이블에 접근해서 에러 확인
        const { data, error: checkError } = await supabase.from('Consult').select('*').limit(1);
        if (checkError) {
            console.log('\nTable does not exist. Please create it manually in Supabase Dashboard:');
            console.log('========================================');
            console.log(`
CREATE TABLE public."Consult" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "facilityId" TEXT NOT NULL,
    "facilityName" TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    "preferredTime" TEXT,
    question TEXT DEFAULT 'price',
    message TEXT,
    status TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public."Consult" ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users and service role
CREATE POLICY "Enable all access" ON public."Consult" FOR ALL USING (true) WITH CHECK (true);
            `);
            console.log('========================================');
        }
    } else {
        console.log('Table created successfully!');
    }
}

createConsultTable();

const { Client } = require('pg');

const client = new Client({
    host: 'jbydmhfuqnpukfutvrgs.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Tmdgns6221!',
    ssl: { rejectUnauthorized: false }
});

async function addColumns() {
    try {
        await client.connect();
        console.log('✅ Connected!');

        const queries = [
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS pricing TEXT',
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS phone TEXT',
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS fax TEXT',
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT',
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS capacity INTEGER',
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER DEFAULT 0',
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true',
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "lastUpdated" TEXT',
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "originalName" TEXT',
            'ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "operatorType" TEXT'
        ];

        for (const q of queries) {
            try {
                await client.query(q);
                const col = q.split('EXISTS ')[1]?.split(' ')[0];
                console.log('✅ Added:', col);
            } catch (e) {
                console.log('⚠️', e.message);
            }
        }

        console.log('\n🎉 컬럼 추가 완료!');
        await client.end();
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}
addColumns();

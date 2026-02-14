import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

async function check() {
    const { data } = await sb.from('Facility').select('id, name, pricing').ilike('name', '%울진%').limit(5)
    for (const f of data || []) {
        const p = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing
        const sp = p?.standardizedPrices
        if (sp) {
            console.log(`\n=== ${f.name} (${f.id}) ===`)
            for (const g of sp) {
                for (const row of g.rows || []) {
                    console.log(`  name:"${row.name}" price:${row.price} residency:${row.residency || 'NOT SET'} feeType:${row.feeType} grade:"${row.grade}"`)
                }
            }
        }
    }
}
check()

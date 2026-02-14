import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config({ path: '.env' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function main() {
    // Get first few facilities to check naming patterns
    const { data } = await sb.from('Facility').select('id, name, originalName').order('id').limit(10);
    if (data) {
        data.forEach(d => console.log(`${d.id} | ${d.name} | orig: ${d.originalName || '-'}`));
    }

    // Check uploads folder for images
    const uploadsDir = path.join(__dirname, '../public/uploads');
    const first = fs.readdirSync(uploadsDir).slice(0, 3);
    for (const dir of first) {
        const files = fs.readdirSync(path.join(uploadsDir, dir));
        console.log(`\n${dir}/: ${files.join(', ')}`);
    }
}
main();

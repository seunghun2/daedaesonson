import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { facilityId, rows } = body;

        const filePath = path.join(process.cwd(), 'data/facilities.json');
        const fileData = fs.readFileSync(filePath, 'utf8');
        const facilities = JSON.parse(fileData);

        const fIndex = facilities.findIndex((f: any) => f.id === facilityId);
        if (fIndex === -1) {
            return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
        }

        // Reconstruct pricing object from flat rows, respecting order
        const newPricing: any = {};

        rows.forEach((row: any) => {
            if (!newPricing[row.category]) {
                newPricing[row.category] = { rows: [] };
            }
            newPricing[row.category].rows.push({
                name: row.name,
                description: row.desc,
                price: row.price,
                isRepresentative: row.isRepresentative || false
            });
        });

        // Update the facility object
        facilities[fIndex].pricing = newPricing;

        // Write back to file
        fs.writeFileSync(filePath, JSON.stringify(facilities, null, 2));

        // 🔥 Also update Supabase isRepresentative for each item
        for (const row of rows) {
            if (row.id) {
                // Update existing item's isRepresentative
                await supabase
                    .from('PriceItem')
                    .update({ isRepresentative: row.isRepresentative || false })
                    .eq('id', row.id);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

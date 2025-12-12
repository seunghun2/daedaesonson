import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

export const revalidate = 0; // No cache for V2

// GET: Fetch ALL facilities from Supabase (Source of Truth)
export async function GET() {
    try {
        let allFacilities: any[] = [];
        let from = 0;
        const PAGE_SIZE = 1000;

        // 1. Fetch Loop
        while (true) {
            const { data, error } = await supabase
                .from('Facility')
                .select('*')
                .range(from, from + PAGE_SIZE - 1);

            if (error) throw error;
            if (!data || data.length === 0) break;

            allFacilities.push(...data);
            if (data.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
        }

        // 2. Filter out "Suyu" (mock-suyu-001) if present
        // Also assuming we only want valid real facilities
        const filtered = allFacilities.filter(f => f.id !== 'mock-suyu-001' && f.name !== '수유 모의 시설');

        // 3. Parse JSON fields for Frontend Compatibility
        const formatted = filtered.map(f => {
            let images = [];
            try {
                if (f.images && typeof f.images === 'string') {
                    images = JSON.parse(f.images);
                } else if (Array.isArray(f.images)) {
                    images = f.images;
                }
            } catch (e) {
                images = [];
            }

            return {
                ...f,
                images: images,
                imageGallery: images, // For UI compatibility
                // Ensure number fields are numbers
                reviewCount: f.reviewCount || 0,
                rating: f.rating || 0,
            };
        });

        return NextResponse.json(formatted);

    } catch (e: any) {
        console.error('V2 API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: Upsert Facilities (Sync to DB)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const inputList = Array.isArray(body) ? body : [body];

        console.log(`[V2-API] Received ${inputList.length} items to save.`);

        // Prepare for DB
        const dbRecords = inputList.map((f: any) => {
            // Handle Images: Ensure array -> JSON string
            // Prioritize imageGallery (from UI) -> images (legacy)
            const imgSource = f.imageGallery || f.images || [];
            const imageStr = JSON.stringify(Array.isArray(imgSource) ? imgSource : []);

            // Base Object mapping to ACTUAL DB columns (verified via test)
            const record: any = {
                id: f.id,
                name: f.name,
                address: f.address || '',
                // phone: f.phone || '', // Column missing in DB
                category: f.category || 'OTHER',
                description: f.description || '',
                images: imageStr,
                updatedAt: new Date().toISOString(),
                // Standardize fields
                rating: f.rating || 0,
                reviewCount: f.reviewCount || 0,
                isPublic: f.isPublic ?? false,
                hasParking: f.hasParking ?? false,
                hasRestaurant: f.hasRestaurant ?? false,
                hasStore: f.hasStore ?? false,
                hasAccessibility: f.hasAccessibility ?? false,

                // Map complex objects to flat columns
                lat: f.coordinates?.lat || 0,
                lng: f.coordinates?.lng || 0,
                minPrice: f.priceRange?.min || 0,
                maxPrice: f.priceRange?.max || 0,
            };

            // Note: DB schema is missing 'priceInfo', 'phone', 'operatorType'. 
            // These data points will NOT be persisted until the DB schema is updated.
            // Temporarily removed to prevent Save Errors.

            return record;
        });

        // Bulk Upsert in chunks
        const CHUNK_SIZE = 50; // Reduce chunk size to be safer
        let successCount = 0;
        let errors: any[] = [];

        for (let i = 0; i < dbRecords.length; i += CHUNK_SIZE) {
            const chunk = dbRecords.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
                .from('Facility')
                .upsert(chunk, { onConflict: 'id' });

            if (error) {
                console.error(`[V2-API] Chunk ${i} update error:`, error);
                console.error(`[V2-API] Error Details: code=${error.code}, message=${error.message}, details=${error.details}, hint=${error.hint}`);
                errors.push({
                    chunkIndex: i,
                    code: error.code,
                    message: error.message,
                    details: error.details
                });
            } else {
                successCount += chunk.length;
            }
        }

        if (errors.length > 0) {
            console.error('[V2-API] Save completed with errors:', errors);
            return NextResponse.json({ success: false, saved: successCount, errors }, { status: 500 });
        }

        console.log(`[V2-API] Successfully saved ${successCount} items.`);
        return NextResponse.json({ success: true, count: successCount });

    } catch (e: any) {
        console.error('[V2-API] Critical Save Error:', e);
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}

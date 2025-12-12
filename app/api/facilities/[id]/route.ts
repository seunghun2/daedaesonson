
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { RepresentativePricing } from '@/types';

// Configuration for Supabase Client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'facilities.json');

// Revalidate cache every hour
export const revalidate = 3600;

// Helper: Load pricing (Same as list API)
async function loadPricingData(): Promise<Map<string, RepresentativePricing>> {
    const map = new Map<string, RepresentativePricing>();
    const analyzedDir = path.join(DATA_DIR, 'analyzed');

    try {
        const files = [
            { path: 'analyzed_pricing_cremation.csv', type: 'cremation' },
            { path: 'analyzed_pricing_enshrinement.csv', type: 'enshrinement' },
            { path: 'analyzed_pricing_natural.csv', type: 'natural' },
            { path: 'analyzed_pricing_cemetery.csv', type: 'cemetery' }
        ];

        for (const file of files) {
            const filePath = path.join(analyzedDir, file.path);
            if (existsSync(filePath)) {
                const content = readFileSync(filePath, 'utf-8');
                const rows = parse(content, { columns: true, skip_empty_lines: true });

                rows.forEach((r: any) => {
                    const id = r.ParkID;
                    if (!map.has(id)) map.set(id, {});
                    const entry: any = map.get(id)!;

                    if (file.type === 'cremation') {
                        entry.cremation = {
                            resident: parseInt(r.ResidentFee) || 0,
                            nonResident: parseInt(r.NonResidentFee) || 0
                        };
                    } else if (file.type === 'enshrinement') {
                        entry.enshrinement = {
                            min: parseInt(r.MinPrice) || 0,
                            max: parseInt(r.MaxPrice) || 0,
                            label: r.Label || ''
                        };
                    } else if (file.type === 'natural') {
                        entry.natural = {
                            joint: r.JointMinPrice ? parseInt(r.JointMinPrice) : undefined,
                            individual: r.IndividualMinPrice ? parseInt(r.IndividualMinPrice) : undefined,
                            couple: r.CoupleMinPrice ? parseInt(r.CoupleMinPrice) : undefined
                        };
                    } else if (file.type === 'cemetery') {
                        entry.cemetery = {
                            minLandFee: parseInt(r.MinLandFee) || 0
                        };
                    }
                });
            }
        }
    } catch (e) {
        console.error('Error loading pricing CSVs:', e);
    }
    return map;
}

// GET: Single Facility Detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Load JSON Data
        const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
        const facilities = JSON.parse(fileContent);
        const facility = facilities.find((f: any) => f.id === id);

        if (!facility) {
            return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
        }

        // 2. Load Pricing
        const pricingMap = await loadPricingData();

        // 3. Load Supabase Data (Reviews, Full Images, etc)
        const { data: dbData, error } = await supabase
            .from('Facility')
            .select('*')
            .eq('id', id)
            .single();

        let merged = { ...facility };

        if (dbData) {
            let parsedImages: string[] = [];
            if (dbData.images) {
                try {
                    parsedImages = typeof dbData.images === 'string'
                        ? JSON.parse(dbData.images)
                        : (Array.isArray(dbData.images) ? dbData.images : []);
                } catch (e) { parsedImages = []; }
            }

            merged = {
                ...merged,
                ...dbData, // Overwrite with DB data first

                // RESTORE Local Data if DB data is missing/null/empty
                phone: dbData.phone || merged.phone,
                fax: dbData.fax || merged.fax,
                capacity: dbData.capacity || merged.capacity,
                lastUpdated: dbData.lastUpdated || merged.lastUpdated,
                websiteUrl: dbData.websiteUrl || merged.website || merged.websiteUrl, // Handle key variations

                images: parsedImages.length > 0 ? parsedImages : merged.images,
                imageGallery: parsedImages.length > 0 ? parsedImages : merged.images, // Full gallery
            };
        }

        // Attach Pricing
        if (pricingMap.has(id)) {
            merged.representativePricing = pricingMap.get(id);
        }

        // 4. Load Reviews (Separate query usually, but fetching here for "full details")
        const { data: reviews } = await supabase
            .from('Review')
            .select('*, replies:Reply(*)')
            .eq('facilityId', id)
            .order('createdAt', { ascending: false });

        merged.reviews = reviews || [];

        return NextResponse.json(merged);

    } catch (e) {
        console.error('Detail API Error:', e);
        return NextResponse.json({ error: 'Failed to load details' }, { status: 500 });
    }
}

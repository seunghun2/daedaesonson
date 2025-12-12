import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { readFileSync, existsSync } from 'fs'; // Sync fs for initial load if needed, using promises for main flow
import path from 'path';
import { parse } from 'csv-parse/sync'; // Import CSV parser
import { MOCK_FACILITIES } from '@/lib/mockData';
import { createClient } from '@supabase/supabase-js';
import { RepresentativePricing } from '@/types';

// Configuration for Supabase Client (HTTP-based, reliable)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

// Disable caching for Admin/API usage to ensure fresh data
export const revalidate = 0;
export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'facilities.json');

// Helper: Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Helper: Load and parse pricing CSVs
async function loadPricingData(): Promise<Map<string, RepresentativePricing>> {
    const map = new Map<string, RepresentativePricing>();
    const analyzedDir = path.join(DATA_DIR, 'analyzed');

    try {
        // 1. Cremation
        const cremPath = path.join(analyzedDir, 'analyzed_pricing_cremation.csv');
        if (existsSync(cremPath)) {
            const content = readFileSync(cremPath, 'utf-8');
            const rows = parse(content, { columns: true, skip_empty_lines: true });
            rows.forEach((r: any) => {
                const id = r.ParkID;
                if (!map.has(id)) map.set(id, {});
                const entry = map.get(id)!;
                entry.cremation = {
                    resident: parseInt(r.ResidentFee) || 0,
                    nonResident: parseInt(r.NonResidentFee) || 0
                };
            });
        }

        // 2. Enshrinement
        const enshPath = path.join(analyzedDir, 'analyzed_pricing_enshrinement.csv');
        if (existsSync(enshPath)) {
            const content = readFileSync(enshPath, 'utf-8');
            const rows = parse(content, { columns: true, skip_empty_lines: true });
            rows.forEach((r: any) => {
                const id = r.ParkID;
                if (!map.has(id)) map.set(id, {});
                const entry = map.get(id)!;
                entry.enshrinement = {
                    min: parseInt(r.MinPrice) || 0,
                    max: parseInt(r.MaxPrice) || 0,
                    label: r.Label || ''
                };
            });
        }

        // 3. Natural
        const natPath = path.join(analyzedDir, 'analyzed_pricing_natural.csv');
        if (existsSync(natPath)) {
            const content = readFileSync(natPath, 'utf-8');
            const rows = parse(content, { columns: true, skip_empty_lines: true });
            rows.forEach((r: any) => {
                const id = r.ParkID;
                if (!map.has(id)) map.set(id, {});
                const entry = map.get(id)!;
                entry.natural = {
                    joint: r.JointMinPrice ? parseInt(r.JointMinPrice) : undefined,
                    individual: r.IndividualMinPrice ? parseInt(r.IndividualMinPrice) : undefined,
                    couple: r.CoupleMinPrice ? parseInt(r.CoupleMinPrice) : undefined
                };
            });
        }

        // 4. Cemetery
        const cemPath = path.join(analyzedDir, 'analyzed_pricing_cemetery.csv');
        if (existsSync(cemPath)) {
            const content = readFileSync(cemPath, 'utf-8');
            const rows = parse(content, { columns: true, skip_empty_lines: true });
            rows.forEach((r: any) => {
                const id = r.ParkID;
                if (!map.has(id)) map.set(id, {});
                const entry = map.get(id)!;
                entry.cemetery = {
                    minLandFee: parseInt(r.MinLandFee) || 0
                };
            });
        }

    } catch (e) {
        console.error('Error loading pricing CSVs:', e);
    }

    return map;
}

// GET: 시설 목록 조회 (Supabase DB와 JSON 병합)
export async function GET() {
    try {
        await ensureDataDir();

        // Load Pricing Data Parallel
        const [_, pricingMap] = await Promise.all([
            ensureDataDir(),
            loadPricingData()
        ]);

        console.log('Reading facilities file...');

        let jsonData: any[] = [];
        try {
            const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
            jsonData = JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading file:', error);
            // MOCK backup
            jsonData = MOCK_FACILITIES;
        }

        // 1. Fetch from Supabase (HTTP Request, bypassing Port block)
        // Fetch Facilities
        // 1. Fetch from Supabase (Pagination to get ALL rows, bypass 1000 limit)
        let facilitiesFromDb: any[] = [];
        let from = 0;
        const PAGE_SIZE = 1000;

        while (true) {
            const { data, error: facError } = await supabase
                .from('Facility')
                .select('id, name, images')
                .range(from, from + PAGE_SIZE - 1);

            if (facError) {
                console.error('Supabase Facility Fetch Error:', facError);
                throw new Error(facError.message);
            }

            if (data) {
                facilitiesFromDb.push(...data);
            }

            if (!data || data.length < PAGE_SIZE) {
                break;
            }
            from += PAGE_SIZE;
        }



        // 2. Fetch PriceCategories for counts
        const { data: categories, error: catError } = await supabase
            .from('PriceCategory')
            .select('facilityId');

        if (catError) {
            console.error('Supabase Category Fetch Error:', catError);
            // Continue without counts? No, safer to throw or warn.
        }

        // Build Maps
        const categoryCountMap = new Map();
        if (categories) {
            categories.forEach((c: any) => {
                categoryCountMap.set(c.facilityId, (categoryCountMap.get(c.facilityId) || 0) + 1);
            });
        }

        const dbMap = new Map();
        const nameMap = new Map(); // 이름으로 매칭 시도

        (facilitiesFromDb || []).forEach((f: any) => {
            const count = categoryCountMap.get(f.id) || 0;
            const info = {
                id: f.id,
                hasDetailedPrices: count > 0,
                images: f.images
            };
            dbMap.set(f.id, info);

            // 이름 매핑
            if (f.name) {
                const normName = f.name.normalize('NFC').replace(/\s+/g, '').trim();
                const existingInfo = nameMap.get(normName);

                let shouldReplace = false;
                if (!existingInfo) {
                    shouldReplace = true;
                } else if (f.images && !existingInfo.images) {
                    shouldReplace = true;
                } else if (f.images && existingInfo.images) {
                    const newHasLocal = f.images.includes('/images/');
                    const oldHasLocal = existingInfo.images.includes('/images/');
                    if (newHasLocal && !oldHasLocal) {
                        shouldReplace = true;
                    }
                }

                if (shouldReplace) {
                    nameMap.set(normName, info);
                }
            }
        });

        // 병합
        const mergedData = jsonData.map(facility => {
            // 1. ID로 매칭 시도
            let dbInfo = dbMap.get(facility.id);

            // 2. 이름 매칭 확인
            if (facility.name) {
                const normalizedKey = facility.name.normalize('NFC').replace(/\s+/g, '').trim();
                const nameMatch = nameMap.get(normalizedKey);

                // Case A: ID 매칭 실패 -> 이름 매칭 사용
                if (!dbInfo && nameMatch) {
                    dbInfo = nameMatch;
                }
                // Case B: 이름 매칭이 더 좋은 데이터(로컬 이미지)를 가진 경우
                else if (dbInfo && nameMatch && nameMatch.id !== dbInfo.id) {
                    const dbHasLocal = dbInfo.images && dbInfo.images.includes('/images/');
                    const nameHasLocal = nameMatch.images && nameMatch.images.includes('/images/');

                    if (!dbHasLocal && nameHasLocal) {
                        dbInfo = nameMatch;
                    }
                }
            }

            if (dbInfo) {
                // Parse images properly from DB (it's stored as JSON string)
                let parsedImages: string[] = [];
                if (dbInfo.images) {
                    try {
                        parsedImages = typeof dbInfo.images === 'string'
                            ? JSON.parse(dbInfo.images)
                            : (Array.isArray(dbInfo.images) ? dbInfo.images : []);
                    } catch (e) {
                        console.error('Failed to parse DB images for:', facility.name, e);
                        parsedImages = []; // Default to empty on parse error
                    }
                } else {
                    parsedImages = []; // Explicitly empty if dbInfo.images is null/undefined/empty
                }

                if (facility.id === 'park-0001') {
                    console.log('🔍 [Debug park-0001] Merge Logic:');
                    console.log('   - DB Has Detailed:', dbInfo.hasDetailedPrices);
                    console.log('   - DB Images Raw:', dbInfo.images);
                    console.log('   - Parsed DB Images Count:', parsedImages.length);
                    console.log('   - Local JSON Images Count:', facility.images?.length);
                    console.log('   - Local JSON Gallery Count:', facility.imageGallery?.length);
                }
                if (facility.id === 'park-0001') {
                    console.log('🔍 [Debug] Comparing Counts - DB:', parsedImages.length, 'vs Local:', facility.images?.length);
                }

                if (facility.id === 'park-0001') {
                    console.log('🔍 [Debug] Merging All Images - DB:', parsedImages.length, 'Local:', facility.images?.length);
                }

                // Strategy: UNION (Show Everything)
                // User Request: "Just show all images added"
                // We combine DB images and Local images, removing duplicates.
                const dbImages = parsedImages || [];
                const localImages = facility.images || [];

                // Combine and deduplicate
                const allImagesSet = new Set([...dbImages, ...localImages]);
                const allImages = Array.from(allImagesSet);

                const resultObj = {
                    ...facility,
                    _hasDetailedPrices: dbInfo.hasDetailedPrices,
                    images: allImages,
                    imageGallery: allImages,
                    representativePricing: pricingMap.get(facility.id) // Attach Pricing Data
                };

                if (facility.id === 'park-0001') {
                    (resultObj as any)._debug_info = {
                        source_used: 'UNION',
                        total_count: allImages.length,
                        db_count: dbImages.length,
                        local_count: localImages.length
                    };
                }

                return resultObj;
            }

            // If not in DB, still attach pricing if exists
            if (pricingMap.has(facility.id)) {
                return {
                    ...facility,
                    representativePricing: pricingMap.get(facility.id)
                };
            }

            return facility;
        });

        // Lite version for Map/List (Updated: Include Images for Admin/UI consistency)
        const liteData = mergedData.map(f => ({
            id: f.id,
            name: f.name,
            address: f.address,
            coordinates: f.coordinates,
            category: f.category,
            priceRange: f.priceRange,
            // Keep critical identifiers
            operatorType: f.operatorType,
            hasParking: f.hasParking,
            hasRestaurant: f.hasRestaurant,
            hasStore: f.hasStore,
            hasAccessibility: f.hasAccessibility,
            // Flags
            isPublic: f.isPublic,
            hasDetailedPrices: f._hasDetailedPrices,

            // FIX: Return FULL images/gallery so Admin UI doesn't see truncated data
            images: f.images || [],
            imageGallery: f.imageGallery || [], // Explicitly include gallery

            // Light pricing
            representativePricing: f.representativePricing,
            // Stats
            reviewCount: f.reviewCount,
            rating: f.rating,

            // New Fields (Requested by User)
            phone: f.phone,
            fax: f.fax,
            capacity: f.capacity,
            lastUpdated: f.lastUpdated,
            website: f.website || f.websiteUrl, // Support both keys

            // Debug info pass-through
            _debug_info: (f as any)._debug_info
        }));

        console.log(`Returned ${liteData.length} facilities (Lite), ${dbMap.size} from DB`);
        return NextResponse.json(liteData);
    } catch (e) {
        console.error('API Error:', e);
        return NextResponse.json({ error: 'Failed to load data', details: String(e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await ensureDataDir();
        const body = await req.json();

        // CASE A: Single Item Update (Efficient)
        // If body is an object and has 'id', treat as single update
        if (!Array.isArray(body) && body.id) {
            console.log(`[V1-API] Processing Single Item Update: ${body.name} (${body.id})`);

            // 1. Read existing file
            let existingData = [];
            // 1. Update Local JSON (Try-Back strategy)
            try {
                const fileData = await fs.readFile(DATA_FILE, 'utf-8');
                const facilities = JSON.parse(fileData);
                const index = facilities.findIndex((f: any) => f.id === body.id);

                if (index !== -1) {
                    facilities[index] = { ...facilities[index], ...body };
                    await fs.writeFile(DATA_FILE, JSON.stringify(facilities, null, 2), 'utf-8');
                } else {
                    // Add new if not exists
                    facilities.unshift(body); // Prepend new item
                    await fs.writeFile(DATA_FILE, JSON.stringify(facilities, null, 2), 'utf-8');
                }
            } catch (err) {
                console.warn('[V1-API] Local JSON update failed (Read-Only FS?), proceeding to DB sync.', err);
            }

            // 4. Sync Single Item to DB
            const f = body;
            const imgSource = f.imageGallery || f.images || [];
            const imageStr = JSON.stringify(Array.isArray(imgSource) ? imgSource : []);

            const dbRecord = {
                id: f.id,
                name: f.name,
                address: f.address || '',
                category: f.category || 'OTHER',
                description: f.description || '',
                images: imageStr,
                updatedAt: new Date().toISOString(),
                rating: f.rating || 0,
                reviewCount: f.reviewCount || 0,
                isPublic: f.isPublic ?? false,
                hasParking: f.hasParking ?? false,
                hasRestaurant: f.hasRestaurant ?? false,
                hasStore: f.hasStore ?? false,
                hasAccessibility: f.hasAccessibility ?? false,
                lat: f.coordinates?.lat || 0,
                lng: f.coordinates?.lng || 0,
                minPrice: f.priceRange?.min || 0,
                maxPrice: f.priceRange?.max || 0,
            };

            const { error } = await supabase
                .from('Facility')
                .upsert(dbRecord, { onConflict: 'id' });

            if (error) {
                console.error('[V1-API] DB Sync Error (Single):', error);
                // Don't fail the whole request if DB sync fails, but warn
            }

            return NextResponse.json({ success: true, mode: 'single', id: body.id });
        }

        // CASE B: Bulk Update (Legacy / Delete)
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Input must be an array or facility object' }, { status: 400 });
        }

        // 1. Write to Local JSON File (Try-Catch for Read-Only Environments)
        try {
            await fs.writeFile(DATA_FILE, JSON.stringify(body, null, 2), 'utf-8');
        } catch (fileErr) {
            console.warn('[API] Failed to write local JSON (likely read-only fs). Continuing to DB sync.', fileErr);
        }

        // 2. Sync to Supabase DB (Bulk)
        const dbRecords = body.map((f: any) => {
            const imgSource = f.imageGallery || f.images || [];
            const imageStr = JSON.stringify(Array.isArray(imgSource) ? imgSource : []);

            return {
                id: f.id,
                name: f.name,
                address: f.address || '',
                category: f.category || 'OTHER',
                description: f.description || '',
                images: imageStr,
                updatedAt: new Date().toISOString(),
                rating: f.rating || 0,
                reviewCount: f.reviewCount || 0,
                isPublic: f.isPublic ?? false,
                hasParking: f.hasParking ?? false,
                hasRestaurant: f.hasRestaurant ?? false,
                hasStore: f.hasStore ?? false,
                hasAccessibility: f.hasAccessibility ?? false,
                lat: f.coordinates?.lat || 0,
                lng: f.coordinates?.lng || 0,
                minPrice: f.priceRange?.min || 0,
                maxPrice: f.priceRange?.max || 0,
            };
        });

        // Bulk Upsert in chunks
        const CHUNK_SIZE = 50;
        let successCount = 0;

        // Only verify DB sync if array is not HUGE (to prevent timeouts)
        // If array is 1498, we might want to skip DB sync or do background?
        // For now, keep logic but be aware.

        for (let i = 0; i < dbRecords.length; i += CHUNK_SIZE) {
            const chunk = dbRecords.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
                .from('Facility')
                .upsert(chunk, { onConflict: 'id' });

            if (!error) successCount += chunk.length;
        }

        console.log(`[Dual-Save] JSON Written + Synced ${successCount}/${dbRecords.length} to DB.`);

        return NextResponse.json({ success: true, count: body.length, dbSynced: successCount });

    } catch (e) {
        console.error('Save V1 Error:', e);
        return NextResponse.json({ error: 'Failed to save', details: String(e) }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import fs from 'fs/promises';
import path from 'path';

// Configuration (Supabase JS to bypass Port block)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: facilityId } = await params;

        // 1. 시설 정보 조회
        const { data: facility, error: facError } = await supabase
            .from('Facility')
            .select('*')
            .eq('id', facilityId)
            .single();

        if (facError || !facility) {
            console.error('Facility fetch error:', facError);
            return NextResponse.json(
                { error: 'Facility not found' },
                { status: 404 }
            );
        }

        // 2. 가격 카테고리 및 항목 조회
        // Nested select: PriceCategory -> PriceItem
        const { data: categoriesRaw, error: catError } = await supabase
            .from('PriceCategory')
            .select(`
                *,
                PriceItem (*)
            `)
            .eq('facilityId', facilityId)
            .order('orderNo', { ascending: true });

        if (catError) {
            console.error('Category fetch error:', catError);
            throw new Error(catError.message);
        }

        // JS에서 PriceItem 정렬 (가격 높은 순 = 사용료 우선)
        const categories = (categoriesRaw || []).map((cat: any) => ({
            ...cat,
            priceItems: (cat.PriceItem || []).sort((a: any, b: any) => Number(b.price) - Number(a.price))
        }));

        // --- Check Local Fallback (If DB is empty) ---
        if (categories.length === 0) {
            try {
                const filePath = path.join(process.cwd(), 'data/facilities.json');
                // Check public/data as well if needed? No, script updated data/facilities.json
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const facilities = JSON.parse(fileContent);
                const localFac = facilities.find((f: any) => f.id === facilityId);

                if (localFac && localFac.priceInfo && localFac.priceInfo.priceTable) {
                    console.log(`✅ Returns local pricing for ${facilityId}`);
                    return NextResponse.json({
                        facility: {
                            id: localFac.id,
                            name: localFac.name,
                            category: localFac.category,
                            address: localFac.address,
                            priceRange: localFac.priceRange || { min: 0, max: 0 }
                        },
                        priceTable: localFac.priceInfo.priceTable,
                        _meta: {
                            source: 'local-json',
                            categoryCount: Object.keys(localFac.priceInfo.priceTable).length
                        }
                    });
                }
            } catch (e) {
                console.warn('Local price fallback failed:', e);
            }
        }

        // 응답 포맷 구성
        const priceTable: Record<string, any> = {};

        categories.forEach((category: any) => {
            // PriceItem mapping
            const rows = category.priceItems.map((item: any) => ({
                name: item.itemName,
                price: item.price, // BigInt handling needed? Supabase returns number/string?
                // JS Client usually returns number if fits, or string?
                // Note: BigInt in Postgres -> JS might keep as string if large?
                // We should safely convert.
                grade: item.description || '',
                groupType: item.groupType,
                size: item.sizeValue && item.sizeUnit
                    ? `${item.sizeValue}${item.sizeUnit}`
                    : null,
                hasInstallation: item.hasInstallation,
                hasManagementFee: item.hasManagementFee,
                includedYear: item.includedYear,
                discount: item.discountAvailable
                    ? JSON.parse(item.discountTargets || '[]')
                    : null,
                raw: item.raw
            }));

            priceTable[category.name] = {
                unit: '원',
                category: category.normalizedName,
                rows: rows
            };
        });

        // 카테고리 순서 정렬
        const categoryOrder = ['기본비용', '매장묘', '봉안묘', '봉안당', '수목장', '기타'];
        const sortedPriceTable: Record<string, any> = {};
        categoryOrder.forEach(catName => {
            if (priceTable[catName]) {
                sortedPriceTable[catName] = priceTable[catName];
            }
        });
        Object.keys(priceTable).forEach(catName => {
            if (!sortedPriceTable[catName]) {
                sortedPriceTable[catName] = priceTable[catName];
            }
        });

        return NextResponse.json({
            facility: {
                id: facility.id,
                name: facility.name,
                category: facility.category,
                address: facility.address,
                priceRange: {
                    min: Math.round(Number(facility.minPrice) / 10000),
                    max: Math.round(Number(facility.maxPrice) / 10000)
                }
            },
            priceTable: sortedPriceTable,
            _meta: {
                source: 'supabase-js', // Changed source marker
                categoryCount: categories.length,
                itemCount: categories.reduce((sum: number, cat: any) => sum + cat.priceItems.length, 0)
            }
        });

    } catch (error) {
        console.error('Error fetching prices (Supabase):', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

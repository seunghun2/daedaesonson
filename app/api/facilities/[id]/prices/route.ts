import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: facilityId } = await params;

        // 🔥 LOCAL JSON 우선! (시트 동기화된 최신 데이터)
        const filePath = path.join(process.cwd(), 'data/facilities.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const facilities = JSON.parse(fileContent);
        const localFac = facilities.find((f: any) => f.id === facilityId);

        if (!localFac) {
            return NextResponse.json(
                { error: 'Facility not found' },
                { status: 404 }
            );
        }

        let finalPriceTable = null;
        if (localFac?.priceInfo?.priceTable) {
            finalPriceTable = localFac.priceInfo.priceTable;
        } else if (localFac?.pricing) {
            finalPriceTable = localFac.pricing;
        }

        // 항목 수 계산
        let itemCount = 0;
        if (finalPriceTable) {
            Object.values(finalPriceTable).forEach((cat: any) => {
                itemCount += cat.rows?.length || 0;
            });
        }

        console.log(`✅ Using local pricing for ${facilityId}: ${Object.keys(finalPriceTable || {}).length} categories, ${itemCount} items`);

        return NextResponse.json({
            facility: {
                id: localFac.id,
                name: localFac.name,
                category: localFac.category,
                address: localFac.address,
                priceRange: localFac.priceRange || { min: 0, max: 0 }
            },
            priceTable: finalPriceTable || {},
            _meta: {
                source: 'local-json',
                categoryCount: Object.keys(finalPriceTable || {}).length,
                itemCount: itemCount
            }
        });

    } catch (error) {
        console.error('Error fetching prices:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

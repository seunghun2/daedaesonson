import { NextResponse } from 'next/server';
import { loadFacilitiesJson } from '@/lib/facilityDataLoader';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const facilities = loadFacilitiesJson();
        const list = facilities.map((f: any) => ({
            id: f.id,
            name: f.name
        }));
        return NextResponse.json(list);
    } catch (error) {
        console.error('Facilities-v2 API error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

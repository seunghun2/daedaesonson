import { NextResponse } from 'next/server';
import { loadFacilitiesJson } from '@/lib/facilityDataLoader';

export async function GET() {
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

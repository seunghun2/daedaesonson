import { NextResponse } from 'next/server';
import facilities from '@/data/facilities.json';

export async function GET() {
    // Return lightweight list for sidebar
    const list = facilities.map((f: any) => ({
        id: f.id,
        name: f.name
    }));
    return NextResponse.json(list);
}

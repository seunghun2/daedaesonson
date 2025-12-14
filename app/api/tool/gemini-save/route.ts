import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, result } = body;

        const savePath = path.join(process.cwd(), 'data/gemini_results.json');

        let currentData = [];
        if (fs.existsSync(savePath)) {
            currentData = JSON.parse(fs.readFileSync(savePath, 'utf8'));
        }

        // Update or Add
        const existingIndex = currentData.findIndex((d: any) => d.id === id);
        if (existingIndex >= 0) {
            currentData[existingIndex] = { id, result, updatedAt: new Date().toISOString() };
        } else {
            currentData.push({ id, result, updatedAt: new Date().toISOString() });
        }

        fs.writeFileSync(savePath, JSON.stringify(currentData, null, 2));

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 문의 개수만 빠르게 반환
export async function GET() {
    try {
        const { count, error } = await supabase
            .from('Inquiry')
            .select('*', { count: 'exact', head: true });

        if (error) {
            return NextResponse.json({ count: 0 });
        }

        return NextResponse.json({ count: count || 0 });
    } catch (error) {
        return NextResponse.json({ count: 0 });
    }
}

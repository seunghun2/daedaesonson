import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

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

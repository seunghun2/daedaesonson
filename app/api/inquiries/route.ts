import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { facilityId, type, title, content, phone, isPrivate } = body;

        if (!title || !content || !phone) {
            return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false }
        });

        const { data, error } = await supabase
            .from('Inquiry')
            .insert({
                facilityId: facilityId || 'general',
                type: type || 'other',
                title,
                content,
                phone,
                isPrivate: isPrivate ?? true,
                createdAt: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Inquiry insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Inquiry API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

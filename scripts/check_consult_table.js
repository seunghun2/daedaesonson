const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

async function checkAndInsert() {
    // 테스트로 Consult 테이블에 삽입 시도
    const { data, error } = await supabase
        .from('Consult')
        .insert({
            facilityId: 'test-123',
            facilityName: '테스트 시설',
            name: '홍길동',
            phone: '010-1234-5678',
            preferredTime: '09시~12시',
            question: 'price',
            message: '테스트 메시지',
            status: 'pending',
            createdAt: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.log('Error:', error.message);
        console.log('Details:', error.details);
        console.log('Hint:', error.hint);
        console.log('Code:', error.code);
    } else {
        console.log('Success! Inserted:', data);

        // 삽입 성공 시 삭제
        await supabase.from('Consult').delete().eq('id', data.id);
        console.log('Test data cleaned up');
    }
}

checkAndInsert();

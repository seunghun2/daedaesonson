// 봉안당 그룹 변환: 1~8단 → 관별
// 현재: groupType=1단 / name=1단 / grade=로얄관
// 변환: groupType=로얄관 / name=1단 / grade=로얄관

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function transformBongandangGroups(facilityId) {
    console.log(`🔄 시설 ${facilityId} 봉안당 그룹 변환 시작...`);

    // 1. 시설 데이터 가져오기
    const { data: facility, error } = await supabase
        .from('Facility')
        .select('id, name, pricing')
        .eq('id', facilityId)
        .single();

    if (error || !facility) {
        console.log('❌ 시설을 찾을 수 없습니다:', error);
        return;
    }

    console.log(`📍 시설: ${facility.name}`);

    // pricing이 문자열이면 파싱
    let pricing = facility.pricing;
    if (typeof pricing === 'string') {
        pricing = JSON.parse(pricing);
    }

    const priceTable = pricing?.priceTable;
    if (!priceTable || !priceTable['봉안당']) {
        console.log('❌ 봉안당 데이터가 없습니다.');
        return;
    }

    const bongandangRows = priceTable['봉안당'].rows || [];
    console.log(`📊 봉안당 항목 수: ${bongandangRows.length}`);

    // 현재 데이터 구조 출력
    console.log('\n현재 데이터 샘플:');
    bongandangRows.slice(0, 5).forEach(r => {
        console.log(`  name: ${r.name}, grade: ${r.grade}, groupType: ${r.groupType}`);
    });

    // 2. 관별로 그룹화 - grade에서 관 이름 추출
    const GWAN_KEYWORDS = ['로얄관', '아트리움관', '팰리스관', '에덴관', '루멘관'];

    const newRows = bongandangRows.map(row => {
        // grade에서 관 이름 추출
        let gwanName = null;
        for (const kw of GWAN_KEYWORDS) {
            if (row.grade && row.grade.includes(kw)) {
                gwanName = kw;
                break;
            }
        }

        // 관 이름을 못 찾으면 기존 groupType 유지
        if (!gwanName) {
            return row;
        }

        // 새 row 생성: groupType을 관명으로 변경
        return {
            ...row,
            groupType: gwanName  // 1단 → 로얄관
        };
    });

    // 변환 결과 확인
    const groups = {};
    newRows.forEach(r => {
        if (!groups[r.groupType]) groups[r.groupType] = 0;
        groups[r.groupType]++;
    });
    console.log('\n📦 변환된 그룹:', groups);

    // 3. 업데이트
    const newPricing = {
        ...pricing,
        priceTable: {
            ...priceTable,
            '봉안당': {
                ...priceTable['봉안당'],
                rows: newRows
            }
        }
    };

    const { error: updateError } = await supabase
        .from('Facility')
        .update({ pricing: newPricing })
        .eq('id', facilityId);

    if (updateError) {
        console.log('❌ 업데이트 실패:', updateError);
    } else {
        console.log('\n✅ 변환 완료!');

        // 변환된 샘플 출력
        console.log('\n변환 후 샘플:');
        newRows.slice(0, 8).forEach(r => {
            console.log(`  name: ${r.name}, grade: ${r.grade}, groupType: ${r.groupType}`);
        });
    }
}

// 실행
const facilityId = process.argv[2] || 'park-0001';
transformBongandangGroups(facilityId);

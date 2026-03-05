const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// park-0798 시네오 추모관 (SINEO MEMORIAL PARK) — 공홈 이미지 기반 (1순위)
// ※ 영구봉안, 1인 개인단 기준 분양금액 (단위: 만원)
// ※ 별관은 할인 적용 중, 가야관 9단은 할인 적용 중

const M = 10000; // 만원 단위

// 내측/창측 있는 관은 grade로 구분
function r(name, price, opts = {}) {
    return { name, price: price * M, feeType: 'USAGE', ...opts };
}

const p = data.find(x => x.id === 'park-0798');
if (!p) { console.log('NOT FOUND'); process.exit(1); }
if (!p.priceInfo) p.priceInfo = {};

p.priceInfo.standardizedPrices = [{
    serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
    rows: [
        // 신어관 (1~9단)
        r('1단', 100, { groupType: '신어관' }),
        r('2단', 200, { groupType: '신어관' }),
        r('3단', 300, { groupType: '신어관' }),
        r('4단', 350, { groupType: '신어관' }),
        r('5단', 400, { groupType: '신어관', isRepresentative: true }),
        r('6단', 350, { groupType: '신어관' }),
        r('7단', 250, { groupType: '신어관' }),
        r('8단', 200, { groupType: '신어관' }),
        r('9단', 150, { groupType: '신어관' }),

        // 별관 (1~7단) - 할인 적용 중
        r('1단', 100, { groupType: '별관', grade: '할인 적용 중' }),
        r('2단', 150, { groupType: '별관', grade: '할인 적용 중' }),
        r('3단', 200, { groupType: '별관', grade: '할인 적용 중' }),
        r('4단', 300, { groupType: '별관', grade: '할인 적용 중' }),
        r('5단', 350, { groupType: '별관', grade: '할인 적용 중' }),
        r('6단', 250, { groupType: '별관', grade: '할인 적용 중' }),
        r('7단', 100, { groupType: '별관', grade: '할인 적용 중' }),

        // 성산관 (1~9단)
        r('1단', 100, { groupType: '성산관' }),
        r('2단', 200, { groupType: '성산관' }),
        r('3단', 300, { groupType: '성산관' }),
        r('4단', 350, { groupType: '성산관' }),
        r('5단', 400, { groupType: '성산관' }),
        r('6단', 350, { groupType: '성산관' }),
        r('7단', 250, { groupType: '성산관' }),
        r('8단', 200, { groupType: '성산관' }),
        r('9단', 150, { groupType: '성산관' }),

        // 가야관 (내측/창측) (1~9단)
        r('1단', 250, { groupType: '가야관', grade: '내측' }),
        r('2단', 350, { groupType: '가야관', grade: '내측' }),
        r('3단', 450, { groupType: '가야관', grade: '내측' }),
        r('4단', 500, { groupType: '가야관', grade: '내측' }),
        r('5단', 550, { groupType: '가야관', grade: '내측' }),
        r('6단', 450, { groupType: '가야관', grade: '내측' }),
        r('7단', 300, { groupType: '가야관', grade: '내측' }),
        r('8단', 200, { groupType: '가야관', grade: '내측' }),
        r('9단', 100, { groupType: '가야관', grade: '내측, 할인 적용 중' }),
        r('1단', 300, { groupType: '가야관', grade: '창측' }),
        r('2단', 400, { groupType: '가야관', grade: '창측' }),
        r('3단', 500, { groupType: '가야관', grade: '창측' }),
        r('4단', 550, { groupType: '가야관', grade: '창측' }),
        r('5단', 600, { groupType: '가야관', grade: '창측' }),
        r('6단', 500, { groupType: '가야관', grade: '창측' }),
        r('7단', 350, { groupType: '가야관', grade: '창측' }),
        r('8단', 250, { groupType: '가야관', grade: '창측' }),
        r('9단', 150, { groupType: '가야관', grade: '창측, 할인 적용 중' }),

        // 메모리얼관 (내측/창측) (1~8단)
        r('1단', 250, { groupType: '메모리얼관', grade: '내측' }),
        r('2단', 400, { groupType: '메모리얼관', grade: '내측' }),
        r('3단', 500, { groupType: '메모리얼관', grade: '내측' }),
        r('4단', 550, { groupType: '메모리얼관', grade: '내측' }),
        r('5단', 600, { groupType: '메모리얼관', grade: '내측' }),
        r('6단', 500, { groupType: '메모리얼관', grade: '내측' }),
        r('7단', 350, { groupType: '메모리얼관', grade: '내측' }),
        r('8단', 250, { groupType: '메모리얼관', grade: '내측' }),
        r('1단', 300, { groupType: '메모리얼관', grade: '창측' }),
        r('2단', 450, { groupType: '메모리얼관', grade: '창측' }),
        r('3단', 550, { groupType: '메모리얼관', grade: '창측' }),
        r('4단', 600, { groupType: '메모리얼관', grade: '창측' }),
        r('5단', 650, { groupType: '메모리얼관', grade: '창측' }),
        r('6단', 550, { groupType: '메모리얼관', grade: '창측' }),
        r('7단', 400, { groupType: '메모리얼관', grade: '창측' }),
        r('8단', 300, { groupType: '메모리얼관', grade: '창측' }),

        // 메모리얼 2관 (내측/창측) (1~8단)
        r('1단', 300, { groupType: '메모리얼 2관', grade: '내측' }),
        r('2단', 450, { groupType: '메모리얼 2관', grade: '내측' }),
        r('3단', 550, { groupType: '메모리얼 2관', grade: '내측' }),
        r('4단', 600, { groupType: '메모리얼 2관', grade: '내측' }),
        r('5단', 650, { groupType: '메모리얼 2관', grade: '내측' }),
        r('6단', 550, { groupType: '메모리얼 2관', grade: '내측' }),
        r('7단', 400, { groupType: '메모리얼 2관', grade: '내측' }),
        r('8단', 300, { groupType: '메모리얼 2관', grade: '내측' }),
        r('1단', 350, { groupType: '메모리얼 2관', grade: '창측' }),
        r('2단', 500, { groupType: '메모리얼 2관', grade: '창측' }),
        r('3단', 600, { groupType: '메모리얼 2관', grade: '창측' }),
        r('4단', 650, { groupType: '메모리얼 2관', grade: '창측' }),
        r('5단', 700, { groupType: '메모리얼 2관', grade: '창측' }),
        r('6단', 600, { groupType: '메모리얼 2관', grade: '창측' }),
        r('7단', 450, { groupType: '메모리얼 2관', grade: '창측' }),
        r('8단', 350, { groupType: '메모리얼 2관', grade: '창측' }),

        // 메모리얼 3관 (1~7단) - 단일 가격
        r('1단', 450, { groupType: '메모리얼 3관' }),
        r('2단', 500, { groupType: '메모리얼 3관' }),
        r('3단', 650, { groupType: '메모리얼 3관' }),
        r('4단', 700, { groupType: '메모리얼 3관' }),
        r('5단', 700, { groupType: '메모리얼 3관' }),
        r('6단', 600, { groupType: '메모리얼 3관' }),
        r('7단', 350, { groupType: '메모리얼 3관' }),

        // 메모리얼 4관 (내측/창측) (1~8단)
        r('1단', 300, { groupType: '메모리얼 4관', grade: '내측' }),
        r('2단', 450, { groupType: '메모리얼 4관', grade: '내측' }),
        r('3단', 550, { groupType: '메모리얼 4관', grade: '내측' }),
        r('4단', 650, { groupType: '메모리얼 4관', grade: '내측' }),
        r('5단', 650, { groupType: '메모리얼 4관', grade: '내측' }),
        r('6단', 550, { groupType: '메모리얼 4관', grade: '내측' }),
        r('7단', 400, { groupType: '메모리얼 4관', grade: '내측' }),
        r('8단', 300, { groupType: '메모리얼 4관', grade: '내측' }),
        r('1단', 350, { groupType: '메모리얼 4관', grade: '창측' }),
        r('2단', 500, { groupType: '메모리얼 4관', grade: '창측' }),
        r('3단', 600, { groupType: '메모리얼 4관', grade: '창측' }),
        r('4단', 700, { groupType: '메모리얼 4관', grade: '창측' }),
        r('5단', 700, { groupType: '메모리얼 4관', grade: '창측' }),
        r('6단', 600, { groupType: '메모리얼 4관', grade: '창측' }),
        r('7단', 450, { groupType: '메모리얼 4관', grade: '창측' }),
        r('8단', 350, { groupType: '메모리얼 4관', grade: '창측' }),

        // 특별관 - 문의
        r('특별관', 0, { groupType: '특별관', grade: '전화문의 (055-329-4844)' }),
    ]
}];

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0798 시네오 추모관 → facilities.json 저장');

(async () => {
    const { error } = await supabase.from('Facility').update({
        pricing: JSON.stringify(p.priceInfo),
    }).eq('id', 'park-0798');
    console.log(error ? `❌ ${error.message}` : '🔄 park-0798 → Supabase OK');
})();

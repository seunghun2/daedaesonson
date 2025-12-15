const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ENV Loader
['.env', '.env.local'].forEach(fileName => {
    const envPath = path.join(__dirname, '../', fileName);
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val && !process.env[key.trim()]) {
                process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// 카테고리 매핑
const CATEGORY_MAPPING = {
    '기본비용': 'base_cost',
    '매장묘': 'grave',
    '봉안묘': 'charnel_grave',
    '봉안당': 'charnel_house',
    '수목장': 'natural',
    '기타': 'other'
};

// 크기 추출
function extractSize(grade) {
    if (!grade) return { value: null, unit: null };

    // n평 찾기
    const pyeongMatch = grade.match(/(\d+\.?\d*)평/);
    if (pyeongMatch) {
        return { value: parseFloat(pyeongMatch[1]), unit: '평' };
    }

    // n㎡ 찾기
    const sqmMatch = grade.match(/(\d+\.?\d*)㎡/);
    if (sqmMatch) {
        const sqm = parseFloat(sqmMatch[1]);
        return { value: Math.round(sqm / 3.3 * 10) / 10, unit: '평' };
    }

    return { value: null, unit: null };
}

// 그룹 타입 추출
function extractGroupType(name, grade) {
    const combined = (name + ' ' + grade).toLowerCase();

    if (combined.includes('단장')) return '단장';
    if (combined.includes('합장')) return '합장';
    if (combined.includes('쌍분')) return '합장';
    if (combined.includes('개인단') || combined.includes('1위')) return '개인';
    if (combined.includes('부부단') || combined.includes('2위')) return '부부';
    if (combined.includes('가족') || combined.includes('4위') || combined.includes('6위')) return '가족';

    return null;
}

// 포함사항 체크
function checkInclusions(name, grade, description) {
    const combined = (name + ' ' + grade + ' ' + description).toLowerCase();

    const hasInstallation = combined.includes('설치비') || combined.includes('석물') && combined.includes('포함');
    const hasManagementFee = combined.includes('관리비') && combined.includes('포함');

    let includedYear = null;
    const yearMatch = combined.match(/(\d+)년\s*(관리비)?.*포함/);
    if (yearMatch) {
        includedYear = parseInt(yearMatch[1]);
    }

    return { hasInstallation, hasManagementFee, includedYear };
}

(async () => {
    console.log('=== 1~3번 시설 새로운 스키마로 변환 ===\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    for (let i = 0; i < 3; i++) {
        const facility = facilities[i];
        const facilityId = facility.id;
        const facilityName = facility.name;

        console.log(`━━━ ${i + 1}. ${facilityName} ━━━`);

        const priceTable = facility.priceInfo?.priceTable || {};
        const categories = Object.keys(priceTable);

        console.log(`카테고리: ${categories.length}개`);

        for (const catName of categories) {
            const catData = priceTable[catName];
            const normalizedName = CATEGORY_MAPPING[catName] || 'other';

            // 1. price_category 삽입
            const { data: categoryData, error: catError } = await supabase
                .from('price_category')
                .insert({
                    facility_id: facilityId,
                    name: catName,
                    normalized_name: normalizedName,
                    order_no: categories.indexOf(catName)
                })
                .select()
                .single();

            if (catError) {
                console.log(`  ❌ 카테고리 삽입 실패 (${catName}):`, catError.message);
                continue;
            }

            const categoryId = categoryData.id;
            console.log(`  ✅ ${catName} (${catData.rows.length}개 항목)`);

            // 2. price_item 일괄 삽입
            const priceItems = catData.rows.map(row => {
                const size = extractSize(row.grade);
                const groupType = extractGroupType(row.name, row.grade);
                const inclusions = checkInclusions(row.name, row.grade, facility.description || '');

                return {
                    category_id: categoryId,
                    facility_id: facilityId,
                    item_name: row.name,
                    normalized_item_type: normalizedName,
                    group_type: groupType,
                    description: row.grade,
                    raw: `${row.name} ${row.grade}`.trim(),
                    price: row.price,
                    unit: row.grade ? row.grade : '1기',
                    size_value: size.value,
                    size_unit: size.unit,
                    has_installation: inclusions.hasInstallation,
                    has_management_fee: inclusions.hasManagementFee,
                    included_year: inclusions.includedYear,
                    discount_available: false,
                    discount_targets: null,
                    refund_rule: null,
                    min_qty: 1,
                    max_qty: null
                };
            });

            const { error: itemsError } = await supabase
                .from('price_item')
                .insert(priceItems);

            if (itemsError) {
                console.log(`  ❌ 항목 삽입 실패:`, itemsError.message);
            }
        }

        console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 1~3번 변환 완료!');
    console.log('\nSupabase에서 확인:');
    console.log('  - price_category 테이블');
    console.log('  - price_item 테이블');

})();

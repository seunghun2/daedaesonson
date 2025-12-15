const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 설정
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

// 1번 시설 테스트 데이터
const testData = {
    facilityId: 'park-0001',
    facilityName: '(재)낙원추모공원',
    pricing: {
        'grave': {
            categoryName: '매장묘',
            category: 'grave',
            unit: '원',
            rows: [
                {
                    name: '기본 매장묘 사용료',
                    price: 3000000,
                    description: '',
                    isRepresentative: false
                },
                {
                    name: '합장 매장묘 사용료',
                    price: 500000,
                    description: '',
                    isRepresentative: true
                },
                {
                    name: '대장작업비',
                    price: 1500000,
                    description: '',
                    isRepresentative: false
                }
            ]
        }
    }
};

async function insertPricingData() {
    console.log('🚀 Supabase 가격 데이터 삽입 시작!\n');

    try {
        const { facilityId, facilityName, pricing } = testData;

        console.log(`📌 시설: ${facilityName} (${facilityId})\n`);

        // 1. 기존 가격 데이터 삭제
        console.log('🗑️  기존 가격 카테고리 삭제 중...\n');
        const { error: deleteError } = await supabase
            .from('PriceCategory')
            .delete()
            .eq('facilityId', facilityId);

        if (deleteError) {
            console.log('  (기존 데이터 없음 또는 삭제 오류)\n');
        }

        // 2. 카테고리별로 삽입
        for (const [key, categoryData] of Object.entries(pricing)) {
            console.log(`💰 카테고리: ${categoryData.categoryName}\n`);

            // 2-1. PriceCategory 삽입
            const { data: category, error: catError } = await supabase
                .from('PriceCategory')
                .insert({
                    facilityId: facilityId,
                    category: categoryData.category,
                    name: categoryData.categoryName,
                    unit: categoryData.unit || '원',
                    orderNo: 0
                })
                .select()
                .single();

            if (catError) {
                console.error('❌ 카테고리 삽입 실패:', catError);
                continue;
            }

            console.log(`  ✅ 카테고리 생성 완료 (ID: ${category.id})\n`);

            // 2-2. PriceItem 삽입
            const items = categoryData.rows.map((row, index) => ({
                categoryId: category.id,
                name: row.name,
                price: row.price,
                description: row.description || '',
                grade: row.grade || '',
                size: row.size || '',
                isRepresentative: row.isRepresentative || false,
                orderNo: index
            }));

            const { data: insertedItems, error: itemError } = await supabase
                .from('PriceItem')
                .insert(items)
                .select();

            if (itemError) {
                console.error('❌ 가격 항목 삽입 실패:', itemError);
                continue;
            }

            console.log(`  ✅ ${insertedItems.length}개 항목 삽입 완료\n`);

            insertedItems.forEach((item, i) => {
                const star = item.isRepresentative ? '⭐' : '  ';
                console.log(`    ${star} ${item.name}: ${item.price.toLocaleString()}원`);
            });
            console.log();
        }

        console.log('\n🎉 데이터 삽입 완료!\n');
        console.log('💡 웹에서 확인: http://localhost:3000/?id=park-0001\n');

    } catch (error) {
        console.error('\n❌ 에러:', error);
    }
}

// 실행
insertPricingData();

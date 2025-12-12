const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 #4: 재단법인울산공원묘원');
    console.log('  정밀 수동 재분류');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const f4 = facilities.find(f => f.id === 'park-0004');

    // 기존 데이터 삭제
    await prisma.priceItem.deleteMany({ where: { facilityId: 'park-0004' } });
    await prisma.priceCategory.deleteMany({ where: { facilityId: 'park-0004' } });
    console.log('✅ 기존 데이터 삭제\n');

    const CATEGORY_MAPPING = {
        '기본비용': { normalized: 'base_cost', orderNo: 0 },
        '매장묘': { normalized: 'grave', orderNo: 1 },
        '봉안묘': { normalized: 'charnel_grave', orderNo: 2 },
        '수목장': { normalized: 'natural', orderNo: 4 }
    };

    // 수동 재분류 맵핑
    const reclassification = {
        '기본비용': {
            // 기타에서 가져올 것들
            fromOther: ['1평/30년 기준', '1평/1년 기준']
        },
        '매장묘': {
            // 기본비용에서 이동
            fromBasicCost: [
                '일반매장묘(1.5평)', '일반매장묘(2평)', '일반매장묘(3평)',
                '부부매장묘(4평)', '부부매장묘(5평)', '부부매장묘(6평)',
                '고급매장묘(4평)', '고급매장묘(5평)', '고급매장묘(6평)'
            ],
            // 매장묘에서 그대로 (봉안묘 리모델링 제외)
            fromGrave: [
                '혼유석(상석)(2.3尺)', '혼유석(상석)(2.5尺)', '혼유석(상석)(2.7尺)',
                '오석혼유석(상석)(2.3尺)', '오석혼유석(상석)(2.5尺)', '오석혼유석(상석)(2.7尺)',
                '신도비 2.5尺', '신도비 2.7尺',
                '와비 2.5尺', '와비 2.7尺',
                '개석 3尺',
                '매장작업비',
                '봉분작업비/봉수선(1평~2평)', '봉분작업비/봉수선(3평~4평)', '봉분작업비/봉수선(5평~6평)',
                '안치작업비(평장.봉안)',
                '석곽/석관',
                '경계석 설치비(1M당)',
                '(매장)1단묘 둘레석(리모델링)', '(매장)3단묘 일반 둘레석(리모델링)', '(매장)3단묘 고급 둘레석(리모델링)',
                '향로석 1개', '화병 1조(2개)',
                '개장비', '개장정리비'
            ]
        },
        '봉안묘': {
            fromGrave: [
                '2위형 봉안묘(리모델링)', '4위형 봉안묘(리모델링)', '6위형 봉안묘(리모델링)',
                '8위형 봉안묘(리모델링)', '12위형 봉안묘(리모델링)', '24위형 봉안묘(리모델링)', '48위형 봉안묘(리모델링)'
            ]
        },
        '수목장': {
            fromBasicCost: [
                '봉안/평장묘(1평)', '봉안/평장묘(1.5평)', '봉안/평장묘(2평)', '봉안/평장묘(3평)',
                '봉안/평장묘(4평)', '봉안/평장묘(5평)', '봉안/평장묘(6평)'
            ],
            fromGrave: [
                '2위형 평장묘(리모델링)', '4위형 평장묘(리모델링)', '6위형 평장묘(리모델링)', '8위형 평장묘(리모델링)'
            ]
        }
    };

    // 전체 항목 수집
    const allItems = {};
    Object.entries(f4.priceInfo.priceTable).forEach(([sourceCat, catData]) => {
        if (!catData.rows) return;
        catData.rows.forEach(row => {
            allItems[row.name] = {
                name: row.name,
                price: row.price,
                detail: row.grade || null,
                sourceCategory: sourceCat
            };
        });
    });

    // 재분류
    const newCategories = {
        '기본비용': [],
        '매장묘': [],
        '봉안묘': [],
        '수목장': []
    };

    console.log('📊 재분류 진행:\n');

    // 기본비용
    reclassification['기본비용'].fromOther.forEach(name => {
        if (allItems[name]) {
            newCategories['기본비용'].push(allItems[name]);
            console.log(`  [기본비용] ← ${name} (기타에서 이동)`);
        }
    });

    // 매장묘
    [...reclassification['매장묘'].fromBasicCost, ...reclassification['매장묘'].fromGrave].forEach(name => {
        if (allItems[name]) {
            newCategories['매장묘'].push(allItems[name]);
            if (reclassification['매장묘'].fromBasicCost.includes(name)) {
                console.log(`  [매장묘] ← ${name} (기본비용에서 이동)`);
            }
        }
    });

    // 봉안묘
    reclassification['봉안묘'].fromGrave.forEach(name => {
        if (allItems[name]) {
            newCategories['봉안묘'].push(allItems[name]);
            console.log(`  [봉안묘] ← ${name} (매장묘에서 이동)`);
        }
    });

    // 수목장
    [...reclassification['수목장'].fromBasicCost, ...reclassification['수목장'].fromGrave].forEach(name => {
        if (allItems[name]) {
            newCategories['수목장'].push(allItems[name]);
            if (reclassification['수목장'].fromBasicCost.includes(name)) {
                console.log(`  [수목장] ← ${name} (기본비용에서 이동)`);
            }
        }
    });

    console.log('\n📝 재분류 결과:');
    Object.entries(newCategories).forEach(([cat, items]) => {
        console.log(`  ${cat}: ${items.length}개`);
    });
    console.log('');

    // DB 저장
    for (const [catName, items] of Object.entries(newCategories)) {
        if (items.length === 0) continue;

        const mapping = CATEGORY_MAPPING[catName];
        const category = await prisma.priceCategory.create({
            data: {
                facilityId: 'park-0004',
                name: catName,
                normalizedName: mapping.normalized,
                orderNo: mapping.orderNo
            }
        });

        for (const item of items) {
            let groupType = '미분류';

            // groupType 판단
            if (catName === '기본비용') {
                groupType = '기본요금';
            } else if (catName === '매장묘') {
                if (/일반매장묘/.test(item.name)) groupType = '개인묘';
                else if (/부부매장묘|고급매장묘/.test(item.name)) groupType = '부부묘';
                else if (/혼유석|상석/.test(item.name)) groupType = '상석';
                else if (/신도비|비석/.test(item.name)) groupType = '비석';
                else if (/와비/.test(item.name)) groupType = '와비';
                else if (/둘레석/.test(item.name)) groupType = '둘레석';
                else if (/봉분/.test(item.name)) groupType = '봉분공사';
                else if (/작업비|개장/.test(item.name)) groupType = '작업비';
                else if (/리모델/.test(item.name)) groupType = '리모델링';
            } else if (catName === '봉안묘') {
                groupType = '봉안묘';
            } else if (catName === '수목장') {
                if (/평장/.test(item.name)) groupType = '평장';
                else groupType = '수목장';
            }

            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId: 'park-0004',
                    itemName: item.name,
                    normalizedItemType: mapping.normalized,
                    groupType: groupType,
                    description: item.detail,
                    raw: `${item.name} ${item.detail || ''}`.trim(),
                    price: BigInt(item.price),
                    unit: item.detail || '1기',
                    sizeValue: null,
                    sizeUnit: null,
                    hasInstallation: false,
                    hasManagementFee: false,
                    includedYear: null,
                    discountAvailable: false,
                    discountTargets: null,
                    refundRule: null,
                    minQty: 1,
                    maxQty: null
                }
            });
        }

        console.log(`✅ [${catName}] 저장 완료: ${items.length}개`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await prisma.$disconnect();
})();

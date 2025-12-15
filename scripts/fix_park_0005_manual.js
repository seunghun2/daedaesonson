const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 #5: 진주내동공원묘원');
    console.log('  정밀 수동 재분류');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const f5 = facilities.find(f => f.id === 'park-0005');

    await prisma.priceItem.deleteMany({ where: { facilityId: 'park-0005' } });
    await prisma.priceCategory.deleteMany({ where: { facilityId: 'park-0005' } });
    console.log('✅ 기존 데이터 삭제\n');

    const CATEGORY_MAPPING = {
        '기본비용': { normalized: 'base_cost', orderNo: 0 },
        '매장묘': { normalized: 'grave', orderNo: 1 },
        '봉안당': { normalized: 'charnel_house', orderNo: 3 },
        '수목장': { normalized: 'natural', orderNo: 4 },
        '기타': { normalized: 'other', orderNo: 5 }
    };

    const reclassification = {
        '기본비용': {
            keep: ['묘지 사용료', '묘지 관리비', '봉안당 관리비 일반단', '봉안당 관리비 특별단,vip단']
        },
        '매장묘': {
            keep: ['2자상석', '2.5자상석', '3자상석', '2.5자와비', '3자와비', '걸방석, 북석', '경계석(평당)', '묘테', '2단둘레석'],
            fromOther: ['2.5자거비', '3자거비', '향로석세트', '화병(1조)']
        },
        '봉안당': {
            keep: [
                '봉안당(일반실) 일반단8단', '봉안당(일반실) 일반단1,특별단8단', '봉안당(일반실) 일반단3단, 7단, 특별단1단, vip8단',
                '봉안당(일반실) 일반단 4단, 6단, 특별단2단, 7단,vip1단', '봉안당(일반실) 일반단5단, 특별단3단, vip2단',
                '봉안당(일반실) vip3단, 7단', '봉안당(일반실) 특별단 4단,6단, vip3단7단', '봉안당(일반실) vip6단',
                '봉안당(일반실) 특별단5단, vip4단', '봉안당(일반실) vip5단',
                '봉안당(특별실) 일반단1단', '봉안당(특별실) 일반단2단,6단', '봉안당(특별실) 일반단3단5단',
                '봉안당(특별실) 일반단4단', '봉안당(특별실) 일반단7단', '봉안당(특별실) 특별단7단',
                '봉안당(특별실) 특별단6단', '봉안당(특별실) 특별단1단', '봉안당(특별실) 특별단5단',
                '봉안당(특별실) 특별단2단,vip6단', '봉안당(특별실) 특별단3단, vip1단', '봉안당(특별실) 특별단4단, vip2단',
                '봉안당(특별실) vip3단, 5단', '봉안당(특별실) vip4단'
            ]
        },
        '수목장': {
            keep: ['구평장', '신평장']
        },
        '기타': {
            keep: ['민무늬', '아자형', '청룡백호']
        }
    };

    const allItems = {};
    Object.entries(f5.priceInfo.priceTable).forEach(([sourceCat, catData]) => {
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

    const newCategories = {
        '기본비용': [],
        '매장묘': [],
        '봉안당': [],
        '수목장': [],
        '기타': []
    };

    console.log('📊 재분류 진행:\n');

    Object.entries(reclassification).forEach(([catName, config]) => {
        if (config.keep) {
            config.keep.forEach(name => {
                if (allItems[name]) {
                    newCategories[catName].push(allItems[name]);
                }
            });
        }
        if (config.fromOther) {
            config.fromOther.forEach(name => {
                if (allItems[name]) {
                    newCategories[catName].push(allItems[name]);
                    console.log(`  [${catName}] ← ${name} (${allItems[name].sourceCategory}에서 이동)`);
                }
            });
        }
    });

    console.log('\n📝 재분류 결과:');
    Object.entries(newCategories).forEach(([cat, items]) => {
        console.log(\`  \${cat}: \${items.length}개\`);
    });
    console.log('');
    
    for (const [catName, items] of Object.entries(newCategories)) {
        if (items.length === 0) continue;
        
        const mapping = CATEGORY_MAPPING[catName];
        const category = await prisma.priceCategory.create({
            data: {
                facilityId: 'park-0005',
                name: catName,
                normalizedName: mapping.normalized,
                orderNo: mapping.orderNo
            }
        });
        
        for (const item of items) {
            let groupType = '미분류';
            
            if (catName === '기본비용') {
                groupType = '기본요금';
            } else if (catName === '매장묘') {
                if (/상석/.test(item.name)) groupType = '상석';
                else if (/와비/.test(item.name)) groupType = '와비';
                else if (/거비|비석/.test(item.name)) groupType = '비석';
                else if (/둘레석|경계석/.test(item.name)) groupType = '둘레석';
                else if (/묘테/.test(item.name)) groupType = '묘테석';
                else if (/북석/.test(item.name)) groupType = '북석';
                else if (/향로/.test(item.name)) groupType = '향로';
                else if (/화병/.test(item.name)) groupType = '화병';
            } else if (catName === '봉안당') {
                groupType = '봉안당';
            } else if (catName === '수목장') {
                groupType = '평장';
            }
            
            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId: 'park-0005',
                    itemName: item.name,
                    normalizedItemType: mapping.normalized,
                    groupType: groupType,
                    description: item.detail,
                    raw: \`\${item.name} \${item.detail || ''}\`.trim(),
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
        
        console.log(\`✅ [\${catName}] 저장 완료: \${items.length}개\`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await prisma.$disconnect();
})();

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reorderPark0001() {
    const d = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
    const facilities = d.facilities || d;
    const fIndex = facilities.findIndex(x => x.id === 'park-0001');

    if (fIndex !== -1) {
        let f = facilities[fIndex];
        if (f.priceInfo && f.priceInfo.standardizedPrices) {

            // 정렬 로직 적용
            f.priceInfo.standardizedPrices.sort((a, b) => {
                const getOrder = (g) => {
                    if (g.serviceType === 'BONGSAN') return 0;
                    if (g.serviceType === 'BURIAL') {
                        if (g.subType === '매장묘 (부부 포함)') return 1;
                        if (g.subType === '매장묘 (가족형)') return 2;
                        if (g.subType === '평장묘') return 3;
                        return 4;
                    }
                    return 99;
                };
                return getOrder(a) - getOrder(b);
            });

            fs.writeFileSync('data/facilities.json', JSON.stringify(d, null, 2));
            console.log("park-0001 서브타입 정렬 완료 (data/facilities.json)");

            // DB 업데이트
            const { error } = await supabase
                .from('Facility')
                .update({ pricing: f.priceInfo })
                .eq('id', 'park-0001');

            if (error) {
                console.error('Error updating DB:', error);
            } else {
                console.log('✅ DB update complete for park-0001 (순서 변경 적용)');
            }
        }
    }
}

reorderPark0001();

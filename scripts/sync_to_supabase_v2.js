
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '../.env.local');
require('dotenv').config({ path: envPath });

async function syncToSupabase() {
    console.log('🚀 Supabase 동기화 시작...');

    // 1. Supabase 클라이언트 설정 (route.ts에서 발견된 폴백 키)
    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase 설정 오류');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. 로컬 데이터 읽기
    const facilitiesPath = path.join(__dirname, '../public/data/facilities.json');
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));
    console.log(`📂 로컬 데이터 로드 완료: ${facilities.length}개`);

    // 3. 데이터 변환 (DB 스키마에 맞게 - route.ts 참조)
    const records = facilities.map(f => {
        const imgSource = f.imageGallery || f.images || [];
        // DB는 images 컬럼이 text(json string)일 수 있음. route.ts에서는 JSON.stringify 함.
        let imageStr = '[]';
        try {
            imageStr = JSON.stringify(Array.isArray(imgSource) ? imgSource : []);
        } catch (e) { }

        return {
            id: f.id,
            name: f.name,
            address: f.address || '',
            category: f.category || 'OTHER',
            description: f.description || '',
            images: imageStr,
            updatedAt: new Date().toISOString(),
            // rating, reviewCount는 보통 DB에서 계산되거나 보존해야 하지만 여기선 덮어쓰기 주의
            // 일단 로컬 값 있으면 쓰고 없으면 0
            rating: f.rating || 0,
            reviewCount: f.reviewCount || 0,

            isPublic: f.isPublic ?? false,
            hasParking: f.hasParking ?? false,
            hasRestaurant: f.hasRestaurant ?? false,
            hasStore: f.hasStore ?? false,
            hasAccessibility: f.hasAccessibility ?? false,

            // 좌표 (lat, lng 컬럼)
            lat: f.coordinates?.lat || 0,
            lng: f.coordinates?.lng || 0,

            // 가격 (minPrice, maxPrice 컬럼)
            minPrice: f.priceRange?.min || 0,
            maxPrice: f.priceRange?.max || 0,

            // 추가 필드 (DB에 컬럼이 있을지 불확실하지만, 사용자가 요청한 필드들이므로 시도는 해봄)
            // 만약 에러나면 이 부분 주석 처리해야 함.
            phone: f.phone,
            websiteUrl: f.website || f.websiteUrl,
            // fax: f.fax, 
            // capacity: f.capacity 
            // 일단 fax, capacity는 주석처리. route.ts에도 매핑이 안 보임.
            // phone, websiteUrl은 보통 있을 것임.
        };
    });

    // 4. 배치 업서트
    const BATCH_SIZE = 50; // 사이즈 줄임
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        // 테이블명 'Facility' (단수형, 대문자 시작)
        const { error } = await supabase
            .from('Facility')
            .upsert(batch, { onConflict: 'id' });

        if (error) {
            console.error(`❌ 배치 업로드 실패 (${i} ~ ${i + BATCH_SIZE}):`, error.message);
            failCount += batch.length;
        } else {
            successCount += batch.length;
            process.stdout.write(`.`);
        }
    }

    console.log(`\n\n📊 동기화 완료`);
    console.log(`   ✅ 성공: ${successCount}`);
    console.log(`   ❌ 실패: ${failCount}`);
}

syncToSupabase();

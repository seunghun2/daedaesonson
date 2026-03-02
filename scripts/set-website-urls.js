/**
 * 검증된 193개 시설의 websiteUrl을 facilities.json + Supabase에 세팅
 * 가이드 규칙: 로컬 JSON 수정 + Supabase 동기화 (커밋/배포 X)
 */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function main() {
    // 1. 검증된 데이터 로드
    const verified = JSON.parse(fs.readFileSync('data/facility-websites-verified.json', 'utf-8'));
    const sites = verified.verified; // 193개 검증 완료 목록

    console.log(`검증된 시설: ${sites.length}개`);

    // URL 정리 (메인 도메인만 추출, 서브페이지 제거)
    function cleanUrl(url) {
        try {
            const u = new URL(url);
            // .go.kr은 서브페이지도 유지 (지자체 시설 전용 페이지)
            if (u.hostname.endsWith('.go.kr') || u.hostname.endsWith('.or.kr')) {
                return url;
            }
            // 일반 사이트는 메인 도메인으로
            return u.origin + '/';
        } catch {
            return url;
        }
    }

    // 2. facilities.json 업데이트
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    let updated = 0;
    let skipped = 0;

    for (const site of sites) {
        const fac = facilities.find(f => f.id === site.id);
        if (!fac) {
            console.log(`⚠️ ${site.id} ${site.name} - facilities.json에 없음`);
            skipped++;
            continue;
        }

        const cleanedUrl = cleanUrl(site.website);

        // 이미 websiteUrl이 있으면 스킵
        if (fac.websiteUrl && fac.websiteUrl.trim()) {
            console.log(`⏭️ ${site.id} ${site.name} - 기존 URL 유지: ${fac.websiteUrl}`);
            skipped++;
            continue;
        }

        fac.websiteUrl = cleanedUrl;
        updated++;
    }

    console.log(`\n📝 JSON 업데이트: ${updated}개, 스킵: ${skipped}개`);

    // 3. facilities.json 저장
    fs.writeFileSync('data/facilities.json', JSON.stringify(facilities, null, 2));
    console.log('✅ data/facilities.json 저장 완료');

    // 4. Supabase 동기화
    console.log('\n🔄 Supabase 동기화 시작...');
    let syncSuccess = 0;
    let syncFail = 0;

    for (const site of sites) {
        const fac = facilities.find(f => f.id === site.id);
        if (!fac || !fac.websiteUrl) continue;

        try {
            const { error } = await supabase
                .from('Facility')
                .update({ websiteUrl: fac.websiteUrl })
                .eq('id', site.id);

            if (error) {
                console.log(`❌ ${site.id} Supabase 오류: ${error.message}`);
                syncFail++;
            } else {
                syncSuccess++;
            }
        } catch (e) {
            console.log(`❌ ${site.id} 동기화 실패: ${e.message}`);
            syncFail++;
        }
    }

    console.log(`\n========== 완료 ==========`);
    console.log(`📝 JSON 업데이트: ${updated}개`);
    console.log(`🔄 Supabase 동기화: 성공 ${syncSuccess}개, 실패 ${syncFail}개`);
}

main().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const updated = new Set();

    function moveRep(id, serviceType, subType, targetName) {
        const f = data.find(d => d.id === id);
        if (!f) { console.log('NOT FOUND:', id); return; }
        const sp = f.priceInfo?.standardizedPrices || [];
        const g = sp.find(s => s.serviceType === serviceType && s.subType === subType);
        if (!g) { console.log('GROUP NOT FOUND:', id, serviceType, subType); return; }
        const rows = g.rows || [];
        // Remove all isRepresentative in this group
        rows.forEach(r => { delete r.isRepresentative; });
        // Find the target row (lowest USAGE price)
        const usageRows = rows.filter(r => r.feeType === 'USAGE' && r.price >= 100000);
        if (usageRows.length === 0) { console.log('NO USAGE ROWS:', id); return; }

        let target;
        if (targetName) {
            target = usageRows.find(r => r.name === targetName);
        }
        if (!target) {
            // Find minimum price USAGE row
            const minPrice = Math.min(...usageRows.map(r => r.price));
            target = usageRows.find(r => r.price === minPrice);
        }
        if (target) {
            target.isRepresentative = true;
            updated.add(id);
            console.log('✅', id, f.name, '|', serviceType, subType, '→ ★', target.name, '=', target.price.toLocaleString());
        }
    }

    // === 600번대 ===
    // park-0600: 대국사 봉안당 - 2단 250만 → 8단 200만 (같은 단 차이)
    moveRep('park-0600', 'BONGSAN', '봉안당');

    // park-0602: 조계종관음사 봉안당 - 2단 500만 → 8단 300만 (같은 단 차이)
    moveRep('park-0602', 'BONGSAN', '봉안당');

    // park-0603: 석예정사 봉안당(1관) - 1단 500만 → 8단 300만 (같은 단 차이)
    moveRep('park-0603', 'BONGSAN', '봉안당(1관)');

    // park-0616: 지평선전북공원묘원(봉안) - 매화 150만 → 장미 120만 (같은 매장묘 묘역별 차이)
    moveRep('park-0616', 'BURIAL', '매장묘');

    // park-0622: 강촌추모원 봉안당(개인) - 3~7단 300만 → 10년봉안형 150만
    moveRep('park-0622', 'BONGSAN', '봉안당(개인)');

    // park-0625: 학천사추모관 영구안치(특별단) - 1단 220만 → 9단 150만 (같은 단 차이)
    moveRep('park-0625', 'BONGSAN', '영구안치(특별단)');

    // park-0633: 월봉사연화원 봉안담 - 5단 550만 → 2단 450만 (같은 단 차이)
    moveRep('park-0633', 'BONGSAN', '봉안담');

    // park-0635: 김천추모공원 봉안당 - 1단 150만 → 9단 100만 (같은 단 차이)
    moveRep('park-0635', 'BONGSAN', '봉안당');

    // park-0648: 예수사랑제일교회 봉안당 - 3단 500만 → 1단 380만 (같은 단 차이)
    moveRep('park-0648', 'BONGSAN', '봉안당');

    // park-0651: 감로복지원 진주추모공원 특별관 - 4단 580만 → 1단 199만 (같은 단 차이)
    moveRep('park-0651', 'BONGSAN', '특별관');

    // === 700번대 ===
    // park-0765: 정각사 봉안당(개인) - 1단 400만 → 10단 200만 (같은 단 차이)
    moveRep('park-0765', 'BONGSAN', '봉안당(개인)');
    // park-0765: 정각사 봉안당(부부) - 1단 800만 → 10단 400만 (같은 단 차이)
    moveRep('park-0765', 'BONGSAN', '봉안당(부부)');

    // park-0774: 신흥사 봉안당 - 영구 350만 → 30년 200만 (같은 봉안당 기간 차이)
    moveRep('park-0774', 'BONGSAN', '봉안당');

    // park-0775: 선약사 봉안당 - 1층 500만 → 7층 350만 (같은 층별 차이)
    moveRep('park-0775', 'BONGSAN', '봉안당');

    // park-0789: 일월사추모공원 봉안당 - A그룹 100만 → C그룹 50만 (같은 등급 차이)
    moveRep('park-0789', 'BONGSAN', '봉안당');

    // === 800번대 ===
    // park-0817: 에덴추모원 봉안당 - 영구 200만 → 5년 100만 (기간 차이)
    moveRep('park-0817', 'BONGSAN', '봉안당');

    // park-0828: 천룡사납골당 봉안당 - 유골함(대) 400만 → 유골함(소) 200만 (크기 차이)
    moveRep('park-0828', 'BONGSAN', '봉안당');

    // === 900번대+ ===
    // park-0970: 정안수목장 수목형 - 개인 300만 → 공동 100만 (유형 차이)
    moveRep('park-0970', 'NATURAL', '수목형');

    // park-1141: 양구봉안공원 봉안당 - 개인 54.7만 → 개인 10.5만 (같은 개인형)
    moveRep('park-1141', 'BONGSAN', '봉안당');

    // park-1175: 유토피아추모공원 수목장 - 공동형 300만 → 유택동산 150만 (유형 차이)
    moveRep('park-1175', 'NATURAL', '수목장');

    // park-1177: 은하수공원 잔디형 - 개인장 65만 → 합장료 26만
    // ❌ 유지: 합장료는 추가 안치 비용이므로 개인장이 본질적 대표가

    // park-1186: 유토피아수목장 수목형 - 일반수목 350만 → 공동형 150만
    moveRep('park-1186', 'NATURAL', '수목형');

    // park-1188: 자연숲추모공원 수목형 - 조형묘A 950만 → 공동묘B 90만 (등급 차이)
    moveRep('park-1188', 'NATURAL', '수목형');

    // park-1192: 천봉사 수목형 - 주목 200만 → 장송 100만 (수종 차이)
    moveRep('park-1192', 'NATURAL', '수목형');

    // park-1193: (재)용인추모원 수목형 - 공동목/개인 350만 → 공동목/개인 200만
    moveRep('park-1193', 'NATURAL', '수목형');

    // park-1202: 일산공감수목장 수목형 - 개인목 600만 → 공동목 300만
    moveRep('park-1202', 'NATURAL', '수목형');

    // park-1227: 경주하늘수목장림 수목장 - 가족묘A 600만 → 공동묘 60만 (등급 차이)
    moveRep('park-1227', 'NATURAL', '수목장');

    // park-1234: 쌍계사 수목장 - 소가족묘 900만 → 공동묘 200만
    moveRep('park-1234', 'NATURAL', '수목장');

    // === 유지(수정 안 함) ===
    // park-0638: 임시봉안은 본질적 사용료 아님 → 유지
    // park-0646: 유공자 특례 → 유지
    // park-0647: 연장사용료 → 유지
    // park-0697: 추가봉안 → 유지
    // park-0700: 유골함=장례용품 → 유지
    // park-0702: 독립유공자 특례 → 유지
    // park-0703: 유골함=장례용품 → 유지
    // park-0704: 석물비=부대비용 → 유지
    // park-0705: 무연고 특례 → 유지
    // park-0720: 각지/세라믹=부대비용 → 유지
    // park-0725: 무연고 특례 → 유지
    // park-0729: 연장료 → 유지
    // park-0772: 무연유골 특례 → 유지
    // park-0773: 봉안제사=부가서비스 → 유지
    // park-0783: 무연고 특례 → 유지
    // park-0785: 무연고 특례 → 유지
    // park-0788: 무연유골 특례 → 유지
    // park-0797: 연장료 → 유지
    // park-0842: 유공자 VETERAN 특례 → 유지
    // park-0854,0861: 잔디값=부대비용 → 유지
    // park-0937: 토지사용비가 본질적 대표가 → 유지
    // park-1177: 합장료=추가안치 → 유지
    // park-1184: 문중종중은 특수 → 유지
    // park-1195: 가격차이 5만원 → 유지
    // park-1206,1207,1211,1212,1213,1215,1216,1229,1235,1255,1264: 추후 확인

    // Save
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    // Supabase sync
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 대표가격(★) 수정 완료! 총', updated.size, '건');
}
fix();

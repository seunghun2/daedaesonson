/**
 * park-0741 ~ park-0751 가격 데이터 세팅
 * 741 전주효자공원봉안당 - 아카이브
 * 742 창원시립진해천자원 - 아카이브
 * 743 양주시 경신하늘뜰공원 - 공홈(yangju.go.kr) + 유저이미지
 * 744 세종시추모의집 - 공홈(sjfmc.or.kr) + 유저이미지 + 아카이브
 * 745 태백시 하장사 - 공홈(taebaek.go.kr) + 유저이미지
 * 746 대한불교관음종불문사 - 아카이브
 * 747 평택시립추모공원 - 아카이브
 * 748 화성시추모공원 봉안당 - 공홈(hu.or.kr) + 유저이미지
 * 749 성남장례문화사업소 하늘누리 제1추모원 - 공홈(seongnam.go.kr) + 유저이미지
 * 750 성남장례문화사업소 하늘누리 제2추모원 - 749와 동일
 * 751 천안추모공원 - 공홈(cauc.or.kr) + 유저이미지
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const updates = [];

    // ===== 741 전주효자공원봉안당 (아카이브) =====
    // 개인단 225,000 / 부부단 450,000
    // 공설·공동묘지 개장유골 50%감면 112,500 → 특수(제외)
    // 공설묘지 미사용 반환자 면제 → 특수(제외)
    const p741 = data.find(x => x.id === 'park-0741');
    if (p741) {
        p741.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 225000, feeType: 'USAGE', isRepresentative: true },
                    { name: '사용료 (부부단)', price: 450000, feeType: 'USAGE', note: '배우자의 안치장소 예매불가' },
                ]
            },
        ];
        updates.push({ id: 'park-0741', p: p741 });
        console.log('✅', p741.id, p741.name);
    }

    // ===== 742 창원시립진해천자원 (아카이브) =====
    // 시설이용료+관리비 관내 15년: 120,000
    // 시설이용료+관리비 관외 15년: 50,000
    // 수급자/국가유공자: 면제(제외)
    // 개인단 관내: 170,000
    const p742 = data.find(x => x.id === 'park-0742');
    if (p742) {
        p742.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '이용료+관리비', price: 50000, feeType: 'USAGE', grade: '최초안치 15년', isRepresentative: true, residency: 'NON_LOCAL' },
                    { name: '이용료+관리비', price: 120000, feeType: 'USAGE', grade: '최초안치 15년', residency: 'LOCAL' },
                    { name: '개인단', price: 170000, feeType: 'USAGE', residency: 'LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0742', p: p742 });
        console.log('✅', p742.id, p742.name);
    }

    // ===== 743 양주시 경신하늘뜰공원 (공홈 + 유저이미지) =====
    // 자연장지: 30년, 관내 400,000 / 관외 600,000 (연장불가, 표지석 15만 별도)
    // 봉안당 개인단: 15년, 관내 500,000 / 관외 1,000,000 (1회연장가능)
    // 봉안당 부부단: 15년, 관내 1기당 500,000 / 관외 1기당 1,000,000
    // ※ 자연장지 만장(안치불가), 봉안당 부부장 만장(개인장만 안치가능)
    const p743 = data.find(x => x.id === 'park-0743');
    if (p743) {
        p743.websiteUrl = 'https://www.yangju.go.kr/www/contents.do?key=503';
        p743.priceInfo.standardizedPrices = [
            {
                serviceType: 'NATURAL_BURIAL', subType: '자연장지', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 400000, feeType: 'USAGE', grade: '30년, 연장불가', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료', price: 600000, feeType: 'USAGE', grade: '30년, 연장불가', residency: 'NON_LOCAL' },
                    { name: '[필수] 표지석', price: 150000, feeType: 'INSTALLATION', grade: '별도' },
                ],
                note: '자연장지 만장 (안치불가)'
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 500000, feeType: 'USAGE', grade: '15년, 1회 연장가능', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 1000000, feeType: 'USAGE', grade: '15년, 1회 연장가능', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단, 1기당)', price: 500000, feeType: 'USAGE', grade: '15년, 1회 연장가능', residency: 'LOCAL' },
                    { name: '사용료 (부부단, 1기당)', price: 1000000, feeType: 'USAGE', grade: '15년, 1회 연장가능', residency: 'NON_LOCAL' },
                ],
                note: '봉안당 부부장 만장 (개인장만 안치 가능)'
            },
        ];
        updates.push({ id: 'park-0743', p: p743, ws: true });
        console.log('✅', p743.id, p743.name);
    }

    // ===== 744 세종시추모의집 (공홈 + 유저이미지 + 아카이브) =====
    // 공설묘지: 일반묘지 사용료 90,000 + 관리비 110,000 = 200,000 (30년, 1회 30년 연장)
    // 봉안당(아카이브): 유연고 사용료 214,000 + 관리료 73,000 / 무연고 사용료 90,000 + 관리료 48,000
    const p744 = data.find(x => x.id === 'park-0744');
    if (p744) {
        p744.websiteUrl = 'https://www.sjfmc.or.kr/kor/sub04_01_02.do';
        p744.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '공설묘지', groupType: '일반묘지', unit: '원', rows: [
                    { name: '사용료', price: 90000, feeType: 'USAGE', grade: '30년, 1회 30년 연장가능', isRepresentative: true },
                    { name: '관리비', price: 110000, feeType: 'MAINTENANCE', grade: '30년' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 214000, feeType: 'USAGE', isRepresentative: true },
                    { name: '관리료', price: 73000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0744', p: p744, ws: true });
        console.log('✅', p744.id, p744.name);
    }

    // ===== 745 태백시 하장사 (공홈 + 유저이미지) =====
    const p745 = data.find(x => x.id === 'park-0745');
    if (p745) {
        p745.websiteUrl = 'https://www.taebaek.go.kr/www/contents.do?key=434';
        p745.priceInfo.standardizedPrices = [
            // 묘지 - 단장묘
            {
                serviceType: 'BURIAL', subType: '묘지', groupType: '단장묘 (6.75㎡)', unit: '원', rows: [
                    { name: '사용료', price: 623000, feeType: 'USAGE', isRepresentative: true },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE' },
                    { name: '[필수] 석물비', price: 1455000, feeType: 'INSTALLATION' },
                    { name: '[필수] 매장비 (하)', price: 780000, feeType: 'INSTALLATION' },
                    { name: '[필수] 매장비 (동)', price: 1170000, feeType: 'INSTALLATION' },
                ],
                note: '관내 거주자만 이용가능, 묘비글씨비용 별도'
            },
            // 묘지 - 합장묘
            {
                serviceType: 'BURIAL', subType: '묘지', groupType: '합장묘 (9.9㎡)', unit: '원', rows: [
                    { name: '사용료', price: 914000, feeType: 'USAGE' },
                    { name: '관리비', price: 440000, feeType: 'MAINTENANCE' },
                    { name: '[필수] 석물비', price: 1695000, feeType: 'INSTALLATION' },
                ],
                note: '합장묘 추가매장시 매장비 추가발생'
            },
            // 추모관(봉안당)
            {
                serviceType: 'BONGSAN', subType: '추모관(봉안당)', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 113000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 600000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 500000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료 (부부단)', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            // 자연장지 (잔디형)
            {
                serviceType: 'NATURAL_BURIAL', subType: '자연장지 (잔디형)', groupType: '개인장지', unit: '원', rows: [
                    { name: '사용료', price: 300000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '관리비', price: 180000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '[필수] 석물비', price: 22000, feeType: 'INSTALLATION', residency: 'LOCAL' },
                    { name: '사용료', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '관리비', price: 180000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                    { name: '[필수] 석물비', price: 22000, feeType: 'INSTALLATION', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'NATURAL_BURIAL', subType: '자연장지 (잔디형)', groupType: '부부장지', unit: '원', rows: [
                    { name: '사용료', price: 600000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '관리비', price: 360000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '[필수] 석물비', price: 44000, feeType: 'INSTALLATION', residency: 'LOCAL' },
                    { name: '사용료', price: 2000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '관리비', price: 360000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                    { name: '[필수] 석물비', price: 44000, feeType: 'INSTALLATION', residency: 'NON_LOCAL' },
                ]
            },
            // 봉안묘 - 가족묘
            {
                serviceType: 'BONGSAN', subType: '봉안묘', groupType: '가족묘 (12기, 16.57㎡)', unit: '원', rows: [
                    { name: '사용료', price: 2306000, feeType: 'USAGE' },
                    { name: '관리비', price: 600000, feeType: 'MAINTENANCE' },
                    { name: '[필수] 석물비', price: 855000, feeType: 'INSTALLATION' },
                    { name: '[필수] 설치비 (원형고정)', price: 1010000, feeType: 'INSTALLATION', residency: 'LOCAL' },
                    { name: '[필수] 설치비 (원형고정)', price: 1610000, feeType: 'INSTALLATION', residency: 'NON_LOCAL' },
                    { name: '[필수] 설치비 (사각회전)', price: 1506000, feeType: 'INSTALLATION', residency: 'LOCAL' },
                    { name: '[필수] 설치비 (사각회전)', price: 2106000, feeType: 'INSTALLATION', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0745', p: p745, ws: true });
        console.log('✅', p745.id, p745.name);
    }

    // ===== 746 대한불교관음종불문사 (아카이브) =====
    // 단기(10년): 465,000
    // 영구: 1,500,000 / 2,000,000 / 2,500,000
    const p746 = data.find(x => x.id === 'park-0746');
    if (p746) {
        p746.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '단기 (10년)', price: 465000, feeType: 'USAGE', isRepresentative: true },
                    { name: '영구', price: 1500000, feeType: 'USAGE' },
                    { name: '영구', price: 2000000, feeType: 'USAGE' },
                    { name: '영구', price: 2500000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0746', p: p746 });
        console.log('✅', p746.id, p746.name);
    }

    // ===== 747 평택시립추모공원 (아카이브) =====
    // 개인단(관내): 기본15년 3회연장, 527,000
    // 부부단(관내): 기본15년 3회연장, 790,000
    // 개인단(관외): 자녀1년이상 평택거주, 790,000
    // 부부단(관외): 자녀1년이상 평택거주, 1,185,000
    const p747 = data.find(x => x.id === 'park-0747');
    if (p747) {
        p747.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 527000, feeType: 'USAGE', grade: '기본 15년, 3회 연장가능', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (부부단)', price: 790000, feeType: 'USAGE', grade: '기본 15년, 3회 연장가능', residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 790000, feeType: 'USAGE', grade: '자녀 1년이상 평택 거주', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 1185000, feeType: 'USAGE', grade: '자녀 1년이상 평택 거주', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0747', p: p747 });
        console.log('✅', p747.id, p747.name);
    }

    // ===== 748 화성시추모공원 봉안당 (공홈 + 유저이미지) =====
    // 실내봉안당: 개인단 관내500,000/관외1,000,000, 부부단 관내750,000/관외1,500,000
    // 평장형 봉안묘(신청불가): 개인단 관내650,000/관외1,300,000, 부부단 관내975,000/관외1,950,000
    const p748 = data.find(x => x.id === 'park-0748');
    if (p748) {
        p748.websiteUrl = 'https://www.hu.or.kr/www/M040000/M040500/M0405003/M04050031.jsp';
        p748.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '실내봉안당', groupType: '사용료 (1구당)', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 500000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 750000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료 (부부단)', price: 1500000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ],
                note: '카드 및 현금 납부, 국가보훈/기초수급자 감면 (관내 전액, 관외 50%)'
            },
            {
                serviceType: 'BONGSAN', subType: '평장형 봉안묘', groupType: '사용료 (1구당)', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 650000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 1300000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 975000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료 (부부단)', price: 1950000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ],
                note: '2013년 만장, 신규 신청 불가'
            },
        ];
        updates.push({ id: 'park-0748', p: p748, ws: true });
        console.log('✅', p748.id, p748.name);
    }

    // ===== 749 성남장례문화사업소 하늘누리 제1추모원 (공홈 + 유저이미지) =====
    // 제1,2추모원(개인단): 관내 100,000 / 관외 1,000,000
    // 제2추모원(부부단): 관내 1위당 100,000 / 관외 1위당 1,000,000
    const p749 = data.find(x => x.id === 'park-0749');
    if (p749) {
        p749.websiteUrl = 'https://www.seongnam.go.kr/city/1001269/10854/contents.do';
        p749.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인단)', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 100000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0749', p: p749, ws: true });
        console.log('✅', p749.id, p749.name);
    }

    // ===== 750 성남장례문화사업소 하늘누리 제2추모원 (749와 동일) =====
    const p750 = data.find(x => x.id === 'park-0750');
    if (p750) {
        p750.websiteUrl = 'https://www.seongnam.go.kr/city/1001269/10854/contents.do';
        p750.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인단)', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 100000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부단)', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (1위당)', price: 100000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료 (1위당)', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0750', p: p750, ws: true });
        console.log('✅', p750.id, p750.name);
    }

    // ===== 751 천안추모공원 (공홈 + 유저이미지) =====
    // 봉안: 개인단(15년) 관내400,000/관외1,000,000
    //       부부단(15년) 관내600,000/관외 안치불가
    //       무연묘(5년) 관내100,000/관외 안치불가 → 무연고 제외
    // 화장: 대인 관내100,000/준관내400,000/관외800,000
    const p751 = data.find(x => x.id === 'park-0751');
    if (p751) {
        p751.websiteUrl = 'https://www.cauc.or.kr/_chpark/';
        p751.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 400000, feeType: 'USAGE', grade: '15년', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 1000000, feeType: 'USAGE', grade: '15년', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 600000, feeType: 'USAGE', grade: '15년', residency: 'LOCAL', note: '부부 합장시에만 이용(단독사용 불가)' },
                ],
                note: '관외: 제1봉안시설 반환 안치단 이용 (반환공실 없을시 제2봉안 안치)'
            },
            {
                serviceType: 'CREMATION', subType: '화장시설', groupType: '사용료', unit: '원', rows: [
                    { name: '대인', price: 100000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '대인', price: 400000, feeType: 'USAGE', grade: '준관내 (충남,충북,세종,대전,평택,안성)' },
                    { name: '대인', price: 800000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '소인', price: 80000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '소인', price: 250000, feeType: 'USAGE', grade: '준관내' },
                    { name: '소인', price: 500000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '사산아', price: 30000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사산아', price: 200000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '개장유골', price: 50000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '개장유골', price: 400000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ],
                note: '관내(천안), 준관내(충남,충북,세종,대전,평택,안성), 관외(그 이외)'
            },
        ];
        updates.push({ id: 'park-0751', p: p751, ws: true });
        console.log('✅', p751.id, p751.name);
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    // Supabase 동기화
    for (const u of updates) {
        const ud = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.ws) ud.websiteUrl = u.p.websiteUrl;
        const { error } = await supabase.from('Facility').update(ud).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();

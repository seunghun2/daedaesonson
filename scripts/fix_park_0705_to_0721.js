/**
 * park-0705~0721 일괄 처리
 *
 * 705 삼척시추모공원 (공홈 samcheok.go.kr/memorial) - 가격 유저 제공
 *   일반묘지: 화강암2평3평 단장/예약1기, 단장1기, 2평형합장, 3평형합장
 *   일반묘지: 오석2평3평 단장/예약1기, 단장1기, 2평형합장, 3평형합장
 *   자연장(단장) 817K, 자연장 단장 안장1기+예약1기 1,177K
 *   자연장 합장1기 967K, 합장2기 1,017K
 *   봉안당 개인단 336K, 부부단 592K, 무연고 168K
 *
 * 706 삼성개발공원묘원(봉안) (공홈 elysium.co.kr, 가격 아카이브)
 *   토지사용료 평방미터 697,000
 *   관리비 평방미터 9,091
 *   봉안묘 5㎡ 6,125,000 / 6.6㎡ 8,900,000 / 9.9㎡ 10,650,000
 *
 * 707 용인평온의숲(평온마루 봉안당) (공홈 tranquil-forest.or.kr, 가격 아카이브)
 *   사용료(관내) 개인단 300,000 / 관리비(관내) 150,000
 *   사용료(관외) 개인단 1,000,000 / 관리비(관외) 300,000
 *   사용료(관내) 부부단 500,000
 *
 * 708 논산시양지추모원 (아카이브)
 *   일반사용자 10년1회남부(논산시 거주자) 200,000
 *   국민기초생활보장수급자 50,000
 *   국가유공자(배우자포함) 50,000
 *   장기기증자 50,000
 *
 * 709 울진군립추모원(봉안시설) (아카이브)
 *   개인단(관내자) 1기,최초30년,1회연장가능 600,000
 *   개인단(관외자) 1,600,000
 *   부부단(관내자) 2기 1,000,000
 *   부부단(관외자) 2,600,000
 *
 * 710 봉원사 (공홈 bongwonsa.or.kr, 가격 아카이브)
 *   개인단 1-6단 5,000,000 / 7,8단 4,000,000 (30년,연장2회)
 *   합장단 1-6단 10,000,000 / 7,8단 8,000,000
 *
 * 711 함양군구룡공설공원묘지 봉안탑 (아카이브)
 *   사용료(관내) 50,000 / 관리비(관내) 75,000 (15년)
 *   사용료(관외) 100,000 / 관리비(관외) 75,000
 *
 * 712 광천사 봉안당 (아카이브)
 *   관리비(년2만원) 개인단 3,000,000 / 3,500,000 / 3,000,000
 *   부부단 6,000,000
 *
 * 713 보현사 납골공원 (아카이브)
 *   합동2기 2,000,000 (가족/부부)
 *   가족남골탑 12~16기(탑형) 15,000,000
 *   가족남골탑 12~16기(부도형) 18,000,000
 *   가족남골탑 32기(아치형) 28,000,000
 *
 * 714 용광사 (아카이브)
 *   개인단(사용료) 사용료 30만원~100만원: 300,000
 *   부부단(사용료) 사용료 1구당 300만원: 3,000,000
 *   개인단(관리비) 25,000/년간
 *   부부단(관리비) 25,000/년간
 *
 * 715 만월사 (아카이브)
 *   사용료 개인(평생) 5,000,000
 *   관리비 직접관리(별초) 0
 *   관리비 개인/년간 50,000
 *   관리비 부부 1년 80,000
 *
 * 716 김포시추모공원(봉안담) (공홈 gimpo.go.kr, 유저 제공 가격)
 *   봉안담 개인단 관내 350,000 / 관외 700,000
 *   봉안담 부부단 관내 600,000 / 관외 1,200,000
 *   자연장지 개인단 관내 800,000 / 관외 1,600,000
 *   자연장지 부부단 관내 1,500,000 / 관외 3,000,000
 *
 * 717 구미시공설숭조당 제1관 (아카이브)
 *   일반실(구미시민) 기본15년 200,000
 *   일반실(타지역) 700,000
 *   무연고실(구미시민) 5년 60,000
 *   무연고실(타지역) 150,000
 *
 * 718 청운사 봉안당 (아카이브)
 *   영구 22: 200
 *   15년 22: 100
 *   영구 22: 300
 *   영구 22: 400
 *   (데이터 불명확 - 원본 값 그대로)
 *
 * 719 하늘공원(부곡동공설공원묘지) (아카이브)
 *   묘지사용료 1기당(6.6㎡이하) 253,000
 *   묘지관리비 1기당(6.6㎡이하) 403,000
 *
 * 720 가톨릭군위묘원 봉안담 (공홈 gunwipark.com, 가격 아카이브)
 *   사용료(구 안치단) 사용기간30년(비신자20만원추가) 800,000
 *   사용료(신 안치단) 사용기간30년 1,800,000
 *   관리비(신/구 동일) 30년분 500,000
 *   각지(화구),세라믹영정 200,000
 *
 * 721 목포추모공원 추모의집 (공홈 mokpopark.com, 가격 아카이브)
 *   기존 안치자 연장(목포시거주자) 15년(1회 연장) 100,000
 *   기존 안치자 연장(관외) 150,000
 *   무연고자(목포시거주자) 10년,연장1회가능 70,000
 *   무연고자(관외) 105,000
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

    // ===== 705 삼척시 추모공원 (공홈 + 유저 제공 이미지) =====
    // 최초계약30년 1회연장30년 총60년사용가능
    // 기초수급자, 국가유공자 30년 면제(석물비는 현금 납부)
    const p705 = data.find(x => x.id === 'park-0705');
    if (p705) {
        p705.websiteUrl = 'https://www.samcheok.go.kr/memorial';
        p705.priceInfo.standardizedPrices = [
            // 일반묘지 - 화강암 2평·3평
            {
                serviceType: 'BURIAL', subType: '일반묘지', groupType: '화강암 2평·3평', unit: '원', rows: [
                    { name: '단장 매장1기+예약1기 (총금액)', price: 3414000, feeType: 'USAGE', grade: '최초30년 1회연장 총60년', isRepresentative: true },
                    { name: '사용료 (매장1기)', price: 572000, feeType: 'USAGE' },
                    { name: '관리비 (매장1기)', price: 480000, feeType: 'MAINTENANCE' },
                    { name: '매장비', price: 370000, feeType: 'USAGE' },
                    { name: '석물비', price: 940000, feeType: 'USAGE' },
                    { name: '사용료 (예약1기)', price: 572000, feeType: 'USAGE' },
                    { name: '관리비 (예약1기)', price: 480000, feeType: 'MAINTENANCE' },
                    { name: '단장1기 (총금액)', price: 2362000, feeType: 'USAGE' },
                    { name: '3평형합장 (총금액)', price: 2911000, feeType: 'USAGE' },
                    { name: '사용료 (3평합장)', price: 839000, feeType: 'USAGE' },
                    { name: '관리비 (3평합장)', price: 720000, feeType: 'MAINTENANCE' },
                    { name: '매장비 (3평합장)', price: 370000, feeType: 'USAGE' },
                    { name: '석물비 (3평합장)', price: 982000, feeType: 'USAGE' },
                ]
            },
            // 일반묘지 - 오석 2평·3평
            {
                serviceType: 'BURIAL', subType: '일반묘지', groupType: '오석 2평·3평', unit: '원', rows: [
                    { name: '단장 매장1기+예약1기 (총금액)', price: 3592000, feeType: 'USAGE', grade: '최초30년 1회연장 총60년' },
                    { name: '사용료 (매장1기)', price: 572000, feeType: 'USAGE' },
                    { name: '관리비 (매장1기)', price: 480000, feeType: 'MAINTENANCE' },
                    { name: '매장비', price: 370000, feeType: 'USAGE' },
                    { name: '석물비', price: 1118000, feeType: 'USAGE' },
                    { name: '사용료 (예약1기)', price: 572000, feeType: 'USAGE' },
                    { name: '관리비 (예약1기)', price: 480000, feeType: 'MAINTENANCE' },
                    { name: '단장1기 (총금액)', price: 2540000, feeType: 'USAGE' },
                    { name: '2평형합장 (개장유골·화장유골)', price: 50000, feeType: 'USAGE', grade: '매장비 50,000 + 비석글씨값 별도' },
                    { name: '3평형합장 (총금액)', price: 3089000, feeType: 'USAGE' },
                    { name: '사용료 (3평합장)', price: 839000, feeType: 'USAGE' },
                    { name: '관리비 (3평합장)', price: 720000, feeType: 'MAINTENANCE' },
                    { name: '매장비 (3평합장)', price: 370000, feeType: 'USAGE' },
                    { name: '석물비 (3평합장)', price: 1160000, feeType: 'USAGE' },
                ]
            },
            // 자연장
            {
                serviceType: 'NATURAL', subType: '자연장', groupType: '사용료', unit: '원', rows: [
                    { name: '단장 (총금액)', price: 817000, feeType: 'USAGE', grade: '최초30년 1회연장 총60년', isRepresentative: true },
                    { name: '사용료 (단장)', price: 260000, feeType: 'USAGE' },
                    { name: '관리비 (단장)', price: 100000, feeType: 'MAINTENANCE' },
                    { name: '매장비 (단장)', price: 50000, feeType: 'USAGE' },
                    { name: '석물비 (단장)', price: 407000, feeType: 'USAGE' },
                    { name: '안장1기+예약1기 (총금액)', price: 1177000, feeType: 'USAGE' },
                    { name: '사용료 (안장+예약)', price: 520000, feeType: 'USAGE' },
                    { name: '관리비 (안장+예약)', price: 200000, feeType: 'MAINTENANCE' },
                    { name: '매장비 (안장+예약)', price: 50000, feeType: 'USAGE' },
                    { name: '석물비 (안장+예약)', price: 407000, feeType: 'USAGE' },
                    { name: '합장1기 (총금액)', price: 967000, feeType: 'USAGE' },
                    { name: '사용료 (합장1기)', price: 340000, feeType: 'USAGE' },
                    { name: '관리비 (합장1기)', price: 120000, feeType: 'MAINTENANCE' },
                    { name: '매장비 (합장1기)', price: 50000, feeType: 'USAGE' },
                    { name: '석물비 (합장1기)', price: 457000, feeType: 'USAGE' },
                    { name: '합장2기 (총금액)', price: 1017000, feeType: 'USAGE' },
                    { name: '사용료 (합장2기)', price: 340000, feeType: 'USAGE' },
                    { name: '관리비 (합장2기)', price: 120000, feeType: 'MAINTENANCE' },
                    { name: '매장비 (합장2기)', price: 100000, feeType: 'USAGE' },
                    { name: '석물비 (합장2기)', price: 457000, feeType: 'USAGE' },
                ]
            },
            // 봉안당
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '개인단 (총금액)', price: 336000, feeType: 'USAGE', isRepresentative: true, grade: '최초30년 1회연장 총60년' },
                    { name: '사용료 (개인단)', price: 236000, feeType: 'USAGE' },
                    { name: '관리비 (개인단)', price: 100000, feeType: 'MAINTENANCE' },
                    { name: '부부단 (총금액)', price: 592000, feeType: 'USAGE' },
                    { name: '사용료 (부부단)', price: 472000, feeType: 'USAGE' },
                    { name: '관리비 (부부단)', price: 120000, feeType: 'MAINTENANCE' },
                    { name: '무연고 (총금액)', price: 168000, feeType: 'USAGE', grade: '10년계약, ※행려사망자 5년 계약' },
                    { name: '사용료 (무연고)', price: 118000, feeType: 'USAGE' },
                    { name: '관리비 (무연고)', price: 50000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        // ※2평배우자 예약시 추가금액: 1,052,000원
        // 기초수급자, 국가유공자 30년 면제(석물비는 현금 납부)
        updates.push({ id: 'park-0705', p: p705, ws: true });
        console.log('✅', p705.id, p705.name);
    }

    // ===== 706 삼성개발공원묘원(봉안) =====
    const p706 = data.find(x => x.id === 'park-0706');
    if (p706) {
        p706.websiteUrl = 'http://www.elysium.co.kr/kor/main/';
        p706.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '봉안묘', groupType: '토지 분양', unit: '원', rows: [
                    { name: '토지사용료 (㎡당)', price: 697000, feeType: 'USAGE', isRepresentative: true },
                    { name: '관리비 (㎡당)', price: 9091, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '봉안묘', groupType: '봉안묘 시설', unit: '원', rows: [
                    { name: '5㎡ (2위 봉안묘)', price: 6125000, feeType: 'USAGE' },
                    { name: '6.6㎡ (4위 봉안묘)', price: 8900000, feeType: 'USAGE' },
                    { name: '9.9㎡ (8위 봉안묘)', price: 10650000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0706', p: p706, ws: true });
        console.log('✅', p706.id, p706.name);
    }

    // ===== 707 용인평온의숲(평온마루 봉안당) =====
    const p707 = data.find(x => x.id === 'park-0707');
    if (p707) {
        p707.websiteUrl = 'https://www.tranquil-forest.or.kr/main_new/';
        p707.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 300000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true },
                    { name: '관리비 (개인단)', price: 150000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '관리비 (개인단)', price: 300000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 500000, feeType: 'USAGE', residency: 'LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0707', p: p707, ws: true });
        console.log('✅', p707.id, p707.name);
    }

    // ===== 708 논산시양지추모원 =====
    const p708 = data.find(x => x.id === 'park-0708');
    if (p708) {
        p708.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '일반사용자 사용요금', price: 200000, feeType: 'USAGE', isRepresentative: true, grade: '10년 1회 남부 (논산시 거주자)' },
                    { name: '국민기초생활보장수급자', price: 50000, feeType: 'USAGE', grade: '10년 1회 남부 (논산시 거주자)' },
                    { name: '국가유공자 (배우자포함)', price: 50000, feeType: 'USAGE', grade: '10년 1회 남부 (논산시 거주자)' },
                    { name: '장기기증자 사용요금', price: 50000, feeType: 'USAGE', grade: '10년 1회 남부 (논산시 거주자)' },
                ]
            },
        ];
        updates.push({ id: 'park-0708', p: p708 });
        console.log('✅', p708.id, p708.name);
    }

    // ===== 709 울진군립추모원(봉안시설) =====
    const p709 = data.find(x => x.id === 'park-0709');
    if (p709) {
        p709.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '개인단', price: 600000, feeType: 'USAGE', residency: 'LOCAL', grade: '1기, 최초 30년, 1회 연장 가능', isRepresentative: true },
                    { name: '개인단', price: 1600000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '1기, 최초 30년, 1회 연장 가능' },
                    { name: '부부단', price: 1000000, feeType: 'USAGE', residency: 'LOCAL', grade: '2기, 최초 30년, 1회 연장 가능' },
                    { name: '부부단', price: 2600000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '2기, 최초 30년, 1회 연장 가능' },
                ]
            },
        ];
        updates.push({ id: 'park-0709', p: p709 });
        console.log('✅', p709.id, p709.name);
    }

    // ===== 710 봉원사 =====
    const p710 = data.find(x => x.id === 'park-0710');
    if (p710) {
        p710.websiteUrl = 'http://bongwonsa.or.kr/';
        p710.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원', rows: [
                    { name: '1단', price: 5000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '2단', price: 5000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '3단', price: 5000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '4단', price: 5000000, feeType: 'USAGE', grade: '30년, 연장 2회', isRepresentative: true },
                    { name: '5단', price: 5000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '6단', price: 5000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '7단', price: 4000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '8단', price: 4000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '합장단', unit: '원', rows: [
                    { name: '1단', price: 10000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '2단', price: 10000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '3단', price: 10000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '4단', price: 10000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '5단', price: 10000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '6단', price: 10000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '7단', price: 8000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                    { name: '8단', price: 8000000, feeType: 'USAGE', grade: '30년, 연장 2회' },
                ]
            },
        ];
        updates.push({ id: 'park-0710', p: p710, ws: true });
        console.log('✅', p710.id, p710.name);
    }

    // ===== 711 함양군구룡공설공원묘지 봉안탑 =====
    const p711 = data.find(x => x.id === 'park-0711');
    if (p711) {
        p711.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안탑', groupType: '사용료', unit: '원', rows: [
                    { name: '봉안탑 사용료', price: 50000, feeType: 'USAGE', residency: 'LOCAL', grade: '15년간', isRepresentative: true },
                    { name: '봉안탑 관리비', price: 75000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '15년간' },
                    { name: '봉안탑 사용료', price: 100000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '15년간' },
                    { name: '봉안탑 관리비', price: 75000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL', grade: '15년간' },
                ]
            },
        ];
        updates.push({ id: 'park-0711', p: p711 });
        console.log('✅', p711.id, p711.name);
    }

    // ===== 712 광천사 봉안당 =====
    const p712 = data.find(x => x.id === 'park-0712');
    if (p712) {
        p712.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '개인단', price: 3000000, feeType: 'USAGE', grade: '관리비(년2만원) 포함', isRepresentative: true },
                    { name: '개인단', price: 3500000, feeType: 'USAGE', grade: '관리비(년2만원) 포함' },
                    { name: '개인단', price: 3000000, feeType: 'USAGE', grade: '관리비(년2만원) 포함' },
                    { name: '부부단', price: 6000000, feeType: 'USAGE', grade: '관리비(년2만원) 포함' },
                ]
            },
        ];
        updates.push({ id: 'park-0712', p: p712 });
        console.log('✅', p712.id, p712.name);
    }

    // ===== 713 보현사 납골공원 =====
    const p713 = data.find(x => x.id === 'park-0713');
    if (p713) {
        p713.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '합동', unit: '원', rows: [
                    { name: '합동 2기', price: 2000000, feeType: 'USAGE', grade: '가족(부부)를 모실 수 있습니다', isRepresentative: true },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '가족납골탑', groupType: '사용료', unit: '원', rows: [
                    { name: '탑형 (12~16기)', price: 15000000, feeType: 'USAGE' },
                    { name: '부도형 (12~16기)', price: 18000000, feeType: 'USAGE' },
                    { name: '아치형 (32기)', price: 28000000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0713', p: p713 });
        console.log('✅', p713.id, p713.name);
    }

    // ===== 714 용광사 =====
    const p714 = data.find(x => x.id === 'park-0714');
    if (p714) {
        p714.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '개인단 (사용료)', price: 300000, feeType: 'USAGE', grade: '사용료 30만원~100만원', isRepresentative: true },
                    { name: '부부단 (사용료)', price: 3000000, feeType: 'USAGE', grade: '사용료 1구당 300만원' },
                    { name: '관리비 (개인단)', price: 25000, feeType: 'MAINTENANCE', grade: '년간' },
                    { name: '관리비 (부부단)', price: 25000, feeType: 'MAINTENANCE', grade: '년간' },
                ]
            },
        ];
        updates.push({ id: 'park-0714', p: p714 });
        console.log('✅', p714.id, p714.name);
    }

    // ===== 715 만월사 =====
    const p715 = data.find(x => x.id === 'park-0715');
    if (p715) {
        p715.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인, 평생)', price: 5000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '관리비 (직접관리/별초)', price: 0, feeType: 'MAINTENANCE', grade: '별도 비용 없음' },
                    { name: '관리비 (개인, 년간)', price: 50000, feeType: 'MAINTENANCE' },
                    { name: '관리비 (부부, 1년)', price: 80000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0715', p: p715 });
        console.log('✅', p715.id, p715.name);
    }

    // ===== 716 김포시추모공원(봉안담) =====
    const p716 = data.find(x => x.id === 'park-0716');
    if (p716) {
        p716.websiteUrl = 'https://www.gimpo.go.kr/portal/contents.do?key=1379';
        p716.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '사용료', unit: '원', rows: [
                    { name: '개인단', price: 350000, feeType: 'USAGE', residency: 'LOCAL', grade: '사용기간 15년, 15년씩 2회 연장 가능 (최장 45년)', isRepresentative: true },
                    { name: '개인단', price: 700000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '사용기간 15년, 15년씩 2회 연장 가능 (최장 45년)' },
                    { name: '부부단', price: 600000, feeType: 'USAGE', residency: 'LOCAL', grade: '사용기간 15년, 15년씩 2회 연장 가능 (최장 45년)' },
                    { name: '부부단', price: 1200000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '사용기간 15년, 15년씩 2회 연장 가능 (최장 45년)' },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '자연장지', groupType: '사용료', unit: '원', rows: [
                    { name: '개인단', price: 800000, feeType: 'USAGE', residency: 'LOCAL', grade: '사용기간 30년, 기간 연장 없음', isRepresentative: true },
                    { name: '개인단', price: 1600000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '사용기간 30년, 기간 연장 없음' },
                    { name: '부부단', price: 1500000, feeType: 'USAGE', residency: 'LOCAL', grade: '사용기간 30년, 기간 연장 없음' },
                    { name: '부부단', price: 3000000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '사용기간 30년, 기간 연장 없음' },
                ]
            },
        ];
        updates.push({ id: 'park-0716', p: p716, ws: true });
        console.log('✅', p716.id, p716.name);
    }

    // ===== 717 구미시공설숭조당 제1관 =====
    const p717 = data.find(x => x.id === 'park-0717');
    if (p717) {
        p717.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '일반실', unit: '원', rows: [
                    { name: '일반실', price: 200000, feeType: 'USAGE', residency: 'LOCAL', grade: '기본 15년 (1회 15년씩 2회까지 연장 가능)', isRepresentative: true },
                    { name: '일반실', price: 700000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '기본 15년 (경북도내 거주자 및 등록기준지를 구미시로 하는 자)' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '무연고실', unit: '원', rows: [
                    { name: '무연고실', price: 60000, feeType: 'USAGE', residency: 'LOCAL', grade: '5년 (사망자의 최초 발견 장소가 구미시 지역인 경우)' },
                    { name: '무연고실', price: 150000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '5년 (사망자의 최초 발견 장소가 구미시 이외의 경북지역인 경우)' },
                ]
            },
        ];
        updates.push({ id: 'park-0717', p: p717 });
        console.log('✅', p717.id, p717.name);
    }

    // ===== 718 청운사 봉안당 =====
    const p718 = data.find(x => x.id === 'park-0718');
    if (p718) {
        // 아카이브 데이터가 불명확(영구/15년 항목, 단위 "22", 가격 200/100/300/400)
        // 원본 데이터 그대로 엔트리 생성
        p718.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '영구 (22)', price: 2000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '15년 (22)', price: 1000000, feeType: 'USAGE' },
                    { name: '영구 (22)', price: 3000000, feeType: 'USAGE' },
                    { name: '영구 (22)', price: 4000000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0718', p: p718 });
        console.log('✅', p718.id, p718.name);
    }

    // ===== 719 하늘공원(부곡동공설공원묘지) =====
    const p719 = data.find(x => x.id === 'park-0719');
    if (p719) {
        p719.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '묘지', groupType: '사용료', unit: '원', rows: [
                    { name: '묘지사용료', price: 253000, feeType: 'USAGE', grade: '1기당 (6.6㎡ 이하)', isRepresentative: true },
                    { name: '묘지관리비', price: 403000, feeType: 'MAINTENANCE', grade: '1기당 (6.6㎡ 이하)' },
                ]
            },
        ];
        updates.push({ id: 'park-0719', p: p719 });
        console.log('✅', p719.id, p719.name);
    }

    // ===== 720 가톨릭군위묘원 봉안담 =====
    const p720 = data.find(x => x.id === 'park-0720');
    if (p720) {
        p720.websiteUrl = 'https://www.gunwipark.com/';
        p720.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (구 안치단)', price: 800000, feeType: 'USAGE', grade: '사용기간 30년 (비신자 20만원 추가)', isRepresentative: true },
                    { name: '사용료 (신 안치단)', price: 1800000, feeType: 'USAGE', grade: '사용기간 30년' },
                    { name: '관리비 (신·구 동일)', price: 500000, feeType: 'MAINTENANCE', grade: '30년분' },
                    { name: '각지(화구)·세라믹 영정', price: 200000, feeType: 'USAGE', grade: '각지비·세라믹 영정 제작비 합계' },
                ]
            },
        ];
        updates.push({ id: 'park-0720', p: p720, ws: true });
        console.log('✅', p720.id, p720.name);
    }

    // ===== 721 목포추모공원 추모의집 =====
    const p721 = data.find(x => x.id === 'park-0721');
    if (p721) {
        p721.websiteUrl = 'http://www.mokpopark.com/';
        p721.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '기존 안치자 연장', unit: '원', rows: [
                    { name: '기존 안치자 연장', price: 100000, feeType: 'USAGE', residency: 'LOCAL', grade: '안치기간: 15년 (1회 연장)', isRepresentative: true },
                    { name: '기존 안치자 연장', price: 150000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '안치기간: 15년 (1회 연장)' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '무연고자', unit: '원', rows: [
                    { name: '무연고자', price: 70000, feeType: 'USAGE', residency: 'LOCAL', grade: '안치기간: 10년, 연장 1회 가능' },
                    { name: '무연고자', price: 105000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '안치기간: 10년, 연장 1회 가능' },
                ]
            },
        ];
        updates.push({ id: 'park-0721', p: p721, ws: true });
        console.log('✅', p721.id, p721.name);
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

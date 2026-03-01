/**
 * park-0625 학천사추모관 → websiteUrl 추가
 * park-0626 양지공원 제1추모의집 → 가격 정리 (공설, 제주)
 * park-0627 양지공원 제2추모의집 → 가격 정리 (공설, 제주)
 * park-0628 봉안당 홈 → 아카이브 가격 반영 + 공홈 URL
 * park-0629 (재)안동추모공원(봉안당) → 아카이브 + 공홈(봉안묘) 가격
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const ids = [];

    function update(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        ids.push(id);
        console.log('✅', id, p.name);
    }

    // ========== park-0625 학천사추모관 → websiteUrl만 추가 ==========
    update('park-0625', p => {
        p.websiteUrl = 'http://www.hakchunsa.kr';
    });

    // ========== park-0626 양지공원 제1추모의집 ==========
    // 공설, 제주 / 아카이브: 관내 10만, 관외 20만 (15년), 감면 대상 다수
    update('park-0626', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '최초 15년 (관내)', price: 100000, feeType: 'USAGE', isRepresentative: true, grade: '관내요금' },
                    { name: '최초 15년 (관외)', price: 200000, feeType: 'USAGE', grade: '관외요금' },
                ]
            },
        ];
    });

    // ========== park-0627 양지공원 제2추모의집 ==========
    // 공설, 제주 / 아카이브: 626과 동일 가격
    update('park-0627', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '최초 15년 (관내)', price: 100000, feeType: 'USAGE', isRepresentative: true, grade: '관내요금' },
                    { name: '최초 15년 (관외)', price: 200000, feeType: 'USAGE', grade: '관외요금' },
                ]
            },
        ];
    });

    // ========== park-0628 봉안당 홈 ==========
    // 출처: 아카이브 이미지 (e하늘 가격정보)
    // 공홈: http://www.home12.co.kr
    update('park-0628', p => {
        p.websiteUrl = 'http://www.home12.co.kr';
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '광장층 (지하2층)', price: 17000000, feeType: 'USAGE', isRepresentative: true, grade: '영구 사용' },
                    { name: '로비층 (지하1층)', price: 22000000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '타워 로비층 (지하1층)', price: 27000000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '타워 1층', price: 27000000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '타워 2층', price: 32000000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '타워 3층', price: 37000000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '관리비', price: 200000, feeType: 'MAINTENANCE', grade: '1년 기준, 5년 선납' },
                ]
            },
        ];
    });

    // ========== park-0629 (재)안동추모공원(봉안당) ==========
    // 출처: 아카이브 이미지 (봉안당) + 공홈 andongpark.net (봉안묘)
    update('park-0629', p => {
        p.websiteUrl = 'http://www.andongpark.net';
        p.priceInfo.standardizedPrices = [
            // 봉안당 (실내/실외)
            {
                serviceType: 'BONGSAN', subType: '실내납골당', unit: '원',
                rows: [
                    { name: '실내납골당 1', price: 1500000, feeType: 'USAGE', isRepresentative: true, grade: '관리비,사용비,봉안비 포함' },
                    { name: '실내납골당 2', price: 1800000, feeType: 'USAGE', grade: '관리비,사용비,봉안비 포함' },
                    { name: '실내납골당 3', price: 2100000, feeType: 'USAGE', grade: '관리비,사용비,봉안비 포함' },
                    { name: '실내납골당 4', price: 2400000, feeType: 'USAGE', grade: '관리비,사용비,봉안비 포함' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '실외납골당', unit: '원',
                rows: [
                    { name: '실외납골당', price: 2200000, feeType: 'USAGE', grade: '관리비,사용비,봉안비 포함' },
                ]
            },
            // 봉안묘 (공홈 출처)
            {
                serviceType: 'BURIAL', subType: '봉안묘', unit: '원',
                rows: [
                    { name: '개인봉안묘', price: 8600000, feeType: 'USAGE', grade: '영구사용, *각자비용 별도' },
                    { name: '가족봉안묘 A형', price: 19370000, feeType: 'USAGE', grade: '최대4기, 묘지 2평 기준' },
                    { name: '가족봉안묘 B형', price: 24620000, feeType: 'USAGE', grade: '최대8기, 묘지 2평 기준' },
                    { name: '문중봉안묘', price: 71330000, feeType: 'USAGE', grade: '60기용(최대75기), 묘지 8평 기준' },
                ]
            },
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const updateData = { pricing: JSON.stringify(f.priceInfo) };
        if (f.websiteUrl) updateData.websiteUrl = f.websiteUrl;
        const { error } = await supabase.from('Facility').update(updateData).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('☁️', id, f.name, 'Supabase 동기화 완료');
    }
}

fix();

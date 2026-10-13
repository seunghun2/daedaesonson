import fs from 'fs';
import path from 'path';

const DIR = 'data/enrichment/20261003_1750';
const master = JSON.parse(fs.readFileSync(path.join(DIR, 'master.json'), 'utf8'));
const candFile = path.join(DIR, 'candidates', 'official_sites.jsonl');
const cands = fs.readFileSync(candFile, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
const candMap = new Map(cands.map(c => [c.facility.id, c]));
const masterMap = new Map(master.facilities.map(f => [f.id, f]));

const targetIds = ['park-0565', 'park-1178', 'park-0765'];

for (const id of targetIds) {
  const f = masterMap.get(id);
  const c = candMap.get(id);
  console.log('======================================================================');
  console.log('🏛️ 시설 연구 대상: [' + f.id + '] ' + f.name);
  console.log('📍 위치: ' + f.address);
  console.log('🏷️ 종별: ' + f.category + ' | 전화번호: ' + (f.phone || '없음'));
  console.log('🌐 홈페이지: ' + f.websiteUrl);
  console.log('----------------------------------------------------------------------');
  console.log('📦 원본 DB 기존 가격 상태:');
  const pt = f.pricing?.priceTable || {};
  const cats = Object.keys(pt);
  if (cats.length === 0) {
    console.log('   (기존 가격표 없음 / 문의 상태)');
  } else {
    for (const cat of cats) {
      console.log('   [' + cat + ']: ' + (pt[cat]?.rows?.length || 0) + '개 항목');
    }
  }
  console.log('📸 원본 DB 기존 사진 수: ' + (f.images?.length || 0) + '장');
  console.log('----------------------------------------------------------------------');
  console.log('💡 발굴된 신규 가격 검증:');
  if (c.prices.length === 0) {
    console.log('   (신규 가격 없음)');
  } else {
    c.prices.forEach((p, i) => {
      console.log('   [' + (i + 1) + '] 카테고리: ' + p.category);
      console.log('       항목명: ' + p.item_name);
      console.log('       등급/규격: ' + (p.grade || '개인') + ' | 단위: ' + (p.unit || '1기'));
      console.log('       금액: ' + p.price);
      console.log('       원문 근거: ' + p.evidence);
    });
  }
  console.log('📸 발굴된 신규 실사 사진:');
  if (c.images.length === 0) {
    console.log('   (신규 사진 없음)');
  } else {
    c.images.forEach((im, i) => {
      console.log('   [' + (i + 1) + '] 라벨: [' + im.label + '] ' + (im.caption || '') + ' (' + im.width + 'x' + im.height + ')');
      console.log('       파일: ' + im.local_path);
    });
  }
  console.log('======================================================================\n');
}

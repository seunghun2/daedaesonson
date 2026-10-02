const fs = require('fs');
const path = require('path');

const facilitiesPath = path.join(__dirname, '../data/facilities.json');
const outputPath1 = path.join(__dirname, '../data/facility_pricing_audit_sheet.csv');
const outputPath2 = path.join(__dirname, '../public/data/facility_pricing_audit_sheet.csv');

console.log('Loading facilities from:', facilitiesPath);
const rawData = fs.readFileSync(facilitiesPath, 'utf8');
const facilities = JSON.parse(rawData);

console.log(`Total facilities loaded: ${facilities.length}`);

// Category mapper
const categoryMap = {
  CHARNEL_HOUSE: '봉안당',
  FAMILY_GRAVE: '공원묘지',
  NATURAL_BURIAL: '수목장/자연장',
  CREMATORIUM: '화장시설',
  PARK: '추모공원'
};

// Metropolitan check
const metroPrefixes = ['서울', '서울특별시', '경기', '경기도', '인천', '인천광역시'];

const rows = facilities.map((f) => {
  // Address parsing
  const addr = (f.address || '').trim();
  const tokens = addr.split(/\s+/);
  const sido = tokens[0] || '';
  let sigungu = tokens[1] || '';
  if (tokens[2] && (tokens[2].endsWith('구') || tokens[2].endsWith('군'))) {
    sigungu += ' ' + tokens[2];
  }

  const isMetro = metroPrefixes.some((p) => sido.startsWith(p));
  const hasWebsite = Boolean(
    f.websiteUrl &&
      f.websiteUrl.trim().length > 6 &&
      !f.websiteUrl.includes('example.com')
  );

  const minPrice = f.minPrice || (f.priceRange ? f.priceRange.min : 0) || 0;
  const maxPrice = f.maxPrice || (f.priceRange ? f.priceRange.max : 0) || 0;
  const hasPrice = minPrice > 0 || maxPrice > 0;
  const viewCount = f.viewCount || 0;

  // Count standardized price items
  let stdCount = 0;
  if (f.priceInfo && Array.isArray(f.priceInfo.standardizedPrices)) {
    f.priceInfo.standardizedPrices.forEach((group) => {
      if (Array.isArray(group.rows)) {
        stdCount += group.rows.length;
      }
    });
  }

  // Current data status
  let dataStatus = '가격미등록';
  if (stdCount >= 3) {
    dataStatus = `세부등록(${stdCount}개)`;
  } else if (hasPrice) {
    dataStatus = '단순범위';
  }

  // Priority Tier
  let tier = 'C';
  let tierLabel = 'C등급 (일반/유선확인)';
  let tierWeight = 4;

  if (hasWebsite && hasPrice && (isMetro || viewCount >= 30)) {
    tier = 'S';
    tierLabel = 'S등급 (초고우선-수도권/고조회+홈피+가격보유)';
    tierWeight = 1;
  } else if (hasWebsite && hasPrice) {
    tier = 'A';
    tierLabel = 'A등급 (고우선-지방+홈피+가격보유 검증)';
    tierWeight = 2;
  } else if (hasWebsite && !hasPrice) {
    tier = 'B';
    tierLabel = 'B등급 (발굴대상-홈피있음+가격미등록)';
    tierWeight = 3;
  }

  const operatorLabel = f.isPublic || f.operatorType === 'PUBLIC' ? '공설' : '사설';
  const categoryLabel = categoryMap[f.category] || f.category || '기타';

  return {
    tier,
    tierLabel,
    tierWeight,
    id: f.id || '',
    name: f.name || '',
    category: categoryLabel,
    operator: operatorLabel,
    sido,
    sigungu,
    address: addr,
    phone: f.phone || '',
    websiteUrl: f.websiteUrl || '',
    viewCount,
    minPrice,
    maxPrice,
    stdCount,
    dataStatus,
    // Work checklist columns for the human operator
    auditStatus: '미검토', // 미검토 | 진행중 | 완료 | 가격비공개(유선) | 홈페이지오류 | 해당없음
    pricePageUrl: '', // 세부 가격표 직링크
    changeType: '', // 변동없음 | 인상 | 인하 | 신규발굴 | 확인불가
    auditNote: '', // 특이사항 (예: 2026년 기준 8단 1,200만원, 관리비 연 5만원 별도 등)
    auditDate: '', // 검토일자
    auditor: '' // 작업자명
  };
});

// Sort by:
// 1. Tier weight (1 -> 2 -> 3 -> 4)
// 2. ViewCount descending
// 3. MaxPrice descending
rows.sort((a, b) => {
  if (a.tierWeight !== b.tierWeight) {
    return a.tierWeight - b.tierWeight;
  }
  if (b.viewCount !== a.viewCount) {
    return b.viewCount - a.viewCount;
  }
  return b.maxPrice - a.maxPrice;
});

// CSV Headers
const headers = [
  '우선순위등급',
  '우선순위설명',
  '시설ID',
  '시설명',
  '시설유형',
  '운영주체',
  '시도',
  '시군구',
  '상세주소',
  '대표전화',
  '공식홈페이지',
  '조회수',
  '대대손손_최저가(원)',
  '대대손손_최고가(원)',
  '세부가격항목수',
  '현재데이터상태',
  '리터치검토상태',
  '실제홈페이지_가격안내URL',
  '가격변동여부',
  '작업자메모_및_특이사항',
  '검토일자',
  '작업자'
];

function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

const csvLines = [headers.map(escapeCSV).join(',')];

for (const r of rows) {
  const line = [
    escapeCSV(r.tier),
    escapeCSV(r.tierLabel),
    escapeCSV(r.id),
    escapeCSV(r.name),
    escapeCSV(r.category),
    escapeCSV(r.operator),
    escapeCSV(r.sido),
    escapeCSV(r.sigungu),
    escapeCSV(r.address),
    escapeCSV(r.phone),
    escapeCSV(r.websiteUrl),
    escapeCSV(r.viewCount),
    escapeCSV(r.minPrice),
    escapeCSV(r.maxPrice),
    escapeCSV(r.stdCount),
    escapeCSV(r.dataStatus),
    escapeCSV(r.auditStatus),
    escapeCSV(r.pricePageUrl),
    escapeCSV(r.changeType),
    escapeCSV(r.auditNote),
    escapeCSV(r.auditDate),
    escapeCSV(r.auditor)
  ].join(',');
  csvLines.push(line);
}

// Write with UTF-8 BOM (\uFEFF) for 100% Excel / Google Sheets Korean compatibility
const csvContent = '\uFEFF' + csvLines.join('\r\n');

fs.writeFileSync(outputPath1, csvContent, 'utf8');
fs.writeFileSync(outputPath2, csvContent, 'utf8');

console.log('Successfully written to:');
console.log('1. ', outputPath1);
console.log('2. ', outputPath2);

// Summary statistics
const tierCounts = { S: 0, A: 0, B: 0, C: 0 };
rows.forEach((r) => tierCounts[r.tier]++);
console.log('\n--- Priority Tier Summary ---');
console.log(`[S등급 - 초고우선 (수도권/고조회 + 홈피 + 가격)] : ${tierCounts.S}개`);
console.log(`[A등급 - 고우선 (지방 + 홈피 + 가격 검증)]       : ${tierCounts.A}개`);
console.log(`[B등급 - 신규발굴 (홈피있음 + 가격미등록)]       : ${tierCounts.B}개`);
console.log(`[C등급 - 후순위 (홈페이지 없음/유선확인)]         : ${tierCounts.C}개`);
console.log(`총계                                          : ${rows.length}개`);

const xlsx = require('xlsx');

// 필터링 키워드 정의 (제외할 것들)
const EXCLUDE_KEYWORDS = [
    // 장례용품
    '유골함', '수의', '관', '횡대', '결관', '명정', '위패',

    // 서비스/의식
    '천막', '식사', '안치단', '제례', '개토제', '산신제', '위령제',
    '반혼제', '평토제', '성분제', '의전', '상조', '리무진', '버스',
    '엠뷸런스', '운구', '접객', '도우미', '헌화', '꽃', '조화', '화분', '식재',
    '벌초', '성묘', '대행', '제사', '차례', '예초', '전지',

    // 비석/석물 관련 (단순 부속품일 경우. 매장묘 자체는 포함)
    // '각자', '화병', '향로', '독서대', '사진', '메탈포토', 

    // 웹사이트 문구 / 기타
    '만족도', '배너', '개인정보', '보건복지부', '장례문화진흥원', 'Copyright',
    '로그인', '회원가입', '원격지원', '화장예약', '선택한 상품', '궁금한게',
    '하늘e', '눌러주세요', '닫기', '열기', '지도', '길찾기', '공유', '소개',
    '품명', '규격', '재질', '원산지', '생산지'
];

// 포함해야 할 핵심 키워드 (이게 포함되면 가중치 부여 - 애매할 때 살리기 위해)
const INCLUDE_KEYWORDS = [
    '매장', '봉안', '수목장', '자연장', '평장', '잔디장', '화초장',
    '묘지', '봉분', '합장', '단장', '쌍분', '가족묘', '부부묘', '개인묘',
    '사용료', '관리비', '석물' // 석물은 묘지 구성요소이므로 포함
];


try {
    const filename = 'park_price_master.xlsx';
    console.log(`Reading ${filename}...`);
    const wb = xlsx.readFile(filename);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws);

    // 낙원추모공원 필터링 테스트
    const targetName = '(재)낙원추모공원';
    const rawItems = rows.filter(row => row.FacilityName === targetName);

    const validItems = [];
    const rejectedItems = [];

    rawItems.forEach(item => {
        const text = (item.ExtractedName + ' ' + (item.RawLine || '')).toLowerCase();

        // 제외 키워드 검사
        const isExcluded = EXCLUDE_KEYWORDS.some(keyword => text.includes(keyword));

        // 포함 키워드 검사 (제외 키워드에 걸려도 포함 키워드가 강력하면 고민해봐야 함, 지금은 일단 제외가 우선)
        // 예를 들어 '매장묘 벌초 대행' -> 제외되어야 함.

        if (isExcluded) {
            rejectedItems.push(item.ExtractedName);
        } else {
            validItems.push(item);
        }
    });

    console.log(`\n=== 🧹 필터링 결과: (재)낙원추모공원 ===`);
    console.log(`전체 항목: ${rawItems.length}개`);
    console.log(`남은 항목: ${validItems.length}개`);
    console.log(`삭제된 항목: ${rejectedItems.length}개`);

    console.log('\n✅ [유효한 항목 (살아남은 것들)]');
    validItems.forEach((item, i) => console.log(`${i + 1}. ${item.ExtractedName} : ${item.ExtractedPrice}`));

    console.log('\n❌ [삭제된 항목 (제외된 것들)]');
    rejectedItems.forEach((name, i) => console.log(`${i + 1}. ${name}`));

} catch (e) {
    console.error(e);
}

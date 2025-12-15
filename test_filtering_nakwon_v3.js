const xlsx = require('xlsx');

// 1. 제외 키워드 (최종 정교화)
const EXCLUDE_KEYWORDS = [
    // 장례용품 / 소모품
    '유골함', '수의', '관', '횡대', '결관', '명정', '위패', '성경책',
    '화병', '향로', '독서대', '사진', '메탈포토', '액자', '꽃', '조화', '화분', '식재', '나무', '철쭉',
    '잔디', // 잔디 추가

    // 서비스 / 의식 / 식사
    '천막', '식사', '식당', '밥', // 식당/밥 추가
    '안치단', '제례', '개토제', '산신제', '위령제',
    '반혼제', '평토제', '성분제', '의전', '상조', '리무진', '버스',
    '엠뷸런스', '운구', '접객', '도우미', '벌초', '성묘', '대행', '제사', '차례', '예초', '전지',

    // 작업비 / 설치비 / 부대비용
    '작업비', '설치비', '개장', '수선', '이장', '파묘', '화장',
    '봉분', '리모델링', '토목', '공사', '각자', '글자', '철거', '운반',

    // 석물 부속 (묘지 자체가 아닌 부속품들)
    '상석', '비석', '와비', '둘레석', '묘테', '경계석', '석관', '석곽', '석실', // 석실 추가
    '월석', '표석', '가족표석', '부부표석', '갓', '좌대', '판석', '석등', '걸방석', '구판', // 구판 추가

    // 기타 잡동사니
    '만족도', '배너', '개인정보', '보건복지부', '장례문화진흥원', 'Copyright',
    '로그인', '회원가입', '원격지원', '화장예약', '선택한 상품', '궁금한게',
    '하늘e', '눌러주세요', '닫기', '열기', '지도', '길찾기', '공유', '금액',
    '품명', '규격', '재질', '원산지', '생산지',

    // 낙원추모공원 특화 제외
    '담장형 월석' // 월석 포함된 평장묘도 애매하면 제외? 일단 월석만 제외
];

// 2. 관리비는 필수 포함 (제외 키워드에 걸려도 살림)
const INCLUDE_KEYWORDS = [
    '관리비', '석면'
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
        let text = (item.ExtractedName + ' ' + (item.RawLine || '')).toLowerCase();

        // 이름 비어있으면 제외
        if (!item.ExtractedName || item.ExtractedName.trim() === '') {
            return;
        }

        // 1. 관리비는 무조건 통과 (우선순위 최상)
        if (text.includes('관리비')) {
            validItems.push(item);
            return;
        }

        // 2. 제외 키워드 검사
        let isExcluded = false;
        let excludeReason = '';

        for (const keyword of EXCLUDE_KEYWORDS) {
            if (text.includes(keyword)) {
                isExcluded = true;
                excludeReason = keyword;
                break;
            }
        }

        if (isExcluded) {
            rejectedItems.push({ name: item.ExtractedName, reason: excludeReason });
        } else {
            validItems.push(item);
        }
    });

    console.log(`\n=== 🧹 필터링 결과: (재)낙원추모공원 ===`);
    console.log(`전체 항목: ${rawItems.length}개`);
    console.log(`남은 항목: ${validItems.length}개`);
    console.log(`삭제된 항목: ${rejectedItems.length}개`);

    console.log('\n✅ [남은 항목 (최종 상품)]');
    validItems.forEach((item, i) => console.log(`${i + 1}. ${item.ExtractedName} : ${item.ExtractedPrice}`));

} catch (e) {
    console.error(e);
}

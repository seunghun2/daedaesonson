const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) {
        console.log('CSV 파일이 없습니다.');
        return;
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    let fixed = 0;

    const newLines = lines.map((line, index) => {
        if (index === 0) return line;

        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return line;

        let itemName = cols[3].replace(/^"|"$/g, '');
        let rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';
        const originalName = itemName;
        const originalRaw = rawText;

        // --- 1. ItemName 통일화 (Standardization) ---

        // 1.1 비용 명칭 통일 (띄어쓰기 제거)
        // "묘지 사용료" -> "묘지사용료"
        // "묘지 관리비" -> "묘지관리비"
        // "작업 비" -> "작업비", "안치 비용" -> "안치비"
        if (/사용료|관리비|작업비|안치비|이장비|개장비/.test(itemName)) {
            itemName = itemName.replace(/(묘지|봉안|매장|수목|자연)(?:\s+)(사용료|관리비)/g, '$1$2');
            itemName = itemName.replace(/\s+(비용)/g, '비'); // 안치 비용 -> 안치비
        }

        // 1.2 "사용료" 단독 표기 -> "묘지사용료"
        if (itemName === '사용료' || itemName.startsWith('사용료 (')) {
            itemName = itemName.replace('사용료', '묘지사용료');
        }
        // "관리비" 단독 표기 -> "묘지관리비" (단, 석물관리비 등 합성어 제외 체크)
        // "관리비 (1평)" -> "묘지관리비 (1평)"
        if (/^관리비(\s*\(|$)/.test(itemName)) {
            itemName = itemName.replace('관리비', '묘지관리비');
        }

        // 1.3 괄호 포맷 통일
        // "( 1평 )" -> "(1평)"
        itemName = itemName.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
        // 본문과 괄호 사이 띄어쓰기 "묘지사용료(1평)" -> "묘지사용료 (1평)"
        itemName = itemName.replace(/([가-힣])\(/g, '$1 (');

        // 1.4 상품명 띄어쓰기 표준화
        // "매장 묘" -> "매장묘", "봉안 묘" -> "봉안묘"
        itemName = itemName.replace(/매장 묘/g, '매장묘').replace(/봉안 묘/g, '봉안묘').replace(/평장 묘/g, '평장묘');


        // --- 2. RawText 통일화 및 요약 ---

        // 2.1 중복 제목 제거
        // 설명이 제목으로 시작하면 제거
        // 예: Item="묘지사용료", Desc="묘지사용료 (1평) / ..."
        if (rawText.startsWith(itemName)) {
            rawText = rawText.substring(itemName.length).trim();
            rawText = rawText.replace(/^[\/,\s]+/, '');
        }

        // 2.2 서술형 어구 -> 태그화
        // "자격은 ~입니다" -> "[자격: ~]"
        const replacementMap = [
            { regex: /(단, )?([가-힣\s]+거주자(만)?)\s*(가능)?/, tag: '자격' },
            { regex: /([가-힣\s]+)포함/, tag: '포함' },
            { regex: /([가-힣\s]+)별도/, tag: '별도' },
            { regex: /([가-힣\s]+)제외/, tag: '별도' },
        ];

        // (복잡한 자연어 처리는 위험하므로, 명확한 패턴만 "[태그: ...]" 스타일로 유지)
        // 기존에 이미 [태그: ...] 형식이 많으므로, 이를 유지하며, 너무 긴 텍스트(>50자)만 줄임표 처리?
        // 아니면 핵심만 남기기. 사용자 요청: "진짜 너무 긴것들은 줄이는 방향"

        if (rawText.length > 50) {
            // 태그별로 줄바꿈 되어있거나 / 로 나뉘어 있다면 각각 체크
            const parts = rawText.split(' / ');
            const shortParts = parts.map(p => {
                if (p.length > 40) {
                    // 너무 긴 설명은... 어쩔 수 없이 둠? 아니면 "..."?
                    // 정보 손실 우려가 있으므로, 괄호나 불필요한 조사 제거 시도
                    return p.replace(/에 대해|에서의| 의 |함을 원칙으로 함|을 포함함/g, '');
                }
                return p;
            });
            rawText = shortParts.join(' / ');
        }

        // 2.3 불필요한 공백/특수문자 정리
        rawText = rawText.replace(/\s{2,}/g, ' ').trim();
        rawText = rawText.replace(/^\/|\/$/g, '');

        if (itemName !== originalName || rawText !== originalRaw) {
            fixed++;
            cols[3] = `"${itemName.trim()}"`;
            cols[5] = `"${rawText.trim()}"`;
        }

        return cols.join(',');
    });

    if (fixed > 0) {
        fs.writeFileSync(CSV_FILE, newLines.join('\n'));
        console.log(`총 ${fixed}개 항목의 명칭 및 설명을 표준화했습니다.`);
    } else {
        console.log('수정할 항목이 없습니다.');
    }
})();

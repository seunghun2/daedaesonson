import { createWorker } from 'tesseract.js';

export interface ParsedData {
    text: string;
    phone?: string;
    address?: string;
    category?: string;
    priceTable?: Record<string, { unit: string; rows: { name: string; price: number }[] }>;
    description?: string;
}

// 추출된 텍스트에서 가격표를 찾아내는 함수
function parseSimplePriceTable(text: string) {
    // 1. 줄바꿈 강화: 혹시 줄바꿈 없이 쭉 이어진 텍스트가 있다면, '원' 뒤에서 강제로 줄을 나눔
    // 예: "특실 50,000원 일반실 30,000원" -> "특실 50,000원\n일반실 30,000원"
    let processedText = text.replace(/(\d{3,}(?:,\d{3})*원?)\s+([가-힣])/g, '$1\n$2');

    // 파이프(|)나 탭 문자로 구분된 표일 경우도 대비해서 줄바꿈으로 변경
    processedText = processedText.replace(/[|\t]/g, '\n');

    const lines = processedText.split(/\r?\n/);
    const result: Record<string, { unit: string; rows: { name: string; price: number }[] }> = {};

    let currentGroup = '기본 항목';

    // 그룹 식별 키워드 (헤더)
    const GROUP_KEYWORDS = [
        '시설 사용료', '시설사용료', '사용료', '이용료',
        '서비스항목', '서비스 항목', '부가서비스', '예약서비스',
        '장사용품', '장사 용품', '용품', '수의', '관', '입관',
        '상차림', '식대', '음식', '제단', '헌화',
        '안치료', '빈소', '접객실', '관리비',
        '구분', '형태', '품명', '금액' // 표 헤더 단어들도 추가
    ];

    // 가격 찾기 전략 (유연화)
    // 예: "걸방석 2.3/2.5자 고흥석 100,000 1"
    // 전략: 줄 뒤쪽에서부터 탐색해서 '가격'으로 보이는 숫자(세자리 확인, 1000원 이상 등)를 찾는다.

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length < 2) continue;
        if (/^\d+$/.test(trimmed) || /^\d+\/\d+$/.test(trimmed)) continue; // 페이지 번호나 단순 날짜 등 무시

        // 1. 그룹명 감지
        const foundKeyword = GROUP_KEYWORDS.find(k => trimmed.includes(k));
        const looksLikeHeader = foundKeyword || /^\[.+\]$/.test(trimmed) || trimmed.endsWith('안내') || trimmed.endsWith('현황');
        // 가격이 포함된 줄은 헤더가 아닐 확률이 높음 (단, '사용료' 같은 단어가 포함될 수 있으므로 주의)
        const hasPriceCandidate = /[\d,]{3,}0/.test(trimmed); // 적어도 10원 단위 이상

        if (looksLikeHeader && !hasPriceCandidate) {
            const newGroup = trimmed.replace(/[:\[\]]/g, '').trim();
            if (newGroup.length > 1) {
                currentGroup = newGroup;
                if (!result[currentGroup]) result[currentGroup] = { unit: '원', rows: [] };
            }
            continue;
        }

        // 2. 가격 데이터 파싱 (Last Valid Price 전략)
        // 공백으로 분리된 토큰 중, 뒤에서부터 검사하여 가격 패턴 찾기
        // 가격 패턴: 콤마가 있거나, 000으로 끝나는 숫자
        const tokens = trimmed.split(/\s+/);
        let priceIndex = -1;
        let price = 0;

        for (let i = tokens.length - 1; i >= 0; i--) {
            const token = tokens[i].replace(/원$/, '').replace(/,/g, '');
            // 숫자이며, 100 이상인 경우 (무료 0원은 일단 제외하거나 정책 결정 필요, 여기선 유료 위주)
            if (/^\d+$/.test(token) && parseInt(token, 10) >= 100) {
                priceIndex = i;
                price = parseInt(token, 10);
                break; // 가장 뒤에 있는 유효 가격을 찾으면 중단 (수량 '1' 등은 무시됨)
            }
        }

        if (priceIndex > 0) { // 맨 앞이 가격일 수는 없음 (이름이 있어야 함)
            // 가격 앞부분을 모두 이름으로 간주
            let name = tokens.slice(0, priceIndex).join(' ');

            // 노이즈 필터링
            if (name.length > 50 || name.length < 1) continue;
            // 이름에 숫자가 너무 많으면(전화번호, 날짜 등) 의심스럽지만, '2.3자' 같은게 있으므로 허용하되,
            // 이름이 순수하게 기호나 숫자로만 구성된 경우는 제외
            if (/^[\d.\-/~]+$/.test(name)) continue;

            if (!result[currentGroup]) result[currentGroup] = { unit: '원', rows: [] };

            // 중복 체크
            if (!result[currentGroup].rows.some(r => r.name === name)) {
                result[currentGroup].rows.push({ name, price });
            }
        }
    }

    // 빈 그룹 정리
    Object.keys(result).forEach(k => {
        if (result[k].rows.length === 0) delete result[k];
    });

    return result;
}


export const parsePdfFile = async (file: File, forceOcr: boolean = false): Promise<ParsedData> => {
    // 1. PDF.js 로드
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
    }).promise;

    let fullText = '';

    // 2. 텍스트 추출 (Y좌표 기반 줄바꿈 강화)
    if (!forceOcr) {
        try {
            for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                let lastY = -1;
                let pageText = '';

                for (const item of textContent.items as any[]) {
                    // Y값 차이가 크면(>5) 줄바꿈
                    if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                        pageText += '\n';
                    } else if (lastY !== -1) {
                        // 같은 줄이면 공백 추가
                        pageText += ' ';
                    }

                    pageText += item.str;

                    // 빈 문자열이 아니면 Y값 갱신
                    if (item.str.trim().length > 0) {
                        lastY = item.transform[5];
                    }
                }

                if (pageText.length > 10) fullText += pageText + '\n\n';
            }
        } catch (e) {
            console.warn('Text extraction failed:', e);
        }
    }

    // 3. OCR (Fallback)
    if (fullText.length < 50 || forceOcr) {
        console.log('OCR 모드 실행');
        const worker = await createWorker('kor');
        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                // @ts-ignore
                await page.render({ canvasContext: context, viewport }).promise;
                const image = canvas.toDataURL('image/png');
                const { data: { text } } = await worker.recognize(image);
                fullText += text + '\n\n';
            }
        }
        await worker.terminate();
    }

    // 4. 정보 추출
    const phoneMatch = fullText.match(/(\d{2,3})[-\s.]?\d{3,4}[-\s.]?\d{4}/);
    const addressMatch = fullText.match(/([가-힣]+[시도]\s+[가-힣]+[구군]\s+[가-힣0-9\s-]+(?:길|로|동|가))/);

    // 카테고리 유추
    let category = 'OTHER';
    if (/봉안|납골/.test(fullText)) category = 'CHARNEL_HOUSE';
    else if (/수목|자연/.test(fullText)) category = 'NATURAL_BURIAL';
    else if (/묘지|매장/.test(fullText)) category = 'FAMILY_GRAVE';
    else if (/장례식장/.test(fullText)) category = 'FUNERAL_HOME';
    else if (/화장|승화/.test(fullText)) category = 'CREMATORIUM';

    // 가격표 파싱 (새로운 로직)
    const priceTable = parseSimplePriceTable(fullText);

    return {
        text: fullText,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        address: addressMatch ? addressMatch[0] : undefined,
        category,
        priceTable,
        description: fullText.slice(0, 200).replace(/\n/g, ' ') + '...'
    };
};

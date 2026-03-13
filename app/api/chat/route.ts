import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

const SYSTEM_PROMPT = `당신은 "대손이"입니다. 대대손손의 AI 전문 상담사입니다.

## 역할
전국 봉안당, 수목장, 자연장림, 화장시설, 장례식장, 공원묘지 등 장지 시설 정보를 안내합니다.
자기소개 시 "대손이"라고 합니다. "대대손손의 장지 전문 상담사 대손이"입니다.

## 톤 & 매너 (50대 고객 친화적 전문 컨설턴트)
- 짧고 핵심적으로. 시설 추천 답변은 최대 12줄, 일반 답변은 5줄 이내.
- 존댓말은 쓰되, 동네 부동산 사장님처럼 편하고 신뢰감 있게.
- "~입니다"로 끝나는 문장 연속 2번 금지. 어미 다양하게: ~해요, ~거든요, ~추천드려요, ~좋아요, ~있어요
- 이모지는 아주 소량만 사용. 답변당 1~2개 정도. 예: ✅, 📍, 😊 정도. **볼드**는 핵심 키워드(시설명, 가격, 지역)에 사용 가능. ## 헤딩 같은 다른 마크다운은 절대 불가.
- 서론/인사 없이 바로 정보 전달.
- "~해드릴게요", "~안내드릴게요" 같은 서비스 어투.
- 절대로 영어를 사용하지 않습니다. 100% 한국어.

## 절대 하지 말 것 (모든 답변에 적용! 첫 답변이든 후속 답변이든!)
- 절대절대 [핵심 진단], [비교 추천], [대손이 팁], [후속 질문] 같은 대괄호 태그를 답변에 쓰지 마세요!!! 어떤 상황에서도, 어떤 답변에서도 금지! 이전 대화에 태그가 있더라도 따라하지 마세요!
- 고객 질문을 앵무새처럼 반복하지 마세요. "가격이 궁금하시군요" 금지. 바로 답을 주세요.
- "가격 정보가 없습니다" 반복 금지. 해당 유형 일반 가격대를 안내:
  "공립이라 보통 50~200만원 선이에요. 정확한 금액은 시설에 문의해 보세요."
- 애매한 열린 질문 금지. 구체적 A/B 선택지로:
  나쁜: "다른 조건도 중요하게 생각하시나요?"
  좋은: "가격이 중요하세요, 시설 퀄리티가 중요하세요?"
- "[상세보기](URL)" 형식 금지! 링크는 자연스러운 문장에 녹여서:
  나쁜: [상세보기](https://daedaesonson.com/facility/park-XXXX)
  좋은: 여기 한번 보세요 https://daedaesonson.com/facility/park-XXXX

## 전문 용어 규칙
- 고객은 장례 용어를 모른다고 가정. 전문 용어엔 반드시 쉬운 설명을 괄호로:
  로열단 → "로열단(서서 눈높이에서 참배하는 층)", 안치 → "안치(유골함 보관)"
  봉안담 → "봉안담(야외 벽체형 시설)", 자연장 → "자연장(나무 밑에 묻는 방식)"

## 한국어 이해 규칙
- 고객은 비격식 한국어, 줄임말, 오타를 사용합니다.
- "얼마?" → 가격 문의, "거기" → 현재 시설, "뭐가좋아?" → 추천 요청
- 잘 모르겠으면 "혹시 ~을 찾고 계신 건가요?"처럼 부드럽게 확인.

## 데이터 표시 규칙
- 영어 필드명 절대 노출 금지. CHARNEL_HOUSE → 봉안당, NATURAL_BURIAL → 수목장
- 가격은 "만원" 단위, 지역명은 시도 단위.
- 시설 ID(park-XXXX), 내부 코드, "Id-파크" 등 내부 식별자를 절대 답변에 포함하지 마세요! 고객에게는 시설명만 보여주세요.

## 응답 구조 (시설 추천 시)
태그([핵심 진단] 등) 없이 자연스러운 문장으로:
1. 바로 핵심 정보 1줄
2. 시설별로 번호 매기고 시설당 2줄 (이름+유형 / 추천 이유)
3. 실무 팁 1줄
4. 마지막에 반드시 빠른 응답 선택지를 {{선택1|선택2}} 또는 {{선택1|선택2|선택3}} 형식으로 출력!
   이 선택지는 고객이 버튼으로 탭할 수 있게 변환됩니다.
   예시: {{공립(가성비)|민간(고급시설)}} 또는 {{봉안당|수목장|화장시설}}
   선택지는 짧고 명확하게 (8자 이내). 2~3개가 적당.

좋은 답변 예시:
"수원이면 추모의집이 제일 괜찮아요.

1. 수원시연화장 추모의집 - 공립, 수원 영통구
공립이라 가격 부담 적고, 수원시에서 운영해서 믿을만해요.
여기 한번 보세요 https://daedaesonson.com/facility/park-XXXX

시설 퀄리티가 중요하시면 민간도 있어요.
2. 제2추모의집 - 민간, 수원 영통구
최신 시설이고 다양한 안치단(유골함 보관층) 종류가 있어요.
여기도 비교해 보세요 https://daedaesonson.com/facility/park-XXXX

수원 거주자면 공립이 가성비 최고예요.
가격 부담이 적은 게 좋으세요, 시설이 깔끔한 게 좋으세요?"

일반 질문은 5줄 이내로 간결하게 + 끝에 선택지 질문 1줄.

## 시설 추천 형식
- 시설 링크는 반드시 데이터의 "[내부코드]" 값을 그대로 복사해서 URL에 사용.
- 모든 시설 코드는 "park-XXXX" 형태 (봉안당이든 수목장이든).
- 코드를 임의로 생성하지 마세요! 데이터에 있는 코드만 사용.
- 코드는 오직 URL 안에서만 사용! 답변 텍스트에 "park-XXXX", "(ID: ~)", "Id-파크~" 등 코드/ID를 절대 노출하지 마세요!
- 나쁜 예: "서울추모공원 (Id-파크0004)" ← 이렇게 쓰면 안 됩니다!
- 좋은 예: "서울추모공원" + URL 링크만 제공

## 가이드 셀링 (대화의 핵심 흐름) — 가장 중요!!!
당신은 "장지 전문 컨설턴트"입니다. 고객이 처음 왔을 때 질문을 하나씩 물어보면서 조건을 좁혀가세요.
한 번에 여러 개 묻지 마세요! 한 번에 딱 하나만!
매 답변 끝에 반드시 {{선택1|선택2|선택3}} 형태의 빠른 응답 선택지를 넣으세요!

### 질문 순서 (이 순서대로 하나씩):

STEP 1 - 시설 유형:
"어떤 시설을 찾고 계세요? 😊"
{{봉안당|수목장|묘지|잘 모르겠어요}}

STEP 2 - 지역:
"어느 지역이 편하세요? 자주 찾아뵈려면 가까운 곳이 좋거든요."
{{서울|경기|부산|제주|기타 지역}}

STEP 3 - 예산:
"예산은 대략 어느 정도 생각하세요?"
{{200만원 이하|200~500만원|500만원 이상|잘 모르겠어요}}

STEP 4 - 공립/민간:
"공립은 저렴하고, 민간은 시설이 고급이에요."
{{공립(가성비)|민간(고급시설)|상관없어요}}

STEP 5 - 최종 추천:
이제 조건이 다 모였습니다! 데이터에서 딱 맞는 1곳을 확신 있게 추천하세요:

"조건에 딱 맞는 곳 찾았어요! 📍

OO봉안당 추천드려요
- 5단 기준 500만원대
- 서울에서 접근성 좋음
- 민간이라 시설 깔끔

여기 한번 보세요 https://daedaesonson.com/facility/park-XXXX

이 정도면 괜찮으시겠어요?"
{{여기 좋아요|다른 곳도 보고 싶어요|예산 조정할게요}}

### 중요 규칙:
- 고객이 "수원 봉안당"처럼 구체적으로 물어오면 → STEP 2, 3는 건너뛰고 바로 추천.
  단, 추천 후 빠진 정보(예산, 인원)를 역으로 물어보세요.
- 추천할 때 절대 3~4개 나열하지 마세요! 1곳을 확신 있게 추천하고, 안 맞으면 다음 것.
- 최종 추천에는 반드시: 시설명, 단수/가격, 지역 접근성, 공립/민간 구분을 포함하세요.
- "잘 모르겠어요"를 선택하면 쉽게 설명해주고 다시 선택지를 주세요.

## 상담 전환
- 3-4번 대화 후, "더 자세한 안내가 필요하시면 연락처를 남겨주세요."라고 한 번만 안내합니다.
- 이후 고객이 원하지 않으면 다시 언급하지 않습니다.

## 장지 유형별 전문 지식

### 봉안당 (납골당)
- 화장 후 유골함을 실내 건물에 안치하는 시설
- **단수(안치단 높이)가 가격의 핵심!** 반드시 안내:
  - 로열단(4~6단): 서서 눈높이에서 참배 가능, 가장 비쌈
  - 가성비단(1~2단, 8~9단): 로열단보다 30~50% 저렴
  - "예산을 아끼시려면 좋은 시설의 상/하단을 선택하시는 방법도 있습니다"라고 안내
- 장점: 날씨 무관, 깔끔한 관리, 이장 가능, 보안 우수
- 단점: 인공적 공간, 공립은 기간 제한(15~45년), 민간은 비용 높음
- 가격: 공립 50~200만원 / 민간 400~4,000만원 (단수·실 등급에 따라 차이)
- 관리비: 연 4~10만원, 보통 5년 이상 선납
- 공립은 해당 지역 주민만 가능, 민간은 누구나 가능

### 수목장/자연장
- 화장 후 나무 밑이나 잔디에 유골을 안치하는 친환경 장법
- **안치 형태에 따라 가격 차이 큼:**
  - 공동목(여러 가족 공유): 가장 저렴 (80~200만원)
  - 개인목(한 가족 전용 나무): 중간 (200~700만원)
  - 부부목/가족목: 개인목보다 넓은 공간 (300~1,000만원)
  - 잔디장(비석만): 가장 저렴한 자연장 (100~300만원)
- 장점: 자연 회귀, 관리 부담 적음, 공원 같은 분위기
- 단점: 이장 매우 어려움(사실상 불가), 날씨 영향, 추모 장소 비가시적

### 공원묘지 (매장)
- 전통적 봉분 묘지, 가족묘·부부묘·개인묘 등
- 장점: 전통적 추모, 명확한 추모 공간, 가족 합장 가능
- 단점: 관리 필요(벌초 등), 넓은 면적 필요
- 가격: 300만원~수천만원 (지역·면적에 따라 큰 차이)

### 화장시설
- 화장만 진행하는 시설, 이후 안치는 별도
- 화장비: 공립 5~15만원, 민간 20~30만원
- 화장 후 봉안당·수목장·자연장 중 선택

## 공립 vs 민간 핵심 차이
- 공립: 저렴(50~200만원), 거주지 제한 있음, 안치기간 제한(15~45년), 시설 간소
- 민간: 비쌈(400~4000만원), 누구나 가능, 기간 무제한, 시설 고급
- 고객이 "저렴한 곳"을 원하면 → 공립 우선 추천 + "해당 지역 거주자이신가요?" 확인
- 고객이 "좋은 시설"을 원하면 → 민간 추천 + "예산은 어느 정도 생각하세요?" 확인
- 예산이 넉넉하지 않으면: 낙후된 시설 로열단보다 최고급 시설 가성비단(상/하단)이 장기적으로 유리함을 안내

## 인접 대안 지역 가이드
고객이 특정 지역을 물어보면, 교통(명절 정체 등)과 가성비를 고려해 인접 위성도시도 함께 제안합니다:
- 서울 강남/경기 남부 → 용인, 광주(경기), 안성
- 서울 강북/경기 북부 → 일산, 파주, 양주, 포천
- 서울 서부 → 김포, 파주, 인천
- 부산 → 기장, 양산, 김해
- 대구 → 경산, 군위, 칠곡
- 대전 → 세종, 공주, 논산
예: "용인은 명절 정체가 심할 수 있는데, 차로 20~30분 거리인 경기 광주나 안성으로 가시면 같은 예산으로 더 좋은 단수를 선택하실 수 있습니다."

## 고객 의사결정 가이드 (대화 흐름)
고객이 막연하게 질문하면 다음 순서로 자연스럽게 확인합니다:
1. 유형 파악: "봉안당, 수목장, 매장 중 어떤 방식을 생각하고 계세요?" (잘 모르면 각 특징을 간단히 안내)
2. 지역 파악: "어느 지역이 편하세요?"
3. 예산 파악: "예산은 어느 정도 생각하세요?"
4. 기수 파악: "몇 분을 모실 건가요?" (개인·부부·가족 파악)
→ 이 4가지가 확인되면 정확하게 추천 가능합니다.
한 번에 4개를 다 묻지 말고, 대화 흐름에 따라 자연스럽게 1~2개씩 확인합니다.

## 장례 절차 간이 가이드
고객이 장례 절차를 물어보면 아래 순서로 안내합니다:
- 1일차: 임종 → 사망진단서 발급(7~10부) → 장례식장 운구·안치 → 빈소 설치
- 2일차: 염습(시신 정결) → 입관 → 성복(상복 착용) → 조문 접수
- 3일차: 발인식 → 장지로 이동 → 화장 or 매장 → 안치
- 평균 비용: 1,200~1,500만원 (장례식장 250~400만, 음식 200~600만, 관·수의 250~350만, 장지 별도)
- 최근 간소화 추세: 무빈소 장례 200~300만원대도 가능

## 대화 스킬 (감정적 케어)
- 고객은 대부분 급하고 불안한 상태입니다.
- "먼저 마음 편히 하세요" 같은 과한 위로는 하지 않습니다. 오히려 부담됩니다.
- "필요한 정보 바로 안내드릴게요"처럼 실질적 도움을 먼저 제안합니다.
- 가격 질문에 절대 회피하지 않습니다. 데이터에 있는 가격을 정확히 안내합니다.
- "비싸다/싸다" 가치 판단은 하지 않습니다. 가격만 제시하고 고객이 판단합니다.
- "아버지/어머니가 돌아가셨는데..."처럼 감정적 시작이면 → "힘드신 시간이시죠. 필요한 부분 바로 안내드릴게요." 한 문장만.

## 제한
- 의료/법률/종교 조언 불가
- 확인되지 않은 가격 안내 불가
- 장례 외 주제는 정중히 거절
- 이미지/사진 요청 시: "상세페이지에서 시설 사진을 확인하실 수 있습니다."라고 안내하고 시설 링크를 제공합니다.

## 데이터 기반 응답 (가장 중요!)
- 아래 [검색된 시설 목록]에 있는 시설만 추천합니다.
- 시설명과 ID를 반드시 데이터 목록에서 **그대로 복사**해서 사용합니다.
- 절대로 존재하지 않는 시설명이나 ID를 만들어내지 마세요!
- 검색 결과가 0건이면: "해당 조건에 맞는 시설을 찾지 못했어요. 조건을 넓혀서 다시 검색해 볼까요?" 라고 안내합니다.
- 데이터에 없는 시설은 절대 언급하지 않습니다.
`;

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

// POST: 챗봇 메시지 처리
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, history = [], sessionId, facilityContext, customerInfo } = body;

        if (!message && !customerInfo) {
            return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 });
        }

        // 고객 정보 저장 요청
        if (customerInfo && sessionId) {
            const { error } = await supabase
                .from('ChatSession')
                .update({
                    customer_name: customerInfo.name,
                    customer_phone: customerInfo.phone,
                    status: 'new',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', sessionId);

            return NextResponse.json({
                response: `${customerInfo.name}님, 감사합니다. 담당 상담사가 ${customerInfo.phone}으로 빠르게 연락드리겠습니다.`,
                sessionId,
            });
        }

        if (!message) {
            return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: '서비스 설정이 필요합니다.' }, { status: 500 });
        }

        // 1. 시설 데이터 구성
        let facilityData = '';

        // facilityContext로 전달된 상세 시설 정보
        if (facilityContext) {
            facilityData += `\n\n[현재 조회 중인 시설 (고객이 이 시설 페이지에서 상담을 시작했습니다)]`;
            facilityData += `\n이름: ${facilityContext.name}`;
            facilityData += `\n카테고리: ${facilityContext.category}`;
            facilityData += `\n지역: ${facilityContext.address || ''}`;
            facilityData += `\n전화번호: ${facilityContext.phone || '문의'}`;
            facilityData += `\nID: ${facilityContext.id}`;
            
            if (facilityContext.representativePrice) {
                const price = facilityContext.representativePrice >= 10000
                    ? `${Math.round(facilityContext.representativePrice / 10000)}만원`
                    : `${facilityContext.representativePrice.toLocaleString()}원`;
                facilityData += `\n대표가격: ${price}`;
            }

            if (facilityContext.institutionType) {
                facilityData += `\n운영주체: ${facilityContext.institutionType}`;
            }

            if (facilityContext.description) {
                facilityData += `\n시설 설명: ${facilityContext.description}`;
            }

            // 상세 가격표
            if (facilityContext.standardizedPrices && facilityContext.standardizedPrices.length > 0) {
                facilityData += `\n\n[가격 상세]`;
                facilityContext.standardizedPrices.forEach((p: any) => {
                    const priceStr = p.price >= 10000
                        ? `${Math.round(p.price / 10000)}만원`
                        : `${p.price?.toLocaleString()}원`;
                    facilityData += `\n- ${p.type || ''} ${p.subType || ''}: ${priceStr} ${p.notes ? `(${p.notes})` : ''}`;
                });
            }

            // 편의시설
            if (facilityContext.amenities && Object.keys(facilityContext.amenities).length > 0) {
                facilityData += `\n\n[편의시설]`;
                const amenityLabels: Record<string, string> = {
                    parking: '주차장', restaurant: '식당', convenienceStore: '편의점',
                    accessibility: '장애인 편의', shuttle: '셔틀버스',
                };
                Object.entries(facilityContext.amenities).forEach(([key, val]) => {
                    if (val) facilityData += `\n- ${amenityLabels[key] || key}: ✅`;
                });
            }
        }

        // ── 스마트 검색 (JSON 파일 기반) ──
        // 카테고리/가격은 전체 텍스트에서, 지역은 사용자 메시지에서만 검색 (AI 응답 지역명 오염 방지)
        const allText = [message, ...history.map((m: ChatMessage) => m.content)].join(' ');

        const regionKeywords = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
            '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
        
        // 약칭 → 실제 주소에 사용되는 풀네임 매핑
        const regionFullNames: Record<string, string[]> = {
            '서울': ['서울', '서울특별시'],
            '경기': ['경기', '경기도'],
            '인천': ['인천', '인천광역시'],
            '부산': ['부산', '부산광역시'],
            '대구': ['대구', '대구광역시'],
            '대전': ['대전', '대전광역시'],
            '광주': ['광주', '광주광역시'],
            '울산': ['울산', '울산광역시'],
            '세종': ['세종', '세종특별자치시'],
            '강원': ['강원', '강원도', '강원특별자치도'],
            '충북': ['충북', '충청북도'],
            '충남': ['충남', '충청남도'],
            '전북': ['전북', '전라북도', '전북특별자치도'],
            '전남': ['전남', '전라남도'],
            '경북': ['경북', '경상북도'],
            '경남': ['경남', '경상남도'],
            '제주': ['제주', '제주특별자치도'],
        };

        const subRegionKeywords = [
            '강남', '서초', '송파', '강동', '강서', '마포', '종로', '용산', '영등포', '관악', '동작', '성북', '노원',
            '수원', '성남', '분당', '고양', '일산', '용인', '안양', '안산', '파주', '화성', '평택', '김포', '하남',
            '부천', '양평', '이천', '여주', '포천', '가평', '양주', '남양주', '구리', '광명',
            '해운대', '기장', '사상', '사하', '금정',
            '수성', '달서', '달성', '유성', '대덕',
            '창원', '김해', '양산', '거제', '진주', '통영',
            '청주', '천안', '아산', '세종',
            '전주', '익산', '군산', '순천', '여수', '목포',
            '포항', '경주', '구미', '안동',
            '춘천', '원주', '강릉', '속초',
            '서귀포',
        ];
        const categoryKeywords: Record<string, string> = {
            '봉안당': 'CHARNEL_HOUSE', '봉안': 'CHARNEL_HOUSE', '납골당': 'CHARNEL_HOUSE',
            '추모관': 'CHARNEL_HOUSE', '추모공원': 'CHARNEL_HOUSE', '납골': 'CHARNEL_HOUSE',
            '수목장': 'NATURAL_BURIAL', '자연장': 'NATURAL_BURIAL', '자연장림': 'NATURAL_BURIAL', '수목': 'NATURAL_BURIAL',
            '화장': 'CREMATORIUM', '화장시설': 'CREMATORIUM', '화장장': 'CREMATORIUM', '화장터': 'CREMATORIUM',
            '장례식장': 'FUNERAL_HOME', '장례': 'FUNERAL_HOME',
            '공원묘지': 'FAMILY_GRAVE', '가족묘': 'FAMILY_GRAVE', '묘지': 'FAMILY_GRAVE',
            '매장': 'FAMILY_GRAVE', '매장묘지': 'FAMILY_GRAVE',
        };
        // ── 가격 파싱 (정규식 기반) ──
        const priceRegex = /(\d+)\s*만\s*원?\s*(대|이하|이상|정도|쯤|선|미만)?/;
        const priceMatchResult = allText.match(priceRegex);
        const wantsCheap = ['저렴', '싼', '싸', '최저', '가성비'].some(k => allText.includes(k));

        // ── 지역 필터: 현재 메시지 우선 → 사용자 히스토리 → (AI 응답은 제외!) ──
        let foundRegion: string | null = null;
        // 1. 현재 메시지에서 찾기
        for (const k of regionKeywords) {
            if (message.includes(k)) { foundRegion = k; break; }
        }
        // 2. 현재 메시지에 없으면, 사용자의 이전 메시지에서 찾기 (최신 우선)
        if (!foundRegion) {
            const userHistory = history.filter((m: ChatMessage) => m.role === 'user').reverse();
            for (const msg of userHistory) {
                for (const k of regionKeywords) {
                    if (msg.content.includes(k)) { foundRegion = k; break; }
                }
                if (foundRegion) break;
            }
        }

        // 세부 지역도 사용자 메시지 우선
        let foundSubRegion: string | null = null;
        for (const k of subRegionKeywords) {
            if (message.includes(k)) { foundSubRegion = k; break; }
        }
        if (!foundSubRegion) {
            const userHistory = history.filter((m: ChatMessage) => m.role === 'user').reverse();
            for (const msg of userHistory) {
                for (const k of subRegionKeywords) {
                    if (msg.content.includes(k)) { foundSubRegion = k; break; }
                }
                if (foundSubRegion) break;
            }
        }

        const foundCategory = Object.entries(categoryKeywords).find(([k]) => allText.includes(k));

        // 시설명 직접 검색 (3글자 이상)
        const excludeWords = ['추천', '궁금', '가격', '얼마', '안내', '알려', '알려줘', '비슷', '근처', '주변', '저렴', '찾아', '어디', '있나', '가까운', '도와', '드릴까', '상담', '문의', '해줘', '해주세요', '부탁', '만원대', '만원'];
        const nameMatch = message.match(/[가-힣]{3,}/g)?.filter(
            (w: string) => !regionKeywords.includes(w) && !subRegionKeywords.includes(w)
                && !Object.keys(categoryKeywords).includes(w) && !excludeWords.includes(w)
        );

        // JSON 파일에서 검색
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'data', 'facilities.json');
        const allFacilitiesData: any[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        let results = allFacilitiesData;

        // 카테고리 필터
        if (foundCategory) {
            results = results.filter((f: any) => f.category === foundCategory[1]);
        }
        // 지역 필터 (풀네임 매핑 적용)
        if (foundRegion) {
            const fullNames = regionFullNames[foundRegion] || [foundRegion];
            results = results.filter((f: any) => {
                const addr = f.address || '';
                return fullNames.some(name => addr.includes(name));
            });
        }
        if (foundSubRegion) {
            const subFiltered = results.filter((f: any) => (f.address || '').includes(foundSubRegion));
            if (subFiltered.length > 0) results = subFiltered;
        }

        // ── 시설별 모든 실제 가격 추출 헬퍼 ──
        const getAllPrices = (f: any): number[] => {
            const prices: number[] = [];
            if (f.standardizedPrices && Array.isArray(f.standardizedPrices)) {
                for (const group of f.standardizedPrices) {
                    if (group.rows && Array.isArray(group.rows)) {
                        for (const row of group.rows) {
                            if (row.price && row.price > 0 && row.feeType !== 'MAINTENANCE') {
                                prices.push(row.price);
                            }
                        }
                    }
                }
            }
            // standardizedPrices가 없으면 priceRange 사용
            if (prices.length === 0 && f.priceRange?.min) {
                prices.push(f.priceRange.min);
                if (f.priceRange.max && f.priceRange.max !== f.priceRange.min) {
                    prices.push(f.priceRange.max);
                }
            }
            return prices;
        };

        // 특정 가격에 가장 가까운 실제 가격과의 차이
        const getClosestPriceDiff = (f: any, target: number): number => {
            const prices = getAllPrices(f);
            if (prices.length === 0) return Infinity;
            return Math.min(...prices.map(p => Math.abs(p - target)));
        };

        // 시설이 특정 가격 범위 내의 상품을 가지고 있는지 체크
        const hasAnyPriceInRange = (f: any, lower: number, upper: number): boolean => {
            const prices = getAllPrices(f);
            return prices.some(p => p >= lower && p <= upper);
        };

        // ── 가격 필터 (standardizedPrices 전체 탐색) ──
        let targetPrice = 0;
        if (priceMatchResult) {
            targetPrice = parseInt(priceMatchResult[1]) * 10000;
            const priceIntent = priceMatchResult[2] || '대';

            let priceFiltered: any[];

            if (priceIntent === '이하' || priceIntent === '미만') {
                // "500만원 이하" → 해당 가격 이하 상품이 있는 시설
                priceFiltered = results.filter((f: any) => {
                    const prices = getAllPrices(f);
                    return prices.some(p => p <= targetPrice);
                });
            } else if (priceIntent === '이상') {
                // "500만원 이상" → 해당 가격 이상 상품이 있는 시설
                priceFiltered = results.filter((f: any) => {
                    const prices = getAllPrices(f);
                    return prices.some(p => p >= targetPrice);
                });
            } else {
                // "대", "정도", "쯤", "선" → 해당 가격 ±30% 범위 상품이 있는 시설
                priceFiltered = results.filter((f: any) =>
                    hasAnyPriceInRange(f, targetPrice * 0.7, targetPrice * 1.3)
                );
                // 결과가 너무 적으면 ±50% 범위로 확대
                if (priceFiltered.length < 3) {
                    const wider = results.filter((f: any) =>
                        hasAnyPriceInRange(f, targetPrice * 0.5, targetPrice * 1.5)
                    );
                    if (wider.length > priceFiltered.length) priceFiltered = wider;
                }
            }
            if (priceFiltered.length > 0) results = priceFiltered;
        } else if (wantsCheap) {
            const withPrice = results.filter((f: any) => getAllPrices(f).length > 0);
            if (withPrice.length > 0) results = withPrice;
        }

        // 정렬: 목표가격이 있으면 실제 가격 근접도순, 없으면 최저가 오름차순
        if (targetPrice > 0) {
            results.sort((a: any, b: any) => getClosestPriceDiff(a, targetPrice) - getClosestPriceDiff(b, targetPrice));
        } else {
            results.sort((a: any, b: any) => (a.priceRange?.min || 999999999) - (b.priceRange?.min || 999999999));
        }

        // 시설명 직접 검색 (별도)
        let nameResults: any[] = [];
        if (nameMatch && nameMatch.length > 0) {
            for (const nm of nameMatch.slice(0, 2)) {
                const found = allFacilitiesData.filter((f: any) => f.name.includes(nm));
                nameResults.push(...found);
            }
        }

        // 합치기 (중복 제거)
        const combined = [...results.slice(0, 15), ...nameResults];
        const uniqueMap = new Map<string, any>();
        combined.forEach(f => uniqueMap.set(f.id, f));
        const uniqueFacilities = Array.from(uniqueMap.values()).slice(0, 20);

        const cats: Record<string, string> = {
            'CHARNEL_HOUSE': '봉안당', 'NATURAL_BURIAL': '수목장/자연장', 'CREMATORIUM': '화장시설',
            'FUNERAL_HOME': '장례식장', 'FAMILY_GRAVE': '공원묘지/매장묘지', 'ETC': '기타',
        };

        // ── 시설 데이터 → AI 컨텍스트 포맷팅 ──
        const formatPrice = (p: number) => p >= 10000 ? `${Math.round(p / 10000)}만원` : `${p.toLocaleString()}원`;

        if (uniqueFacilities.length > 0) {
            // targetPrice가 있으면 '매칭 추천서' 모드
            if (targetPrice > 0) {
                const targetStr = formatPrice(targetPrice);
                facilityData += `\n\n[코드에서 미리 분석 완료된 추천 후보 — 아래 내용을 자연스럽게 전달하세요. 가격을 절대 변형하지 마세요!]`;
                facilityData += `\n고객 요청: ${targetStr}대`;

                uniqueFacilities.slice(0, 10).forEach((f: any, i: number) => {
                    const isPublic = f.isPublic ? '공립' : '민간';
                    facilityData += `\n\n${i + 1}. ${f.name} (${isPublic}, ${f.address || ''})`;
                    facilityData += `\n   [URL용 코드: ${f.id} — 답변에 절대 노출 금지]`;

                    if (f.standardizedPrices && f.standardizedPrices.length > 0) {
                        // 매칭 상품 (±30%)
                        const matchedItems: string[] = [];
                        // 기타 상품 요약
                        const otherItems: string[] = [];

                        for (const pg of f.standardizedPrices) {
                            if (!pg.rows) continue;
                            for (const row of pg.rows) {
                                if (!row.price || row.price <= 0 || row.feeType === 'MAINTENANCE') continue;
                                const label = row.groupType
                                    ? `${pg.subType || pg.serviceType} ${row.groupType} ${row.name}`
                                    : `${pg.subType || pg.serviceType} ${row.name}`;
                                const priceStr = formatPrice(row.price);

                                if (row.price >= targetPrice * 0.7 && row.price <= targetPrice * 1.3) {
                                    matchedItems.push(`${label}: ${priceStr}`);
                                } else {
                                    otherItems.push(`${label}: ${priceStr}`);
                                }
                            }
                        }

                        if (matchedItems.length > 0) {
                            facilityData += `\n   ✅ 예산 매칭 상품 (${targetStr} 근처):`;
                            matchedItems.slice(0, 6).forEach(item => {
                                facilityData += `\n      - ${item}`;
                            });
                        }

                        // 기타 가격대 요약 (최저~최고만)
                        if (otherItems.length > 0) {
                            const allUsagePrices = getAllPrices(f);
                            const minP = Math.min(...allUsagePrices);
                            const maxP = Math.max(...allUsagePrices);
                            facilityData += `\n   📊 전체 가격 범위: ${formatPrice(minP)} ~ ${formatPrice(maxP)}`;
                        }

                        // 관리비
                        for (const pg of f.standardizedPrices) {
                            if (!pg.rows) continue;
                            const maint = pg.rows.find((r: any) => r.feeType === 'MAINTENANCE' && r.price > 0);
                            if (maint) {
                                facilityData += `\n   💰 관리비: ${formatPrice(maint.price)}${maint.grade ? ` (${maint.grade})` : ''}`;
                                break;
                            }
                        }
                    } else {
                        // standardizedPrices 없으면 priceRange만
                        if (f.priceRange?.min) {
                            facilityData += `\n   가격: ${formatPrice(f.priceRange.min)}~${f.priceRange.max ? formatPrice(f.priceRange.max) : ''}`;
                        }
                    }
                });

                facilityData += `\n\n[중요 지시] 위 ✅ 예산 매칭 상품의 가격을 그대로 인용하세요. "~부터 시작" 같은 최저가 안내 금지! 고객이 요청한 ${targetStr}대에 맞는 구체적 상품명과 가격을 안내하세요.`;
                facilityData += `\n[추천 개수] 가장 적합한 1~2개를 확신있게 추천. 나열 금지.`;

            } else {
                // targetPrice 없으면 기본 목록 모드
                facilityData += '\n\n[검색된 시설 목록]';
                uniqueFacilities.slice(0, 15).forEach((f: any, i: number) => {
                    const isPublic = f.isPublic ? '공립' : '민간';
                    facilityData += `\n${i + 1}. ${f.name} | ${cats[f.category] || f.category} (${isPublic}) | ${f.address || ''}`;
                    facilityData += `\n   [URL용 코드: ${f.id} — 답변에 절대 노출 금지]`;

                    if (f.standardizedPrices && f.standardizedPrices.length > 0) {
                        for (const pg of f.standardizedPrices) {
                            if (!pg.rows || pg.rows.length === 0) continue;
                            const usageRows = pg.rows.filter((r: any) => r.price && r.price > 0 && r.feeType !== 'MAINTENANCE');
                            if (usageRows.length === 0) continue;
                            const summary = usageRows.slice(0, 8).map((r: any) => {
                                const label = r.groupType ? `${r.groupType} ${r.name}` : r.name;
                                return `${label}:${formatPrice(r.price)}`;
                            }).join(', ');
                            facilityData += `\n   └ ${pg.subType || pg.serviceType}: ${summary}`;
                        }
                        // 관리비
                        for (const pg of f.standardizedPrices) {
                            if (!pg.rows) continue;
                            const maint = pg.rows.find((r: any) => r.feeType === 'MAINTENANCE' && r.price > 0);
                            if (maint) {
                                facilityData += `\n   └ 관리비: ${formatPrice(maint.price)}${maint.grade ? ` (${maint.grade})` : ''}`;
                                break;
                            }
                        }
                    } else if (f.priceRange?.min) {
                        facilityData += `\n   └ 가격: ${formatPrice(f.priceRange.min)}~`;
                    }
                });
                facilityData += `\n\n[총 ${uniqueFacilities.length}개 검색됨. 가장 적합한 1~3개를 추천하세요.]`;
            }
        } else {
            facilityData += '\n\n[검색 결과: 0건. 해당 조건에 맞는 시설이 없습니다. 절대로 시설을 만들어내지 마세요. 조건을 넓혀볼 것을 안내하세요.]';
        }

        // 2. Gemini 호출
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { temperature: 0.15 },
        });

        const chatHistory = history.map((msg: ChatMessage) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        const greetingResponse = facilityContext
            ? `네, "${facilityContext.name}" 시설에 대해 안내해드리겠습니다. 무엇이 궁금하신가요?`
            : '네, 대대손손 장지 상담사입니다. 전국 봉안당, 수목장, 화장시설 정보를 안내해드려요. 어떤 장지를 찾고 계신가요?';

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: SYSTEM_PROMPT + facilityData }] },
                { role: 'model', parts: [{ text: greetingResponse }] },
                ...chatHistory,
            ],
        });

        const result = await chat.sendMessage(message);
        const response = result.response.text();

        // 3. 세션 저장
        const newMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
        const aiMsg: ChatMessage = { role: 'assistant', content: response, timestamp: new Date().toISOString() };

        if (sessionId) {
            const { data: existing } = await supabase
                .from('ChatSession')
                .select('messages')
                .eq('id', sessionId)
                .single();

            if (existing) {
                const updated = [...(existing.messages as ChatMessage[]), newMsg, aiMsg];
                await supabase
                    .from('ChatSession')
                    .update({ messages: updated, updated_at: new Date().toISOString() })
                    .eq('id', sessionId);
            }
        } else {
            const { data: newSession } = await supabase
                .from('ChatSession')
                .insert({
                    facility_id: facilityContext?.id || null,
                    messages: [newMsg, aiMsg],
                    user_agent: request.headers.get('user-agent') || '',
                })
                .select('id')
                .single();

            return NextResponse.json({ response, sessionId: newSession?.id });
        }

        return NextResponse.json({ response, sessionId });

    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: '죄송합니다. 상담 서비스에 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
            { status: 500 }
        );
    }
}

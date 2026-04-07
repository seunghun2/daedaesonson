import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { sendSlack } from '@/lib/slack';
import fs from 'fs';
import path from 'path';

const supabase = getSupabaseServer();

// 시설 데이터 모듈 레벨 캐싱 (cold start마다 1회 로드)
let _cachedFacilities: any[] = [];
function getFacilities(): any[] {
    if (_cachedFacilities.length === 0) {
        const filePath = path.join(process.cwd(), 'data', 'facilities.json');
        _cachedFacilities = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return _cachedFacilities;
}

// Haversine 거리 계산 (km 단위)
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SYSTEM_PROMPT = `당신은 "대손이"입니다. 대한민국 1등 장지 비교 플랫폼 '대대손손'의 수석 장지 컨설턴트입니다.

## 핵심 정체성
유가족이나 장지를 미리 준비하시는 분들의 막막함에 깊이 공감하며, 복잡한 가격 구조와 시설의 장단점을 투명하고 쉽게 풀어주는 '진정한 조력자'입니다. 동네에서 오래 알고 지낸 부동산 전문 중개사처럼 친근하면서도 정보는 매우 정확하게 전달합니다.

## 톤 & 매너
- 짧고 핵심적으로. 시설 추천은 최대 12줄, 일반 답변은 5줄 이내.
- 존댓말 쓰되 편하게: ~해요, ~거든요, ~추천드려요, ~좋아요, ~있어요 (같은 어미 연속 2번 금지)
- 이모지 최소(답변당 1~2개). **볼드**는 핵심(시설명, 가격, 지역)에만. ## 헤딩 등 다른 마크다운 절대 불가.
- 서론/인사 없이 바로 정보 전달. 100% 한국어.

## ★ 대화의 4대 철칙 (Golden Rules) ★
1. **묻는 말에 가장 먼저 대답**: 고객이 뭘 물어보든 결론부터 즉시. 가격 물으면 가격부터. 가이드 질문을 앞세우면 절대 안 됨!
2. **맥락 100% 유지**: 이미 말한 예산, 지역, 시설 유형을 잊거나 다시 묻는 것(리셋)은 절대 금지. 대화 리셋 = 최대 실패!
3. **1턴 1질문**: 고객에게 부담 주지 않도록 질문은 답변 맨 마지막에 딱 1개만 자연스럽게.
4. **유연한 상담**: 고객이 막연하면("알아보려고요") → 가이드 시작. 구체적이면("여기 얼마?") → 즉시 딥다이브.

## 고객 감정 감지 & 대응
고객의 첫 메시지 톤에서 감정을 읽고 맞춤 대응합니다:
- 평온/탐색적 → 정보 중심 전문가 톤으로 안내
- 불안/급함 ("급해요", "빨리") → "바로 안내드릴게요" 한마디로 안심시킨 후 핵심 정보 즉시 전달
- 슬픔/상실 ("아버지가 돌아가셨는데...") → "힘드신 시간이시죠. 필요한 부분 바로 안내드릴게요." 한 문장만. 과한 위로 금지.
- 의심/불만 ("사기 아닌지", "너무 좁던데") → 데이터 기반 근거로 신뢰 구축
- 단답/무표정 ("얼마?", "ㅇㅇ") → 능동적으로 맥락을 추론하고, 추론한 것을 확인하는 질문으로 대화 유도

## 진입 경로별 대응
- 홈페이지 메인에서 온 고객: 관심 시설 없는 백지 상태. 가이드 셀링으로 시작.
- 시설 상세 페이지에서 온 고객 (facilityContext 있음): 해당 시설의 '도슨트'가 되세요. "이 시설은 OO이 장점이에요" 라고 먼저 설명하고, 다른 곳도 추천 가능하다고 제안.
- 검색/블로그 유입: 의도가 명확하므로 즉시 질문에 답변.

## 절대 하지 말 것 (모든 답변, 모든 상황!)
- [핵심 진단], [비교 추천], [대손이 팁], [후속 질문] 같은 대괄호 태그 절대 금지! 이전 대화에 태그가 있어도 따라하지 마세요!
- 고객 질문 앵무새 반복 금지. "가격이 궁금하시군요" → 바로 답을 주세요.
- "가격 정보가 없습니다" 반복 금지 → 대신 해당 유형의 일반 가격대를 안내: "공립이라 보통 50~200만원 선이에요."
- 애매한 열린 질문 금지. 구체적 A/B 선택지로: "가격이 중요하세요, 시설 퀄리티가 중요하세요?"
- "[상세보기](URL)" 형식 금지! → "여기 한번 보세요 https://daedaesonson.com/facility/park-XXXX"

## 전문 용어 규칙
고객은 장례 용어를 모른다고 가정. 전문 용어엔 반드시 쉬운 설명을 괄호로:
로열단 → "로열단(서서 눈높이에서 참배하는 층)", 안치 → "안치(유골함 보관)"
봉안담 → "봉안담(야외 벽체형 시설)", 자연장 → "자연장(나무 밑에 묻는 방식)"

## 한국어 이해 규칙
고객은 비격식 한국어, 줄임말, 오타를 사용합니다.
- "얼마?" → 가격 문의, "거기" → 현재 시설, "뭐가좋아?" → 추천 요청
- "납골당" = 봉안당, "자연장" = 수목장, "묘지" = 공원묘지로 동일 의미 처리
- 잘 모르겠으면 "혹시 ~을 찾고 계신 건가요?"처럼 부드럽게 확인.

## 데이터 표시 규칙
- 영어 필드명 절대 노출 금지. CHARNEL_HOUSE → 봉안당, NATURAL_BURIAL → 수목장
- 가격은 "만원" 단위, 지역명은 시도 단위.
- 시설 ID(park-XXXX), 내부 코드, "Id-파크" 등 내부 식별자 답변에 절대 포함 금지! 고객에게는 시설명만.

## 응답 구조 (모든 답변)
자연스러운 문장으로 (태그 없이!):
1. **즉시 답변**: 고객이 궁금한 것에 결론부터 바로 대답
2. **전문가 꿀팁 1줄**: 고객이 놓치는 것(관리비, 단수 차이, 공립 자격조건 등)을 자연스럽게
3. **넥스트 스텝 질문 1개 + 버튼**: 비어있는 조건 1가지를 부드럽게 물으며 {{선택1|선택2}} 버튼 제공

시설 추천 시 추가:
- 시설별 번호 매기고 시설당 2줄 (이름+유형 / 추천 이유)
- 링크: "여기 한번 보세요 https://daedaesonson.com/facility/park-XXXX"
- 선택지는 짧고 명확하게 (8자 이내), 2~3개

좋은 답변 예시 (가격 문의):
"대구 가족 봉안당은 민간 기준 **600만~1,500만원** 선이에요.

같은 봉안당이라도 눈높이 '로열단(서서 참배하는 층)'이냐 상/하단이냐에 따라 가격 차이가 꽤 크거든요. 예산을 아끼시려면 좋은 시설의 상/하단을 선택하시는 방법도 있어요 😊

대구 시내 쪽과 외곽(군위 등) 중 어느 쪽이 편하세요?
{{대구 시내|외곽도 괜찮아|예산부터 맞추기}}"

## 시설 추천 형식
- 시설 링크는 반드시 데이터의 "[내부코드]" 값을 그대로 복사해서 URL에 사용.
- 모든 시설 코드는 "park-XXXX" 형태 (봉안당이든 수목장이든).
- 코드를 임의로 생성하지 마세요! 데이터에 있는 코드만 사용.
- 코드는 URL 안에서만! 답변에 "park-XXXX", "(ID: ~)" 등 절대 노출 금지!

## 가이드 셀링 (막연한 고객 전용)
고객이 "알아보려고요", "추천해주세요"처럼 막연할 때만 사용. 구체적 질문이 오면 건너뛰세요!
한 번에 하나만 묻되, 고객이 이미 밝힌 조건은 다시 묻지 않습니다:

STEP 1 - 시설 유형: "어떤 시설을 찾고 계세요? 😊" {{봉안당|수목장|묘지|잘 모르겠어요}}
STEP 2 - 지역: "어느 지역이 편하세요? 자주 찾아뵈려면 가까운 곳이 좋거든요." {{서울|경기|부산|제주|기타 지역}}
STEP 3 - 예산: "예산은 어느 정도 생각하세요?" {{200만원 이하|200~500만원|500만원 이상|잘 모르겠어요}}
STEP 4 - 공립/민간: "공립은 저렴하고, 민간은 시설이 고급이에요." {{공립(가성비)|민간(고급시설)|상관없어요}}
STEP 5 - 인원: "몇 분을 모실 건가요?" {{1인(개인)|2인(부부)|3인 이상(가족)}}
이 5가지가 확인되면 정확하게 추천 가능합니다. 한 번에 다 묻지 말고, 대화 흐름에 따라 자연스럽게 1개씩!

## 이장/전환 고객 대응 (매우 실전적!)
"기존 산소를 옮기고 싶어요", "매장을 화장으로 바꾸려면?" 같은 이장/전환 고객:
- 절차 안내: ① 관할 구청 개장허가 신청 ② 화장장 예약(공립 5~15만원) ③ 새 장지 계약
- 비용 구조: 기존 장지 해약비(있는 경우) + 화장비 + 운구비 + 신규 장지 비용
- 수목장 주의: "수목장은 한 번 안치하면 이장이 매우 어려워요. 나중에 옮길 가능성이 있으시면 봉안당이 더 유연해요."
- 봉안당→수목장: "봉안당에서 수목장으로 전환하시려면, 기존 유골함을 수습해서 수목장에 재안치하는 방식이에요."

## 만실 시설 대응
추천하려는 시설이 만실(isFull=true)인 경우:
- "이 시설은 현재 만실이에요" 라고 솔직히 알려주세요.
- 즉시 같은 지역 + 같은 유형의 대안 시설을 추천하세요.
- "대기가 가능한지는 시설에 직접 확인해 보시는 것도 방법이에요."

## 편의시설 기반 추천 강화
시설 추천 시, 편의시설 정보를 자연스럽게 포함하세요:
- 주차장(hasParking): "주차장이 넓어서 가족 방문이 편해요"
- 식당(hasRestaurant): "시설 내 식당이 있어서 참배 후 식사가 편해요"
- 매점(hasStore): "매점에서 제수용품을 바로 구매할 수 있어요"
- 고객이 "편의시설 좋은 곳" 원하면 → 주차+식당+매점 모두 있는 시설 우선

## 예산 부족 고객 대처 (중요!)
"100만원이면 되나요?" "제일 싼 데로" 같은 극저예산 고객에게:
- 무조건 "안 됩니다"로 끊지 마세요!
- 공립 시설 자격 조건(해당 지역 거주)을 확인하세요.
- 가성비단(최상단/최하단), 잔디장, 공동목 수목장 등 저렴한 대안을 제시하세요.
- "좋은 시설의 가성비단이 낙후된 시설의 로열단보다 장기적으로 유리해요"라는 꿀팁을 전달하세요.

## 상담 전환 (자연스럽게!)
- 시설 추천 후: 빠른 응답에 "📞 연락처 남기기" 포함! → {{여기 좋아요|다른 곳도 볼래요|📞 연락처 남기기}}
- 고객이 만족한 분위기면: {{여기로 할게요|📞 연락처 남기기}}
- 텍스트로 직접 "연락처 남겨주세요" 금지. 버튼에만 포함!
- 고객이 무시하면 더 이상 언급 금지.


## 주제 벗어난 질문 대응
장지/장례 관련 없는 질문:
"저는 장지 전문 상담사 대손이라서 그 부분은 답변드리기 어려워요 😊 장지 관련 궁금한 점 있으시면 편하게 물어봐 주세요!"
- 1~2줄로만 거절. 긴 답변 금지.
- "ㅋㅋㅋ", "ㅎㅎ" 등 의미없는 입력 → "어떤 장지를 찾고 계세요? 편하게 말씀해 주세요 😊"
- 욕설/비속어도 침착하게 같은 방식으로 거절.

## 장지 유형별 전문 지식

### 봉안당 (납골당)
- 화장 후 유골함을 실내 건물에 안치하는 시설
- **단수(안치단 높이)가 가격의 핵심!**
  - 로열단(4~6단): 서서 눈높이에서 참배, 가장 비쌈
  - 가성비단(1~2단, 8~9단): 로열단보다 30~50% 저렴
- 장점: 날씨 무관, 깔끔한 관리, 이장 가능, 보안 우수
- 단점: 인공적 공간, 공립은 기간 제한(15~45년), 민간은 비용 높음
- 가격: 공립 50~200만원 / 민간 400~4,000만원 (단수·등급별 차이)
- 관리비: 연 4~10만원, 보통 5년 이상 선납
- 공립은 해당 지역 주민만 가능, 민간은 누구나

### 수목장/자연장
- 화장 후 나무 밑이나 잔디에 유골을 안치하는 친환경 장법
  - 공동목(여러 가족 공유): 80~200만원
  - 개인목(한 가족 전용): 200~700만원
  - 부부목/가족목: 300~1,000만원
  - 잔디장(비석만): 100~300만원
- 장점: 자연 회귀, 관리 부담 적음, 공원 같은 분위기
- 단점: 이장 사실상 불가, 날씨 영향

### 공원묘지 (매장)
- 전통적 봉분 묘지, 가족묘·부부묘·개인묘 등
- 장점: 전통적 추모, 가족 합장 가능
- 단점: 관리 필요(벌초 등), 넓은 면적 필요
- 가격: 300만원~수천만원

### 화장시설
- 화장만 진행하는 시설, 이후 안치는 별도
- 화장비: 공립 5~15만원, 민간 20~30만원

## 공립 vs 민간 핵심 차이
- 공립: 저렴(50~200만원), 거주지 제한 있음, 안치기간 제한(15~45년), 시설 간소
- 민간: 비쌈(400~4000만원), 누구나 가능, 기간 무제한, 시설 고급
- "저렴한 곳" → 공립 우선 + "해당 지역 거주자이신가요?" 확인
- "좋은 시설" → 민간 + "예산은 어느 정도?" 확인

## 인접 대안 지역 가이드
특정 지역 질문 시, 교통·가성비 고려해 인접 위성도시도 함께 제안:
- 서울 강남/경기남부 → 용인, 광주(경기), 안성
- 서울 강북/경기북부 → 일산, 파주, 양주, 포천
- 서울 서부 → 김포, 파주, 인천
- 부산 → 기장, 양산, 김해
- 대구 → 경산, 군위, 칠곡
- 대전 → 세종, 공주, 논산
꿀팁: "용인은 명절 정체가 심할 수 있는데, 차로 20~30분 거리인 경기 광주로 가시면 같은 예산으로 더 좋은 단수를 선택할 수 있어요."

## 장례 절차 간이 가이드
- 1일차: 임종 → 사망진단서 발급(7~10부) → 장례식장 운구·안치 → 빈소 설치
- 2일차: 염습 → 입관 → 성복 → 조문 접수
- 3일차: 발인식 → 장지 이동 → 화장/매장 → 안치
- 평균 비용: 1,200~1,500만원 (장례식장 250~400만, 음식 200~600만, 관·수의 250~350만, 장지 별도)
- 최근 간소화 추세: 무빈소 장례 200~300만원대도 가능

## 제한
- 의료/법률/종교 조언 불가
- 확인되지 않은 가격 안내 불가
- 장례 외 주제는 정중히 거절
- 이미지/사진 요청 시: "상세페이지에서 시설 사진을 확인하실 수 있어요." + 시설 링크 제공

## 데이터 기반 응답 (가장 중요!)
- 아래 [검색된 시설 목록]에 있는 시설만 추천합니다.
- 시설명과 ID를 반드시 데이터 목록에서 **그대로 복사**해서 사용합니다.
- 절대로 존재하지 않는 시설명이나 ID를 만들어내지 마세요!
- 검색 결과가 0건이면: "해당 조건에 맞는 시설을 찾지 못했어요. 조건을 넓혀서 다시 검색해 볼까요?"
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

            if (error) console.error('ChatSession update error:', error);

            // Slack 알림
            await sendSlack('chatbot', `🤖 *챗봇 상담 신청!*\n• 이름: ${customerInfo.name}\n• 연락처: ${customerInfo.phone}\n• 세션: ${sessionId}`);

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

        // 버그 #8: 프롬프트 인젝션 방지 — facilityContext를 서버에서 검증
        const allFacilitiesForContext = getFacilities();
        let verifiedContext = facilityContext;
        if (facilityContext?.id) {
            const found = allFacilitiesForContext.find((f: any) => String(f.id) === String(facilityContext.id));
            if (found) {
                verifiedContext = {
                    id: found.id, name: found.name, category: found.category,
                    address: found.address, phone: found.phone,
                    representativePrice: found.representativePrice,
                    institutionType: found.institutionType,
                    description: found.description,
                    standardizedPrices: found.standardizedPrices || found.priceInfo?.standardizedPrices,
                    amenities: found.amenities,
                };
            } else {
                verifiedContext = null; // DB에 없는 ID면 무시
            }
        }
        // verifiedContext로 전달된 상세 시설 정보
        if (verifiedContext) {
            facilityData += `\n\n[현재 조회 중인 시설 (고객이 이 시설 페이지에서 상담을 시작했습니다)]`;
            facilityData += `\n이름: ${verifiedContext.name}`;
            facilityData += `\n카테고리: ${verifiedContext.category}`;
            facilityData += `\n지역: ${verifiedContext.address || ''}`;
            facilityData += `\n전화번호: ${verifiedContext.phone || '문의'}`;
            facilityData += `\nID: ${verifiedContext.id}`;
            
            if (verifiedContext.representativePrice) {
                const price = verifiedContext.representativePrice >= 10000
                    ? `${Math.round(verifiedContext.representativePrice / 10000)}만원`
                    : `${verifiedContext.representativePrice.toLocaleString()}원`;
                facilityData += `\n대표가격: ${price}`;
            }

            if (verifiedContext.institutionType) {
                facilityData += `\n운영주체: ${verifiedContext.institutionType}`;
            }

            if (verifiedContext.description) {
                facilityData += `\n시설 설명: ${verifiedContext.description}`;
            }

            // 상세 가격표
            if (verifiedContext.standardizedPrices && verifiedContext.standardizedPrices.length > 0) {
                facilityData += `\n\n[가격 상세]`;
                verifiedContext.standardizedPrices.forEach((p: any) => {
                    const priceStr = p.price >= 10000
                        ? `${Math.round(p.price / 10000)}만원`
                        : `${p.price?.toLocaleString()}원`;
                    facilityData += `\n- ${p.type || ''} ${p.subType || ''}: ${priceStr} ${p.notes ? `(${p.notes})` : ''}`;
                });
            }

            // 편의시설
            if (verifiedContext.amenities && Object.keys(verifiedContext.amenities).length > 0) {
                facilityData += `\n\n[편의시설]`;
                const amenityLabels: Record<string, string> = {
                    parking: '주차장', restaurant: '식당', convenienceStore: '편의점',
                    accessibility: '장애인 편의', shuttle: '셔틀버스',
                };
                Object.entries(verifiedContext.amenities).forEach(([key, val]) => {
                    if (val) facilityData += `\n- ${amenityLabels[key] || key}: ✅`;
                });
            }
        }

        // ── 스마트 검색 (JSON 파일 기반) ──
        // AI 응답 오염 방지: 모든 키워드 검색을 사용자 메시지에서만 수행
        const userMessages = history.filter((m: ChatMessage) => m.role === 'user').map((m: ChatMessage) => m.content);
        const userText = [message, ...userMessages].join(' ');

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
        // ── 가격 파싱 (버그 #13: 한글 숫자 + 범위 지원) ──
        // 한글 숫자 → 숫자 변환
        const korNum: Record<string, number> = { '일': 1, '이': 2, '삼': 3, '사': 4, '오': 5, '육': 6, '칠': 7, '팔': 8, '구': 9, '십': 10, '백': 100, '천': 1000 };
        const parseKorPrice = (text: string): number | null => {
            // "500만원", "1000만원" 등
            const numMatch = text.match(/(\d+)\s*만\s*원?/);
            if (numMatch) return parseInt(numMatch[1]) * 10000;
            // "5백만원", "2천만원" 등
            const korMatch = text.match(/(\d+)\s*(백|천)\s*만\s*원?/);
            if (korMatch) {
                const mul = korMatch[2] === '천' ? 1000 : 100;
                return parseInt(korMatch[1]) * mul * 10000;
            }
            return null;
        };

        const priceRegex = /(\d+)\s*만\s*원?\s*(대|이하|이상|정도|쯤|선|미만)?/;
        // 범위 파싱: "200~500만원"
        const rangeRegex = /(\d+)\s*[~\-~]\s*(\d+)\s*만\s*원?/;
        const rangeMatch = userText.match(rangeRegex);

        let priceMatchResult = userText.match(priceRegex);
        // 한글 가격 fallback
        if (!priceMatchResult) {
            const korPrice = parseKorPrice(userText);
            if (korPrice) {
                priceMatchResult = [`${korPrice / 10000}만원`, `${korPrice / 10000}`, '대'] as any;
            }
        }
        const wantsCheap = ['저렴', '싼', '싸', '최저', '가성비'].some(k => userText.includes(k));

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

        const foundCategory = Object.entries(categoryKeywords).find(([k]) => userText.includes(k));

        // 공립/민간 감지
        const publicKeywords = ['공립', '공설', '국립', '시립', '군립'];
        const privateKeywords = ['민간', '사설', '사립', '민영'];
        const wantsPublic = publicKeywords.some(k => userText.includes(k));
        const wantsPrivate = privateKeywords.some(k => userText.includes(k));

        // 시설명 직접 검색 (3글자 이상)
        const excludeWords = ['추천', '궁금', '가격', '얼마', '안내', '알려', '알려줘', '비슷', '근처', '주변', '저렴', '찾아', '어디', '있나', '가까운', '도와', '드릴까', '상담', '문의', '해줘', '해주세요', '부탁', '만원대', '만원'];
        const nameMatch = message.match(/[가-힣]{3,}/g)?.filter(
            (w: string) => !regionKeywords.includes(w) && !subRegionKeywords.includes(w)
                && !Object.keys(categoryKeywords).includes(w) && !excludeWords.includes(w)
        );

        // JSON 파일에서 검색
        const allFacilitiesData = getFacilities();

        let results = [...allFacilitiesData];

        // 카테고리 필터
        if (foundCategory) {
            results = results.filter((f: any) => f.category === foundCategory[1]);
        }
        // 공립/민간 필터 (명시적 요청 시)
        if (wantsPublic && !wantsPrivate) {
            results = results.filter((f: any) => f.isPublic === true);
        } else if (wantsPrivate && !wantsPublic) {
            results = results.filter((f: any) => f.isPublic === false);
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

        // ── standardizedPrices 추출 헬퍼 (priceInfo 폴백 포함) ──
        const getStdPrices = (f: any): any[] | null => {
            if (f.standardizedPrices && Array.isArray(f.standardizedPrices) && f.standardizedPrices.length > 0) return f.standardizedPrices;
            if (f.priceInfo?.standardizedPrices && Array.isArray(f.priceInfo.standardizedPrices) && f.priceInfo.standardizedPrices.length > 0) return f.priceInfo.standardizedPrices;
            return null;
        };

        // ── 시설별 모든 실제 가격 추출 헬퍼 ──
        const getAllPrices = (f: any): number[] => {
            const prices: number[] = [];
            const spSource = getStdPrices(f);
            if (spSource) {
                for (const group of spSource) {
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

        // 범위 파싱 우선: "200~500만원" 같은 표현
        if (rangeMatch) {
            const rangeLow = parseInt(rangeMatch[1]) * 10000;
            const rangeHigh = parseInt(rangeMatch[2]) * 10000;
            targetPrice = rangeLow;
            const rangeFiltered = results.filter((f: any) => hasAnyPriceInRange(f, rangeLow, rangeHigh));
            if (rangeFiltered.length > 0) results = rangeFiltered;
        } else if (priceMatchResult) {
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

                    const fsp = getStdPrices(f);
                    if (fsp) {
                        // 매칭 상품 (±30%)
                        const matchedItems: string[] = [];
                        // 기타 상품 요약
                        const otherItems: string[] = [];

                        for (const pg of fsp) {
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
                        for (const pg of fsp) {
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

                    const fStdPrices2 = getStdPrices(f);
                    if (fStdPrices2) {
                        for (const pg of fStdPrices2) {
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
                        for (const pg of fStdPrices2!) {
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

        // ── 시설 비교 카드 데이터 생성 (프론트 카드 UI용) ──
        // 카드 표시 조건: 현재 메시지에 추천 트리거가 있을 때만
        const recommendTriggers = ['추천', '알려줘', '보여줘', '찾아줘', '어디', '어떤', '비교', '있나요', '있을까', '소개'];
        const wantsOther = ['다른', '다른 곳', '다른데', '다른곳', '또 다른', '다른시설', '비슷한'].some(k => message.includes(k));
        const wantsNearby = ['주변', '근처', '가까운', '근방', '인근', '가까이'].some(k => message.includes(k));

        // 버그 #7: "다른 곳" 요청 시 AI에게 맥락 전달
        if (wantsOther) {
            facilityData += `\n\n[중요 맥락] 고객이 이전 추천을 거부하고 다른 시설을 요청했습니다. 가이드 셀링을 처음부터 다시 시작하지 마세요! 이전에 추천하지 않은 새로운 시설을 바로 추천해주세요.`;
        }
        const hasSearchTrigger = Boolean(foundCategory) || Boolean(foundRegion) || targetPrice > 0
            || recommendTriggers.some(k => message.includes(k)) || wantsOther || wantsNearby;
        // facilityContext(시설 상세페이지)에서는 명시적 추천/비교/주변 요청 시에만 카드 표시
        const wantsRecommendation = wantsOther || wantsNearby || ['추천', '비교', '비슷'].some(k => message.includes(k));
        const shouldShowCards = hasSearchTrigger && uniqueFacilities.length > 0
            && (!verifiedContext || wantsRecommendation);

        // 정보 완성도 스코어 (가격 데이터 풍부도 + 정보 완성도)
        const cardScore = (f: any): number => {
            let s = 0;
            if (getStdPrices(f)) {
                const rowCount = getStdPrices(f)!.reduce((acc: number, pg: any) => acc + (pg.rows?.length || 0), 0);
                s += Math.min(rowCount * 2, 20);
            }
            if (f.phone) s += 5;
            if (f.amenities && Object.values(f.amenities).some((v: any) => v)) s += 5;
            if (targetPrice > 0) {
                const diff = getClosestPriceDiff(f, targetPrice);
                if (diff < targetPrice * 0.3) s += 15;
                else if (diff < targetPrice * 0.5) s += 10;
            }
            return s;
        };

        let cardCandidates: any[] = [];
        if (shouldShowCards) {
            // 현재 보고 있는 시설 제외 (상세페이지에서 추천 시)
            const excludeId = verifiedContext?.id ? String(verifiedContext.id) : null;
            const filteredForCards = excludeId
                ? uniqueFacilities.filter((f: any) => String(f.id) !== excludeId)
                : uniqueFacilities;

            // ── 주변 시설 추천 (좌표 기반) ──
            if (wantsNearby && verifiedContext?.id) {
                const baseFacility = allFacilitiesData.find((f: any) => String(f.id) === String(verifiedContext.id));
                if (baseFacility?.lat && baseFacility?.lng) {
                    const nearby = allFacilitiesData
                        .filter((f: any) => String(f.id) !== String(verifiedContext.id) && f.lat && f.lng)
                        .map((f: any) => ({
                            ...f,
                            _distKm: haversineKm(baseFacility.lat, baseFacility.lng, f.lat, f.lng),
                        }))
                        .filter((f: any) => f._distKm <= 50) // 반경 50km
                        .sort((a: any, b: any) => a._distKm - b._distKm)
                        .slice(0, 3);
                    cardCandidates = nearby;
                }
            }

            // ── 일반 추천 (버그 #6: 이전 대화에서 추천한 시설 제외) ──
            if (cardCandidates.length === 0) {
                // 이전 AI 응답에서 이미 추천한 시설 ID 추출
                const previouslyRecommended = new Set<string>();
                history.filter((m: ChatMessage) => m.role === 'assistant').forEach((m: ChatMessage) => {
                    const urls = m.content.match(/facility\/(park-\d+)/g);
                    if (urls) urls.forEach(u => previouslyRecommended.add(u.replace('facility/', '')));
                });

                const notYetShown = filteredForCards.filter((f: any) => !previouslyRecommended.has(String(f.id)));
                const pool = notYetShown.length > 0 ? notYetShown : filteredForCards;

                // 다양성 보장: 공립/민간 명시 시 해당만, 미명시 시 공립1+민간2 혼합
                if (wantsPublic || wantsPrivate) {
                    cardCandidates = [...pool].sort((a, b) => cardScore(b) - cardScore(a)).slice(0, 3);
                } else {
                    const pubPool = pool.filter((f: any) => f.isPublic === true).sort((a: any, b: any) => cardScore(b) - cardScore(a));
                    const privPool = pool.filter((f: any) => f.isPublic === false).sort((a: any, b: any) => cardScore(b) - cardScore(a));
                    if (pubPool.length > 0 && privPool.length > 0) {
                        cardCandidates = [pubPool[0], ...privPool.slice(0, 2)];
                        if (cardCandidates.length < 3 && pubPool.length > 1) cardCandidates.push(pubPool[1]);
                    } else {
                        cardCandidates = [...pool].sort((a, b) => cardScore(b) - cardScore(a)).slice(0, 3);
                    }
                }
            }
        }

        const facilityCards = cardCandidates.map((f: any) => {
            const allUsagePrices = getAllPrices(f);
            const minP = allUsagePrices.length > 0 ? Math.min(...allUsagePrices) : null;
            let matchedPrice: number | null = null;
            let matchedItem: string | null = null;
            if (targetPrice > 0 && getStdPrices(f)) {
                for (const pg of getStdPrices(f)!) {
                    if (!pg.rows) continue;
                    for (const row of pg.rows) {
                        if (!row.price || row.price <= 0 || row.feeType === 'MAINTENANCE') continue;
                        if (row.price >= targetPrice * 0.7 && row.price <= targetPrice * 1.3) {
                            matchedPrice = row.price;
                            matchedItem = row.groupType
                                ? `${pg.subType || pg.serviceType} ${row.groupType} ${row.name}`
                                : `${pg.subType || pg.serviceType} ${row.name}`;
                            break;
                        }
                    }
                    if (matchedPrice) break;
                }
            }
            return {
                id: f.id,
                name: f.name,
                category: cats[f.category] || f.category,
                address: (f.address || '').split(' ').slice(0, 2).join(' '),
                isPublic: f.isPublic ?? null,
                minPrice: minP ? Math.round(minP / 10000)
                    : f.representativePrice ? Math.round(f.representativePrice / 10000)
                    : f.priceRange?.min ? Math.round(f.priceRange.min / 10000)
                    : null,
                matchedPrice: matchedPrice ? Math.round(matchedPrice / 10000) : null,
                matchedItem: matchedItem,
                distanceKm: f._distKm ? Math.round(f._distKm * 10) / 10 : undefined,
            };
        });

        // ── 가격표 인라인 데이터 생성 (가격 질문 시) ──
        const priceQueryKeywords = ['가격', '얼마', '비용', '요금', '가격표', '얼마야', '얼마에요', '얼마인가요', '얼마인가', '얼마예요'];
        const isPriceQuery = priceQueryKeywords.some(k => message.includes(k));

        let pricingTable: any = null;
        if (isPriceQuery) {
            // 가격표 대상 시설 결정
            let pricingTarget: any = null;

            // 1순위: verifiedContext (시설 상세페이지에서 상담)
            if (verifiedContext?.id) {
                pricingTarget = allFacilitiesData.find((f: any) => f.id === verifiedContext.id);
            }
            // 2순위: 이름 검색 결과
            if (!pricingTarget && nameResults.length > 0) {
                pricingTarget = nameResults[0];
            }

            if (pricingTarget && (pricingTarget.standardizedPrices?.length > 0 || pricingTarget.priceInfo?.standardizedPrices?.length > 0)) {
                const priceSource = pricingTarget.standardizedPrices?.length > 0 ? pricingTarget.standardizedPrices : pricingTarget.priceInfo.standardizedPrices;
                const fmtPrice = (p: number) => p >= 10000 ? `${Math.round(p / 10000)}만원` : `${p.toLocaleString()}원`;
                const sections: any[] = [];

                for (const pg of priceSource) {
                    if (!pg.rows || pg.rows.length === 0) continue;
                    const usageRows = pg.rows.filter((r: any) => r.price && r.price > 0 && r.feeType !== 'MAINTENANCE');
                    const maintRows = pg.rows.filter((r: any) => r.feeType === 'MAINTENANCE' && r.price > 0);

                    if (usageRows.length === 0) continue;

                    // groupType별로 묶기
                    const groups = new Map<string, any[]>();
                    for (const row of usageRows) {
                        const key = row.groupType || '_default';
                        if (!groups.has(key)) groups.set(key, []);
                        groups.get(key)!.push(row);
                    }

                    const tableRows: any[] = [];
                    for (const [groupName, rows] of groups) {
                        if (rows.length <= 3) {
                            // 행이 적으면 그대로
                            rows.forEach(r => tableRows.push({
                                name: r.name, grade: groupName !== '_default' ? groupName : undefined,
                                price: fmtPrice(r.price),
                            }));
                        } else {
                            // 행이 많으면 범위로 요약
                            const prices = rows.map((r: any) => r.price);
                            const minP = Math.min(...prices);
                            const maxP = Math.max(...prices);
                            tableRows.push({
                                name: groupName !== '_default' ? groupName : pg.subType || pg.serviceType,
                                price: minP === maxP ? fmtPrice(minP) : `${fmtPrice(minP)} ~ ${fmtPrice(maxP)}`,
                            });
                        }
                    }

                    sections.push({
                        title: pg.subType || pg.serviceType || '기타',
                        rows: tableRows.slice(0, 10),
                        maintenance: maintRows.length > 0
                            ? maintRows.map((m: any) => `${m.name}: ${fmtPrice(m.price)}${m.grade ? ` (${m.grade})` : ''}`).join(', ')
                            : undefined,
                    });
                }

                if (sections.length > 0) {
                    pricingTable = {
                        facilityName: pricingTarget.name,
                        facilityId: pricingTarget.id,
                        isPublic: pricingTarget.isPublic ?? null,
                        sections,
                    };
                }
            }
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

        const greetingResponse = verifiedContext
            ? `네, "${verifiedContext.name}" 시설에 대해 안내해드리겠습니다. 무엇이 궁금하신가요?`
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

        // 📊 실시간 대화 내용 슬랙 전송 (fire-and-forget)
        const msgCount = history.length + 1;
        const facilityLabel = verifiedContext?.name ? ` (${verifiedContext.name})` : '';
        const sessionLabel = sessionId ? sessionId.slice(0, 8) : '신규';
        const slackMsg = `💬 *챗봇 대화${facilityLabel}*\n` +
            `• 세션: ${sessionLabel} | 메시지 #${msgCount}\n` +
            `• 👤 고객: ${message.slice(0, 200)}\n` +
            `• 🤖 대손이: ${response.slice(0, 300)}${response.length > 300 ? '...' : ''}`;
        sendSlack('chatbot', slackMsg).catch(() => {});

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
                    facility_id: verifiedContext?.id || null,
                    messages: [newMsg, aiMsg],
                    user_agent: request.headers.get('user-agent') || '',
                    ip_address: request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
                })
                .select('id')
                .single();

            return NextResponse.json({ response, sessionId: newSession?.id, facilityCards: facilityCards.length > 0 ? facilityCards : undefined, pricingTable: pricingTable || undefined });
        }

        return NextResponse.json({ response, sessionId, facilityCards: facilityCards.length > 0 ? facilityCards : undefined, pricingTable: pricingTable || undefined });

    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: '죄송합니다. 상담 서비스에 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
            { status: 500 }
        );
    }
}

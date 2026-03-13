import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

const SYSTEM_PROMPT = `당신은 "대손이"입니다. 대대손손의 AI 전문 상담사입니다.

## 역할
전국 봉안당, 수목장, 자연장림, 화장시설, 장례식장, 공원묘지 등 장지 시설 정보를 안내합니다.
자기소개 시 "대손이"라고 합니다. "대대손손의 장지 전문 상담사 대손이"입니다.

## 톤 & 매너 (채널톡 스타일)
- 간결하고 명확하게 답변합니다. 한 문장이 2줄을 넘지 않도록 합니다.
- 존댓말은 쓰되, 딱딱하지 않고 따뜻하게 씁니다.
- 이모지는 사용하지 않습니다. 이모티콘, 특수문자 장식도 쓰지 않습니다.
- "AI"라고 자칭하지 않습니다. "대손이" 또는 "저희 대대손손"으로 표현합니다.
- 공감은 짧게 ("힘드신 시간이시죠."), 정보는 핵심 위주로 전달합니다.
- "~해드릴게요", "~안내드릴게요" 같은 부드러운 서비스 어투를 씁니다.
- 불필요한 인사말이나 반복 표현은 줄입니다.

## 한국어 이해 규칙 (중요!)
- 고객은 비격식 한국어, 줄임말, 신조어, 오타를 사용할 수 있습니다.
- 맥락을 추론하여 최대한 이해하세요. 예시:
  - "자혼자" → "혼자 사용할" (1인), "몇자리?" → "몇 기?", "얼마?" → 가격 문의
  - "뭐가좋아?" → 추천 요청, "거기" → 현재 보고 있는 시설
- 절대 고객의 표현을 그대로 인용하며 "이해하지 못했습니다"라고 하지 마세요.
- 잘 모르겠으면 "혹시 ~을 찾고 계신 건가요?"처럼 부드럽게 확인합니다.

## 데이터 표시 규칙 (중요!)
절대로 영어 필드명을 응답에 포함하지 마세요. 반드시 한글로 변환합니다:
- INDIVIDUAL → 개인묘, FAMILY_GRAVE → 가족묘, COUPLE → 부부묘
- CHARNEL_HOUSE → 봉안당, MEMORIAL_PARK → 공원묘지
- NATURAL_BURIAL → 수목장/자연장, CREMATORIUM → 화장시설
- priceType, subCategory 등 필드명 절대 노출 금지
- 가격은 항상 "만원" 단위로 읽기 쉽게 (예: 1520만원~)
- 지역명은 시도 단위로 (예: 부산, 서울 서초구)

## 응답 구조
- 첫 줄: 핵심 답변 (1-2문장)
- 이후: 상세 정보 (필요시)
- 마지막: 추가 질문 유도 (자연스럽게, 1문장)

## 시설 추천 형식
시설 추천 시:
- 시설 링크는 반드시 아래 데이터에 표시된 "ID:" 값을 **그대로 복사**해서 사용합니다.
- 모든 시설 ID는 "park-" 접두사를 가집니다 (예: park-0002, park-0509, park-1022).
- 봉안당이든 수목장이든 화장시설이든 상관없이 ID는 항상 "park-XXXX" 형태입니다.
- 절대로 "charnel-", "natural-", "cremation-" 같은 접두사를 만들지 마세요!
- 절대로 ID를 임의로 생성하지 마세요! 반드시 데이터에 있는 ID만 사용합니다.
- **[시설명 >](https://daedaesonson.com/facility/park-XXXX)**, 봉안당/수목장/화장시설, 지역
- 가격: 120만원~
- 최대 3-5개까지만 추천

## 상담 전환
- 3-4번 대화 후, "더 자세한 안내가 필요하시면 연락처를 남겨주세요."라고 한 번만 안내합니다.
- 이후 고객이 원하지 않으면 다시 언급하지 않습니다.

## 장지 유형별 전문 지식

### 봉안당 (납골당)
- 화장 후 유골함을 실내 건물에 안치하는 시설
- 장점: 날씨 무관, 깔끔한 관리, 이장 가능, 보안 우수
- 단점: 인공적 공간, 공립은 기간 제한(15~45년), 민간은 비용 높음
- 가격: 공립 50~200만원 / 민간 400~4,000만원 (위치·단 높이에 따라 차이)
- 관리비: 연 4~10만원, 보통 5년 이상 선납
- 공립은 해당 지역 주민만 가능, 민간은 누구나 가능

### 수목장/자연장
- 화장 후 나무 밑이나 잔디에 유골을 안치하는 친환경 장법
- 장점: 자연 회귀, 관리 부담 적음, 공원 같은 분위기
- 단점: 이장 매우 어려움(사실상 불가), 날씨 영향, 추모 장소 비가시적
- 가격: 공립 38~120만원 / 민간 80~700만원 (개인목/공동목에 따라 차이)
- 자연장(잔디장): 100~300만원으로 가장 저렴

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
        const allText = [message, ...history.map((m: ChatMessage) => m.content)].join(' ');

        const regionKeywords = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
            '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
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
        const priceKeywords: Record<string, number> = {
            '저렴': 5000000, '싼': 5000000, '싸': 5000000, '최저': 3000000,
            '100만원': 1000000, '200만원': 2000000, '300만원': 3000000, '500만원': 5000000,
            '1000만원': 10000000, '1500만원': 15000000, '2000만원': 20000000, '3000만원': 30000000,
        };

        const foundRegions = regionKeywords.filter(k => allText.includes(k));
        const foundSubRegions = subRegionKeywords.filter(k => allText.includes(k));
        const foundCategory = Object.entries(categoryKeywords).find(([k]) => allText.includes(k));
        const foundPrice = Object.entries(priceKeywords).find(([k]) => allText.includes(k));

        // 시설명 직접 검색 (3글자 이상)
        const excludeWords = ['추천', '궁금', '가격', '얼마', '안내', '알려', '알려줘', '비슷', '근처', '주변', '저렴', '찾아', '어디', '있나', '가까운', '도와', '드릴까', '상담', '문의', '해줘', '해주세요', '부탁'];
        const nameMatch = message.match(/[가-힣]{3,}/g)?.filter(
            w => !regionKeywords.includes(w) && !subRegionKeywords.includes(w)
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
        // 지역 필터
        if (foundRegions.length > 0) {
            results = results.filter((f: any) => (f.address || '').includes(foundRegions[0]));
        }
        if (foundSubRegions.length > 0) {
            const subFiltered = results.filter((f: any) => (f.address || '').includes(foundSubRegions[0]));
            if (subFiltered.length > 0) results = subFiltered;
        }
        // 가격 필터
        if (foundPrice) {
            const priceFiltered = results.filter((f: any) =>
                f.priceRange && f.priceRange.min && f.priceRange.min <= foundPrice[1]
            );
            if (priceFiltered.length > 0) results = priceFiltered;
        }

        // 가격 오름차순 정렬
        results.sort((a: any, b: any) => (a.priceRange?.min || 999999999) - (b.priceRange?.min || 999999999));

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

        if (uniqueFacilities.length > 0) {
            facilityData += '\n\n[검색된 시설 목록]';
            uniqueFacilities.forEach((f: any, i: number) => {
                const minPrice = f.priceRange?.min;
                const price = minPrice
                    ? (minPrice >= 10000 ? `${Math.round(minPrice / 10000)}만원~` : `${minPrice.toLocaleString()}원~`)
                    : '문의';
                const isPublic = f.isPublic ? '공립' : '민간';
                facilityData += `\n${i + 1}. ${f.name} | ${cats[f.category] || f.category} (${isPublic}) | ${f.address || ''} | ${price} | ID: ${f.id}`;
            });
            facilityData += `\n\n[총 ${uniqueFacilities.length}개 검색됨. 이 중 가장 적합한 3-5개를 추천하세요.]`;
        } else {
            facilityData += '\n\n[검색 결과: 0건. 해당 조건에 맞는 시설이 없습니다. 절대로 시설을 만들어내지 마세요. 조건을 넓혀볼 것을 안내하세요.]';
        }

        // 2. Gemini 호출
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

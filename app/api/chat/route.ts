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
- **[시설명 >](https://daedaesonson.com/facility/시설ID)**, 봉안당/수목장/화장시설, 지역
- 가격: 개인묘 120만원~, 가족묘 1,520만원~ 
- 최대 3-5개까지만 추천
- 자연스러운 한글 문장으로 안내 (목록 형태도 OK)

## 상담 전환
- 3-4번 대화 후, "더 자세한 안내가 필요하시면 연락처를 남겨주세요."라고 한 번만 안내합니다.
- 이후 고객이 원하지 않으면 다시 언급하지 않습니다.

## 제한
- 의료/법률/종교 조언 불가
- 확인되지 않은 가격 안내 불가
- 장례 외 주제는 정중히 거절
- 이미지/사진 요청 시: "상세페이지에서 시설 사진을 확인하실 수 있습니다."라고 안내하고 시설 링크를 제공합니다.

## 시설 데이터
아래 데이터를 기반으로 답변합니다. 데이터에 없는 시설은 추천하지 않습니다.
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

        // 메시지에서 키워드 검색
        const regionKeywords = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종',
            '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
            '수원', '성남', '고양', '용인', '안양', '안산', '파주', '화성', '평택'];
        const categoryKeywords: Record<string, string> = {
            '봉안당': 'CHARNEL_HOUSE', '봉안': 'CHARNEL_HOUSE', '납골당': 'CHARNEL_HOUSE', '추모관': 'CHARNEL_HOUSE',
            '수목장': 'NATURAL_BURIAL', '자연장': 'NATURAL_BURIAL', '자연장림': 'NATURAL_BURIAL',
            '화장': 'CREMATORIUM', '화장시설': 'CREMATORIUM', '화장장': 'CREMATORIUM',
            '장례식장': 'FUNERAL_HOME', '장례': 'FUNERAL_HOME',
            '가족묘': 'FAMILY_GRAVE', '묘지': 'FAMILY_GRAVE', '매장': 'FAMILY_GRAVE',
        };

        const foundRegion = regionKeywords.find(k => message.includes(k));
        const foundCategory = Object.entries(categoryKeywords).find(([k]) => message.includes(k));

        let query = supabase
            .from('Facility')
            .select('id, name, category, address, representativePrice, institutionType, phone')
            .not('representativePrice', 'is', null)
            .order('representativePrice', { ascending: true })
            .limit(10);

        if (foundRegion) query = query.ilike('address', `%${foundRegion}%`);
        if (foundCategory) query = query.eq('category', foundCategory[1]);

        const { data: facilities } = await query;

        if (facilities && facilities.length > 0) {
            facilityData += '\n\n[검색된 시설 목록]';
            facilities.forEach((f: any, i: number) => {
                const cats: Record<string, string> = {
                    'CHARNEL_HOUSE': '봉안당', 'NATURAL_BURIAL': '수목장', 'CREMATORIUM': '화장시설',
                    'FUNERAL_HOME': '장례식장', 'FAMILY_GRAVE': '가족묘지', 'ETC': '기타',
                };
                const price = f.representativePrice
                    ? (f.representativePrice >= 10000 ? `${Math.round(f.representativePrice / 10000)}만원` : `${f.representativePrice.toLocaleString()}원`)
                    : '문의';
                facilityData += `\n${i + 1}. ${f.name} | ${cats[f.category] || f.category} | ${f.address || ''} | ${price} | ID: ${f.id}`;
            });
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

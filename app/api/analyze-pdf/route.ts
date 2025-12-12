import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// API Key 설정 (환경변수 체크)
const API_KEY = process.env.GEMINI_API_KEY;

console.log('---------------------------------------------------');
console.log('Server-side Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GEMINI_API_KEY Present:', !!API_KEY);
if (!API_KEY) console.log('Current Env Vars Keys:', Object.keys(process.env).filter(k => k.includes('API')));
console.log('---------------------------------------------------');

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY가 설정되지 않았습니다. 테스트용 Mock Data를 반환합니다.');
        // Mock Data 반환 (프론트엔드 UI 테스트용)
        const mockData = {
            "facilityName": "[테스트] 예시 추모공원 (API 키 미설정)",
            "phone": "031-123-4567",
            "address": "경기도 용인시 처인구 모현읍 123",
            "category": "CHARNEL_HOUSE",
            "description": "이 데이터는 API 키가 없어서 생성된 테스트 데이터입니다. 실제 PDF 분석을 위해서는 .env 파일에 GEMINI_API_KEY를 설정해주세요.",
            "products": {
                "기본비용": {
                    "unit": "원",
                    "rows": [
                        { "name": "기본 사용료", "price": 3000000, "grade": "1평형" }
                    ]
                },
                "봉안당 (실내)": {
                    "unit": "원",
                    "rows": [
                        { "name": "개인단 (1단)", "price": 1500000, "grade": "개인형" },
                        { "name": "개인단 (2~8단)", "price": 4500000, "grade": "개인형" },
                        { "name": "부부단 (1단)", "price": 3000000, "grade": "부부형" },
                        { "name": "부부단 (Royal)", "price": 9000000, "grade": "부부형" }
                    ]
                },
                "수목장": {
                    "unit": "원",
                    "rows": [
                        { "name": "잔디장", "price": 1000000, "grade": "1위" },
                        { "name": "공동목", "price": 3000000, "grade": "1위" },
                        { "name": "부부목", "price": 12000000, "grade": "2위" }
                    ]
                }
            },
            "installationCosts": {
                "rows": [
                    { "name": "최초 안치료", "price": 300000 },
                    { "name": "부부단 각자비", "price": 200000 }
                ]
            },
            "managementCosts": {
                "rows": [
                    { "name": "1년 관리비 (개인)", "price": 50000 },
                    { "name": "1년 관리비 (부부)", "price": 90000 }
                ]
            }
        };

        // 실제 API처럼 약간의 지연 시간 추가
        await new Promise(resolve => setTimeout(resolve, 1500));

        return NextResponse.json(mockData);
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 });
        }

        // 파일 데이터를 ArrayBuffer로 읽어서 Base64로 변환
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        // Gemini 클라이언트 초기화
        const genAI = new GoogleGenerativeAI(API_KEY);
        // 문맥 이해와 속도가 뛰어난 2.0 Flash 모델 사용
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                responseMimeType: "application/json", // JSON 모드 강제
            }
        });

        const prompt = `
당신은 한국의 장사 시설(공원묘지, 봉안당 등) 가격표 분석 전문가입니다.
제공된 PDF 문서를 분석하여, 고객이 이해하기 쉬운 구조화된 JSON 데이터를 추출해주세요.

다음 규칙을 엄격히 준수하세요:

1. **전체 페이지 탐색 (필수)**: 
   - 문서의 모든 페이지를 확인하여 가격표를 누락 없이 추출하세요. 
   - 특히 '수목장', '자연장' 관련 표가 뒤쪽에 있어도 반드시 찾아내세요.

2. **데이터 3단 분류 규칙 (매우 중요)**:
   - **'products' (메인 상품)**:
     - **중요**: 이 항목에 '관리비'나 '벌초비'를 절대 섞지 마세요.
     - 고객이 구매하는 '공간'이나 '안치권'만 포함하세요.
     - **카테고리 매핑 (6가지)**:
       - **기본비용**: 기본료, 기본 사용료, 필수 비용, 분양가. 예: "기본 사용료 300만원", "필수 비용 500만원"
       - **매장묘**: 매장, 묘지, 단장, 합장, 쌍분.
       - **봉안묘**: 봉안묘, 납골묘, 가족묘, 평장형 봉안묘, 봉안담.
       - **봉안당**: 봉안당, 납골당, 실내 안치단, 부부단, 개인단, 특별실.
       - **수목장**: 수목장, 자연장, 잔디장, 화초장, 수목, 공동목, 개인목, 부부목.
       - **기타**: 위 카테고리에 속하지 않는 모든 항목.
     - '상품명(name)'은 구체적으로 (예: "매장묘 1단지", "기본 사용료"), '등급/규격(grade)'은 단위나 유형 (예: "1평형", "개인형(1위)", "부부형(2위)", "6위형")을 적으세요.

   - **'installationCosts' (시설/석물/작업비)**:
     - 분양가 외에 추가로 발생하는 **필수 비용**입니다.
     - 키워드: 석물비, 비석, 둘레석, 묘테, 상석, 각자비, 작업비, 안치료, 최초 조성비.
     - **주의**: "사용료" 표와 "석물비" 표가 따로 있으면 반드시 둘 다 추출하세요.

   - **'managementCosts' (관리/용역비)**:
     - **필수 분리**: 표에 상품(매장묘 등)과 관리비가 섞여 있어도, 관리비 행은 이쪽으로 분리해서 추출하세요.
     - 키워드: 연간 관리비, 5년 선납 관리비, 벌초 대행료, 제사상 비용.

3. **가격 데이터 검증**:
   - 모든 가격은 **'원 단위 숫자'**로 변환하세요. (예: "300만원" -> 3000000)

4. **그룹명 규칙**:
   - 기본비용은 "기본비용" 또는 "기본 사용료"로 그룹명을 지정하세요.
   - 다른 카테고리는 "1단지 매장묘", "2층 봉안당" 등 구체적으로 지정하세요.

요구되는 JSON 구조:
{
    "facilityName": "시설 이름",
    "phone": "전화번호",
    "address": "주소",
    "category": "대표 시설 종류 (CHARNEL_HOUSE | NATURAL_BURIAL | FAMILY_GRAVE | CREMATORIUM | FUNERAL_HOME | OTHER)",
    "description": "시설 소개",
    "products": {
        "기본비용": {
            "unit": "원",
            "rows": [
                { "name": "기본 사용료", "price": 3000000, "grade": "1인 기준" }
            ]
        },
        "1단지 매장묘": {
            "unit": "원",
            "rows": [
                { "name": "일반 매장형", "price": 5000000, "grade": "1평형 (단장)" },
                { "name": "가족 매장형", "price": 12000000, "grade": "3평형 (합장)" }
            ]
        },
        "2층 봉안당": {
            "unit": "원",
            "rows": [
                { "name": "개인실", "price": 1500000, "grade": "1위형" },
                { "name": "부부실", "price": 2500000, "grade": "2위형" }
            ]
        }
    },
    "installationCosts": {
        "rows": [
             { "name": "매장묘 석물비 (비석+둘레석)", "price": 5500000 }
        ]
    },
    "managementCosts": {
        "rows": [
             { "name": "연간 관리비", "price": 50000 }
        ]
    }
}
`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || "application/pdf"
                }
            }
        ]);

        const responseText = result.response.text();
        console.log('Gemini Analyzed:', responseText.slice(0, 100) + '...');

        const parsedData = JSON.parse(responseText);
        return NextResponse.json(parsedData);

    } catch (error: any) {
        console.error('==========================================');
        console.error('❌ Gemini API Error Details:');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);

        // Gemini API 특정 에러 체크
        if (error.message?.includes('API key')) {
            console.error('🔑 API 키 문제 감지: API 키가 유효하지 않거나 권한이 없습니다.');
        }
        if (error.message?.includes('quota')) {
            console.error('📊 할당량 초과: Gemini API 무료 한도를 초과했을 수 있습니다.');
        }
        if (error.message?.includes('JSON')) {
            console.error('📄 JSON 파싱 실패: Gemini가 잘못된 형식의 응답을 반환했습니다.');
            console.error('Raw Response (first 500 chars):', error.response?.slice(0, 500));
        }

        console.error('==========================================');

        return NextResponse.json(
            {
                error: 'PDF 분석 중 오류가 발생했습니다.',
                details: error.message,
                hint: error.message?.includes('API key')
                    ? '.env 파일의 GEMINI_API_KEY를 확인해주세요.'
                    : error.message?.includes('quota')
                        ? 'Gemini API 무료 한도를 확인해주세요.'
                        : '서버 로그를 확인해주세요.'
            },
            { status: 500 }
        );
    }
}

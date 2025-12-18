const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// ENV 로드
['.env', '.env.local'].forEach(fileName => {
  const envPath = path.join(__dirname, '../', fileName);
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const [key, val] = line.split('=');
      if (key && val && !process.env[key.trim()]) {
        process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
      }
    });
  }
});

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '0000';

// Gemini 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: { responseMimeType: "application/json" }
});

const PROMPT = `너는 장례시설(공원묘지·추모공원) 가격표를
일반인이 이해할 수 있도록 구조화·정리하는 역할이다.

아래 규칙을 반드시 고정으로 적용하며,
단 하나도 임의 해석하거나 완화하지 마라.

[1] 카테고리 (고정)
- 매장묘
- 봉안당
- 수목장
- 옵션

※ 평장묘, 단장묘, 합장묘 → 모두 "매장묘"
※ 봉안묘, 봉안함, 봉안담, 납골 → 모두 "봉안당"
※ 석물, 비석, 상석, 묘테, 각자비, 작업비 → 전부 "옵션"

[2] 포함 / 제외 기준
- 묘지 관련 항목만 정리한다.
- 장례용품, 장례서비스, 반환기준, 행정 문구, 이용자격 문구는 전부 제외한다.
- 아래 항목만 남긴다:
  · 묘지 사용료
  · 관리비
  · 봉안
  · 수목장
  · 석물(옵션)

[3] 시설 기본정보 처리
- 시설명, 주소, 전화번호, 운영주체, 공설/사설 정보는
  표에 절대 포함하지 않는다.

[4] 용어 정리 기준
- 내부·행정 용어(구역명, 코드명, 층수, 단수, 면적 코드 등)는
  상품명에 절대 사용하지 않는다.
- 상품명은 반드시 일반인이 바로 이해 가능한 표현으로 작성한다.
- 단수(1단, 8단 등)는 설명 컬럼에 넣어라.

[5] 설명 문구 고정 (절대 변경 금지)
- 묘지 사용료 설명:
  "1평(3.3㎡) 기준 묘지 사용료"
- 관리비 설명:
  "1평당 연간 관리비"
- 단수가 있으면 설명에 추가 (예: "3단", "1~5단")

[6] 옵션 처리 규칙
- 석물, 비석, 상석, 묘테, 각자비, 작업비는
  반드시 카테고리를 "옵션"으로 표기한다.
- 기본 비용처럼 보이게 작성하지 않는다.

[7] 출력 형식 (JSON)
다음 JSON 형식으로 출력하라:
{
  "items": [
    {
      "category": "매장묘",
      "itemName": "개인묘 3평형",
      "description": "1평(3.3㎡) 기준 묘지 사용료",
      "price": 5000000
    }
  ]
}

- 가격이 있는 항목만 포함한다.
- 가격 추정, 평균, 계산, 환산은 절대 하지 않는다.
- PDF에 표기된 가격을 그대로 사용한다.
- 만장 / 분양불가 / 접수불가 항목은 표에 포함하지 않는다.

[8] 정렬 규칙 (고정)
1) 카테고리 순서
   매장묘 → 봉안당 → 수목장 → 옵션
2) 같은 카테고리 내 순서
   사용료 → 관리비 → 상품 → 옵션

PDF를 "사람이 보는 가격표"로 번역하듯, 짧고 명확하게 정리하라.`;

// ========== 설정 ==========
const FACILITY_NUM = 511;
const FACILITY_ID = 'park-0511';
const FACILITY_NAME = '해인사 고불암무량수전';
const START_ROW = 825;
// ==========================

async function main() {
  const pdfPath = path.join(__dirname, `../archive5/${FACILITY_NUM}.${FACILITY_NAME}_price_info.pdf`);

  console.log(`📄 PDF 분석 중: ${FACILITY_NUM}.${FACILITY_NAME}`);

  // 1. PDF 읽고 Gemini로 분석
  const pdfData = fs.readFileSync(pdfPath);
  const base64Data = pdfData.toString('base64');

  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        data: base64Data,
        mimeType: "application/pdf"
      }
    }
  ]);

  const responseText = result.response.text();
  const data = JSON.parse(responseText);

  console.log(`✅ 분석 완료!`);
  console.log(`   총 ${data.items?.length || 0}개 항목`);

  // 2. 시트 데이터 형식으로 변환
  const sheetRows = data.items.map(item => [
    FACILITY_ID,                   // 시설ID
    FACILITY_NAME,                 // 시설명
    '공원묘지',                    // 시설카테고리
    '사설',                        // 운영구분
    item.category || '매장묘',     // 가격카테고리
    item.itemName || '',           // 상품명
    item.description || '',        // 설명
    String(item.price || 0),       // 가격
    ''                             // 대표가격
  ]);

  console.log('\n📋 삽입할 데이터:');
  sheetRows.slice(0, 5).forEach((row, i) => {
    console.log(`  ${i + 1}. ${row[5]} | ${row[6]} | ${row[7]}원 (${row[4]})`);
  });
  if (sheetRows.length > 5) {
    console.log(`  ... 외 ${sheetRows.length - 5}개`);
  }

  // 3. 시트에 삽입
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

  const range = `${SHEET_NAME}!A${START_ROW}:I${START_ROW + sheetRows.length - 1}`;

  console.log(`\n📝 시트에 삽입 중... (${range})`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'RAW',
    resource: { values: sheetRows }
  });

  console.log(`\n✅ 완료! ${sheetRows.length}개 행이 ${START_ROW}번 줄부터 삽입되었습니다.`);
}

main().catch(e => console.error('Error:', e.message));

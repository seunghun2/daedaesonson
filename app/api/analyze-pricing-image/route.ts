import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });

        const prompt = `
이 이미지는 장례/추모 시설의 가격표입니다.

다음 형식으로 JSON을 정확히 추출해주세요:

{
  "facility": "시설명",
  "categories": [
    {
      "name": "매장묘",
      "items": [
        {
          "name": "기본 매장묘 사용료",
          "price": 3000000,
          "isRepresentative": true,
          "description": ""
        }
      ]
    },
    {
      "name": "봉안당",
      "items": [...]
    }
  ]
}

규칙:
1. 카테고리: 매장묘, 봉안당, 수목장, 화장 등으로 구분
2. 각 카테고리의 첫 번째 또는 가장 중요한 항목을 isRepresentative: true로 표시
3. 가격은 숫자만 (원 단위)
4. description은 추가 설명이 있으면 넣고, 없으면 빈 문자열

JSON만 응답하세요. 다른 텍스트는 포함하지 마세요.
`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: file.type,
                    data: base64
                }
            }
        ]);

        const response = result.response.text();

        // Extract JSON from response (sometimes wrapped in markdown)
        let jsonText = response.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        const parsed = JSON.parse(jsonText);

        return NextResponse.json({
            success: true,
            data: parsed
        });

    } catch (error) {
        console.error('Vision API Error:', error);
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}

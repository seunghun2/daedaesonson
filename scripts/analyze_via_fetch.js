const fs = require('fs');
const { glob } = require('glob');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-3-pro-image-preview";
const TARGET_ID = '1';

async function main() {
    if (!API_KEY) {
        console.error("❌ Key not found");
        return;
    }

    console.log(`🚀 Analyzing Facility ${TARGET_ID} using RAW FETCH (${MODEL_NAME})...`);

    // 1. Find Image
    let imagePaths = await glob(`FLATTENED_IMAGES/${TARGET_ID}.*jpg`);
    if (imagePaths.length === 0) imagePaths = await glob(`archive/${TARGET_ID}.*/**/*.jpg`);

    if (imagePaths.length === 0) {
        console.log("No images found.");
        return;
    }

    const imagePath = imagePaths[0];
    const imageBase64 = fs.readFileSync(imagePath).toString('base64');

    // 2. Build Request JSON
    const requestBody = {
        contents: [{
            parts: [
                { text: "이 사진은 한국의 장사시설입니다. 다음 중 하나로 분류하고 단어만 뱉으세요: 공원묘지, 봉안당, 수목장, 복합" },
                {
                    inline_data: {
                        mime_type: "image/jpeg",
                        data: imageBase64
                    }
                }
            ]
        }]
    };

    // 3. Send Fetch Request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", JSON.stringify(data.error, null, 2));
        } else {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log("------------------------------------------------");
            console.log(`🤖 Analysis Result: [ ${text ? text.trim() : 'No output'} ]`);
            console.log("------------------------------------------------");
        }

    } catch (e) {
        console.error("❌ Network Error:", e);
    }
}

main();

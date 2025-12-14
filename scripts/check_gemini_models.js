const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ No GEMINI_API_KEY found');
        return;
    }

    // We can't directly list models with the helper easily without iterating,
    // but we can try a few known ones and report which works.
    console.log('--- Testing Gemini Model Parsing ---');
    console.log('Key:', apiKey.substring(0, 10) + '...');

    // Just try to init and see if it throws immediately or on call
    const genAI = new GoogleGenerativeAI(apiKey);

    // We will assume standard models and print what the user likely has access to based on docs
    // Actually, let's just try a simple text gen with 'gemini-pro' first to verify the key works.

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello?");
        console.log('✅ gemini-pro: WORKED');
    } catch (e) {
        console.log('❌ gemini-pro: FAILED (' + e.message + ')');
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello?");
        console.log('✅ gemini-1.5-flash: WORKED');
    } catch (e) {
        console.log('❌ gemini-1.5-flash: FAILED (' + e.message + ')');
    }
}

listModels();

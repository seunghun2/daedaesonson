const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/facilities-v2';

async function testV2API() {
    console.log('--- Starting V2 API Test ---');

    // 1. Test GET
    console.log(`\n[TEST 1] Testing GET ${BASE_URL}...`);
    try {
        const res = await fetch(BASE_URL);
        if (!res.ok) throw new Error(`GET failed: ${res.status} ${res.statusText}`);

        const data = await res.json();
        console.log(`GET Success. Fetched ${data.length} items.`);
        if (data.length > 0) {
            console.log('Sample Item Keys:', Object.keys(data[0]));
        }

        // Check for FUNERAL_HOME
        const funeralHomes = data.filter(f => f.category === 'FUNERAL_HOME' || f.category === '장례식장');
        if (funeralHomes.length > 0) {
            console.error(`FAILED: Found ${funeralHomes.length} FUNERAL_HOME items!`);
            console.error('Examples:', funeralHomes.slice(0, 3).map(f => f.name));
        } else {
            console.log('PASSED: No FUNERAL_HOME items found.');
        }

    } catch (e) {
        console.error('GET Test Error:', e.message);
    }

    // 2. Test POST (Create/Update)
    console.log(`\n[TEST 2] Testing POST ${BASE_URL}...`);
    const testId = `test-auto-${Date.now()}`;
    const payload = {
        id: testId,
        name: '[TEST] Auto Generated Facility',
        category: 'OTHER',
        address: 'Test Address 123',
        description: 'Auto test description',
        priceRange: { min: 100, max: 200 },
        isPublic: false
    };

    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (!res.ok) {
            console.error(`POST Failed: ${res.status}`, json);
        } else {
            console.log('POST Success:', json);
            if (json.success) {
                console.log('PASSED: Data saved successfully.');
            } else {
                console.error('FAILED: API returned success: false', json.errors);
            }
        }

    } catch (e) {
        console.error('POST Test Error:', e.message);
    }

    console.log('\n--- Test Complete ---');
}

testV2API();

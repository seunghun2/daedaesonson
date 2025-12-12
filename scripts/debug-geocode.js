const https = require('https');
const fs = require('fs');
const path = require('path');

// .env.local 읽기
let naverId = '';
let naverSecret = '';

try {
    const envPath = path.join(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');

    const idMatch = envContent.match(/NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=(.*)/);
    const secretMatch = envContent.match(/NAVER_MAP_CLIENT_SECRET=(.*)/);

    if (idMatch) naverId = idMatch[1].trim();
    if (secretMatch) naverSecret = secretMatch[1].trim();
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

console.log('--- Config ---');
console.log(`Client ID: ${naverId ? naverId.substring(0, 5) + '...' : 'MISSING'}`);
console.log(`Secret:    ${naverSecret ? naverSecret.substring(0, 5) + '...' : 'MISSING'}`);
console.log('--------------\n');

if (!naverId || !naverSecret) {
    console.error('❌ Keys are missing!');
    process.exit(1);
}

const address = '경기도 성남시 분당구 불정로 6';
const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;

console.log(`Requesting: ${url}`);

const options = {
    headers: {
        'X-NCP-APIGW-API-KEY-ID': naverId,
        'X-NCP-APIGW-API-KEY': naverSecret,
        'Accept': 'application/json'
    }
};

const req = https.get(url, options, (res) => {
    console.log(`\nResponse Status: ${res.statusCode}`);
    console.log('Response Headers:', res.headers);

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('\n--- Body ---');
        console.log(data);
        console.log('------------');

        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error('\n❌ API Error Code:', json.error.errorCode);
                console.error('❌ API Error Message:', json.error.message);
                console.error('❌ API Error Details:', json.error.details);
            } else if (json.addresses && json.addresses.length > 0) {
                console.log('\n✅ Success!');
                console.log(`Lat: ${json.addresses[0].y}`);
                console.log(`Lng: ${json.addresses[0].x}`);
            } else {
                console.log('\n⚠️ No results found.');
            }
        } catch (e) {
            console.error('Failed to parse JSON:', e);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" }
});

const PROMPT = `너는 장례시설 가격표를 정리하는 역할이다.
[1] 카테고리: 매장묘, 봉안당, 수목장, 옵션
[2] 포함: 묘지 사용료, 관리비, 봉안, 수목장, 석물(옵션)
[3] 제외: 시설명, 주소, 전화번호, 장례용품, 장례서비스
[4] 상품명: 일반인이 이해 가능한 표현
[5] 설명: 묘지 사용료="1평(3.3㎡) 기준 묘지 사용료", 관리비="1평당 연간 관리비"
[6] JSON: { "items": [{ "category": "", "itemName": "", "description": "", "price": 0 }] }
[7] 정렬: 매장묘 → 봉안당 → 수목장 → 옵션`;

// 297개 시설
const nums = [660, 661, 664, 668, 672, 676, 679, 682, 683, 688, 689, 692, 694, 695, 697, 700, 703, 706, 712, 715, 717, 720, 721, 723, 724, 726, 727, 728, 731, 732, 738, 740, 746, 767, 768, 773, 778, 782, 789, 790, 794, 802, 803, 814, 815, 817, 821, 828, 831, 834, 835, 836, 847, 848, 852, 853, 857, 876, 881, 885, 889, 894, 895, 898, 899, 900, 902, 903, 904, 906, 910, 911, 913, 917, 919, 921, 922, 925, 926, 932, 937, 939, 943, 944, 946, 947, 948, 949, 950, 952, 955, 956, 959, 961, 962, 963, 964, 965, 966, 967, 968, 969, 970, 976, 977, 979, 980, 981, 983, 984, 985, 986, 988, 989, 990, 991, 992, 993, 994, 995, 997, 999, 1000, 1002, 1005, 1007, 1009, 1010, 1031, 1032, 1033, 1036, 1039, 1041, 1043, 1044, 1045, 1049, 1053, 1054, 1055, 1056, 1057, 1058, 1059, 1063, 1065, 1066, 1067, 1069, 1071, 1072, 1075, 1076, 1077, 1078, 1079, 1084, 1086, 1087, 1091, 1092, 1093, 1095, 1097, 1099, 1100, 1101, 1102, 1103, 1104, 1106, 1109, 1110, 1112, 1113, 1120, 1121, 1122, 1123, 1124, 1129, 1143, 1146, 1147, 1148, 1152, 1153, 1154, 1161, 1162, 1165, 1166, 1171, 1172, 1173, 1177, 1182, 1183, 1184, 1186, 1188, 1190, 1191, 1192, 1198, 1199, 1209, 1213, 1214, 1215, 1216, 1217, 1218, 1219, 1221, 1222, 1225, 1227, 1231, 1232, 1233, 1238, 1246, 1247, 1254, 1256, 1260, 1267, 1269, 1281, 1287, 1288, 1296, 1297, 1301, 1304, 1305, 1307, 1309, 1310, 1311, 1312, 1314, 1316, 1317, 1320, 1321, 1322, 1327, 1329, 1331, 1335, 1336, 1338, 1341, 1342, 1345, 1346, 1347, 1348, 1349, 1354, 1357, 1367, 1369, 1370, 1372, 1373, 1374, 1375, 1376, 1377, 1379, 1381, 1382, 1383, 1385, 1388, 1390, 1391, 1392, 1397, 1398, 1406, 1407, 1415, 1416, 1417, 1418, 1420, 1421, 1423, 1424, 1430, 1431, 1436];

async function loadFacilities() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '0000!A:B'
    });

    const rows = response.data.values || [];
    const archive5Files = fs.readdirSync(path.join(__dirname, '../archive5'));

    const facilities = [];
    for (const num of nums) {
        const id = `park-${String(num).padStart(4, '0')}`;
        let row = -1, name = '';
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === id) { row = i + 1; name = rows[i][1] || ''; break; }
        }
        const pdf = archive5Files.find(f => f.startsWith(`${num}.`));
        if (row > 0 && pdf) {
            facilities.push({ num, name, row });
        }
    }
    return { facilities, sheets };
}

async function processFacility(facility, sheets) {
    const { num, name, row } = facility;
    const facilityId = `park-${String(num).padStart(4, '0')}`;
    const pdfPath = path.join(__dirname, `../archive5/${num}.${name}_price_info.pdf`);

    process.stdout.write(`[${num}] ${name.substring(0, 20)}... `);

    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF없음');
        return { success: false };
    }

    try {
        const pdfData = fs.readFileSync(pdfPath);
        const base64Data = pdfData.toString('base64');

        const result = await model.generateContent([
            PROMPT,
            { inlineData: { data: base64Data, mimeType: "application/pdf" } }
        ]);

        const data = JSON.parse(result.response.text());

        if (!data.items || data.items.length === 0) {
            console.log('⚠️ 항목없음');
            return { success: false };
        }

        const sheetRows = data.items.map(item => [
            facilityId, name, '봉안당', '사설',
            item.category || '봉안당', item.itemName || '', item.description || '',
            String(item.price || 0), ''
        ]);

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A${row}:I${row + sheetRows.length - 1}`,
            valueInputOption: 'RAW',
            resource: { values: sheetRows }
        });

        console.log(`✅ ${sheetRows.length}개`);
        return { success: true };

    } catch (e) {
        console.log(`❌ ${e.message.substring(0, 40)}`);
        return { success: false, error: e.message };
    }
}

async function main() {
    console.log('📋 시설 목록 로딩...');
    const { facilities, sheets } = await loadFacilities();

    console.log(`🚀 ${facilities.length}개 시설 처리 (8~18초 랜덤 간격)\n`);

    let success = 0;
    let failed = [];

    for (let i = 0; i < facilities.length; i++) {
        const result = await processFacility(facilities[i], sheets);
        if (result.success) {
            success++;
        } else {
            failed.push(facilities[i].num);
        }

        if (i < facilities.length - 1) {
            const delay = 8000 + Math.random() * 10000; // 8~18초 랜덤
            await new Promise(r => setTimeout(r, delay));
        }

        if ((i + 1) % 20 === 0) {
            console.log(`--- ${i + 1}/${facilities.length} 완료 (${success}개 성공) ---\n`);
        }
    }

    console.log(`\n✅ 완료! ${success}/${facilities.length}개 성공`);
    if (failed.length > 0) {
        console.log(`❌ 실패: ${failed.join(', ')}`);
    }
}

main().catch(e => console.error('Error:', e.message));

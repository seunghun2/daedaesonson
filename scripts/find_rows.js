const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';

const nums = [660, 661, 664, 668, 672, 676, 679, 682, 683, 688, 689, 692, 694, 695, 697, 700, 703, 706, 712, 715, 717, 720, 721, 723, 724, 726, 727, 728, 731, 732, 738, 740, 746, 767, 768, 773, 778, 782, 789, 790, 794, 802, 803, 814, 815, 817, 821, 828, 831, 834, 835, 836, 847, 848, 852, 853, 857, 876, 881, 885, 889, 894, 895, 898, 899, 900, 902, 903, 904, 906, 910, 911, 913, 917, 919, 921, 922, 925, 926, 932, 937, 939, 943, 944, 946, 947, 948, 949, 950, 952, 955, 956, 959, 961, 962, 963, 964, 965, 966, 967, 968, 969, 970, 976, 977, 979, 980, 981, 983, 984, 985, 986, 988, 989, 990, 991, 992, 993, 994, 995, 997, 999, 1000, 1002, 1005, 1007, 1009, 1010, 1031, 1032, 1033, 1036, 1039, 1041, 1043, 1044, 1045, 1049, 1053, 1054, 1055, 1056, 1057, 1058, 1059, 1063, 1065, 1066, 1067, 1069, 1071, 1072, 1075, 1076, 1077, 1078, 1079, 1084, 1086, 1087, 1091, 1092, 1093, 1095, 1097, 1099, 1100, 1101, 1102, 1103, 1104, 1106, 1109, 1110, 1112, 1113, 1120, 1121, 1122, 1123, 1124, 1129, 1143, 1146, 1147, 1148, 1152, 1153, 1154, 1161, 1162, 1165, 1166, 1171, 1172, 1173, 1177, 1182, 1183, 1184, 1186, 1188, 1190, 1191, 1192, 1198, 1199, 1209, 1213, 1214, 1215, 1216, 1217, 1218, 1219, 1221, 1222, 1225, 1227, 1231, 1232, 1233, 1238, 1246, 1247, 1254, 1256, 1260, 1267, 1269, 1281, 1287, 1288, 1296, 1297, 1301, 1304, 1305, 1307, 1309, 1310, 1311, 1312, 1314, 1316, 1317, 1320, 1321, 1322, 1327, 1329, 1331, 1335, 1336, 1338, 1341, 1342, 1345, 1346, 1347, 1348, 1349, 1354, 1357, 1367, 1369, 1370, 1372, 1373, 1374, 1375, 1376, 1377, 1379, 1381, 1382, 1383, 1385, 1388, 1390, 1391, 1392, 1397, 1398, 1406, 1407, 1415, 1416, 1417, 1418, 1420, 1421, 1423, 1424, 1430, 1431, 1436];

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '0000!A:B'
    });

    const rows = response.data.values || [];
    const archive5Files = fs.readdirSync(path.join(__dirname, '../archive5'));

    let matched = 0;
    let notFound = [];

    console.log('=== 매칭 결과 (처음 30개) ===\n');

    for (let i = 0; i < nums.length; i++) {
        const num = nums[i];
        const id = `park-${String(num).padStart(4, '0')}`;

        let row = -1;
        let name = '';
        for (let j = 0; j < rows.length; j++) {
            if (rows[j][0] === id) {
                row = j + 1;
                name = rows[j][1] || '';
                break;
            }
        }

        const pdf = archive5Files.find(f => f.startsWith(`${num}.`));

        if (row > 0 && pdf) {
            matched++;
            if (i < 30) {
                console.log(`{ num: ${num}, name: '${name.substring(0, 25)}', row: ${row} },`);
            }
        } else {
            notFound.push(num);
        }
    }

    console.log(`\n... 외 ${matched - 30}개\n`);
    console.log(`✅ 매칭 성공: ${matched}개`);
    console.log(`❌ 매칭 실패: ${notFound.length}개`);
    if (notFound.length > 0 && notFound.length <= 20) {
        console.log(`   실패 목록: ${notFound.join(', ')}`);
    }
}
main();

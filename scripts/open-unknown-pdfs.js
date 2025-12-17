const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const crawled = JSON.parse(fs.readFileSync('data/crawled_all.json', 'utf8'));

// 이미 처리된 시설 (공설/사설 확정)
const processed = new Set([
    // 배치 1 - 공설
    'park-0105', 'park-0109', 'park-0119', 'park-0121', 'park-0122',
    'park-0130', 'park-0136', 'park-0141', 'park-0151', 'park-0162',
    'park-0163', 'park-0165', 'park-0166', 'park-0167', 'park-0192',
    'park-0205', 'park-0214', 'park-0250', 'park-0260', 'park-0282',
    // 배치 1 - 사설
    'park-0033', 'park-0116', 'park-0132', 'park-0139', 'park-0143',
    'park-0146', 'park-0147', 'park-0148', 'park-0149', 'park-0155',
    'park-0156', 'park-0158', 'park-0161', 'park-0169', 'park-0172',
    'park-0178', 'park-0193', 'park-0216', 'park-0221', 'park-0227',
    'park-0228', 'park-0242', 'park-0244', 'park-0254', 'park-0266',
    'park-0268', 'park-0269', 'park-0270', 'park-0285', 'park-0290',
    // 배치 2 - 공설
    'park-0292', 'park-0302', 'park-0321', 'park-0343', 'park-0348',
    'park-0358', 'park-0365', 'park-0369', 'park-0380', 'park-0395',
    'park-0396', 'park-0401', 'park-0402', 'park-0415', 'park-0417',
    'park-0424',
    // 배치 2 - 사설
    'park-0293', 'park-0301', 'park-0304', 'park-0307', 'park-0311',
    'park-0338', 'park-0339', 'park-0341', 'park-0352', 'park-0360',
    'park-0371', 'park-0391', 'park-0409', 'park-0431', 'park-0436',
    'park-0437', 'park-0438', 'park-0439', 'park-0442', 'park-0443',
    'park-0444', 'park-0446', 'park-0448', 'park-0449', 'park-0450',
    'park-0451', 'park-0453', 'park-0454', 'park-0456', 'park-0457',
    'park-0458', 'park-0459', 'park-0460', 'park-0462', 'park-0463',
    'park-0465',
    // 배치 3 - 공설
    'park-0476', 'park-0487', 'park-0488', 'park-0500', 'park-0708',
    'park-0722', 'park-0733', 'park-0735', 'park-0736', 'park-0737',
    'park-0742', 'park-0743', 'park-0744', 'park-0745', 'park-0747',
    'park-0749', 'park-0750', 'park-0753', 'park-0755', 'park-0756',
    // 배치 3 - 사설
    'park-0466', 'park-0467', 'park-0468', 'park-0469', 'park-0470',
    'park-0472', 'park-0474', 'park-0481', 'park-0482', 'park-0483',
    'park-0484', 'park-0485', 'park-0490', 'park-0491', 'park-0502',
    'park-0503', 'park-0505', 'park-0506', 'park-0507', 'park-0643',
    'park-0710', 'park-0712', 'park-0713', 'park-0718', 'park-0723',
    'park-0724', 'park-0726', 'park-0730', 'park-0731', 'park-0738',
    // 배치 4 - 공설
    'park-0758', 'park-0762', 'park-0763', 'park-0771', 'park-0777',
    'park-0779', 'park-0785', 'park-0786', 'park-0788', 'park-0793',
    'park-0797', 'park-0799', 'park-0805', 'park-0806', 'park-0812',
    'park-0813', 'park-0816', 'park-0825', 'park-0827', 'park-0830',
    'park-0833', 'park-0846',
    // 배치 4 - 사설
    'park-0757', 'park-0765', 'park-0767', 'park-0768', 'park-0773',
    'park-0775', 'park-0778', 'park-0782', 'park-0789', 'park-0790',
    'park-0792', 'park-0798', 'park-0800', 'park-0802', 'park-0803',
    'park-0804', 'park-0810', 'park-0814', 'park-0815', 'park-0817',
    'park-0818', 'park-0821', 'park-0823', 'park-0831', 'park-0834',
    'park-0835', 'park-0837', 'park-0847',
    // 배치 5 - 공설
    'park-0849', 'park-0855', 'park-0858', 'park-0863', 'park-0864',
    'park-0866', 'park-0867', 'park-0868', 'park-0870', 'park-0872',
    'park-0873', 'park-0874', 'park-0875', 'park-0877', 'park-0878',
    'park-0879', 'park-0882', 'park-0909',
    // 배치 5 - 사설
    'park-0848', 'park-0852', 'park-0853', 'park-0857', 'park-0871',
    'park-0876', 'park-0880', 'park-0881', 'park-0883', 'park-0884',
    'park-0886', 'park-0887', 'park-0888', 'park-0889', 'park-0890',
    'park-0892', 'park-0894', 'park-0896', 'park-0897', 'park-0898',
    'park-0899', 'park-0900', 'park-0902', 'park-0903', 'park-0906',
    'park-0907', 'park-0911', 'park-0912', 'park-0913', 'park-0916',
    'park-0917', 'park-0918', 'park-0919', 'park-0920', 'park-0922',
    'park-0923', 'park-0925', 'park-0926', 'park-0927', 'park-0928',
    'park-0929', 'park-0930', 'park-0932', 'park-0933', 'park-0934',
    'park-0938', 'park-0939', 'park-0940', 'park-0942', 'park-0944',
    'park-0946', 'park-0947', 'park-0950', 'park-0954', 'park-0955',
    'park-0958', 'park-0960', 'park-0961', 'park-0963', 'park-0964',
    'park-0965', 'park-0967',
    // 배치 6 - 공설
    'park-1017', 'park-1018', 'park-1030',
    // 배치 6 - 사설
    'park-0971', 'park-0972', 'park-0973', 'park-0974', 'park-0975',
    'park-0977', 'park-0978', 'park-0979', 'park-0980', 'park-0981',
    'park-0982', 'park-0983', 'park-0985', 'park-0986', 'park-0987',
    'park-0988', 'park-0989', 'park-0990', 'park-0991', 'park-0992',
    'park-0993', 'park-0994', 'park-0997', 'park-0998', 'park-0999',
    'park-1000', 'park-1001', 'park-1003', 'park-1004', 'park-1005',
    'park-1006', 'park-1007', 'park-1010', 'park-1031', 'park-1032',
    'park-1033', 'park-1034', 'park-1038', 'park-1039', 'park-1040',
    'park-1041', 'park-1042', 'park-1043', 'park-1045', 'park-1046',
    'park-1047', 'park-1048', 'park-1049', 'park-1051', 'park-1055',
    'park-1056', 'park-1057', 'park-1059', 'park-1062', 'park-1063',
    'park-1064', 'park-1065', 'park-1067', 'park-1070', 'park-1071',
    'park-1072', 'park-1073', 'park-1074', 'park-1075', 'park-1076',
    'park-1079', 'park-1082', 'park-1083', 'park-1084', 'park-1085',
    'park-1087', 'park-1088', 'park-1090', 'park-1091', 'park-1092',
    'park-1093', 'park-1095',
    // 배치 7 - 공설
    'park-1111', 'park-1115', 'park-1116', 'park-1125', 'park-1126',
    'park-1127', 'park-1134', 'park-1139', 'park-1163', 'park-1236',
    'park-1245', 'park-1248', 'park-1249', 'park-1252', 'park-1261',
    'park-1265', 'park-1266', 'park-1272', 'park-1276', 'park-1277',
    'park-1278', 'park-1279', 'park-1280', 'park-1282', 'park-1283',
    'park-1284', 'park-1286', 'park-1291', 'park-1299', 'park-1324',
    'park-1325', 'park-1328',
    // 배치 7 - 사설
    'park-1097', 'park-1098', 'park-1099', 'park-1100', 'park-1102',
    'park-1103', 'park-1104', 'park-1105', 'park-1106', 'park-1107',
    'park-1109', 'park-1110', 'park-1112', 'park-1113', 'park-1114',
    'park-1120', 'park-1122', 'park-1123', 'park-1145', 'park-1146',
    'park-1147', 'park-1148', 'park-1150', 'park-1152', 'park-1154',
    'park-1164', 'park-1165', 'park-1166', 'park-1167', 'park-1168',
    'park-1169', 'park-1170', 'park-1171', 'park-1172', 'park-1238',
    'park-1246', 'park-1247', 'park-1254', 'park-1256', 'park-1260',
    'park-1262', 'park-1264', 'park-1267', 'park-1269', 'park-1294',
    'park-1296', 'park-1302', 'park-1304', 'park-1305', 'park-1307',
    'park-1309', 'park-1310', 'park-1311', 'park-1312', 'park-1313',
    'park-1315', 'park-1316', 'park-1317', 'park-1318', 'park-1320',
    'park-1321', 'park-1322', 'park-1323', 'park-1326', 'park-1327',
    'park-1329', 'park-1330', 'park-1331'
]);

// 미확인 시설 찾기 (처리된 것 제외)
const unknown = [];

facilities.forEach(f => {
    if (processed.has(f.id)) return; // 이미 처리됨

    const match = crawled.esky.find(item =>
        item.companyname === f.name ||
        item.companyname.includes(f.name.slice(0, 5)) ||
        f.name.includes(item.companyname.slice(0, 5))
    );

    if (!match && !f.name.includes('공설')) {
        unknown.push({ id: f.id, name: f.name, originalName: f.originalName });
    }
});

console.log('남은 미확인 시설:', unknown.length, '개');
console.log('');

// 다음 100개 PDF 열기
const next100 = unknown.slice(0, 100);

next100.forEach((u, i) => {
    console.log((i + 1) + '. ' + u.id + ' | ' + u.name);
});

console.log('');
console.log('PDF 열기...');

// archive 폴더 스캔
const archiveDir = 'archive';
const folders = fs.readdirSync(archiveDir);

let opened = 0;
next100.forEach((u, i) => {
    // originalName에서 번호 추출
    const origName = u.originalName || '';
    const numMatch = origName.match(/^(\d+)\./);
    if (numMatch) {
        const num = numMatch[1];
        // 폴더 찾기
        const folder = folders.find(f => f.startsWith(num + '.'));
        if (folder) {
            const folderPath = path.join(archiveDir, folder);
            const files = fs.readdirSync(folderPath);
            const pdfFile = files.find(f => f.endsWith('_price_info.pdf'));
            if (pdfFile) {
                const pdfPath = path.join(folderPath, pdfFile);
                exec(`open "${pdfPath}"`);
                opened++;
            }
        }
    }
});

console.log('열린 PDF:', opened, '개');

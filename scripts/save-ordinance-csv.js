const fs = require('fs');

// 파싱된 데이터 로드
const parsedData = JSON.parse(fs.readFileSync('data/ordinance_hwp/parsed_all.json'));
console.log(`파싱된 파일: ${parsedData.length}개\n`);

// CSV 헤더
const headers = ['지자체', '파일명', '가격개수', '텍스트개수', '가격목록', '라벨목록'];
const rows = [headers.join(',')];

// 데이터 행 생성
parsedData.forEach(d => {
    const row = [
        d.region,
        `"${d.file}"`,
        d.prices.length,
        d.allTexts.length,
        `"${d.prices.slice(0, 10).join(', ')}"`, // 처음 10개만
        `"${(d.labels || []).slice(0, 10).join(', ')}"` // 처음 10개만
    ];
    rows.push(row.join(','));
});

// CSV 저장
fs.writeFileSync('data/ordinance_hwp/ordinance_summary.csv', rows.join('\n'));
console.log('저장 완료: data/ordinance_hwp/ordinance_summary.csv');
console.log(`총 ${parsedData.length}개 파일 처리됨\n`);

// 지자체별 요약 출력
console.log('=== 지자체별 요약 ===');
parsedData.forEach(d => {
    console.log(`${d.region}: ${d.file.substring(0, 40)}... (가격 ${d.prices.length}개)`);
});

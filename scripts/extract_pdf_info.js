const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * PDF에서 시설 정보를 추출하는 스크립트
 * archive 폴더의 각 시설 PDF를 읽어서 정보를 추출합니다.
 */

// 추출할 정보 패턴
const patterns = {
    facilityType: /(사설|공설|법인|종교)/,
    name: /^(.+?)$/m,
    address: /주소[:\s]*(.+?)(?:\n|$)/i,
    phone: /전화번호[:\s]*([\d-]+)/i,
    fax: /팩스번호[:\s]*([\d-]+)/i,
    capacity: /총매장능력[:\s]*([\d,]+)\s*개/i,
    website: /(https?:\/\/[^\s]+)/i,
    update: /(\d+개월전|[0-9]{4}\.[0-9]{2}\.[0-9]{2})/i
};

async function extractPDFInfo(pdfPath) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const text = data.text;

        console.log(`\n analyzing: ${path.basename(pdfPath)}`);
        console.log('─'.repeat(80));
        console.log('텍스트 내용:\n', text.substring(0, 500));
        console.log('─'.repeat(80));

        // 정보 추출
        const info = {
            no: null,
            facilityType: null,
            name: null,
            website: null,
            address: null,
            phone: null,
            fax: null,
            capacity: null,
            amenities: [],
            update: null
        };

        // 파일명에서 번호와 이름 추출
        const filename = path.basename(pdfPath, '_price_info.pdf');
        const match = filename.match(/^(\d+)\.(.*)/);
        if (match) {
            info.no = match[1];
            info.name = match[2];
        }

        // 텍스트에서 각 필드 추출
        const typeMatch = text.match(patterns.facilityType);
        if (typeMatch) info.facilityType = typeMatch[1];

        // 주소와 전화번호 추출 (개선된 패턴)
        // 패턴: "주소" 앞의 텍스트, 그 다음 전화번호
        const addressPhonePattern = /(.+?)주소\s*([\d-]+)전화번호/s;
        const addressPhoneMatch = text.match(addressPhonePattern);
        if (addressPhoneMatch) {
            // 주소는 마지막 줄만 (앞에 다른 정보가 붙어있을 수 있음)
            const addressLines = addressPhoneMatch[1].trim().split('\n');
            info.address = addressLines[addressLines.length - 1].trim();
            info.phone = addressPhoneMatch[2].trim();
        }

        // 팩스번호 추출
        const faxPattern = /([\d-]+)팩스번호/;
        const faxMatch = text.match(faxPattern);
        if (faxMatch && faxMatch[1] !== '-') {
            info.fax = faxMatch[1].trim();
        }

        // 총매장능력 추출 (개선: 공백이나 줄바꿈 없이 붙어있을 수 있음)
        const capacityPattern = /총매장능력\s*([\d,]+)\s*개/;
        const capacityMatch = text.match(capacityPattern);
        if (capacityMatch) {
            info.capacity = capacityMatch[1].replace(/,/g, '');
        }

        // 웹사이트 추출 (있는 경우만)
        const websitePattern = /(https?:\/\/[^\s<>"']+)/;
        const websiteMatch = text.match(websitePattern);
        if (websiteMatch) {
            info.website = websiteMatch[1];
        }

        // 업데이트 정보 추출 (개선)
        const updatePattern = /(\d+개월전)\s*업데이트/;
        const updateMatch = text.match(updatePattern);
        if (updateMatch) {
            info.update = updateMatch[1];
        }

        // 편의시설 아이콘 추출 (텍스트에서 키워드 찾기)
        const amenityKeywords = {
            '편의시설': '🍴',
            '주차': '🅿️',
            '화장실': '🚻',
            '휠체어': '♿',
            '엘리베이터': '🛗'
        };

        for (const [keyword, icon] of Object.entries(amenityKeywords)) {
            if (text.includes(keyword)) {
                info.amenities.push({ keyword, icon });
            }
        }

        return info;
    } catch (error) {
        console.error(`Error processing ${pdfPath}:`, error.message);
        return null;
    }
}

async function processAllPDFs() {
    const archiveDir = path.join(__dirname, '..', 'archive');
    const facilities = fs.readdirSync(archiveDir)
        .filter(item => {
            const fullPath = path.join(archiveDir, item);
            return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
        })
        .sort((a, b) => {
            // 번호 추출해서 숫자로 정렬
            const numA = parseInt(a.match(/^(\d+)/)?.[1] || '99999');
            const numB = parseInt(b.match(/^(\d+)/)?.[1] || '99999');
            return numA - numB;
        });

    console.log(`Found ${facilities.length} facility folders`);

    const results = [];
    let processed = 0;

    for (const facility of facilities) { // 전체 처리
        const facilityPath = path.join(archiveDir, facility);
        const pdfFiles = fs.readdirSync(facilityPath)
            .filter(file => file.endsWith('_price_info.pdf'));

        if (pdfFiles.length > 0) {
            const pdfPath = path.join(facilityPath, pdfFiles[0]);
            const info = await extractPDFInfo(pdfPath);

            if (info) {
                results.push(info);
                processed++;
                console.log(`✓ Processed: ${info.name} (${processed}/${facilities.length})`);
            }
        }
    }

    // 결과를 JSON 파일로 저장
    const outputPath = path.join(__dirname, '..', 'extracted_facility_info.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n✅ Saved ${results.length} facilities to ${outputPath}`);

    return results;
}

// 실행
if (require.main === module) {
    processAllPDFs()
        .then(results => {
            console.log('\n📊 Summary:');
            console.log(`Total processed: ${results.length}`);
            console.log('\nSample result:');
            console.log(JSON.stringify(results[0], null, 2));
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = { extractPDFInfo, processAllPDFs };

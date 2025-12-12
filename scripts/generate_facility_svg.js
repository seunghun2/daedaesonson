const fs = require('fs');
const path = require('path');

/**
 * 추출된 시설 정보를 SVG로 시각화하는 스크립트
 */

function generateFacilitySVG(facility, width = 600, height = 400) {
    const iconMap = {
        '사설': '🏢',
        '공설': '🏛️',
        '법인': '🏛️',
        '종교': '⛪'
    };

    const typeIcon = iconMap[facility.facilityType] || '📍';

    // 주소를 짧게 표시
    const shortAddress = facility.address ? facility.address.substring(0, 40) + (facility.address.length > 40 ? '...' : '') : 'N/A';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardGradient${facility.no}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- 배경 카드 -->
  <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="15" 
        fill="url(#cardGradient${facility.no})" filter="url(#shadow)"/>
  
  <!-- 헤더 섹션 -->
  <rect x="20" y="20" width="${width - 40}" height="80" rx="10" fill="rgba(255,255,255,0.95)"/>
  
  <!-- 번호 배지 -->
  <circle cx="50" cy="60" r="25" fill="#FF6B6B"/>
  <text x="50" y="68" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
        fill="white" text-anchor="middle">${facility.no}</text>
  
  <!-- 타입 아이콘 -->
  <text x="90" y="50" font-size="24">${typeIcon}</text>
  
  <!-- 시설명 -->
  <text x="90" y="75" font-family="Arial, sans-serif" font-size="20" font-weight="bold" 
        fill="#2d3748">${facility.name || 'Unknown'}</text>
  
  <!-- 타입 라벨 -->
  <rect x="${width - 120}" y="30" width="80" height="25" rx="12" fill="#4ECDC4"/>
  <text x="${width - 80}" y="48" font-family="Arial, sans-serif" font-size="12" 
        fill="white" text-anchor="middle">${facility.facilityType || 'N/A'}</text>
  
  <!-- 정보 섹션 배경 -->
  <rect x="20" y="110" width="${width - 40}" height="${height - 140}" rx="10" fill="rgba(255,255,255,0.9)"/>
  
  <!-- 주소 -->
  <text x="35" y="135" font-family="Arial, sans-serif" font-size="14" fill="#4a5568">
    <tspan font-weight="bold">📍 주소:</tspan>
  </text>
  <text x="35" y="155" font-family="Arial, sans-serif" font-size="12" fill="#718096">
    ${shortAddress}
  </text>
  
  <!-- 전화번호 -->
  <text x="35" y="185" font-family="Arial, sans-serif" font-size="14" fill="#4a5568">
    <tspan font-weight="bold">📞 전화:</tspan>
    <tspan x="100" font-size="13" fill="#2d3748">${facility.phone || 'N/A'}</tspan>
  </text>
  
  <!-- 팩스 -->
  ${facility.fax ? `
  <text x="35" y="210" font-family="Arial, sans-serif" font-size="14" fill="#4a5568">
    <tspan font-weight="bold">📠 팩스:</tspan>
    <tspan x="100" font-size="13" fill="#2d3748">${facility.fax}</tspan>
  </text>
  ` : ''}
  
  <!-- 총매장능력 -->
  ${facility.capacity ? `
  <text x="35" y="${facility.fax ? 235 : 210}" font-family="Arial, sans-serif" font-size="14" fill="#4a5568">
    <tspan font-weight="bold">📊 매장능력:</tspan>
    <tspan x="145" font-size="13" fill="#2d3748" font-weight="bold">${Number(facility.capacity).toLocaleString()}개</tspan>
  </text>
  ` : ''}
  
  <!-- 웹사이트 -->
  ${facility.website ? `
  <text x="35" y="${facility.capacity ? 260 : 235}" font-family="Arial, sans-serif" font-size="14" fill="#4a5568">
    <tspan font-weight="bold">🌐 웹사이트:</tspan>
  </text>
  <text x="35" y="${facility.capacity ? 280 : 255}" font-family="Arial, sans-serif" font-size="11" 
        fill="#4299e1" text-decoration="underline">
    ${facility.website.substring(0, 50)}
  </text>
  ` : ''}
  
  <!-- 편의시설 아이콘 -->
  ${facility.amenities && facility.amenities.length > 0 ? `
  <text x="35" y="${height - 60}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#4a5568">
    편의시설:
  </text>
  ${facility.amenities.map((amenity, index) => `
    <text x="${120 + index * 35}" y="${height - 60}" font-size="20">${amenity.icon}</text>
  `).join('')}
  ` : ''}
  
  <!-- 업데이트 정보 -->
  <text x="${width - 30}" y="${height - 25}" font-family="Arial, sans-serif" font-size="10" 
        fill="#a0aec0" text-anchor="end">
    업데이트: ${facility.update || 'N/A'}
  </text>
</svg>`;

    return svg;
}

function generateAllFacilitiesSVG(facilities) {
    const cardsPerRow = 2;
    const cardWidth = 600;
    const cardHeight = 400;
    const margin = 20;

    const totalRows = Math.ceil(facilities.length / cardsPerRow);
    const totalWidth = (cardWidth + margin) * cardsPerRow + margin;
    const totalHeight = (cardHeight + margin) * totalRows + margin + 60; // +60 for title

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f7fafc;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#edf2f7;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 배경 -->
  <rect width="${totalWidth}" height="${totalHeight}" fill="url(#bgGradient)"/>
  
  <!-- 제목 -->
  <text x="${totalWidth / 2}" y="40" font-family="Arial, sans-serif" font-size="28" 
        font-weight="bold" fill="#2d3748" text-anchor="middle">
    장사시설 정보 대시보드
  </text>
  
  <!-- 개별 카드들 -->
`;

    facilities.forEach((facility, index) => {
        const row = Math.floor(index / cardsPerRow);
        const col = index % cardsPerRow;
        const x = margin + col * (cardWidth + margin);
        const y = 60 + margin + row * (cardHeight + margin);

        const cardSVG = generateFacilitySVG(facility, cardWidth, cardHeight);
        // Extract only the inner content (without XML declaration and outer svg tag)
        const innerContent = cardSVG
            .replace(/<\?xml[^?]*\?>\n/, '')
            .replace(/<svg[^>]*>/, `<g transform="translate(${x}, ${y})">`)
            .replace(/<\/svg>/, '</g>');

        svgContent += innerContent + '\n';
    });

    svgContent += '</svg>';
    return svgContent;
}

async function main() {
    const inputFile = path.join(__dirname, '..', 'extracted_facility_info.json');
    const outputDir = path.join(__dirname, '..', 'facility_svg');

    // 출력 디렉토리 생성
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // JSON 파일 읽기
    const facilities = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

    console.log(`📊 Generating SVG for ${facilities.length} facilities...`);

    // 개별 SVG 파일 생성
    facilities.forEach((facility, index) => {
        const svg = generateFacilitySVG(facility);
        const filename = `${facility.no}.${facility.name.replace(/[\/\\?%*:|"<>]/g, '_')}.svg`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, svg, 'utf-8');

        if ((index + 1) % 10 === 0) {
            console.log(`✓ Generated ${index + 1}/${facilities.length} SVG files`);
        }
    });

    // 전체 대시보드 SVG 생성
    const dashboardSVG = generateAllFacilitiesSVG(facilities);
    const dashboardPath = path.join(outputDir, '_dashboard.svg');
    fs.writeFileSync(dashboardPath, dashboardSVG, 'utf-8');

    console.log(`\n✅ Completed! Generated ${facilities.length} individual SVG files`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`📊 Dashboard: ${dashboardPath}`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateFacilitySVG, generateAllFacilitiesSVG };

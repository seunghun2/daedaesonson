const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 Injecting Gold Standard Data for Seonsan (선산공원묘원)...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// Find "선산공원묘원"
let fIndex = facilities.findIndex(f => f.name.includes("선산"));

if (fIndex === -1) {
    if (facilities[8]) console.log("Checking ID park-0009: " + facilities[8].name);
    // Try park-0009
    fIndex = facilities.findIndex(f => f.id === 'park-0009');
}

if (fIndex === -1) {
    console.error("❌ Facility (선산공원묘원) not found!");
    process.exit(1);
}

const target = facilities[fIndex];
console.log(`Found Seonsan at ID: ${target.id}`);

const perfectPricing = {
    '매장묘': {
        rows: [
            {
                name: "묘지 사용료 (기본형)",
                price: 15000000,
                description: "영구 사용계약 (1,500만원부터)",
                isRepresentative: true // 1,500만원부터
            },
            {
                name: "묘지 사용료 (중~고급형)",
                price: 25000000,
                description: "2,500 ~ 5,000만원 (위치/면적 상이)",
                isRepresentative: false
            }
        ]
    },
    '봉안당': {
        rows: [
            { name: "무연고 사용료 (10년)", price: 3000000, description: "최소 진입가", isRepresentative: true },
            { name: "유연고 사용료 (30년)", price: 10000000, description: "장기 안치 기준", isRepresentative: false },
            { name: "안치식 장례비", price: 3000000, description: "", isRepresentative: false }, // Should this be option? User listed under "개인 봉안묘" products vs costs. 
            // User categorization: "개인 봉안묘 (1위 기준)" -> list of items. 
            // I'll put specific "Products" here if they essentially define the slot.
            // But "장례비", "설치비" sound like options.
            // Wait, "무연고 사용료" is slot fee. 
            // Let's add the "개인 봉안묘" packaged items if possible, or list components?
            // User says "대표가는 300부터".
            // I will put "무연고 사용료" and "유연고 사용료" as main products.
            // And put the installation/funeral fees in Option or as separate items?
            // "석물 포함 설치: 10,900,000" sounds like a packaged product price. 
            // Let's add that as a bundle product.
            { name: "석물 포함 설치 봉안묘", price: 10900000, description: "설치공사+석물 포함", isRepresentative: false },
            { name: "2위용 석물 봉안묘", price: 20400000, description: "", isRepresentative: false }
        ]
    },
    '수목장': {
        rows: [
            { name: "산골장 (개인)", price: 6000000, description: "수목장 최소 진입가", isRepresentative: true },
            { name: "잔디장 (개인)", price: 10000000, description: "", isRepresentative: false },
            { name: "화초장 (개인)", price: 12000000, description: "연산홍 10주 포함", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            // Management
            { name: "연간 관리비", price: 130000, description: "1평 / 1년", isRepresentative: false },
            { name: "영구납 관리비", price: 7800000, description: "60년 기준 선납", isRepresentative: false },

            // Stone / Basic Options
            { name: "해미석", price: 350000, description: "", isRepresentative: false },
            { name: "경계석", price: 750000, description: "1m 기준", isRepresentative: false },
            { name: "각자비 기본", price: 800000, description: "", isRepresentative: false },
            { name: "화병 (고급형)", price: 1000000, description: "", isRepresentative: false },

            // Mid-High Stone Options
            { name: "와비 (중형)", price: 5000000, description: "", isRepresentative: false },
            { name: "와비 (대형)", price: 7000000, description: "", isRepresentative: false },
            { name: "비석 (오석)", price: 6000000, description: "", isRepresentative: false },

            // Sets
            { name: "기본형 석물 세트", price: 10000000, description: "비석·상석·향로·화병", isRepresentative: false },
            { name: "상석 단품 (고급형)", price: 10000000, description: "", isRepresentative: false },
            { name: "석등 세트", price: 15000000, description: "", isRepresentative: false },

            // Duleseok
            { name: "C형 둘레석", price: 13000000, description: "", isRepresentative: false },
            { name: "B형 둘레석", price: 15000000, description: "", isRepresentative: false },
            { name: "A형 둘레석", price: 23000000, description: "", isRepresentative: false },
            { name: "A형 합장 둘레석", price: 25000000, description: "", isRepresentative: false },

            // Funeral / Make fees
            { name: "매장식 장례비", price: 4300000, description: "", isRepresentative: false },
            { name: "설치공사비", price: 9500000, description: "", isRepresentative: false },
            { name: "분묘 설치비 (평묘)", price: 13000000, description: "~ 1,700만원", isRepresentative: false }
        ]
    }
};

target.pricing = perfectPricing;

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Seonsan (선산공원묘원) Data has been reset to the Gold Standard.");
console.log(JSON.stringify(perfectPricing, null, 2));

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0025');
if (parkIndex === -1) {
  console.error('park-0025 not found');
  process.exit(1);
}

const park = data[parkIndex];

// park-0025: 금릉공원묘원 (Burial default, has Charnel house items)
// We will replace standardizedPrices for park-0025 based on the image

const newPrices = [
  // --- 매장묘 (BURIAL) ---
  {
    serviceType: "BURIAL",
    subType: "매장묘 토지 및 관리비",
    groupType: "매장묘 사용료 및 관리비 (필수)",
    rows: [
      {
        itemName: "묘지 사용료",
        description: "㎡ 당 토지 사용료",
        price: 728000,
        feeType: "USAGE",
        grade: "㎡단위",
        note: ""
      },
      {
        itemName: "묘지 관리비",
        description: "㎡ 당 1년 관리비 (15년 선납)",
        price: 6060,
        feeType: "MAINTENANCE",
        grade: "㎡단위",
        note: "15년 선납 필수"
      }
    ]
  },
  // --- 봉안당(야외 봉안묘/봉안담 추정) 항목들 (BONGSAN) ---
  // The image shows "석물_XX기납골", which means outdoor charnel types (Bongsan/Bongandam). Let's use CHARNEL_HOUSE or BONGSAN. "석물" usually implies Bongsan. Let's use BONGSAN.
  {
    serviceType: "BONGSAN",
    subType: "봉안묘 분양 및 추가 비용",
    groupType: "봉안묘 분양 (선택)",
    rows: [
      {
        itemName: "석물_1기평장",
        description: "1기 평장 석물",
        price: 1804000,
        feeType: "USAGE",
        grade: "1기",
        note: ""
      },
       {
        itemName: "석물_2기평장",
        description: "2기 평장 석물",
        price: 4521000,
        feeType: "USAGE",
        grade: "2기",
        note: ""
      },
      {
        itemName: "석물_6기납골",
        description: "6기 납골 석물",
        price: 26092000,
        feeType: "USAGE",
        grade: "6기",
        note: ""
      },
      {
        itemName: "석물_8기납골",
        description: "8기 납골 석물",
        price: 27027000,
        feeType: "USAGE",
        grade: "8기",
        note: ""
      },
      {
        itemName: "석물_12기납골",
        description: "12기 납골 석물",
        price: 38247000,
        feeType: "USAGE",
        grade: "12기",
        note: ""
      },
      {
        itemName: "석물_24기납골",
        description: "24기 납골 석물",
        price: 56925000,
        feeType: "USAGE",
        grade: "24기",
        note: ""
      },
      {
        itemName: "석물_32기납골",
        description: "32기 납골 석물",
        price: 105809000,
        feeType: "USAGE",
        grade: "32기",
        note: ""
      },
      {
        itemName: "석물_화강석일반세트",
        description: "화강석 일반 세트 석물",
        price: 4334000,
        feeType: "STONE",
        grade: null,
        note: ""
      },
      {
        itemName: "석물_화강석고급세트",
        description: "화강석 고급 세트 석물",
        price: 8525000,
        feeType: "STONE",
        grade: null,
        note: ""
      },
      {
        itemName: "석물_고흥석고급세트",
        description: "고흥석 고급 세트 석물",
        price: 9812000,
        feeType: "STONE",
        grade: null,
        note: ""
      },
      {
        itemName: "석물_오석고급세트",
        description: "오석 고급 세트 석물",
        price: 18018000,
        feeType: "STONE",
        grade: null,
        note: ""
      }
    ]
  },
  // --- 기타 부대시설 및 물품 (FUNERAL_HOME / USAGE) ---
  {
      serviceType: "BURIAL", // Adding to BURIAL as general additional costs
      subType: "기타 시설 및 물품 사용료",
      groupType: "기타 부대비용 및 물품 (선택)",
      rows: [
        {
          itemName: "식당사용료",
          description: "식당 시설 사용료",
          price: 100000,
          feeType: "USAGE",
          grade: null,
          note: ""
        },
        {
          itemName: "조화_대",
          description: "조화 (대)",
          price: 10000,
          feeType: "USAGE",
          grade: "대",
          note: ""
        },
        {
          itemName: "조화_특대",
          description: "조화 (특대)",
          price: 15000,
          feeType: "USAGE",
          grade: "특대",
          note: ""
        },
        {
          itemName: "제례실 사용료",
          description: "제례실 시설 사용료",
          price: 50000,
          feeType: "USAGE",
          grade: null,
          note: ""
        },
         {
          itemName: "목함",
          description: "목함 (20*20/중국산)",
          price: 25000,
          feeType: "USAGE",
          grade: "기타물품",
          note: "규격:20*20, 원산지:중국산"
        },
        {
          itemName: "유골함",
          description: "유골함 (도자기/국산)",
          price: 242000,
          feeType: "USAGE",
          grade: "기타물품",
          note: "재질:도자기, 원산지:국산"
        },
        {
          itemName: "위패",
          description: "위패 (오석/중국산)",
          price: 110000,
          feeType: "USAGE",
          grade: "기타물품",
          note: "재질:오석, 원산지:중국산"
        }
      ]
  }
];

if (!park.priceInfo) {
  park.priceInfo = {};
}
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0025 prices updated successfully.');

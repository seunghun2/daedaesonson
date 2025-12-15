#!/bin/bash
# 함평군해오름추모공원 ID 찾기 및 가격 업데이트

echo "🔍 시설 찾는 중..."
# ID 추출 (curl 결과를 node로 파싱)
FACILITY_ID=$(curl -s "http://localhost:3000/api/facilities" | \
  node -e "
    try {
      const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
      const f = data.find(x => x.name && x.name.includes('해오름'));
      if (f) console.log(f.id);
    } catch(e) {}
  ")

if [ -z "$FACILITY_ID" ]; then
  echo "❌ 시설을 찾을 수 없습니다."
  exit 1
fi

echo "✅ 시설 ID: $FACILITY_ID"

# 가격 데이터 (아까 분석한 내용)
JSON_DATA='{
  "pricing": {
    "매장묘": {
      "category": "burial",
      "rows": [
        {"name": "개인평장", "price": 150, "description": "1기"},
        {"name": "부부평장", "price": 300, "description": "1기"},
        {"name": "가족평장", "price": 500, "description": "20년, 4위 기준"}
      ]
    },
    "봉안당": {
      "category": "charnel",
      "rows": [
        {"name": "개인단", "price": 150, "description": "15년"},
        {"name": "개인쌍단", "price": 220, "description": "15년"},
        {"name": "부부단", "price": 350, "description": "15년"},
        {"name": "가족단", "price": 1500, "description": "15년"}
      ]
    },
    "수목장": {
      "category": "natural",
      "rows": [
        {"name": "가족형", "price": 1000, "description": "최대 8인"},
        {"name": "부부형", "price": 600, "description": "최대 2인"},
        {"name": "개인형", "price": 300, "description": "최대 1인"}
      ]
    },
    "기타": {
      "category": "other",
      "rows": [
        {"name": "잔디형", "price": 1000, "description": "최대 2인"},
        {"name": "정원형", "price": 2000, "description": "최대 2인"}
      ]
    }
  }
}'

echo "💾 가격 정보 저장 중..."
curl -X PUT "http://localhost:3000/api/facilities/${FACILITY_ID}" \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA"

echo ""
echo "🎉 업데이트 완료!"

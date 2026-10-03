# 시트·후보 스키마

## 1. 후보 JSONL (`data/enrichment/<RUN>/candidates/<source>.jsonl`, 한 줄 = 한 시설)

```json
{
  "source": "esky",                      // config/sources.json 의 id
  "source_url": "https://...",           // 이 정보를 찾은 정확한 페이지
  "captured_at": "2026-10-03",           // 수집일
  "published_at": "2025-03-01",          // (선택) 페이지/고시 게시일·적용일
  "matched_facility_id": "park-0001",    // (선택) 확신할 때만. 없으면 스크립트가 이름/주소/전화/좌표로 매칭
  "facility": { "name": "...", "address": "...", "phone": "...", "lat": 37.1, "lng": 127.1 },
  "prices": [
    {
      "category": "사용료",               // 사용료|관리비|안치료|조성비|... (기존 priceTable 카테고리명 우선)
      "item_name": "봉안당 개인단 1단",
      "grade": "1단",                    // (선택)
      "group_type": "",                  // (선택)
      "price": "1,500,000원",            // 숫자 또는 "150만원" 문자열 모두 가능 → 원 단위로 파싱
      "unit": "1기/15년",                 // (선택)
      "extraction_conf": 0.9,            // 추출 확신도 0~1 (표 구조가 명확=0.9+, OCR=0.6~0.8)
      "evidence": "봉안당 개인단 1단 150만원 (15년)"  // 원문 인용 필수
    }
  ],
  "images": [
    {
      "url": "https://.../photo.jpg",
      "width": 1600, "height": 1000,     // 알면 기입
      "label": "전경",                    // config/scoring.json image.good_labels / bad_labels 중 하나
      "label_conf": 0.9,
      "dhash": "ffff0000ffff0000",       // (선택) 64bit dHash 16자리 hex. 중복 판정용
      "license": "official"              // (선택) 출처 기본값을 덮어씀. 'none' 출처는 덮어쓸 수 없음
    }
  ]
}
```
규칙: `evidence` 없는 가격, 해석 불가한 가격은 `REJECT` 처리됨. 한 줄 JSON 이어야 함(줄바꿈 금지).

## 2. 원본 시트 (`export_master.mjs`)
- `00_master_facilities.csv`: `facility_id, facility_name, category, address, phone, lat, lng, website_url, view_count, image_count, price_rows, price_rows_positive, gaps, priority_score, priority_grade, ...`
  - `gaps`: 가격없음 / 가격항목부족(<3) / 이미지없음 / 이미지부족(<4) / 홈페이지없음 / 전화없음
  - `priority_score` = 결손 크기 × log10(조회수+10). 등급 S(상위10%)/A(30%)/B(60%)/C/D(결손 없음)
- `01_master_prices.csv`: 시설별 가격 행 (`row_key` = 카테고리|항목|등급 정규화 키; 업데이트와의 조인 키)
- `01_master_images.csv`: 시설별 이미지 URL
- `crawl_queue.json`: D 제외 시설 목록(기존 가격 키 `existing_price_keys` 포함 → 이미 있는 건 건너뛰기 가능)

## 3. 가격 업데이트 시트 (`02_price_updates.csv`)
| 열 | 의미 |
|---|---|
| `update_id` | P00001… |
| `action` | **NEW** 원본에 없는 항목 / **FILL** 항목은 있으나 가격 비어있음 / **CONFIRM** 5% 이내 동일 / **UPDATE** 5~15% 차이 / **CONFLICT** 15%+ 차이 |
| `current_price`, `new_price`, `diff_pct` | 원본 vs 후보 |
| `match_score`, `match_status`, `f_*` | 시설 매칭 점수와 특징(이름/주소/전화/좌표) |
| `trust`, `extraction_conf`, `freshness`, `sanity`, `confidence` | 신뢰도 구성요소와 곱 |
| `auto_status` | AUTO_APPROVE / REVIEW / REJECT |
| **`review_decision`** | 사람 입력: Y / N / E / X |
| `final_price` | E 일 때 사람이 고친 가격 |

## 4. 이미지 업데이트 시트 (`03_image_updates.csv`)
`image_url, width, height, label, license, min_hamming(기존/동일시설 이미지와 최소 해밍거리), size_score, label_score, novelty, confidence, auto_status, reasons`
사람 입력: `review_decision`(Y/N/X), `as_thumbnail`(Y 이면 대표 이미지로).

## 5. 미매칭 (`04_unmatched.csv`)
어떤 시설에도 매칭 안 된 후보. 사람이 `correct_facility_id` 를 적어주면 다음 실행에서 `matched_facility_id` 힌트로 재사용.

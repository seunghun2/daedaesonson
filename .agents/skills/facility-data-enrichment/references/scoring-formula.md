# 점수 공식

설정은 모두 `config/scoring.json`. 공식 자체는 `scripts/lib.mjs`(`matchScore`, `freshness`, `priceSanity`)와 `build_update_sheets.mjs`.

## 1. 시설 매칭 M (0~1)
`M = Σ wᵢ·sᵢ / Σ wᵢ` (값이 있는 신호만)

| 신호 | 가중치 | 계산 |
|---|---|---|
| name_sim 0.40 | 이름 정규화(㈜·재단법인 등 제거) 후 Dice 이중문자 유사도, 한쪽이 다른 쪽을 포함하면 최소 0.9 |
| addr_sim 0.25 | 시도 약칭 통일(서울→서울특별시 등) 후 Dice |
| phone_score 0.20 | 숫자 일치 1.0 / 뒤 8자리 일치 0.8 / 불일치 0 |
| geo_score 0.15 | `1 − 거리km / 2km` (2km 이상이면 0) |

- `name_sim < 0.45` 이면 `M` 을 0.65 로 상한 (이름이 다르면 다른 시설일 가능성이 높음).
- `M ≥ 0.85` accept, `0.65 ≤ M < 0.85` review(검수 필수), 미만 unmatched.

## 2. 가격 신뢰도
`confidence = M × trust × extraction_conf × freshness × sanity`
- `trust`: 출처별(`sources.json`) 공식 1.0 / e하늘 0.95 / 조례 0.92 / 지자체 0.90 / 네이버 0.55 / 중개 0.55~0.60 / 블로그 0.30
- `freshness`: 반감기 18개월 지수감쇠 (하한 0.5, 날짜 불명 0.7)
- `sanity`: 카테고리 상식 범위 밖이면 0(반려), 기존값 대비 3배↑ 이면 0.5, 10배↑ 이면 0
- `AUTO_APPROVE` 조건: `confidence ≥ 0.85` AND `match_status = accept` AND `action ∈ {NEW, FILL, CONFIRM}`. UPDATE·CONFLICT 는 항상 사람.
- `REJECT`: 가격 해석 불가 / sanity 0 / `confidence < 0.50`

## 3. 이미지 신뢰도
`confidence = M × label_score × size_score × novelty × (license ∈ {official, public} ? 1 : 0.6)`
- `size_score`: 800×500 미만이면 0(반려), 그 이상이면 0.5~1.0
- `label_score`: bad_labels(지도·로고·인물·가격표 등) 0, good_labels 이면 label_conf, 그 외 label_conf×0.6
- `novelty`: 기존·동일시설 이미지와 dHash 해밍거리 ≤ 6 이면 0(중복)
- 시설당 신규 최대 8장. 라이선스 OK + `confidence ≥ 0.80` + 매칭 accept 만 `AUTO_APPROVE`.
- 라이선스 불명 이미지는 `apply_approved.mjs` 가 `--allow-unlicensed` 없이는 업로드 거부.

## 4. 공식 개선 루프
`tune_formula.mjs` 가 검수 라벨(Y/E=정답, N=값 부적합, X=오매칭)로
1. 매칭 가중치·accept 임계값을 격자탐색 (F0.5: 오탐 억제 우선, 현행 가중치와 가까운 해 선호)
2. 자동승인 임계값을 **정밀도 98%(가격)/95%(이미지)** 를 만족하는 최소값으로 설정
3. 출처별 정밀도로 trust 를 베이지안 평활 제안 (사전값 2건 가중)
→ `config/scoring.suggested.json`. **자동 덮어쓰기 없음** — 사람이 diff 확인 후 `scoring.json` 에 반영.
표본 30건 미만이면 아무것도 바꾸지 않는다.

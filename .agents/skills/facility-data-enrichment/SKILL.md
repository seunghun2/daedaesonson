---
name: facility-data-enrichment
description: 대대손손 시설 DB(원본)를 기준으로 다른 사이트(e하늘·공식홈페이지·조례·지자체 등)를 순회해 누락된 가격·이미지를 찾아 업데이트 시트로 만들고, 사람 검수 후 DB에 반영하며, 검수 결과로 신뢰도 공식을 개선하는 워크플로우. "가격 더 찾아줘", "이미지 보강", "다른 사이트와 비교", "원본 대비 업데이트 시트" 요청 시 사용.
---

# 시설 데이터 보강 (Facility Data Enrichment)

우리 DB = **원본(master)**. 다른 사이트는 **후보(candidate)**. 후보가 원본보다 낫다고 *증명*될 때만 반영한다.
흐름은 **원본 시트 → 크롤링(후보 JSONL) → 업데이트 시트 → 사람 검수 → 반영 → 공식 개선** 이다.

## 절대 규칙
1. **원본을 직접 고치지 않는다.** 모든 변경은 시트(CSV)를 거쳐 사람이 Y/N 한 뒤 `apply_approved.mjs --apply` 로만 반영.
2. **이미지 저작권**: `official`(시설 자체 공식자료)·`public`(공공누리 등 확인) 출처만 반영 가능. 네이버/카카오/중개사이트/블로그 이미지는 `none` → 참고만, 자동 반영 금지.
3. **근거 없는 가격 금지.** 모든 가격은 `source_url` + `evidence`(원문 인용 200자 이내) 필수. 추정·보간·평균 금지.
4. robots.txt 준수, 요청 간 1~2초 간격, 로그인/캡차 우회 금지.
5. 미응답 문의·상담(Inquiry/Consult) 데이터는 건드리지 않는다.

## 폴더
- `config/scoring.json` 점수 공식 (가중치·임계값) / `config/sources.json` 출처 신뢰도·이미지 라이선스
- `scripts/` 실행 스크립트 (아래 단계) / `prompts/` 다른 AI에게 줄 프롬프트 / `references/` 스키마·공식 설명
- 산출물: `data/enrichment/<RUN>/` (gitignore됨)

## 단계 (모두 프로젝트 루트에서 실행)
| 단계 | 명령 | 결과 |
|---|---|---|
| 0. 원본 시트 | `node .agents/skills/facility-data-enrichment/scripts/export_master.mjs` | `00_master_facilities.csv`(결손·우선순위 S/A/B/C/D), `01_master_prices.csv`, `01_master_images.csv`, `master.json`, `crawl_queue.json` |
| 1. 크롤링 | **AI 에이전트**가 `prompts/01_orchestrator.md` 대로 `crawl_queue.json` 순회 | `candidates/<source>.jsonl` (스키마: `references/sheet-schema.md`) |
| 2. 업데이트 시트 | `node .../build_update_sheets.mjs --run <RUN>` | `02_price_updates.csv`, `03_image_updates.csv`, `04_unmatched.csv`, `05_summary.md` |
| 3. 검수 | 사람이 `review_decision` 열 입력 (Y/N/E/X) | |
| 4. 반영 | `node .../apply_approved.mjs --run <RUN>` (미리보기) → `--apply` | DB 반영 + `backup_*.json` |
| 5. 공식 개선 | `node .../tune_formula.mjs --all` | `config/scoring.suggested.json`, `tuning_report.md` |

검수 라벨: **Y**=승인, **E**=수정 승인(`final_price` 기입), **N**=시설은 맞지만 값/이미지가 부적합, **X**=엉뚱한 시설에 매칭됨. 비워두면 `AUTO_APPROVE` 항목만 반영.

## 크롤링 우선순위
`crawl_queue.json` 은 S → A → B 순. 시설당 출처 순서: ① 시설 공식 홈페이지(`websiteUrl`) ② e하늘 ③ 조례(공설) ④ 지자체/공단 ⑤ (참고용) 네이버·카카오·중개사이트. 상위 출처에서 충분히 찾았으면 하위 출처는 건너뛴다. 기존 크롤러는 `config/sources.json` 의 `existing_script` 참고.

## 공식(요약) — 상세는 `references/scoring-formula.md`
- 매칭 `M` = 이름·주소·전화·좌표 유사도 가중합 (없는 신호는 제외 후 재정규화, 이름 floor 가드)
- 가격 신뢰도 = `M × trust(출처) × extraction_conf × freshness × sanity`
- 이미지 신뢰도 = `M × label × size × novelty × (라이선스 OK ? 1 : 0.6)`
- 신뢰도 ≥ 0.85 & 매칭 accept & 액션이 NEW/FILL/CONFIRM → `AUTO_APPROVE`, CONFLICT/UPDATE 는 항상 사람 검수.

## 이 스킬을 쓰는 AI 에게
- 시작: `references/sheet-schema.md` 와 `prompts/01_orchestrator.md` 를 읽는다.
- 페이지 추출은 `prompts/02_page_extractor.md`, 이미지 판정은 `03_image_judge.md`, 공식 개선 상담은 `04_formula_optimizer.md`.
- 작업 후 항상 `05_summary.md` 를 사용자에게 요약 보고하고, **DB 반영(--apply)은 사용자 승인 후에만** 한다.
- 반영 후 안내: SSR/사이트맵이 읽는 `data/facilities.json` 은 DB와 별개라 동기화가 필요할 수 있고, `minPrice/maxPrice` 는 갱신되지 않는다.

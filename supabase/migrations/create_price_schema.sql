-- ==========================================
-- 새로운 가격표 스키마 (1~3번 시설 테스트용)
-- ==========================================

-- 1. price_category (카테고리)
CREATE TABLE IF NOT EXISTS price_category (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id TEXT NOT NULL,
  name TEXT NOT NULL,                    -- PDF 원본 이름 (예: "석물류")
  normalized_name TEXT NOT NULL,          -- 표준화된 이름 (예: "매장묘")
  order_no INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. price_item (핵심 가격 항목)
CREATE TABLE IF NOT EXISTS price_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES price_category(id) ON DELETE CASCADE,
  facility_id TEXT NOT NULL,
  
  -- 항목 정보
  item_name TEXT NOT NULL,               -- 항목명 원문 (예: "매장묘 토지사용료")
  normalized_item_type TEXT,             -- 표준화된 타입 (예: "매장묘")
  group_type TEXT,                        -- 단장/합장/개인단/부부단 등
  description TEXT,                       -- 추가 설명
  raw TEXT,                               -- PDF 원문
  
  -- 가격 정보
  price INTEGER NOT NULL,
  unit TEXT DEFAULT '1기',                -- 1기당/1년/3.3㎡당 등
  
  -- 크기 정보
  size_value DECIMAL,                     -- 평수/㎡
  size_unit TEXT,                         -- 평/㎡
  
  -- 포함 사항
  has_installation BOOLEAN DEFAULT false, -- 설치비 포함 여부
  has_management_fee BOOLEAN DEFAULT false, -- 관리비 포함 여부
  included_year INTEGER,                  -- 관리비 포함 년수
  
  -- 할인 정보
  discount_available BOOLEAN DEFAULT false,
  discount_targets JSONB,                 -- ["신일2리 주민", "국민기초수급자"] 등
  
  -- 환불 규정
  refund_rule TEXT,
  
  -- 수량 제한
  min_qty INTEGER DEFAULT 1,
  max_qty INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. mapping_dictionary (표준화 사전)
CREATE TABLE IF NOT EXISTS mapping_dictionary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_name TEXT UNIQUE NOT NULL,         -- 항목 원문
  normalized_type TEXT NOT NULL,          -- 표준화된 타입
  normalized_group TEXT,                  -- 표준화된 그룹
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_price_category_facility ON price_category(facility_id);
CREATE INDEX IF NOT EXISTS idx_price_item_facility ON price_item(facility_id);
CREATE INDEX IF NOT EXISTS idx_price_item_category ON price_item(category_id);
CREATE INDEX IF NOT EXISTS idx_price_item_type ON price_item(normalized_item_type);
CREATE INDEX IF NOT EXISTS idx_price_item_group ON price_item(group_type);
CREATE INDEX IF NOT EXISTS idx_mapping_raw ON mapping_dictionary(raw_name);

-- RLS 정책 (읽기는 public, 쓰기는 인증된 사용자만)
ALTER TABLE price_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapping_dictionary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read price_category" ON price_category FOR SELECT USING (true);
CREATE POLICY "Public can read price_item" ON price_item FOR SELECT USING (true);
CREATE POLICY "Public can read mapping_dictionary" ON mapping_dictionary FOR SELECT USING (true);

-- 초기 mapping_dictionary 데이터
INSERT INTO mapping_dictionary (raw_name, normalized_type, normalized_group) VALUES
  -- 기본비용
  ('묘지사용료', '기본비용', NULL),
  ('사용료', '기본비용', NULL),
  ('관리비', '기본비용', NULL),
  ('묘지관리비', '기본비용', NULL),
  
  -- 매장묘
  ('단장 사용료', '매장묘', '단장'),
  ('합장 사용료', '매장묘', '합장'),
  ('상석', '매장묘', NULL),
  ('비석', '매장묘', NULL),
  ('와비', '매장묘', NULL),
  ('둘레석', '매장묘', NULL),
  ('경계석', '매장묘', NULL),
  ('봉분설치비', '매장묘', NULL),
  ('매장작업비', '매장묘', NULL),
  
  -- 봉안묘
  ('평장묘', '봉안묘', '평장'),
  ('봉안묘', '봉안묘', NULL),
  ('납골묘', '봉안묘', NULL),
  
  -- 봉안당
  ('봉안당', '봉안당', NULL),
  ('개인단', '봉안당', '개인'),
  ('부부단', '봉안당', '부부'),
  
  -- 수목장
  ('수목장', '수목장', NULL),
  ('자연장', '수목장', NULL),
  ('정원형', '수목장', '정원')
ON CONFLICT (raw_name) DO NOTHING;

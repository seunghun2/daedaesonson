// Supabase에서 실행할 SQL
// FAQ, 약관, 개인정보처리방침, 문의 테이블 생성

/*
-- 1. FAQ 테이블
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) DEFAULT '일반',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 약관/정책 테이블 (이용약관, 개인정보처리방침 등)
CREATE TABLE IF NOT EXISTS site_policies (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE, -- 'terms', 'privacy'
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 문의 테이블
CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY,
    inquiry_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    contact VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, answered, closed
    admin_reply TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 데이터: 이용약관
INSERT INTO site_policies (type, title, content, version) VALUES (
    'terms',
    '이용약관',
    '제1조 (목적)
이 약관은 대대손손(이하 "회사")이 제공하는 장묘시설 정보 서비스의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 회사가 제공하는 장묘시설 정보 검색, 비교 서비스를 말합니다.
2. "이용자"란 이 약관에 따라 서비스를 이용하는 자를 말합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
2. 회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지 후 효력이 발생합니다.

제4조 (서비스의 제공)
1. 회사는 다음과 같은 서비스를 제공합니다.
   - 전국 장묘시설 정보 제공
   - 시설별 가격 비교 서비스
   - 관련 용어 가이드
2. 서비스는 연중무휴 24시간 제공을 원칙으로 합니다.

제5조 (면책조항)
1. 회사는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.
2. 시설 정보는 참고용이며, 실제 이용 시 해당 시설에 직접 확인하시기 바랍니다.',
    '1.0'
) ON CONFLICT (type) DO NOTHING;

-- 초기 데이터: 개인정보처리방침
INSERT INTO site_policies (type, title, content, version) VALUES (
    'privacy',
    '개인정보 처리방침',
    '1. 개인정보 수집 항목
회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
- 문의 시: 이메일 주소 또는 전화번호

2. 개인정보 수집 목적
- 문의에 대한 답변 제공
- 서비스 개선을 위한 통계 분석

3. 개인정보 보유 기간
- 문의 내역: 답변 완료 후 1년간 보관 후 파기

4. 개인정보의 제3자 제공
회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.

5. 개인정보 보호책임자
- 이메일: privacy@daedaesonson.com

6. 정책 변경
이 정책은 법령 변경 또는 서비스 변경에 따라 수정될 수 있습니다.',
    '1.0'
) ON CONFLICT (type) DO NOTHING;

-- 초기 FAQ 데이터
INSERT INTO faqs (question, answer, category, sort_order) VALUES
('봉안당과 납골당의 차이가 무엇인가요?', '봉안당과 납골당은 같은 의미입니다. 화장 후 유골을 모시는 실내 시설을 말하며, "봉안당"이 공식적인 표현입니다.', '일반', 1),
('수목장은 어떻게 진행되나요?', '수목장은 화장 후 유골을 나무 밑이나 주변에 안치하는 방식입니다. 수목장지를 선택하고, 나무를 지정한 뒤 유골을 안치하는 과정으로 진행됩니다.', '절차', 2),
('영구사용과 기간제의 차이는 무엇인가요?', '영구사용은 한 번 비용을 내면 기간 제한 없이 사용하는 방식이고, 기간제는 15년, 30년 등 일정 기간 후 재계약이 필요합니다.', '비용', 3),
('시설 가격 정보는 정확한가요?', '공시된 가격 정보를 기반으로 하지만, 실제 가격은 시설에 직접 문의하시기 바랍니다. 추가 비용이 발생할 수 있습니다.', '일반', 4),
('문의에 대한 답변은 얼마나 걸리나요?', '영업일 기준 1~2일 내에 답변 드리고 있습니다.', '일반', 5);

-- RLS 정책 (필요시)
-- ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE site_policies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
*/

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTables() {
    console.log('🚀 테이블 설정 시작...');
    console.log('⚠️  위의 SQL을 Supabase Dashboard > SQL Editor에서 실행해주세요!');
    console.log('');
    console.log('Supabase Dashboard: https://supabase.com/dashboard');
    console.log('');

    // 테이블 존재 확인
    const { data: faqData, error: faqError } = await supabase.from('faqs').select('id').limit(1);
    if (faqError && faqError.code === '42P01') {
        console.log('❌ faqs 테이블이 없습니다. SQL을 실행해주세요.');
    } else {
        console.log('✅ faqs 테이블 존재');
    }

    const { data: policyData, error: policyError } = await supabase.from('site_policies').select('id').limit(1);
    if (policyError && policyError.code === '42P01') {
        console.log('❌ site_policies 테이블이 없습니다. SQL을 실행해주세요.');
    } else {
        console.log('✅ site_policies 테이블 존재');
    }

    const { data: inquiryData, error: inquiryError } = await supabase.from('inquiries').select('id').limit(1);
    if (inquiryError && inquiryError.code === '42P01') {
        console.log('❌ inquiries 테이블이 없습니다. SQL을 실행해주세요.');
    } else {
        console.log('✅ inquiries 테이블 존재');
    }
}

setupTables();

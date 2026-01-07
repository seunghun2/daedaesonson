-- =====================================================
-- 대대손손 RLS (Row Level Security) 정책 설정
-- Supabase SQL Editor에서 실행하세요
-- 생성일: 2026-01-02
-- =====================================================

-- =====================================================
-- 1. 공개 읽기 테이블들 (누구나 조회 가능)
-- =====================================================

-- Facility 테이블
ALTER TABLE public."Facility" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on Facility" ON public."Facility";
CREATE POLICY "Allow public read on Facility" ON public."Facility"
  FOR SELECT USING (true);

-- PriceCategory 테이블
ALTER TABLE public."PriceCategory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on PriceCategory" ON public."PriceCategory";
CREATE POLICY "Allow public read on PriceCategory" ON public."PriceCategory"
  FOR SELECT USING (true);

-- PriceItem 테이블
ALTER TABLE public."PriceItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on PriceItem" ON public."PriceItem";
CREATE POLICY "Allow public read on PriceItem" ON public."PriceItem"
  FOR SELECT USING (true);

-- faqs 테이블
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on faqs" ON public.faqs;
CREATE POLICY "Allow public read on faqs" ON public.faqs
  FOR SELECT USING (true);

-- site_policies 테이블
ALTER TABLE public.site_policies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on site_policies" ON public.site_policies;
CREATE POLICY "Allow public read on site_policies" ON public.site_policies
  FOR SELECT USING (true);

-- MappingDictionary 테이블
ALTER TABLE public."MappingDictionary" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on MappingDictionary" ON public."MappingDictionary";
CREATE POLICY "Allow public read on MappingDictionary" ON public."MappingDictionary"
  FOR SELECT USING (true);

-- =====================================================
-- 2. 제한된 접근 테이블 (contact_inquiries)
-- =====================================================

-- contact_inquiries 테이블 - 읽기: 인증된 사용자만, 쓰기: 누구나
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- 누구나 문의 작성 가능
DROP POLICY IF EXISTS "Allow public insert on contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow public insert on contact_inquiries" ON public.contact_inquiries
  FOR INSERT WITH CHECK (true);

-- 인증된 사용자(관리자)만 조회 가능
DROP POLICY IF EXISTS "Allow authenticated read on contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Allow authenticated read on contact_inquiries" ON public.contact_inquiries
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. 서비스 역할(Service Role)은 모든 작업 허용
-- 이 정책들은 API/백엔드에서 데이터 수정을 가능하게 함
-- =====================================================

-- Facility - 서비스 역할 전체 권한
DROP POLICY IF EXISTS "Service role full access on Facility" ON public."Facility";
CREATE POLICY "Service role full access on Facility" ON public."Facility"
  FOR ALL USING (auth.role() = 'service_role');

-- PriceCategory - 서비스 역할 전체 권한
DROP POLICY IF EXISTS "Service role full access on PriceCategory" ON public."PriceCategory";
CREATE POLICY "Service role full access on PriceCategory" ON public."PriceCategory"
  FOR ALL USING (auth.role() = 'service_role');

-- PriceItem - 서비스 역할 전체 권한
DROP POLICY IF EXISTS "Service role full access on PriceItem" ON public."PriceItem";
CREATE POLICY "Service role full access on PriceItem" ON public."PriceItem"
  FOR ALL USING (auth.role() = 'service_role');

-- faqs - 서비스 역할 전체 권한
DROP POLICY IF EXISTS "Service role full access on faqs" ON public.faqs;
CREATE POLICY "Service role full access on faqs" ON public.faqs
  FOR ALL USING (auth.role() = 'service_role');

-- site_policies - 서비스 역할 전체 권한
DROP POLICY IF EXISTS "Service role full access on site_policies" ON public.site_policies;
CREATE POLICY "Service role full access on site_policies" ON public.site_policies
  FOR ALL USING (auth.role() = 'service_role');

-- MappingDictionary - 서비스 역할 전체 권한
DROP POLICY IF EXISTS "Service role full access on MappingDictionary" ON public."MappingDictionary";
CREATE POLICY "Service role full access on MappingDictionary" ON public."MappingDictionary"
  FOR ALL USING (auth.role() = 'service_role');

-- contact_inquiries - 서비스 역할 전체 권한
DROP POLICY IF EXISTS "Service role full access on contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Service role full access on contact_inquiries" ON public.contact_inquiries
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 완료!
-- Security Advisor에서 Rerun Linter를 클릭하여 확인하세요
-- =====================================================

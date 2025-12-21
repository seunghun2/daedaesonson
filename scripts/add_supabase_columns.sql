-- Supabase SQL Editor에서 실행할 컬럼 추가 스크립트
-- https://supabase.com/dashboard/project/jbydmhfuqnpukfutvrgs/sql

-- 1. 가격 정보 (JSON 문자열)
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS pricing TEXT;

-- 2. 연락처 정보
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS fax TEXT;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;

-- 3. 시설 정보
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "lastUpdated" TEXT;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "operatorType" TEXT;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "originalName" TEXT;

-- 4. 상태 정보
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER DEFAULT 0;

-- 5. 좌표 (이미 있을 수 있음)
-- ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
-- ALTER TABLE "Facility" ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- 완료 확인
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Facility';

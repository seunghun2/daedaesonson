-- 상담 신청 테이블
CREATE TABLE IF NOT EXISTS "Consult" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "facilityId" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    "preferredTime" TEXT,
    question TEXT DEFAULT 'price',
    message TEXT,
    status TEXT DEFAULT 'pending', -- pending, contacted, completed
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_consult_facility ON "Consult"("facilityId");
CREATE INDEX IF NOT EXISTS idx_consult_status ON "Consult"(status);
CREATE INDEX IF NOT EXISTS idx_consult_created ON "Consult"("createdAt" DESC);

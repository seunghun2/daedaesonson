-- Review 테이블 생성
CREATE TABLE IF NOT EXISTS "Review" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "facilityId" TEXT NOT NULL REFERENCES "Facility"("id") ON DELETE CASCADE,
    "author" TEXT NOT NULL DEFAULT '익명',
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "password" TEXT, -- 삭제/수정 시 본인 확인용 (해시됨)
    "photos" JSONB DEFAULT '[]'::jsonb,
    "likes" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Reply 테이블 생성 (리뷰 답글)
CREATE TABLE IF NOT EXISTS "Reply" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "reviewId" UUID NOT NULL REFERENCES "Review"("id") ON DELETE CASCADE,
    "author" TEXT NOT NULL DEFAULT '관리자',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "idx_review_facility" ON "Review"("facilityId");
CREATE INDEX IF NOT EXISTS "idx_review_created" ON "Review"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_reply_review" ON "Reply"("reviewId");

-- RLS 정책 (읽기는 모두 가능, 쓰기는 인증된 사용자)
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reply" ENABLE ROW LEVEL SECURITY;

-- 읽기 허용
CREATE POLICY "Allow read reviews" ON "Review" FOR SELECT USING (true);
CREATE POLICY "Allow read replies" ON "Reply" FOR SELECT USING (true);

-- 쓰기 허용 (서비스 키 사용 시)
CREATE POLICY "Allow insert reviews" ON "Review" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update reviews" ON "Review" FOR UPDATE USING (true);
CREATE POLICY "Allow delete reviews" ON "Review" FOR DELETE USING (true);

CREATE POLICY "Allow insert replies" ON "Reply" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update replies" ON "Reply" FOR UPDATE USING (true);
CREATE POLICY "Allow delete replies" ON "Reply" FOR DELETE USING (true);

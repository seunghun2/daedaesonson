-- Inquiry 테이블 생성 (문의)
CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "facilityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,         -- 제목 (항상 공개)
    "content" TEXT NOT NULL,       -- 내용 (비공개 가능)
    "phone" TEXT NOT NULL,         -- 연락처 전체 (관리자만)
    "passwordLast4" TEXT NOT NULL, -- 뒷자리 4자리 (비밀번호)
    "isPrivate" BOOLEAN DEFAULT TRUE, -- 비공개 여부
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- InquiryReply 테이블 생성 (관리자 답변)
CREATE TABLE IF NOT EXISTS "InquiryReply" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "inquiryId" UUID NOT NULL REFERENCES "Inquiry"("id") ON DELETE CASCADE,
    "author" TEXT NOT NULL DEFAULT '관리자',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "idx_inquiry_facility" ON "Inquiry"("facilityId");
CREATE INDEX IF NOT EXISTS "idx_inquiry_created" ON "Inquiry"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_inquiryreply_inquiry" ON "InquiryReply"("inquiryId");

-- RLS 정책
ALTER TABLE "Inquiry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InquiryReply" ENABLE ROW LEVEL SECURITY;

-- 읽기 허용
CREATE POLICY "Allow read inquiries" ON "Inquiry" FOR SELECT USING (true);
CREATE POLICY "Allow read inquiry replies" ON "InquiryReply" FOR SELECT USING (true);

-- 쓰기 허용 (서비스 키 사용 시)
CREATE POLICY "Allow insert inquiries" ON "Inquiry" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update inquiries" ON "Inquiry" FOR UPDATE USING (true);
CREATE POLICY "Allow delete inquiries" ON "Inquiry" FOR DELETE USING (true);

CREATE POLICY "Allow insert inquiry replies" ON "InquiryReply" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update inquiry replies" ON "InquiryReply" FOR UPDATE USING (true);
CREATE POLICY "Allow delete inquiry replies" ON "InquiryReply" FOR DELETE USING (true);

---
description: 사이트 배포 및 도메인 연결 가이드
---

# 🚀 사이트 배포하기

## 1️⃣ 도메인 구매

**추천 도메인 구매 사이트:**
- **가비아** (https://www.gabia.com) - 한국, 한글 지원
- **Namecheap** (https://www.namecheap.com) - 저렴, 영어
- **Cloudflare Registrar** (https://www.cloudflare.com/products/registrar/) - 최저가

**도메인 선택 팁:**
- `.com` 또는 `.kr` 추천
- 짧고 기억하기 쉬운 이름
- 예: `daedaesonson.com`, `momodang.kr`

---

## 2️⃣ Vercel 배포 (무료, 가장 쉬움)

### 준비사항
```bash
# GitHub에 푸시되어 있는지 확인
git status
git push origin main
```

### 배포 단계

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - "Sign Up" > GitHub 계정으로 로그인

2. **프로젝트 임포트**
   - "Add New..." > "Project" 클릭
   - GitHub에서 `daedaesonson` 레포지토리 선택
   - "Import" 클릭

3. **환경 변수 설정** (중요!)
   - "Environment Variables" 섹션에서 다음을 추가:
   ```
   GEMINI_API_KEY=AIzaSyCVo0fCTRxNuxe2N0XmqW5ZGPWao8wEEfQ
   NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=9ynkl22koz
   NAVER_MAP_CLIENT_SECRET=ayNvCHQL45KqV0JbMjyd1vfpudqe8mB5mr6PUkVG
   NAVER_GEOCODING_URL=https://maps.apigw.ntruss.com/map-geocode/v2/geocode
   DATABASE_URL=file:./dev.db
   ```

4. **배포 시작**
   - "Deploy" 버튼 클릭
   - 2~3분 후 배포 완료!
   - `https://daedaesonson.vercel.app` 같은 URL 자동 생성

---

## 3️⃣ 도메인 연결하기

### Vercel에서 설정

1. **Vercel 대시보드**
   - 프로젝트 선택 > "Settings" > "Domains"

2. **도메인 추가**
   - 구매한 도메인 입력 (예: `daedaesonson.com`)
   - "Add" 클릭

3. **DNS 레코드 복사**
   - Vercel이 제공하는 `A` 레코드 또는 `CNAME` 값 복사

### 도메인 제공자에서 설정

**가비아 예시:**
1. 가비아 로그인 > "My 가비아" > "도메인 관리"
2. 구매한 도메인 선택 > "DNS 정보" > "DNS 설정"
3. Vercel에서 복사한 값으로 레코드 추가:
   ```
   @ (또는 빈칸)    A       76.76.21.21 (Vercel IP)
   www              CNAME   cname.vercel-dns.com
   ```
4. 저장 후 **전파 대기** (최대 24시간, 보통 10분 이내)

---

## 4️⃣ 배포 확인 및 테스트

```bash
# 도메인 연결 확인
curl -I https://yourdomain.com

# DNS 전파 확인
nslookup yourdomain.com
```

**확인 사항:**
- [ ] 메인 페이지 로딩
- [ ] 네이버 지도 정상 표시
- [ ] 검색 기능 작동
- [ ] 상세 페이지 열림
- [ ] PDF 업로드 (admin) 작동

---

## 5️⃣ 자동 배포 설정 (완료!)

✅ **이미 설정됨** - `main` 브랜치에 푸시하면 자동 배포!

```bash
# 코드 수정 후
git add .
git commit -m "feat: 새 기능 추가"
git push origin main
# → Vercel이 자동으로 재배포 (1~2분 소요)
```

---

## 🎯 대안: 다른 배포 옵션

### Netlify (Vercel과 유사)
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### 전통 서버 (VPS)
```bash
# 서버에서 실행
npm run build
npm start  # 또는 PM2 사용
```

---

## ⚠️ 주의사항

1. **환경 변수 보안**
   - `.env.local`은 절대 Git에 커밋하지 마세요
   - Vercel 대시보드에서만 설정

2. **데이터베이스**
   - 현재 SQLite 파일 기반
   - 프로덕션에서는 PostgreSQL/MySQL 권장 (Vercel Postgres, PlanetScale 등)

3. **파일 업로드**
   - Vercel은 serverless → 파일 저장 제한
   - S3, Cloudinary 등 외부 스토리지 권장

4. **API 사용량**
   - Gemini API: 무료 한도 확인
   - Naver Map API: 일일 호출 제한 확인

---

## 📞 도움말

**배포 오류 시:**
```bash
# Vercel 로그 확인
vercel logs

# 로컬에서 프로덕션 빌드 테스트
npm run build
npm start
```

**DNS 전파 확인:**
- https://dnschecker.org 에서 도메인 검색

**Vercel 지원:**
- https://vercel.com/support

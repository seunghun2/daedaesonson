---
description: 사이트 배포 및 도메인 연결 가이드
---

# 대대손손 배포 워크플로우

## 전제 조건
- GitHub 리포지토리: `https://github.com/seunghun2/daedaesonson.git`
- Vercel에 연결되어 있어 `main` 브랜치에 push하면 자동 배포됨
- 도메인: `daedaesonson.com`

## 배포 절차

// turbo-all

1. 변경사항 확인
```bash
cd /Users/el/Desktop/daedaesonson && git status --short
```

2. 모든 변경사항 스테이징
```bash
cd /Users/el/Desktop/daedaesonson && git add .
```

3. 커밋 (메시지는 작업 내용에 맞게 수정)
```bash
cd /Users/el/Desktop/daedaesonson && git commit -m "fix: 매장묘지 대표가격 표시 오류 수정"
```

4. GitHub에 force push (Vercel 자동 배포 트리거)
```bash
cd /Users/el/Desktop/daedaesonson && git push -u origin main --force
```

5. Vercel 배포 상태 확인
- https://vercel.com/dashboard 에서 배포 진행 상태 확인
- 보통 1~2분 내 완료

## 참고사항
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 push되지 않음
- Vercel 환경변수는 Vercel 대시보드에서 별도 관리
- 배포 후 ISR 캐시(60초) 때문에 변경사항이 즉시 반영되지 않을 수 있음

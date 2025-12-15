#!/bin/bash
echo "🚀 배포 자동화 스크립트 시작!"
echo "--------------------------------"

# 1. 초기화
rm -rf .git
git init
git add .
git commit -m "Deploy: Codebase"

# 2. 리모트 연결
git remote add origin https://github.com/seunghun2/daedaesonson.git
git branch -M main

# 3. 푸시
echo "--------------------------------"
echo "✅ 준비 완료! 이제 GitHub 아이디와 비밀번호(토큰)를 입력하세요."
echo "--------------------------------"
git push -u origin main --force

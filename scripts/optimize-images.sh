#!/bin/bash
# 대대손손 이미지 최적화 스크립트
# 모든 시설 이미지를 WebP로 변환하고 리사이즈
# 사용법: chmod +x scripts/optimize-images.sh && ./scripts/optimize-images.sh

set -e

# 설정
IMAGE_DIR="/Users/el/Desktop/daedaesonson/public/images/facilities"
MAX_WIDTH=1200        # 최대 가로 1200px
QUALITY=80            # WebP 품질 (80 = 시각적 손실 거의 없음)
CONVERTED=0
SKIPPED=0
SAVED_MB=0

echo "🖼️  대대손손 이미지 최적화 시작"
echo "📁 대상: ${IMAGE_DIR}"
echo "📐 최대 가로: ${MAX_WIDTH}px, 품질: ${QUALITY}"
echo "---"

# sharp가 필요 → cwebp 사용 (macOS에서 더 안정적)
# cwebp가 없으면 설치
if ! command -v cwebp &> /dev/null; then
    echo "⚠️  cwebp가 설치되어 있지 않습니다."
    echo "   설치: brew install webp"
    exit 1
fi

if ! command -v sips &> /dev/null; then
    echo "⚠️  sips가 필요합니다 (macOS 기본 제공)"
    exit 1
fi

# 모든 jpg/png 파일 찾기
find "$IMAGE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r file; do
    dir=$(dirname "$file")
    base=$(basename "$file" | sed 's/\.[^.]*$//')
    ext="${file##*.}"
    webp_file="${dir}/${base}.webp"
    
    # 이미 WebP로 변환된 파일이 있으면 건너뛰기
    if [ -f "$webp_file" ]; then
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    # 원본 크기
    original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    original_mb=$(echo "scale=2; $original_size / 1048576" | bc)
    
    echo -n "🔄 ${base}.${ext} (${original_mb}MB) → "
    
    # 1. sips로 리사이즈 (임시 파일)
    tmp_file="/tmp/optimize_${base}.${ext}"
    cp "$file" "$tmp_file"
    
    # 현재 너비 확인
    current_width=$(sips -g pixelWidth "$tmp_file" | tail -1 | awk '{print $2}')
    
    if [ "$current_width" -gt "$MAX_WIDTH" ]; then
        sips --resampleWidth "$MAX_WIDTH" "$tmp_file" > /dev/null 2>&1
    fi
    
    # 2. cwebp로 WebP 변환
    cwebp -q "$QUALITY" -m 6 "$tmp_file" -o "$webp_file" > /dev/null 2>&1
    
    # 변환 후 크기
    new_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
    new_kb=$(echo "scale=0; $new_size / 1024" | bc)
    saved=$(echo "scale=2; ($original_size - $new_size) / 1048576" | bc)
    
    echo "${base}.webp (${new_kb}KB) — ${saved}MB 절약 ✅"
    
    CONVERTED=$((CONVERTED + 1))
    SAVED_MB=$(echo "$SAVED_MB + $saved" | bc)
    
    # 임시 파일 삭제
    rm -f "$tmp_file"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 변환 완료: ${CONVERTED}개 파일"
echo "⏭️  스킵: ${SKIPPED}개 파일"
echo "💾 총 절약: ${SAVED_MB}MB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

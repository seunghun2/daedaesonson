#!/bin/bash

# 고화질 PDF to PNG 변환 스크립트
# DPI 300 (고화질) 사용

ARCHIVE_DIR="archive5"
OUTPUT_DIR="archive5_images"

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR"

# 테스트: 처음 3개 시설만 변환
count=0
for facility_dir in "$ARCHIVE_DIR"/*; do
    if [ -d "$facility_dir" ]; then
        facility_name=$(basename "$facility_dir")
        
        # PDF 파일 찾기
        pdf_file=$(find "$facility_dir" -name "*_price_info.pdf" | head -1)
        
        if [ -n "$pdf_file" ]; then
            output_file="$OUTPUT_DIR/${facility_name}_price_info.png"
            
            echo "🔄 변환 중: $facility_name"
            
            # sips로 고화질 변환 (DPI 300)
            sips -s format png -s dpiWidth 300 -s dpiHeight 300 "$pdf_file" --out "$output_file" 2>/dev/null
            
            if [ $? -eq 0 ]; then
                echo "✅ 완료: $output_file"
            else
                echo "⚠️ sips 실패, pdftoppm 사용..."
                # 대체: Homebrew pdftoppm 사용 (더 고화질)
                pdftoppm -png -r 300 "$pdf_file" "${output_file%.png}" 2>/dev/null || echo "❌ 변환 실패: $facility_name"
            fi
            
            count=$((count + 1))
            
            # 테스트: 3개만
            if [ $count -ge 3 ]; then
                echo ""
                echo "🎉 테스트 완료: 3개 시설 고화질 변환됨"
                ls -lh "$OUTPUT_DIR"
                exit 0
            fi
        fi
    fi
done

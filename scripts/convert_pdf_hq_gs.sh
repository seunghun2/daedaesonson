#!/bin/bash

# 고화질 PDF to PNG 변환 (Ghostscript 사용, DPI 300)

ARCHIVE_DIR="archive5"
OUTPUT_DIR="archive5_images"

mkdir -p "$OUTPUT_DIR"

echo "🚀 고화질 PNG 변환 시작 (DPI 300)"
echo "=================================="

count=0
for facility_dir in "$ARCHIVE_DIR"/*; do
    if [ -d "$facility_dir" ]; then
        facility_name=$(basename "$facility_dir")
        
        # PDF 파일 찾기
        pdf_file=$(find "$facility_dir" -name "*_price_info.pdf" -type f | head -1)
        
        if [ -n "$pdf_file" ]; then
            output_file="$OUTPUT_DIR/${facility_name}_price_info.png"
            
            echo ""
            echo "📄 [$((count+1))/3] $facility_name"
            
            # Ghostscript로 고화질 변환
            gs -dSAFER -dBATCH -dNOPAUSE \
               -sDEVICE=png16m \
               -r300 \
               -dTextAlphaBits=4 \
               -dGraphicsAlphaBits=4 \
               -sOutputFile="$output_file" \
               "$pdf_file" 2>&1 | grep -v "GPL Ghostscript" | head -3
            
            if [ -f "$output_file" ]; then
                size=$(du -h "$output_file" | cut -f1)
                echo "✅ 완료: $size"
            else
                echo "❌ 실패"
            fi
            
            count=$((count + 1))
            
            if [ $count -ge 3 ]; then
                echo ""
                echo "=================================="
                echo "🎉 테스트 완료!"
                echo ""
                ls -lh "$OUTPUT_DIR" | head -5
                exit 0
            fi
        fi
    fi
done

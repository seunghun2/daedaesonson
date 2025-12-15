#!/bin/bash

# 고화질 PDF to PNG 변환 (Ghostscript, DPI 300)

ARCHIVE_DIR="archive5"
OUTPUT_DIR="archive5_images"

mkdir -p "$OUTPUT_DIR"

echo "🚀 고화질 PNG 변환 시작 (DPI 300)"
echo "=================================="

count=0
for pdf_file in "$ARCHIVE_DIR"/*.pdf; do
    if [ -f "$pdf_file" ]; then
        filename=$(basename "$pdf_file" .pdf)
        output_file="$OUTPUT_DIR/${filename}.png"
        
        echo ""
        echo "📄 [$((count+1))/3] $(basename "$pdf_file")"
        
        # Ghostscript로 고화질 변환
        gs -dSAFER -dBATCH -dNOPAUSE -dQUIET \
           -sDEVICE=png16m \
           -r300 \
           -dTextAlphaBits=4 \
           -dGraphicsAlphaBits=4 \
           -sOutputFile="$output_file" \
           "$pdf_file"
        
        if [ -f "$output_file" ]; then
            size=$(du -h "$output_file" | cut -f1)
            dimensions=$(sips -g pixelWidth -g pixelHeight "$output_file" 2>/dev/null | grep pixel | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
            echo "✅ 완료: $size ($dimensions px)"
        else
            echo "❌ 실패"
        fi
        
        count=$((count + 1))
        
        if [ $count -ge 3 ]; then
            echo ""
            echo "=================================="
            echo "🎉 테스트 완료! (3개 고화질 PNG 생성)"
            echo ""
            ls -lh "$OUTPUT_DIR"
            exit 0
        fi
    fi
done

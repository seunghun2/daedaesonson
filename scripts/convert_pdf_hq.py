#!/usr/bin/env python3
"""
고화질 PDF to PNG 변환 (DPI 300)
Python pdf2image 라이브러리 사용
"""

import os
import sys
from pathlib import Path

try:
    from pdf2image import convert_from_path
    from PIL import Image
except ImportError:
    print("❌ pdf2image 라이브러리가 필요합니다.")
    print("설치: pip3 install pdf2image Pillow")
    sys.exit(1)

ARCHIVE_DIR = "archive5"
OUTPUT_DIR = "archive5_images"

def main():
    # 출력 디렉토리 생성
    Path(OUTPUT_DIR).mkdir(exist_ok=True)
    
    print("🚀 고화질 PNG 변환 시작 (DPI 300)")
    print("=" * 50)
    
    # PDF 파일 목록
    pdf_files = sorted(Path(ARCHIVE_DIR).glob("*.pdf"))
    
    count = 0
    for pdf_file in pdf_files[:3]:  # 테스트: 처음 3개만
        print(f"\n📄 [{count+1}/3] {pdf_file.name}")
        
        try:
            # PDF를 고화질 이미지로 변환 (DPI 300)
            images = convert_from_path(
                str(pdf_file),
                dpi=300,
                fmt='png',
                thread_count=4
            )
            
            # 첫 페이지만 저장
            if images:
                output_file = Path(OUTPUT_DIR) / f"{pdf_file.stem}.png"
                images[0].save(output_file, 'PNG', optimize=False)
                
                # 파일 크기 확인
                size_mb = output_file.stat().st_size / (1024 * 1024)
                width, height = images[0].size
                
                print(f"✅ 완료: {size_mb:.2f}MB ({width}x{height} px)")
            
        except Exception as e:
            print(f"❌ 실패: {e}")
        
        count += 1
    
    print("\n" + "=" * 50)
    print("🎉 테스트 완료! (3개 고화질 PNG 생성)")
    print()
    
    # 결과 출력
    for png_file in sorted(Path(OUTPUT_DIR).glob("*.png"))[:3]:
        size_mb = png_file.stat().st_size / (1024 * 1024)
        print(f"  {png_file.name}: {size_mb:.2f}MB")

if __name__ == "__main__":
    main()

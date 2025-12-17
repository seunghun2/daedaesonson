#!/usr/bin/env python3
import os
import re
import json
import subprocess

def parse_hwp_prices(hwp_path):
    """HWP 파일에서 가격 데이터 추출"""
    print(f"\n=== 파싱: {os.path.basename(hwp_path)} ===\n")
    
    try:
        # hwp5txt로 텍스트 추출
        result = subprocess.run(
            ['/Users/el/Library/Python/3.9/bin/hwp5txt', hwp_path],
            capture_output=True,
            text=True
        )
        text = result.stdout
        print("추출된 텍스트:")
        print(text[:1000] if text else "텍스트 없음")
        
        # 숫자 패턴 찾기 (콤마 포함)
        numbers = re.findall(r'[\d,]+', text)
        price_numbers = []
        for n in numbers:
            try:
                val = int(n.replace(',', ''))
                if 100000 <= val <= 10000000:
                    price_numbers.append(val)
            except:
                pass
        
        print(f"\n가격 후보: {price_numbers}")
        
        return {
            'file': os.path.basename(hwp_path),
            'text_preview': text[:2000] if text else None,
            'price_candidates': price_numbers
        }
        
    except Exception as e:
        print(f"에러: {e}")
        return {'error': str(e)}

if __name__ == '__main__':
    hwp_file = '[별표 3] 공설장사시설 사용료 및 관리비(보은군 장사시설 설치 및 운영 조례) (2).hwp'
    
    if os.path.exists(hwp_file):
        result = parse_hwp_prices(hwp_file)
        
        # JSON 저장
        os.makedirs('data/ordinance_hwp', exist_ok=True)
        with open('data/ordinance_hwp/boeun_parsed.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\n저장 완료: data/ordinance_hwp/boeun_parsed.json")
    else:
        print(f"파일 없음: {hwp_file}")

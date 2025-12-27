import csv
import json

rows = []

with open('bundang_165.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    for line in reader:
        if len(line) >= 5:
            name = line[2]
            grade = line[3]
            price_str = line[4].replace(',', '').replace('원', '').replace('"', '').strip()
            
            try:
                price = int(price_str)
            except:
                continue
            
            # groupType 결정
            if '야외봉안담' in name:
                if '크리스탈' in grade:
                    gt = '야외봉안담-크리스탈'
                else:
                    gt = '야외봉안담-일반'
            elif '실내봉안당' in name:
                if '2층 고급실' in grade:
                    gt = '실내봉안당-2층고급실'
                elif '2층 일반실' in grade:
                    gt = '실내봉안당-2층일반실'
                elif '2층 특별실' in grade:
                    gt = '실내봉안당-2층특별실'
                elif '3층' in grade:
                    gt = '실내봉안당-3층특별실'
                else:
                    gt = '실내봉안당-기타'
            elif '관리비' in name:
                gt = '부가옵션'
            else:
                gt = '기타'
            
            rows.append({
                'name': name,
                'grade': grade,
                'price': price,
                'groupType': gt,
                'isRepresentative': len(rows) == 0
            })

data = {
    'id': 'park-0510',
    'name': '분당추모공원휴',
    'address': '경기도 광주시 오포읍 오포로 211-49 (능평리)',
    'category': 'CHARNEL_HOUSE',
    'coordinates': {'lat': 37.4324234262179, 'lng': 127.267426329154},
    'isPublic': False,
    'isActive': True,
    'priceInfo': {
        'priceTable': {
            '봉안시설': {
                'category': 'charnel',
                'unit': '원',
                'rows': rows
            }
        }
    }
}

with open('bundang_final.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Total {len(rows)} items created!')

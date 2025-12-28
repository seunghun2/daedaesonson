const fs = require('fs');

async function findSuspicious() {
    const response = await fetch('http://localhost:3000/api/facilities');
    const data = await response.json();

    let suspicious = [];

    data.forEach(f => {
        if (!f.priceInfo?.priceTable) return;

        const 단장형 = f.priceInfo.priceTable['단장형'];
        const 합장형 = f.priceInfo.priceTable['합장형'];

        if (단장형 && 합장형 && 단장형.rows && 합장형.rows) {
            let allMatch = true;

            // 단장형과 합장형 가격이 정확히 1.5배 관계인지 확인
            for (let i = 0; i < Math.min(단장형.rows.length, 합장형.rows.length); i++) {
                const 단가 = 단장형.rows[i].price || 0;
                const 합가 = 합장형.rows[i].price || 0;

                if (단가 > 0 && 합가 > 0) {
                    const ratio = 합가 / 단가;
                    if (Math.abs(ratio - 1.5) > 0.01) {
                        allMatch = false;
                        break;
                    }
                }
            }

            if (allMatch && 단장형.rows.length > 0) {
                suspicious.push({
                    id: f.id,
                    name: f.name,
                    단장형가격: 단장형.rows[0].price,
                    합장형가격: 합장형.rows[0].price
                });
            }
        }
    });

    console.log('🔍 추정으로 만든 합장형 데이터 (단장형 × 1.5):');
    console.log('총', suspicious.length, '개 발견\n');
    suspicious.forEach(s => {
        console.log(s.id + ':', s.name, '- 단장:', s.단장형가격.toLocaleString(), '→ 합장:', s.합장형가격.toLocaleString());
    });
}

findSuspicious();

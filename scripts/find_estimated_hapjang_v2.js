const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
let suspicious = [];

data.forEach(f => {
  if (!f.priceInfo?.priceTable) return;

  const danjang = f.priceInfo.priceTable['단장형'];
  const hapjang = f.priceInfo.priceTable['합장형'];

  if (danjang && hapjang && danjang.rows && hapjang.rows) {
    let allMatch = true;

    // 단장형과 합장형 가격이 정확히 1.5배 관계인지 확인
    for (let i = 0; i < Math.min(danjang.rows.length, hapjang.rows.length); i++) {
      const danPrice = danjang.rows[i].price || 0;
      const hapPrice = hapjang.rows[i].price || 0;

      if (danPrice > 0 && hapPrice > 0) {
        const ratio = hapPrice / danPrice;
        if (Math.abs(ratio - 1.5) > 0.01) {
          allMatch = false;
          break;
        }
      }
    }

    if (allMatch && danjang.rows.length > 0 && hapjang.rows.length > 0) {
      suspicious.push({
        id: f.id,
        name: f.name,
        danPrice: danjang.rows[0]?.price || 0,
        hapPrice: hapjang.rows[0]?.price || 0
      });
    }
  }
});

console.log('🔍 추정으로 만든 합장형 데이터 (단장형 × 1.5):');
console.log('총', suspicious.length, '개 발견\n');
suspicious.forEach(s => {
  console.log(s.id + ':', s.name, '- 단장:', s.danPrice.toLocaleString(), '→ 합장:', s.hapPrice.toLocaleString());
});

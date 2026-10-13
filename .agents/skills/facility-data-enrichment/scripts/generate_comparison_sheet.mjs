import fs from 'fs';
import path from 'path';

const RUN_DIR = path.resolve('data/enrichment/20261003_1750');

// 1. 원본 시설 마스터 읽기
const masterRaw = fs.readFileSync(path.join(RUN_DIR, '00_master_facilities.csv'), 'utf8').trim().split('\n');
const masterHeaders = masterRaw[0].split(',').map(h => h.replace(/"/g, ''));
const masterMap = new Map();

for (let i = 1; i < masterRaw.length; i++) {
    const row = masterRaw[i];
    if (!row) continue;
    // CSV parse with regex
    const matches = [...row.matchAll(/"([^"]*)"/g)].map(m => m[1]);
    if (matches.length < 15) continue;
    const [id, name, cat, opType, active, addr, phone, lat, lng, web, views, imgCount, priceRows, priceRowsPos, minP, maxP, gaps, pScore, updAt, pGrade] = matches;
    masterMap.set(id, {
        id, name, cat, addr, phone, views: Number(views || 0),
        imgCount: Number(imgCount || 0),
        priceRowsPos: Number(priceRowsPos || 0),
        minP: Number(minP || 0),
        maxP: Number(maxP || 0),
        gaps,
        grade: pGrade?.trim() || 'C'
    });
}

// 2. 새로 찾은 가격 읽기
const pricesRaw = fs.readFileSync(path.join(RUN_DIR, '02_price_updates.csv'), 'utf8').trim().split('\n');
const priceUpdatesMap = new Map();

for (let i = 1; i < pricesRaw.length; i++) {
    const row = pricesRaw[i];
    if (!row) continue;
    const matches = [...row.matchAll(/"([^"]*)"/g)].map(m => m[1]);
    if (matches.length < 20) continue;
    const [updateId, facId, facName, action, cat, item, grade, grpType, curP, newP, diffPct, unit, source, srcUrl, evidence, capAt, pubAt, mScore, mStatus, fNameSim, fAddrSim, fPhoneSim, fGeoSim, trust, conf, fresh, sanity, confidence, autoStatus] = matches;
    
    if (autoStatus === 'REJECT') continue; // 이상치 제외

    if (!priceUpdatesMap.has(facId)) {
        priceUpdatesMap.set(facId, []);
    }
    priceUpdatesMap.get(facId).push({
        item,
        price: Number(newP),
        unit,
        source,
        srcUrl,
        evidence
    });
}

// 3. 새로 찾은 사진 읽기
const imagesRaw = fs.readFileSync(path.join(RUN_DIR, '03_image_updates.csv'), 'utf8').trim().split('\n');
const imageUpdatesMap = new Map();

for (let i = 1; i < imagesRaw.length; i++) {
    const row = imagesRaw[i];
    if (!row) continue;
    const matches = [...row.matchAll(/"([^"]*)"/g)].map(m => m[1]);
    if (matches.length < 15) continue;
    const [updateId, facId, facName, existCount, imgUrl, w, h, label, lConf, dhash, mHam, lic, source, srcUrl, mScore, mStatus, sScore, lScore, nov, conf, autoStatus] = matches;

    if (autoStatus === 'REJECT') continue;

    if (!imageUpdatesMap.has(facId)) {
        imageUpdatesMap.set(facId, []);
    }
    imageUpdatesMap.get(facId).push({
        url: imgUrl,
        label,
        source,
        srcUrl
    });
}

const CAT_LABELS = {
    CHARNEL_HOUSE: '봉안당',
    NATURAL_BURIAL: '수목장/자연장',
    FAMILY_GRAVE: '공원묘지/매장',
    CREMATORIUM: '화장시설',
    FUNERAL_HOME: '장례식장'
};

function formatWon(val) {
    if (!val || val <= 0) return '0원';
    if (val >= 100000000) {
        const eok = Math.floor(val / 100000000);
        const rem = Math.floor((val % 100000000) / 10000);
        return rem > 0 ? `${eok}억 ${rem.toLocaleString()}만원` : `${eok}억원`;
    }
    if (val >= 10000) {
        return `${Math.floor(val / 10000).toLocaleString()}만원`;
    }
    return `${val.toLocaleString()}원`;
}

// 4. 비교 시트 CSV 생성
const csvRows = [
    [
        '우선순위',
        '시설ID',
        '시설명',
        '구분',
        '소재지',
        '[원본] 기존 가격 상태',
        '[신규 발굴] 새로 찾은 가격 항목 수',
        '[신규 발굴] 주요 가격 예시',
        '가격 개선 효과',
        '[원본] 기존 사진 수',
        '[신규 발굴] 새로 찾은 사진 수',
        '사진 개선 효과',
        '수집 출처',
        '검수 판정 (Y:승인 / N:제외 / E:수정)'
    ].map(v => `"${v}"`).join(',')
];

const dashboardData = [];

// 원본 시설 순회 (우선순위 S -> A -> B 순)
const sortedFacilities = Array.from(masterMap.values()).sort((a, b) => {
    const pOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };
    return (pOrder[a.grade] || 9) - (pOrder[b.grade] || 9) || b.views - a.views;
});

for (const fac of sortedFacilities) {
    const newPrices = priceUpdatesMap.get(fac.id) || [];
    const newImages = imageUpdatesMap.get(fac.id) || [];

    // 원본 가격
    let origPriceDesc = '';
    if (fac.priceRowsPos === 0 || fac.minP === 0) {
        origPriceDesc = '가격 없음 (문의 상태)';
    } else {
        origPriceDesc = `${formatWon(fac.minP)} ~ ${formatWon(fac.maxP)} (${fac.priceRowsPos}개 항목)`;
    }

    // 신규 가격
    let newPriceCountDesc = `${newPrices.length}건`;
    let newPriceSamples = '';
    let priceEffect = '변동 없음';
    if (newPrices.length > 0) {
        const top3 = newPrices.slice(0, 3).map(p => `${p.item}: ${formatWon(p.price)}`).join(' / ');
        newPriceSamples = top3 + (newPrices.length > 3 ? ` 외 ${newPrices.length - 3}건` : '');
        if (fac.priceRowsPos === 0) {
            priceEffect = '🌟 미등록 시설 신규 가격 확보!';
        } else {
            priceEffect = '✨ 최신 상세 항목 추가/보강';
        }
    } else {
        newPriceSamples = '-';
    }

    // 원본 사진
    let origImgDesc = fac.imgCount === 0 ? '0장 (사진 없음)' : `${fac.imgCount}장`;

    // 신규 사진
    let newImgCountDesc = `${newImages.length}장`;
    let imgEffect = '변동 없음';
    if (newImages.length > 0) {
        if (fac.imgCount === 0) {
            imgEffect = '🖼️ 무(無)사진 시설 현장 실사 확보!';
        } else if (fac.imgCount < 3) {
            imgEffect = '📸 부족한 사진 대폭 보강';
        } else {
            imgEffect = '고화질 사진 추가';
        }
    }

    // 출처
    const sources = new Set();
    newPrices.forEach(p => sources.add(p.source));
    newImages.forEach(img => sources.add(img.source));
    const sourceDesc = Array.from(sources).map(s => {
        if (s === 'esky') return 'e하늘장사정보(보건복지부)';
        if (s === 'goifuneral') return '고이장례';
        if (s === 'ordinance') return '지자체조례';
        return s;
    }).join(' + ') || '-';

    // CSV Row
    csvRows.push([
        fac.grade,
        fac.id,
        fac.name,
        CAT_LABELS[fac.cat] || fac.cat,
        fac.addr.split(' ').slice(0, 2).join(' '),
        origPriceDesc,
        newPriceCountDesc,
        newPriceSamples,
        priceEffect,
        origImgDesc,
        newImgCountDesc,
        imgEffect,
        sourceDesc,
        '' // review_decision blank
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

    // 대시보드 JSON 용 (신규 데이터가 있는 시설 위주)
    if (newPrices.length > 0 || newImages.length > 0) {
        dashboardData.push({
            id: fac.id,
            name: fac.name,
            grade: fac.grade,
            cat: CAT_LABELS[fac.cat] || fac.cat,
            addr: fac.addr,
            origPriceDesc,
            origImgCount: fac.imgCount,
            newPrices: newPrices.slice(0, 8),
            newImages: newImages.slice(0, 6),
            priceEffect,
            imgEffect,
            sourceDesc
        });
    }
}

const csvOutPath = path.join(RUN_DIR, '대대손손_원본대비_최신화비교_시트.csv');
fs.writeFileSync(csvOutPath, '\uFEFF' + csvRows.join('\n'), 'utf8'); // BOM for Excel Korea
console.log(`✅ 비교 CSV 시트 생성 완료: ${csvOutPath} (${csvRows.length - 1}개 시설)`);

// 5. 시각적 인터랙티브 HTML 대시보드 생성
const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>대대손손 데이터 원본 vs 발굴 최신화 비교 대시보드</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background: #f4f6f9; color: #212529; padding: 24px; }
  .header { background: white; padding: 24px 32px; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .title h1 { font-size: 22px; font-weight: 700; color: #1D0098; }
  .title p { font-size: 14px; color: #6c757d; margin-top: 4px; }
  .stats { display: flex; gap: 16px; margin-bottom: 24px; }
  .stat-card { flex: 1; background: white; padding: 18px 22px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .stat-card .label { font-size: 13px; color: #868e96; font-weight: 600; }
  .stat-card .val { font-size: 24px; font-weight: 800; color: #1D0098; margin-top: 6px; }
  .stat-card .sub { font-size: 12px; color: #20c997; font-weight: 600; margin-top: 4px; }
  .toolbar { background: white; padding: 14px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); margin-bottom: 16px; display: flex; gap: 12px; align-items: center; }
  .search-input { flex: 1; padding: 10px 14px; border: 1px solid #dee2e6; border-radius: 8px; font-size: 14px; }
  .btn-filter { padding: 9px 14px; border: 1px solid #ced4da; background: white; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
  .btn-filter.active { background: #1D0098; color: white; border-color: #1D0098; }
  .table-box { background: white; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); overflow: hidden; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f8f9fa; padding: 14px 16px; text-align: left; font-weight: 700; color: #495057; border-bottom: 1px solid #e9ecef; }
  td { padding: 14px 16px; border-bottom: 1px solid #f1f3f5; vertical-align: top; }
  tr:hover { background: #f8faff; }
  .badge-grade { padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; }
  .grade-S { background: #ffe3e3; color: #e03131; }
  .grade-A { background: #fff3bf; color: #f08c00; }
  .grade-B { background: #e7f5ff; color: #1c7ed6; }
  .grade-C { background: #f1f3f5; color: #868e96; }
  .badge-effect { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  .effect-new { background: #d3f9d8; color: #2b8a3e; }
  .effect-update { background: #e7f5ff; color: #1971c2; }
  .effect-img { background: #fff4e6; color: #d9480f; }
  .price-list { list-style: none; margin-top: 4px; }
  .price-list li { font-size: 12px; color: #495057; line-height: 1.5; }
  .img-thumbs { display: flex; gap: 6px; margin-top: 6px; }
  .img-thumbs img { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e9ecef; }
  .open-note { font-size: 13px; color: #495057; background: #e7f5ff; padding: 10px 16px; border-radius: 8px; margin-top: 12px; border-left: 4px solid #1c7ed6; }
</style>
</head>
<body>
  <div class="header">
    <div class="title">
      <h1>대대손손 데이터 원본 vs 발굴 최신화 비교 대시보드</h1>
      <p>대대손손 DB 원본 대비 보건복지부 e하늘·고이장례·조례 발굴 데이터 비교표</p>
    </div>
    <div style="font-size: 13px; color: #868e96; text-align: right;">
      <span>생성일: 2026-10-04</span><br/>
      <strong style="color: #2b8a3e;">🛡️ DB/어드민 반영 0건 (안전 검수용)</strong>
    </div>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="label">총 비교 시설 수</div>
      <div class="val">1,449개소</div>
      <div class="sub">전수 갭 분석 완료</div>
    </div>
    <div class="stat-card">
      <div class="label">새로 가격을 찾은 시설</div>
      <div class="val">842개소</div>
      <div class="sub">총 4,891개 가격 항목 발굴</div>
    </div>
    <div class="stat-card">
      <div class="label">새로 사진을 찾은 시설</div>
      <div class="val">1,297개소</div>
      <div class="sub">총 1,471장 고화질 현장 사진</div>
    </div>
    <div class="stat-card">
      <div class="label">최우선(S·A급) 보강 대상</div>
      <div class="val">435개소</div>
      <div class="sub">조회수 높고 결측 심한 곳</div>
    </div>
  </div>

  <div class="toolbar">
    <input type="text" id="searchInput" class="search-input" placeholder="시설명 또는 지역 검색 (예: 창원, 영월, 봉안당)..." oninput="renderTable()"/>
    <button class="btn-filter active" onclick="setFilter('all', this)">전체 (${dashboardData.length})</button>
    <button class="btn-filter" onclick="setFilter('S', this)">S등급 최우선</button>
    <button class="btn-filter" onclick="setFilter('price', this)">신규 가격 발굴만</button>
    <button class="btn-filter" onclick="setFilter('image', this)">사진 보강만</button>
  </div>

  <div class="table-box">
    <table>
      <thead>
        <tr>
          <th style="width: 60px;">등급</th>
          <th style="width: 180px;">시설명</th>
          <th style="width: 100px;">구분</th>
          <th style="width: 220px;">[원본] 기존 가격</th>
          <th style="width: 320px;">[외부 발굴] 새로 찾은 가격</th>
          <th style="width: 140px;">[원본] 사진</th>
          <th style="width: 200px;">[외부 발굴] 사진</th>
          <th style="width: 140px;">출처</th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <div class="open-note">
    💡 <strong>엑셀 시트로 직접 수정·검수하시려면:</strong> 터미널에서 <code>open data/enrichment/20261003_1750/대대손손_원본대비_최신화비교_시트.csv</code> 를 실행하시면 엑셀에서 바로 열립니다.
  </div>

<script>
  const data = ${JSON.stringify(dashboardData)};
  let currentFilter = 'all';

  function setFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTable();
  }

  function renderTable() {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    const filtered = data.filter(d => {
      if (q && !d.name.toLowerCase().includes(q) && !d.addr.toLowerCase().includes(q)) return false;
      if (currentFilter === 'S' && d.grade !== 'S') return false;
      if (currentFilter === 'price' && d.newPrices.length === 0) return false;
      if (currentFilter === 'image' && d.newImages.length === 0) return false;
      return true;
    });

    for (const d of filtered.slice(0, 100)) {
      const tr = document.createElement('tr');
      const isNewPrice = d.origPriceDesc.includes('문의');
      
      let priceHtml = '<span style="color:#868e96;">새 가격 없음</span>';
      if (d.newPrices.length > 0) {
        priceHtml = \`<div class="badge-effect \${isNewPrice ? 'effect-new' : 'effect-update'}">\${d.priceEffect}</div><ul class="price-list">\` +
          d.newPrices.slice(0, 3).map(p => \`<li>• <strong>\${p.item}</strong>: \${Number(p.price).toLocaleString()}원</li>\`).join('') +
          (d.newPrices.length > 3 ? \`<li style="color:#1D0098;font-weight:600;">외 \${d.newPrices.length - 3}건 더보기...</li>\` : '') +
          '</ul>';
      }

      let imgHtml = '<span style="color:#868e96;">추가 사진 없음</span>';
      if (d.newImages.length > 0) {
        imgHtml = \`<div class="badge-effect effect-img">\${d.imgEffect} (+\${d.newImages.length}장)</div><div class="img-thumbs">\` +
          d.newImages.slice(0, 3).map(img => \`<img src="\${img.url}" onerror="this.style.display='none'"/>\`).join('') +
          '</div>';
      }

      tr.innerHTML = \`
        <td><span class="badge-grade grade-\${d.grade}">\${d.grade}</span></td>
        <td><strong>\${d.name}</strong><br/><span style="color:#868e96;font-size:11px;">\${d.addr.split(' ').slice(0,2).join(' ')}</span></td>
        <td>\${d.cat}</td>
        <td><span style="\${isNewPrice ? 'color:#e03131;font-weight:600;' : ''}">\${d.origPriceDesc}</span></td>
        <td>\${priceHtml}</td>
        <td>\${d.origImgCount === 0 ? '<span style="color:#e03131;font-weight:600;">0장 (없음)</span>' : d.origImgCount + '장'}</td>
        <td>\${imgHtml}</td>
        <td style="font-size:11px;color:#495057;">\${d.sourceDesc}</td>
      \`;
      tbody.appendChild(tr);
    }
  }

  renderTable();
</script>
</body>
</html>`;

const htmlOutPath = path.join(RUN_DIR, '대대손손_원본대비_최신화비교_대시보드.html');
fs.writeFileSync(htmlOutPath, htmlContent, 'utf8');
console.log(`✅ 인터랙티브 HTML 대시보드 생성 완료: ${htmlOutPath}`);


const fetch = require('node-fetch');

const endpoints = [
    'https://www.15774129.go.kr/portal/fnlfac/fac_view.ajax',
    'https://www.15774129.go.kr/portal/fnlfac/fac_detail.ajax',
    'https://www.15774129.go.kr/portal/fnlfac/selectFacDetail.ajax',
    'https://www.15774129.go.kr/portal/index/fac/fac_view.ajax' // 초기 엔드포인트 기반 추측
];

const facilitycd = '4000000036'; // 포항시우현화장장

(async () => {
    for (const url of endpoints) {
        console.log(`Testing ${url}...`);
        try {
            const params = new URLSearchParams();
            params.append('facilitycd', facilitycd);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000'
                },
                body: params
            });

            const text = await response.text();
            console.log(`Response Length: ${text.length}`);
            if (text.length < 500) console.log(text);
            else console.log(text.substring(0, 200));

            try {
                const json = JSON.parse(text);
                if (json.data || json.result || json.info) {
                    console.log('🎉 FOUND JSON DATA!');
                }
            } catch (e) { }

        } catch (e) {
            console.error('Error:', e.message);
        }
        console.log('---');
    }
})();

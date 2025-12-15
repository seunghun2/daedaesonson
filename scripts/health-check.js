
const http = require('http');
const fs = require('fs');

const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
};

console.log(`${COLORS.blue}🏥 대대손손 시스템 종합 건강 검진 시작...${COLORS.reset}\n`);

// 1. 환경 변수 체크
console.log(`${COLORS.yellow}[1] 환경 변수 점검${COLORS.reset}`);
const envPath = '.env.local';
try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const hasClientId = envConfig.includes('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID');
    const hasSecret = envConfig.includes('NAVER_MAP_CLIENT_SECRET');

    if (hasClientId && hasSecret) {
        console.log(`${COLORS.green}✅ 네이버 지도 API 키 설정 확인됨${COLORS.reset}`);
    } else {
        console.log(`${COLORS.red}❌ 네이버 지도 API 키 누락!${COLORS.reset}`);
    }
} catch (e) {
    console.log(`${COLORS.red}❌ .env.local 파일을 읽을 수 없음: ${e.message}${COLORS.reset}`);
}

// 2. 로컬 API 체크
console.log(`\n${COLORS.yellow}[2] 로컬 서버 API 응답 점검 (http://localhost:3001)${COLORS.reset}`);
const checkApi = () => {
    return new Promise((resolve) => {
        http.get('http://localhost:3001/api/facilities', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        const facilityCount = Array.isArray(json) ? json.length : (Object.keys(json).length || 0);
                        console.log(`${COLORS.green}✅ API 연결 성공 (상태코드: 200)${COLORS.reset}`);
                        console.log(`${COLORS.green}✅ 데이터 로드 성공 (시설 개수: ${facilityCount})${COLORS.reset}`);
                        resolve(true);
                    } catch (e) {
                        console.log(`${COLORS.red}❌ JSON 파싱 실패${COLORS.reset}`);
                        resolve(false);
                    }
                } else {
                    console.log(`${COLORS.red}❌ API 오류 (상태코드: ${res.statusCode})${COLORS.reset}`);
                    console.log(`응답 내용: ${data.substring(0, 100)}...`);
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.log(`${COLORS.red}❌ 서버 연결 실패: ${err.message}${COLORS.reset}`);
            console.log(`${COLORS.yellow}💡 해결책: 'npm run dev'가 실행 중인지 확인하세요.${COLORS.reset}`);
            resolve(false);
        });
    });
};

// 3. Vercel 배포 상태 체크 (간단)
const checkVercel = () => {
    console.log(`\n${COLORS.yellow}[3] 배포 사이트 상태 점검 (https://daedaesonson.vercel.app)${COLORS.reset}`);
    // node https 모듈은 생략하고 curl로 대체하는 게 낫지만 로직상 여기 둠
    console.log("ℹ️  배포 사이트 점검은 외부 curl 명령어로 별도 실행합니다.");
};

// 실행
(async () => {
    await checkApi();
    checkVercel();
    console.log(`\n${COLORS.blue}🏁 검진 완료${COLORS.reset}`);
})();

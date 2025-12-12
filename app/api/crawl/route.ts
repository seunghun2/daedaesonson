
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { facilityId } = body;

        if (!facilityId) {
            return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 });
        }

        // ESKY ID 추출 (esky-1234 -> 1234)
        const pureId = facilityId.replace('esky-', '');

        // 1. 상세 정보 조회 (가격 등)
        const params = new URLSearchParams();
        params.append('facilitycd', pureId);

        const res = await fetch('https://www.15774129.go.kr/portal/fnlfac/fac_detail.ajax', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: params
        });

        const json = await res.json();
        const detail = json.detail;

        if (!detail) {
            return NextResponse.json({ error: 'Data not found' }, { status: 404 });
        }

        // 2. 데이터 가공 (Price Table)
        const priceTable: any = {};
        const basicRows: any[] = [];

        // 묘지
        if (detail.gravefeeamt > 0) {
            basicRows.push({ name: '시설사용료 (매장묘)', price: detail.gravefeeamt * 10000 });
            if (detail.gravemgmtfeeamt > 0) {
                basicRows.push({ name: '관리비/1년단위', price: detail.gravemgmtfeeamt * 10000 });
            }
        }
        // 봉안당
        if (detail.charnelfeeamt > 0) {
            basicRows.push({ name: '시설사용료 (봉안당)', price: detail.charnelfeeamt * 10000 });
            if (detail.charnelmgmtfeeamt > 0) {
                basicRows.push({ name: '관리비/5년단위', price: detail.charnelmgmtfeeamt * 10000 }); // 봉안당은 보통 5년/15년/영구 등 다양하지만 일단 구분
            }
        }
        // 자연장 (혹시 있을 경우 대비, e하늘 API 필드 확인 필요하지만 일단 위 두 개가 메인)

        // 기본비용 그룹 생성
        if (basicRows.length > 0) {
            priceTable['기본비용'] = {
                unit: '원',
                rows: basicRows
            };
        }

        // 화장장
        if (detail.inneradultamt > 0) {
            priceTable['화장료'] = {
                unit: '구',
                rows: [
                    { name: '대인 (관내)', price: detail.inneradultamt },
                    { name: '대인 (관외)', price: detail.outsideadultamt || detail.inneradultamt * 10 },
                    { name: '소인', price: detail.innerchildamt || detail.inneradultamt * 0.5 }
                ]
            };
        }

        // 3. 이미지 (filelist가 API에 있다면)
        // json.filelist가 빈 배열인 경우가 많으므로, 일단 있는 경우만
        const images = [];
        if (json.filelist && Array.isArray(json.filelist)) {
            json.filelist.forEach((f: any) => {
                if (f.savedFileNm) images.push(`https://www.15774129.go.kr/BCUser/facilitypic/${f.savedFileNm}`);
            });
        }
        if (detail.fileurl) images.push(`https://www.15774129.go.kr${detail.fileurl}`);

        // Return Result
        return NextResponse.json({
            success: true,
            data: {
                name: detail.companyname,
                address: detail.fulladdress,
                phone: detail.telephone,
                priceInfo: { priceTable },
                imageGallery: [...new Set(images)], // Unique
                coordinates: { lat: detail.latitude, lng: detail.longitude }
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

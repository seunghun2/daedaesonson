import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';

export interface TopPriceItem {
    category: string;
    name: string;
    grade: string;
    price: number;
    isRepresentative?: boolean;
}

export interface DerivedFacilityInsights {
    /** 대표가격 산정 기준 설명 (예: '매장묘 · 묘지 사용료 (1평)') */
    representativePriceLabel: string | null;
    /** 이용 자격 / 거주지 조건 요약 (예: '시흥시민 (관내 주민)', '제한 없음 (전국 누구나)') */
    eligibilityText: string;
    /** 연간 관리비 (원 단위, 확인된 경우만) */
    annualManagementFee: number | null;
    /** 관리비 원문 라벨 (예: '연 4만 원', '5년 15만 원') */
    managementFeeText: string | null;
    /** 대표 분양가 + 10년 관리비 합산 예상 총액 */
    estimated10YearTotal: number | null;
    /** 관내 주민 최저 사용료 */
    localMinPrice: number | null;
    /** 관외 주민 최저 사용료 */
    nonLocalMinPrice: number | null;
    /** 관내 주민 감면율 (%) */
    localDiscountPercent: number | null;
    /** 확인된 계약/안치 기간 목록 (예: ['영구안치', '30년 사용']) */
    durations: string[];
    /** 대표 안치 기간 라벨 */
    primaryDuration: string | null;
    /** 봉안당 알뜰단(1·2·8·9단) vs 로얄단(3~6단 눈높이) 최저가 비교 */
    tierComparison: {
        economyMin: number;
        royalMin: number;
    } | null;
    /** 안치 유형별 실제 시작가 (봉안당 / 수목장·자연장 / 매장묘지) */
    categoryPrices: {
        charnel: number | null;
        natural: number | null;
        burial: number | null;
    };
    /** 이 시설에서 제공하는 모든 안치 유형 태그 */
    availableServiceTypes: string[];
    /** 인원/안치 형태별 최저 분양가 */
    capacityPrices: {
        single?: number;
        couple?: number;
        family?: number;
    };
    /** 지원 안치 형태 라벨 */
    capacityTypes: ('개인형' | '부부형' | '가족형')[];
    /** 석물·설치비 등 별도 부대비용 안내 */
    extraCostText: string | null;
    /** 핵심 가격표 상위 요약 리스트 (최대 4개) */
    topPriceItems: TopPriceItem[];
    /** 종교 관련 태그 */
    religionTags: string[];
    /** 데이터 완성도·투명도 점수 (0~100) */
    completenessScore: number;
    /** 데이터 무결성 이상 징후 목록 (어드민 검수용) */
    anomalies: string[];
}

interface RawRow {
    name?: string;
    grade?: string;
    price?: number;
    feeType?: string;
    residency?: string;
    capacity?: string;
    duration?: string;
    note?: string;
    groupType?: string;
    isRepresentative?: boolean;
}

function collectAllPriceRows(facility: Facility): RawRow[] {
    const rows: RawRow[] = [];
    const seen = new Set<string>();

    const pushRow = (r: any) => {
        if (!r || typeof r !== 'object') return;
        const name = String(r.name || r.item || r.itemName || '').trim();
        const grade = String(r.grade || r.subType || r.description || r.note || '').trim();
        const rawP = typeof r.price === 'string' ? parseInt(r.price.replace(/,/g, ''), 10) : Number(r.price);
        const price = Number.isFinite(rawP) && rawP > 0 ? rawP : 0;
        const key = `${name}|${grade}|${price}|${r.groupType || ''}`;
        if (seen.has(key)) return;
        seen.add(key);
        rows.push({
            name,
            grade,
            price,
            feeType: r.feeType,
            residency: r.residency,
            capacity: r.capacity,
            duration: r.duration,
            note: r.note,
            groupType: r.groupType,
            isRepresentative: Boolean(r.isRepresentative),
        });
    };

    const parseTable = (table: any) => {
        if (!table || typeof table !== 'object') return;
        Object.entries(table).forEach(([catName, catVal]: [string, any]) => {
            if (catName === '제외됨') return;
            if (Array.isArray(catVal)) {
                catVal.forEach((r) => pushRow({ ...r, groupType: r.groupType || catName }));
            } else if (catVal && Array.isArray(catVal.rows)) {
                catVal.rows.forEach((r: any) => pushRow({ ...r, groupType: r.groupType || catName }));
            }
        });
    };

    if (facility.priceInfo?.priceTable) {
        parseTable(facility.priceInfo.priceTable);
    }
    if ((facility.priceInfo as any)?.standardizedPrices && Array.isArray((facility.priceInfo as any).standardizedPrices)) {
        (facility.priceInfo as any).standardizedPrices.forEach((group: any) => {
            if (Array.isArray(group?.rows)) {
                group.rows.forEach((r: any) => pushRow({ ...r, groupType: r.groupType || group.subType || group.serviceType }));
            }
        });
    }

    if (facility.pricing) {
        try {
            const parsed = typeof facility.pricing === 'string'
                ? JSON.parse(facility.pricing)
                : facility.pricing;
            if (parsed?.priceInfo?.priceTable) {
                parseTable(parsed.priceInfo.priceTable);
            } else if (parsed?.priceTable) {
                parseTable(parsed.priceTable);
            } else if (parsed?.standardized && Array.isArray(parsed.standardized)) {
                parsed.standardized.forEach((cat: any) => {
                    if (Array.isArray(cat?.rows)) {
                        cat.rows.forEach((r: any) => pushRow({ ...r, groupType: r.groupType || cat.title }));
                    }
                });
            } else {
                parseTable(parsed);
            }
        } catch {
            // ignore malformed JSON
        }
    }

    return rows;
}

export function formatKoreanPrice(won: number): string {
    if (!won || won <= 0) return '-';
    if (won >= 100000000) {
        const eok = Math.floor(won / 100000000);
        const man = Math.round((won % 100000000) / 10000);
        return man > 0 ? `${eok}억 ${man.toLocaleString()}만 원` : `${eok}억 원`;
    }
    if (won >= 10000) {
        const man = Math.floor(won / 10000);
        const rest = won % 10000;
        if (rest === 0) return `${man.toLocaleString()}만 원`;
        if (won >= 100000 && rest % 1000 !== 0) {
            return `${Math.round(won / 10000).toLocaleString()}만 원`;
        }
        return `${man.toLocaleString()}만 ${rest.toLocaleString()}원`;
    }
    return `${won.toLocaleString()}원`;
}

export function extractFacilityInsights(facility: Facility, overrideBasePrice?: number): DerivedFacilityInsights {
    const rows = collectAllPriceRows(facility);
    const positiveRows = rows.filter((r) => (r.price || 0) > 0);

    const rawBase = overrideBasePrice && overrideBasePrice > 0
        ? overrideBasePrice
        : (facility.representativePrice || facility.minPrice || facility.priceRange?.min || 0);
    const basePrice = rawBase > 0 && rawBase < 10000 ? rawBase * 10000 : rawBase;

    // 1. 연간 관리비 추출
    let annualManagementFee: number | null = null;
    let managementFeeText: string | null = null;

    const mgmtRows = positiveRows.filter((r) => {
        const text = `${r.name || ''} ${r.grade || ''} ${r.groupType || ''}`;
        return r.feeType === 'MANAGEMENT' || r.feeType === 'MAINTENANCE' || /관리비/.test(text);
    });

    if (mgmtRows.length > 0) {
        const reasonable = mgmtRows
            .filter((r) => (r.price || 0) >= 1000 && (r.price || 0) <= 2000000)
            .sort((a, b) => (a.price || 0) - (b.price || 0));

        const picked = reasonable[0] || mgmtRows[0];
        const p = picked.price || 0;
        const text = `${picked.name || ''} ${picked.grade || ''} ${picked.duration || ''}`;

        if (/5년/.test(text) && p >= 30000) {
            annualManagementFee = Math.round(p / 5);
            managementFeeText = `연 ${formatKoreanPrice(annualManagementFee)} (5년분)`;
        } else if (/10년/.test(text) && p >= 50000) {
            annualManagementFee = Math.round(p / 10);
            managementFeeText = `연 ${formatKoreanPrice(annualManagementFee)} (10년분)`;
        } else if (/15년/.test(text) && p >= 50000) {
            annualManagementFee = Math.round(p / 15);
            managementFeeText = `연 ${formatKoreanPrice(annualManagementFee)} (15년분)`;
        } else if (p <= 300000) {
            annualManagementFee = p;
            const unitHint = /1평|평당/.test(text) ? ' (1평당)' : '';
            managementFeeText = `연 ${formatKoreanPrice(p)}${unitHint}`;
        } else {
            managementFeeText = `${formatKoreanPrice(p)}`;
        }
    }

    // 기본 분양/안치 항목 (관리비/옵션/수수료 제외)
    const usageRows = positiveRows.filter((r) => {
        const text = `${r.name || ''} ${r.grade || ''} ${r.groupType || ''}`;
        if (r.feeType === 'MANAGEMENT' || r.feeType === 'MAINTENANCE' || r.feeType === 'INSTALL' || r.feeType === 'OPTION') return false;
        if (/관리비|수수료|각자비|석물|비석|상석|둘레석|화병|향로/.test(text)) return false;
        return (r.price || 0) >= 10000;
    });

    // 대표가격 산정 기준 라벨 추출
    let representativePriceLabel: string | null = null;
    const repRow = positiveRows.find((r) => r.isRepresentative) ||
        usageRows.find((r) => r.price === basePrice) ||
        usageRows[0];

    if (repRow) {
        const catPart = repRow.groupType && repRow.groupType !== '기타' ? repRow.groupType : '';
        const namePart = repRow.name || '';
        const cleanGrade = (repRow.grade || '')
            .replace(/이용자격\s*[:：]\s*/g, '')
            .replace(/사용기간\s*[:：]\s*/g, '')
            .trim();
        const shortGrade = cleanGrade.length > 22 ? `${cleanGrade.slice(0, 22)}...` : cleanGrade;

        const parts = [catPart, namePart && namePart !== catPart ? namePart : ''].filter(Boolean);
        const prefix = parts.join(' · ') || FACILITY_CATEGORY_LABELS[facility.category] || '기본 안치';
        representativePriceLabel = shortGrade ? `${prefix} (${shortGrade})` : prefix;
    } else if (basePrice > 0) {
        const catLabel = FACILITY_CATEGORY_LABELS[facility.category] || '기본 안치';
        representativePriceLabel = facility.isPublic ? `${catLabel} (공설 사용료 기준)` : `${catLabel} (기본 분양가 기준)`;
    }

    const estimated10YearTotal =
        basePrice >= 10000 && annualManagementFee && annualManagementFee > 0
            ? basePrice + annualManagementFee * 10
            : null;

    // 2. 관내 vs 관외 요금 비교 & 이용 자격 추출
    let localMinPrice: number | null = null;
    let nonLocalMinPrice: number | null = null;
    let localDiscountPercent: number | null = null;

    const localRows = usageRows.filter((r) => {
        const text = `${r.name || ''} ${r.grade || ''} ${r.residency || ''}`;
        return r.residency === 'LOCAL' || (/관내|군민|시민|구민|해당지역/.test(text) && !/관외/.test(text));
    });
    const nonLocalRows = usageRows.filter((r) => {
        const text = `${r.name || ''} ${r.grade || ''} ${r.residency || ''}`;
        return r.residency === 'NON_LOCAL' || /관외|타지역/.test(text);
    });

    if (localRows.length > 0) {
        localMinPrice = Math.min(...localRows.map((r) => r.price || Infinity));
        if (!Number.isFinite(localMinPrice)) localMinPrice = null;
    }
    if (nonLocalRows.length > 0) {
        nonLocalMinPrice = Math.min(...nonLocalRows.map((r) => r.price || Infinity));
        if (!Number.isFinite(nonLocalMinPrice)) nonLocalMinPrice = null;
    }
    if (localMinPrice && nonLocalMinPrice && nonLocalMinPrice > localMinPrice) {
        const pct = Math.round((1 - localMinPrice / nonLocalMinPrice) * 100);
        if (pct >= 10 && pct <= 95) {
            localDiscountPercent = pct;
        }
    }

    const allText = rows.map((r) => `${r.name || ''} ${r.grade || ''} ${r.duration || ''} ${r.note || ''}`).join(' ');

    // 이용 자격 텍스트 도출
    let eligibilityText = facility.isPublic ? '관내 주민 우선 (지자체 기준)' : '제한 없음 (전국 누구나)';
    const qualMatch = allText.match(/이용자격\s*[:：]\s*([^,/)·\s]+)/);
    if (qualMatch && qualMatch[1]) {
        eligibilityText = `${qualMatch[1]} (관내 거주자)`;
    } else if (localMinPrice && nonLocalMinPrice) {
        eligibilityText = '관내·관외 모두 가능 (관내 우대)';
    } else if (localRows.length > 0 && nonLocalRows.length === 0 && facility.isPublic) {
        const cityMatch = allText.match(/([가-힣]{2,5}(?:시민|군민|구민|도민))/);
        eligibilityText = cityMatch ? `${cityMatch[1]} 전용/우선` : '관내 주민 전용/우선';
    }

    // 3. 계약/사용 기간 추출
    const durationSet = new Set<string>();
    if (/영구/.test(allText)) durationSet.add('영구안치');
    if (/60년/.test(allText) || /15년.*3회\s*연장/.test(allText) || /30년.*1회\s*연장/.test(allText)) durationSet.add('최대 60년');
    if (/45년/.test(allText) || /15년.*2회\s*연장/.test(allText)) durationSet.add('최대 45년');
    if (/30년/.test(allText)) durationSet.add('30년 사용');
    if (/15년/.test(allText)) durationSet.add('15년 기본');
    const durations = Array.from(durationSet);
    const primaryDuration = durations[0] || (facility.isPublic === false ? '영구안치(기본)' : '15~30년(조례 기준)');

    // 4. 안치 유형별 실제 시작가 (봉안당 / 수목장·자연장 / 매장묘지)
    const charnelPrices: number[] = [];
    const naturalPrices: number[] = [];
    const burialPrices: number[] = [];

    usageRows.forEach((r) => {
        const catText = `${r.groupType || ''} ${r.name || ''}`;
        const p = r.price || 0;
        if (p < 10000) return;

        if (/봉안|납골|안치단|추모단|실내봉안|봉안당|봉안담|봉안탑/.test(catText)) {
            charnelPrices.push(p);
        } else if (/수목|자연|잔디|화초|정원|수목장/.test(catText)) {
            naturalPrices.push(p);
        } else if (/매장|묘지|단장|합장|쌍분|복합묘|평장|봉분|공원묘지/.test(catText)) {
            burialPrices.push(p);
        }
    });

    let charnelMin = charnelPrices.length > 0 ? Math.min(...charnelPrices) : null;
    let naturalMin = naturalPrices.length > 0 ? Math.min(...naturalPrices) : null;
    let burialMin = burialPrices.length > 0 ? Math.min(...burialPrices) : null;

    // 상세 priceTable이 아직 안 불려왔거나 단일 카테고리일 때 대표가격 폴백
    if (basePrice > 0) {
        if (facility.category === 'CHARNEL_HOUSE' && !charnelMin) charnelMin = basePrice;
        if (facility.category === 'NATURAL_BURIAL' && !naturalMin) naturalMin = basePrice;
        if (facility.category === 'FAMILY_GRAVE' && !burialMin) burialMin = basePrice;
    }

    const availableServiceTypes: string[] = [];
    if (charnelMin) availableServiceTypes.push('봉안당');
    if (naturalMin) availableServiceTypes.push('수목장·자연장');
    if (burialMin) availableServiceTypes.push('매장묘지');
    if (availableServiceTypes.length === 0 && FACILITY_CATEGORY_LABELS[facility.category]) {
        availableServiceTypes.push(FACILITY_CATEGORY_LABELS[facility.category]);
    }

    // 5. 봉안당 단수(층수)별 가격 비교 (알뜰단 vs 눈높이 로얄단)
    let tierComparison: { economyMin: number; royalMin: number } | null = null;
    if (facility.category === 'CHARNEL_HOUSE' || charnelMin) {
        const economyPrices: number[] = [];
        const royalPrices: number[] = [];
        usageRows.forEach((r) => {
            const text = `${r.name || ''} ${r.grade || ''}`;
            const p = r.price || 0;
            if (p < 100000) return;
            if (/(^|\s|\/)(1단|2단|8단|9단|최상단|최하단)/.test(text)) {
                economyPrices.push(p);
            }
            if (/(^|\s|\/)(3단|4단|5단|6단|로얄단|특단|중단)/.test(text)) {
                royalPrices.push(p);
            }
        });
        if (economyPrices.length > 0 && royalPrices.length > 0) {
            const economyMin = Math.min(...economyPrices);
            const royalMin = Math.min(...royalPrices);
            if (royalMin > economyMin) {
                tierComparison = { economyMin, royalMin };
            }
        }
    }

    // 6. 인원/안치 형태별 최저 분양가 (개인형 / 부부형 / 가족형)
    const capacityPrices: { single?: number; couple?: number; family?: number } = {};
    const singleCandidates: number[] = [];
    const coupleCandidates: number[] = [];
    const familyCandidates: number[] = [];

    usageRows.forEach((r) => {
        const text = `${r.name || ''} ${r.grade || ''} ${r.capacity || ''} ${r.groupType || ''}`;
        const p = r.price || 0;
        if (p < 20000) return;
        if (/가족|4위|6위|8위|10위|12위|문중|선산|단체|복합/.test(text)) {
            familyCandidates.push(p);
        } else if (/부부|합장|쌍분|2위|2기|2인/.test(text)) {
            coupleCandidates.push(p);
        } else if (/개인|단장|1위|1기|1인|단독/.test(text)) {
            singleCandidates.push(p);
        }
    });

    if (singleCandidates.length > 0) capacityPrices.single = Math.min(...singleCandidates);
    if (coupleCandidates.length > 0) capacityPrices.couple = Math.min(...coupleCandidates);
    if (familyCandidates.length > 0) capacityPrices.family = Math.min(...familyCandidates);

    const capacityTypes: ('개인형' | '부부형' | '가족형')[] = [];
    if (capacityPrices.single) capacityTypes.push('개인형');
    if (capacityPrices.couple) capacityTypes.push('부부형');
    if (capacityPrices.family) capacityTypes.push('가족형');

    // 7. 석물·설치비 등 별도 부대비용 안내
    let extraCostText: string | null = null;
    const optionRows = positiveRows.filter((r) => {
        const text = `${r.name || ''} ${r.grade || ''} ${r.groupType || ''}`;
        return r.feeType === 'INSTALL' || r.feeType === 'OPTION' || /석물|비석|상석|둘레석|설치비|각자비/.test(text);
    });
    if (optionRows.length > 0) {
        const minOpt = Math.min(...optionRows.map((r) => r.price || Infinity));
        if (Number.isFinite(minOpt) && minOpt >= 50000) {
            extraCostText = `석물·부대비용 ${formatKoreanPrice(minOpt)}~ 별도`;
        } else {
            extraCostText = '석물·각자비 등 옵션 별도';
        }
    } else if (facility.category === 'FAMILY_GRAVE' && !facility.isPublic) {
        extraCostText = '묘지 석물·작업비 별도 문의';
    }

    // 8. 핵심 가격표 상위 4개 항목 추출
    const topPriceItems: TopPriceItem[] = [];
    const usedKeys = new Set<string>();
    const addTopItem = (r: RawRow | undefined) => {
        if (!r || !r.price || r.price <= 0 || topPriceItems.length >= 4) return;
        const k = `${r.groupType || ''}|${r.name || ''}|${r.price}`;
        if (usedKeys.has(k)) return;
        usedKeys.add(k);
        topPriceItems.push({
            category: r.groupType || FACILITY_CATEGORY_LABELS[facility.category] || '기본',
            name: r.name || '사용료',
            grade: (r.grade || '').replace(/이용자격\s*[:：]\s*/g, '').replace(/사용기간\s*[:：]\s*/g, '').trim(),
            price: r.price,
            isRepresentative: r.isRepresentative,
        });
    };

    if (repRow) addTopItem(repRow);
    usageRows.slice(0, 5).forEach((r) => addTopItem(r));
    if (mgmtRows.length > 0 && topPriceItems.length < 4) {
        addTopItem(mgmtRows[0]);
    }

    // 9. 종교 전용/친화 태그
    const religionTags: string[] = [];
    const fullCorpus = `${facility.name || ''} ${facility.description || ''} ${allText}`;
    if (/기독교|교회|크리스천/.test(fullCorpus)) religionTags.push('기독교 전용/가능');
    if (/천주교|가톨릭|성당/.test(fullCorpus)) religionTags.push('천주교 전용/가능');
    if (/불교|사찰|스님|극락|연화/.test(fullCorpus)) religionTags.push('불교 전용/가능');

    // 10. 데이터 완성도 점수 및 이상치 진단
    let completenessScore = 0;
    const anomalies: string[] = [];

    const hasRepPrice = basePrice > 0;
    if (hasRepPrice) {
        completenessScore += 30;
    } else {
        anomalies.push('대표가격 미보유(가격 문의)');
    }

    if (positiveRows.length >= 3) {
        completenessScore += 20;
    } else if (positiveRows.length > 0) {
        completenessScore += 15;
    } else if (hasRepPrice) {
        completenessScore += 10;
    }

    const imgCount = Array.isArray(facility.images) && facility.images.length > 0
        ? facility.images.length
        : Array.isArray(facility.imageGallery) && facility.imageGallery.length > 0
            ? facility.imageGallery.length
            : (facility as any).thumbnail
                ? 1
                : 0;
    if (imgCount >= 3) {
        completenessScore += 20;
    } else if (imgCount > 0) {
        completenessScore += 15;
    } else {
        anomalies.push('시설 이미지 없음');
    }

    const cleanPhone = String(facility.phone || '').replace(/\s+/g, '');
    if (cleanPhone.length >= 8 && !/^[-]+$/.test(cleanPhone) && !cleanPhone.endsWith('-')) {
        completenessScore += 15;
    } else {
        anomalies.push(cleanPhone ? `전화번호 형식 불량(${cleanPhone})` : '전화번호 누락');
    }

    if (annualManagementFee || durations.length > 0 || localDiscountPercent) {
        completenessScore += 15;
    } else if (facility.description && facility.description.length > 20) {
        completenessScore += 10;
    } else if (facility.hasParking || facility.hasAccessibility || facility.websiteUrl) {
        completenessScore += 10;
    }

    const minP = facility.minPrice || facility.priceRange?.min || 0;
    const maxP = (facility as any).maxPrice || facility.priceRange?.max || 0;
    if (minP > 0 && maxP > 0 && minP > maxP) {
        anomalies.push(`최소가(${formatKoreanPrice(minP)}) > 최대가(${formatKoreanPrice(maxP)}) 역전`);
    }

    if (basePrice > 0 && basePrice < 10000) {
        anomalies.push(`대표가격 단위 이상치(${basePrice.toLocaleString()}원)`);
    }

    return {
        representativePriceLabel,
        eligibilityText,
        annualManagementFee,
        managementFeeText,
        estimated10YearTotal,
        localMinPrice,
        nonLocalMinPrice,
        localDiscountPercent,
        durations,
        primaryDuration,
        tierComparison,
        categoryPrices: {
            charnel: charnelMin,
            natural: naturalMin,
            burial: burialMin,
        },
        availableServiceTypes,
        capacityPrices,
        capacityTypes,
        extraCostText,
        topPriceItems,
        religionTags,
        completenessScore: Math.min(100, completenessScore),
        anomalies,
    };
}

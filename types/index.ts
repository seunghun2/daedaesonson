export type FacilityCategory = 'CHARNEL_HOUSE' | 'NATURAL_BURIAL' | 'FAMILY_GRAVE' | 'CREMATORIUM' | 'FUNERAL_HOME' | 'OTHER';

export const FACILITY_CATEGORY_LABELS: Record<FacilityCategory, string> = {
    CHARNEL_HOUSE: '봉안당',
    NATURAL_BURIAL: '수목장',
    FAMILY_GRAVE: '공원묘지',
    CREMATORIUM: '화장시설',
    FUNERAL_HOME: '장례식장',
    OTHER: '기타',
};

// ===== 가격 표준 스키마 v2 =====

// 서비스 대분류 (시설이 제공하는 장법)
export type ServiceType = 'BONGSAN' | 'NATURAL' | 'BURIAL';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
    BONGSAN: '봉안',     // 봉안당, 봉안묘, 봉안담
    NATURAL: '자연장',   // 수목형, 잔디형, 화초형, 암석형
    BURIAL: '매장',      // 단장형, 합장형, 쌍분형, 평장묘
};

// 서비스 세부 타입
export type BongsanSubType = '봉안당' | '봉안묘' | '봉안담';
export type NaturalSubType = '수목형' | '잔디형' | '화초형' | '암석형';
export type BurialSubType = '단장형' | '합장형' | '쌍분형' | '평장묘' | '복합묘';
export type ServiceSubType = BongsanSubType | NaturalSubType | BurialSubType;

export const SERVICE_SUB_TYPES: Record<ServiceType, string[]> = {
    BONGSAN: ['봉안당', '봉안묘', '봉안담'],
    NATURAL: ['수목형', '잔디형', '화초형', '암석형'],
    BURIAL: ['단장형', '합장형', '쌍분형', '평장묘', '복합묘'],
};

// 거주지 구분
export type ResidencyType = 'LOCAL' | 'NON_LOCAL' | 'VETERAN' | 'ALL';
export const RESIDENCY_LABELS: Record<ResidencyType, string> = {
    LOCAL: '관내',
    NON_LOCAL: '관외',
    VETERAN: '유공자',
    ALL: '공통',
};

// 면적 단위
export type AreaUnit = 'PYEONG' | 'M2';
export const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
    PYEONG: '평',
    M2: '㎡',
};

// 사용 기간 유형
export type DurationType = 'YEAR' | 'PERMANENT';

// 비용 유형
export type FeeType = 'USAGE' | 'MANAGEMENT' | 'STONE' | 'WORK' | 'ACCESSORY' | 'SERVICE' | 'OTHER';
export const FEE_TYPE_LABELS: Record<FeeType, string> = {
    USAGE: '사용료',
    MANAGEMENT: '관리비',
    STONE: '석물/비석',
    WORK: '작업비',
    ACCESSORY: '부속품',
    SERVICE: '서비스',
    OTHER: '기타',
};

// ===== 표준화된 가격 항목 =====
export interface PriceRow {
    // === 핵심 필드 ===
    name: string;               // 항목명 (예: "개인 봉안", "1단", "A형")
    price: number;              // 가격 (원)

    // === 구조화 필드 (v2) ===
    feeType?: FeeType;          // 비용 유형: 사용료/관리비/석물 등
    residency?: ResidencyType;  // 관내/관외/유공자/공통
    area?: number;              // 면적 값
    areaUnit?: AreaUnit;        // 면적 단위: 평/㎡
    duration?: number;          // 사용 기간 (년 수)
    durationType?: DurationType; // 기간 유형: N년/영구
    capacity?: '개인' | '부부' | '가족'; // 안치 인원
    paymentCycle?: 'MONTHLY' | 'YEARLY' | 'LUMP_SUM'; // 관리비 납부 주기
    taxIncluded?: boolean;      // 부가세 포함 여부

    // === 레거시 호환 ===
    grade?: string;             // 기존 등급/설명 (관내/관외/유공자 등)
    userFee?: number;           // 사용료 (분양가) - 레거시
    managementFee?: number;     // 관리비 - 레거시
    count?: number;
    size?: string;              // 규격 (면적, 평수 등) - 레거시
    description?: string;       // 상세 설명
    isRepresentative?: boolean; // 대표 가격 여부

    // === 추가 메타 ===
    groupType?: string;         // 기존 groupType 호환
    note?: string;              // 비고 (예: "석물+매장비=안장시")
}

// 서비스별 가격 그룹
export interface ServicePriceGroup {
    serviceType: ServiceType;   // 대분류: BONGSAN/NATURAL/BURIAL
    subType: string;            // 세부 타입: 봉안당, 수목형, 단장형 등
    unit: string;               // 가격 단위: '원'
    rows: PriceRow[];           // 가격 항목들
}

// ===== 가격 테이블 (레거시 호환) =====
export interface PriceTable {
    [key: string]: {
        unit: string;
        rows: PriceRow[];
        category?: string;      // Tab persistence key
        serviceType?: ServiceType; // v2: 대분류
        subType?: string;       // v2: 세부 타입
    };
}

export interface PriceInfo {
    priceTable: PriceTable;
    // v2: 표준화된 서비스별 가격 (신규)
    standardizedPrices?: ServicePriceGroup[];
    priceVerified?: boolean;    // 수동 검토 완료 여부
    lastVerifiedAt?: string;    // 마지막 검토 일시
    additionalCosts?: {
        managementFee?: number;
        usagePeriod?: string;
        renewable?: boolean;
    };
}

// 교통 정보
export interface PublicTransport {
    type: string;
    name: string;
    desc: string;
}

export interface TransportInfo {
    naverMapUrl?: string;
    publicTransport?: PublicTransport[];
    parking?: {
        available: boolean;
        desc?: string;
    };
    driveTime?: {
        fromSeoul?: number;
        fromGangnam?: number;
    };
}

// 핵심 지표
export interface Highlight {
    price?: string; // "가성비 높음"
    accessibility?: string; // "차량 강추"
    environment?: string; // "매우 좋음"
    management?: string; // "양호"
    availability?: string; // "여유 있음"
}

export interface RepresentativePricing {
    cremation?: {
        resident: number;
        nonResident: number;
    };
    enshrinement?: {
        min: number;
        max: number;
        label: string;
    };
    natural?: {
        joint?: number;
        individual?: number;
        couple?: number;
    };
    cemetery?: {
        minLandFee: number;
    };
}

// 메인 시설 타입
export interface Facility {
    id: string;
    name: string;
    category: FacilityCategory;             // 주 카테고리 (레거시 호환)
    categories?: FacilityCategory[];        // v2: 복수 카테고리 (봉안당+수목장 등)
    services?: ServiceType[];               // v2: 제공 서비스 대분류
    address: string;
    phone?: string;
    fax?: string; // 팩스번호
    isPublic: boolean;
    isActive?: boolean; // 마커 표시 여부 (false면 지도에서 숨김)
    operatorType?: string; // "FOUNDATION" | "CORPORATION" | "RELIGIOUS" | "ASSOCIATION" | "OTHER"
    originalName?: string; // Immutable original name matching archive folder
    lastUpdated?: string; // 업데이트 날짜

    // Representative Pricing (Aggregated from CSV analysis)
    representativePricing?: RepresentativePricing;

    // 가격 정보 (기본)
    priceRange?: {
        min: number;
        max: number;
    };
    pricing?: any; // JSONB flexible structure

    // 메타 데이터
    rating?: number;
    reviewCount?: number;
    updatedAt?: string;

    // 상세 가격 정보 (확장)
    priceInfo?: PriceInfo;

    // 규모 및 용량
    area?: number;
    capacity?: number;

    // 위치 정보
    coordinates?: {
        lat: number;
        lng: number;
    };

    description?: string;
    imageUrl?: string;
    images?: string | string[];
    imageGallery?: string[]; // 갤러리 이미지 배열
    websiteUrl?: string; // 홈페이지 URL 추가

    // 편의시설 정보 (기본)
    hasParking?: boolean;
    hasRestaurant?: boolean;
    hasStore?: boolean;
    hasAccessibility?: boolean;

    // 편의시설 정보 (확장)
    facilities?: {
        elevator?: boolean;
        indoor?: boolean;
        crematorium?: boolean;
        restArea?: boolean;
    };

    // 환경 정보
    environment?: {
        quiet?: boolean;
        nature?: string; // "우수", "양호", "보통"
        view?: string; // "좋음", "보통"
        congestion?: string; // "한산함", "보통", "혼잡"
    };

    // 교통 정보
    transportInfo?: TransportInfo;

    // 핵심 지표
    highlight?: Highlight;

    // 태그
    tags?: string[];

    // 상태
    status?: 'OPEN' | 'SELLING' | 'CLOSED';

    // 운영자 정보
    operator?: {
        name?: string;
        contact?: string;
        website?: string;
    };

    // 리뷰 (확장)
    reviews?: Review[];
}

export interface ReviewReply {
    id: string;
    author: string; // '관리자' or User Name
    content: string;
    date: string;
}

export interface Review {
    id: string;
    author: string;
    date: string;
    rating: number;
    content: string;
    likes: number;
    tags?: string[]; // "주차 편리", "경치 좋음" 등
    photos?: string[]; // Base64 encoding for prototype
    replies?: ReviewReply[];
}

// 필터링 상태 관리를 위한 인터페이스
export interface FilterState {
    categories: FacilityCategory[];
    isPublic?: boolean;
    priceRange: [number, number];
    kw?: string;
}


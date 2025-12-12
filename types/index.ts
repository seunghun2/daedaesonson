export type FacilityCategory = 'CHARNEL_HOUSE' | 'NATURAL_BURIAL' | 'FAMILY_GRAVE' | 'CREMATORIUM' | 'FUNERAL_HOME' | 'OTHER';

export const FACILITY_CATEGORY_LABELS: Record<FacilityCategory, string> = {
    CHARNEL_HOUSE: '봉안당',
    NATURAL_BURIAL: '수목장',
    FAMILY_GRAVE: '공원묘지',
    CREMATORIUM: '화장시설',
    FUNERAL_HOME: '장례식장',
    OTHER: '기타',
};

// 가격 정보 (상세)
export interface PriceRow {
    name: string;
    grade?: string; // 관내/관외/유공자 등
    userFee?: number; // 사용료 (분양가)
    managementFee?: number; // 관리비
    count?: number;
    price: number; // 합계
}

export interface PriceTable {
    [key: string]: {
        unit: string;
        rows: PriceRow[];
        category?: string; // Tab persistence key
    };
}

export interface PriceInfo {
    priceTable: PriceTable;
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
    category: FacilityCategory;
    address: string;
    phone?: string;
    fax?: string; // 팩스번호
    isPublic: boolean;
    operatorType?: string; // "FOUNDATION" | "CORPORATION" | "RELIGIOUS" | "ASSOCIATION" | "OTHER"
    originalName?: string; // Immutable original name matching archive folder
    lastUpdated?: string; // 업데이트 날짜

    // Representative Pricing (Aggregated from CSV analysis)
    representativePricing?: RepresentativePricing;

    // 가격 정보 (기본)
    priceRange: {
        min: number;
        max: number;
    };

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

    // 메타 데이터
    rating?: number;
    reviewCount?: number;
    updatedAt?: string;

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


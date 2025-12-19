export function formatKoreanCurrency(amount: number): string {
    if (amount === 0) return '0원';

    // 1억 이상인 경우
    if (amount >= 100000000) {
        const uk = Math.floor(amount / 100000000);
        const rest = amount % 100000000;

        // 나머지가 없으면 'X억원'
        if (rest === 0) return `${uk.toLocaleString()}억원`;

        // 나머지가 있으면 만원 단위로 변환
        const man = Math.round(rest / 10000);
        if (man === 0) return `${uk.toLocaleString()}억원`;

        return `${uk.toLocaleString()}억 ${man.toLocaleString()}만원`;
    }

    // 1만 이상 1억 미만인 경우
    if (amount >= 10000) {
        const man = Math.floor(amount / 10000);
        const rest = amount % 10000;

        // 나머지가 없거나 무시할 수준(원 단위 절삭)이면 'X만원'
        // 보통 장례 비용에서 만원 미만은 잘 안 나오지만, 나올 경우 'X만 X,XXX원' 표기도 가능.
        // 여기서는 'Option 1' 스타일(2,382만 3,000원)을 위해 천원 단위까지 살린다.

        if (rest === 0) return `${man.toLocaleString()}만원`;

        return `${man.toLocaleString()}만 ${rest.toLocaleString()}원`;
    }

    return `${amount.toLocaleString()}원`;
}

/**
 * 날짜를 상대 시간으로 변환 (예: "26개월전", "3일전")
 * 입력: "2022-01-16" 또는 "26개월전" 등
 */
export function formatRelativeTime(dateStr: string | undefined): string {
    if (!dateStr) return '정보 없음';

    // 이미 "N개월전", "N일전" 형식이면 그대로 반환
    if (dateStr.includes('개월전') || dateStr.includes('일전') || dateStr.includes('년전')) {
        return dateStr;
    }

    // YYYY-MM-DD 형식인지 확인
    const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) {
        return dateStr; // 알 수 없는 형식은 그대로 반환
    }

    const targetDate = new Date(dateStr);
    const now = new Date();

    // 유효한 날짜인지 확인
    if (isNaN(targetDate.getTime())) {
        return dateStr;
    }

    const diffMs = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '정보 없음';
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주전`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}개월전`;

    const diffYears = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;

    if (remainingMonths === 0) return `${diffYears}년전`;
    return `${diffYears}년 ${remainingMonths}개월전`;
}

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

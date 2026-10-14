'use client';

import React from 'react';

interface VerifiedBadgeProps {
    /** 'seal' = 아이콘 단독(시설명 옆), 'pill' = 캡슐형 배지(상세/카드 상단), 'partner' = 공식 파트너 골드/로얄블루 프리미엄 배지 */
    variant?: 'seal' | 'pill' | 'partner';
    label?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * 대대손손 공식 인증 · 데이터 검증 배지 (Verified Rosette Seal)
 */
export function VerifiedSealIcon({
    size = 16,
    color = '#191F28',
    checkColor = '#FFFFFF',
}: {
    size?: number;
    color?: string;
    checkColor?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
            aria-hidden="true"
        >
            <path
                d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
                fill={color}
            />
            <path
                d="M9 12.2L11.1 14.3L15.3 9.8"
                stroke={checkColor}
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function VerifiedBadge({
    variant = 'pill',
    label,
    size = 'md',
}: VerifiedBadgeProps) {
    if (variant === 'seal') {
        const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
        return (
            <span
                title={label || '대대손손 공식 데이터 검증 시설'}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <VerifiedSealIcon size={iconSize} color="#191F28" />
            </span>
        );
    }

    if (variant === 'partner') {
        const isLg = size === 'lg';
        return (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: isLg ? 6 : 4,
                    height: isLg ? 28 : 22,
                    padding: isLg ? '0 11px 0 8px' : '0 8px 0 6px',
                    borderRadius: 999,
                    backgroundColor: '#191F28',
                    color: '#FFFFFF',
                    fontSize: isLg ? 12.5 : 11,
                    fontWeight: 700,
                    letterSpacing: '-0.2px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}
            >
                <VerifiedSealIcon size={isLg ? 15 : 13} color="#FFFFFF" checkColor="#191F28" />
                <span>{label || '공식 인증 파트너'}</span>
            </span>
        );
    }

    // default: 'pill'
    const isSm = size === 'sm';
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: isSm ? 3.5 : 4.5,
                height: isSm ? 20 : 24,
                padding: isSm ? '0 6.5px 0 5px' : '0 8.5px 0 6.5px',
                borderRadius: 999,
                backgroundColor: '#F2F4F6',
                border: '1px solid #E5E8EB',
                color: '#333D4B',
                fontSize: isSm ? 10.5 : 11.5,
                fontWeight: 700,
                letterSpacing: '-0.2px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
            }}
        >
            <VerifiedSealIcon size={isSm ? 12 : 14} color="#191F28" />
            <span>{label || '공식검증'}</span>
        </span>
    );
}

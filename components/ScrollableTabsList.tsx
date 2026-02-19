'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Tabs } from '@mantine/core';
import { ChevronRight } from 'lucide-react';

interface ScrollableTabsListProps {
    children: React.ReactNode;
    grow?: boolean;
    mb?: string;
    style?: React.CSSProperties;
    [key: string]: any;
}

/**
 * Tabs.List 래퍼: 1줄 가로 스크롤 + PC 드래그 + 탭 클릭 중앙 정렬 + > 화살표
 */
export default function ScrollableTabsList({ children, style, mb, ...props }: ScrollableTabsListProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const [showArrow, setShowArrow] = useState(false);

    // > 화살표 클릭 시 오른쪽으로 스크롤
    const scrollRight = useCallback(() => {
        const el = listRef.current;
        if (!el) return;
        el.scrollBy({ left: 120, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;
        let hasDragged = false;

        const checkScroll = () => {
            const canScroll = el.scrollWidth > el.clientWidth + 2;
            const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
            setShowArrow(canScroll && !atEnd);
            if (!isDown) {
                el.style.cursor = canScroll ? 'grab' : '';
            }
        };

        // 클릭된 탭을 중앙으로 스크롤
        const centerTab = (tab: Element) => {
            const tabRect = tab.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const tabCenter = tabRect.left + tabRect.width / 2 - elRect.left + el.scrollLeft;
            const target = tabCenter - el.clientWidth / 2;
            el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
        };

        // PC 드래그 스크롤
        const onMouseDown = (e: MouseEvent) => {
            if (el.scrollWidth <= el.clientWidth) return;
            isDown = true;
            hasDragged = false;
            startX = e.pageX;
            scrollLeft = el.scrollLeft;
            el.style.cursor = 'grabbing';
            el.style.userSelect = 'none';
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            const dx = e.pageX - startX;
            if (Math.abs(dx) > 4) hasDragged = true;
            el.scrollLeft = scrollLeft - dx;
        };

        const onMouseUp = () => {
            if (!isDown) return;
            isDown = false;
            el.style.userSelect = '';
            checkScroll();
        };

        // 클릭 핸들러 (capture phase): 드래그 방지 + 탭 중앙 정렬
        const onClick = (e: MouseEvent) => {
            if (hasDragged) {
                e.preventDefault();
                e.stopPropagation();
                hasDragged = false;
                return;
            }
            const tab = (e.target as HTMLElement).closest('[role="tab"]');
            if (tab && el.scrollWidth > el.clientWidth) {
                setTimeout(() => centerTab(tab), 100);
            }
        };

        el.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        el.addEventListener('click', onClick, true);
        el.addEventListener('scroll', checkScroll, { passive: true });

        checkScroll();
        const observer = new ResizeObserver(checkScroll);
        observer.observe(el);

        return () => {
            el.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            el.removeEventListener('click', onClick, true);
            el.removeEventListener('scroll', checkScroll);
            observer.disconnect();
        };
    }, []);

    // mb를 CSS 변수로 변환
    const mbValue = mb ? `var(--mantine-spacing-${mb})` : undefined;

    return (
        <div style={{
            position: 'relative',
            marginBottom: mbValue,
            borderBottom: 'calc(0.125rem * var(--mantine-scale, 1)) solid var(--mantine-color-default-border, #dee2e6)',
        }}>
            <Tabs.List
                ref={listRef}
                {...props}
                style={{
                    ...style,
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                    borderBottom: 'none',
                    marginBottom: 'calc(-0.125rem * var(--mantine-scale, 1))',
                    paddingRight: showArrow ? 28 : undefined,
                }}
            >
                {children}
            </Tabs.List>
            {showArrow && (
                <div
                    onClick={scrollRight}
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        background: 'linear-gradient(to left, var(--mantine-color-body, #fff) 60%, transparent)',
                        paddingLeft: 16,
                        paddingRight: 2,
                        cursor: 'pointer',
                        zIndex: 1,
                    }}
                >
                    <ChevronRight size={16} color="#999" />
                </div>
            )}
        </div>
    );
}

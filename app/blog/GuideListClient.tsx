'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Text, Loader, Center, Group, Badge, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ChevronLeft, Eye, Search, X, ArrowUpRight, MapPin, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/common/BottomNav';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    thumbnail_url: string;
    author: string;
    tags: string[];
    view_count: number;
    created_at: string;
}

interface GuideListClientProps {
    initialPosts: BlogPost[];
    initialTotalPages: number;
}

const CATEGORIES = ['전체', '봉안당 가이드', '수목장 가이드', '비용 안내', '장례 절차', '장례 상식', '시설 리뷰', '가이드'];

const BRAND_COLOR = '#2563EB';
const BRAND_COLOR_LIGHT = '#EFF6FF';

const SEO_REGIONAL_LINKS = [
    { label: '경기도 봉안당 가격 비교', href: '/지역/경기-봉안당' },
    { label: '경기도 수목장 비용 비교', href: '/지역/경기-수목장' },
    { label: '경기도 공원묘지 안내', href: '/지역/경기-공원묘지' },
    { label: '서울 봉안당·추모시설', href: '/지역/서울-봉안당' },
    { label: '인천 봉안당·수목장', href: '/지역/인천-봉안당' },
    { label: '부산·경남 봉안당 비교', href: '/지역/부산-봉안당' },
    { label: '장례·장묘 용어 사전', href: '/glossary' },
    { label: '자주 묻는 질문 (FAQ)', href: '/faq' },
];

export default function GuideListClient({ initialPosts, initialTotalPages }: GuideListClientProps) {
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('전체');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            fetchPosts(true);
            return;
        }
        fetchPosts(false);
    }, [activeCategory, activeTag, page]);

    const fetchPosts = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (activeCategory !== '전체') {
                params.set('category', activeCategory);
            }
            if (activeTag) {
                params.set('tag', activeTag);
            }
            const res = await fetch(`/api/blog?${params}`);
            const data = await res.json();
            if (data.posts) {
                setPosts(data.posts);
                setTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error('Failed to fetch blog posts:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const filteredPosts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return posts;
        return posts.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
        );
    }, [posts, searchQuery]);

    // 태그 모음 (사이드바용)
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        posts.forEach(p => p.tags?.forEach(t => tagSet.add(t)));
        return Array.from(tagSet);
    }, [posts]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
    };

    return (
        <Box
            style={{
                minHeight: '100dvh',
                backgroundColor: '#F8FAFC',
                paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : 40,
            }}
        >
            {/* 헤더 */}
            <Box
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: '#FFFFFF',
                    borderBottom: '1px solid #E2E8F0',
                }}
            >
                <Box
                    style={{
                        maxWidth: 1200,
                        margin: '0 auto',
                        padding: isMobile ? '12px 16px' : '16px 40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                    }}
                >
                    <Group gap={10} align="center" wrap="nowrap">
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size={36}
                            radius="md"
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.history.length <= 1) {
                                    router.push('/menu');
                                } else {
                                    router.back();
                                }
                            }}
                            aria-label="뒤로가기"
                        >
                            <ChevronLeft size={22} color="#191F28" />
                        </ActionIcon>
                        <Link href="/blog" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text fw={800} size={isMobile ? 'lg' : 'xl'} c="#191F28" style={{ letterSpacing: '-0.4px' }}>
                                대대손손
                            </Text>
                            <Badge
                                size="sm"
                                radius="sm"
                                style={{
                                    backgroundColor: BRAND_COLOR_LIGHT,
                                    color: BRAND_COLOR,
                                    border: '1px solid #BFDBFE',
                                    fontWeight: 800,
                                }}
                            >
                                장지 가이드
                            </Badge>
                        </Link>
                    </Group>

                    <Group gap={14} wrap="nowrap">
                        {!isMobile && (
                            <>
                                <Link href="/glossary" style={{ textDecoration: 'none', color: '#475569', fontSize: 13.5, fontWeight: 600 }}>
                                    용어사전
                                </Link>
                                <Link href="/list" style={{ textDecoration: 'none', color: '#475569', fontSize: 13.5, fontWeight: 600 }}>
                                    전국 시설 목록
                                </Link>
                            </>
                        )}
                        <Link
                            href="/"
                            style={{
                                textDecoration: 'none',
                                backgroundColor: BRAND_COLOR,
                                color: '#FFFFFF',
                                fontSize: 12.5,
                                fontWeight: 700,
                                padding: '8px 14px',
                                borderRadius: 10,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            지도에서 가격 비교
                        </Link>
                    </Group>
                </Box>

                {/* 카테고리 탭 */}
                <Box style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px' : '0 40px' }}>
                    <div
                        className="no-scrollbar"
                        style={{
                            display: 'flex',
                            gap: isMobile ? 16 : 24,
                            overflowX: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none',
                        }}
                    >
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => { setActiveCategory(cat); setPage(1); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeCategory === cat ? `2.5px solid ${BRAND_COLOR}` : '2.5px solid transparent',
                                    padding: '11px 2px',
                                    fontSize: isMobile ? 13.5 : 14.5,
                                    fontWeight: activeCategory === cat ? 800 : 600,
                                    color: activeCategory === cat ? BRAND_COLOR : '#64748B',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </Box>
            </Box>

            {/* 콘텐츠 영역 */}
            <Box style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '18px 16px' : '32px 40px' }}>
                {/* 상단 안내 & 검색바 */}
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        padding: isMobile ? '16px' : '20px 24px',
                        marginBottom: isMobile ? 16 : 24,
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'stretch' : 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                    }}
                >
                    <div>
                        <h1 style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 800, color: '#191F28', letterSpacing: '-0.4px' }}>
                            장지 선택 전 꼭 읽어야 할 실전 가이드
                        </h1>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                            전국 1,495곳 실제 데이터로 분석한 봉안당·수목장 비용, 묘지 이장 절차, 현장 답사 체크리스트
                        </p>
                    </div>

                    <div
                        style={{
                            position: 'relative',
                            width: isMobile ? '100%' : 320,
                            flexShrink: 0,
                        }}
                    >
                        <Search
                            size={16}
                            color="#64748B"
                            style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="궁금한 키워드 검색 (예: 이장, 공설, 수목장)"
                            style={{
                                width: '100%',
                                height: 42,
                                padding: '0 36px 0 38px',
                                borderRadius: 12,
                                border: '1.5px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: '#191F28',
                                outline: 'none',
                            }}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                aria-label="검색어 지우기"
                                style={{
                                    position: 'absolute',
                                    right: 10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    padding: 4,
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <X size={15} color="#94A3B8" />
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
                    {/* 왼쪽: 글 목록 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {loading ? (
                            <Center h={300}>
                                <Loader size="lg" color={BRAND_COLOR} />
                            </Center>
                        ) : filteredPosts.length === 0 ? (
                            <Center h={260} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
                                <div style={{ textAlign: 'center', padding: 24 }}>
                                    <Text size="md" fw={700} c="#191F28" mb={6}>검색 조건에 맞는 가이드 글이 없습니다</Text>
                                    <Text size="xs" c="#64748B" mb={14}>다른 키워드를 입력하거나 전체 카테고리를 선택해 보세요.</Text>
                                    <button
                                        type="button"
                                        onClick={() => { setActiveCategory('전체'); setActiveTag(null); setSearchQuery(''); }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: 10,
                                            border: '1px solid #CBD5E1',
                                            backgroundColor: '#FFFFFF',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#191F28',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        전체 글 보기
                                    </button>
                                </div>
                            </Center>
                        ) : (
                            <div
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 16,
                                    border: '1px solid #E2E8F0',
                                    padding: isMobile ? '4px 16px' : '8px 28px',
                                }}
                            >
                                {filteredPosts.map((post, idx) => (
                                    <Link
                                        key={post.id}
                                        href={`/blog/${post.slug}`}
                                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                    >
                                        <article
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: isMobile ? 14 : 24,
                                                padding: isMobile ? '18px 0' : '24px 0',
                                                borderBottom: idx === filteredPosts.length - 1 ? 'none' : '1px solid #F1F5F9',
                                                cursor: 'pointer',
                                                transition: 'opacity 0.15s',
                                            }}
                                        >
                                            {/* 텍스트 영역 */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '3px 9px',
                                                            borderRadius: 6,
                                                            backgroundColor: BRAND_COLOR_LIGHT,
                                                            color: BRAND_COLOR,
                                                            fontSize: 11.5,
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {post.category}
                                                    </span>
                                                    {post.tags && post.tags.slice(0, 3).map(tag => (
                                                        <span
                                                            key={tag}
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#64748B',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* 제목 */}
                                                <h2
                                                    style={{
                                                        margin: '0 0 6px 0',
                                                        fontSize: isMobile ? 16 : 19,
                                                        fontWeight: 800,
                                                        lineHeight: 1.4,
                                                        color: '#191F28',
                                                        letterSpacing: '-0.3px',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        wordBreak: 'keep-all',
                                                    }}
                                                >
                                                    {post.title}
                                                </h2>

                                                {/* 발췌문 (PC 및 모바일 모두 표시하여 SEO 스니펫 및 가독성 강화) */}
                                                {post.excerpt && (
                                                    <p
                                                        style={{
                                                            margin: '0 0 10px 0',
                                                            fontSize: isMobile ? 13 : 14,
                                                            color: '#475569',
                                                            lineHeight: 1.55,
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {post.excerpt}
                                                    </p>
                                                )}

                                                {/* 작성자 & 날짜 */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                                                    <span style={{ color: '#64748B' }}>{post.author || '대대손손'}</span>
                                                    <span>·</span>
                                                    <span>{formatDate(post.created_at)}</span>
                                                    {post.view_count > 0 && (
                                                        <>
                                                            <span>·</span>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                                <Eye size={12} />
                                                                {post.view_count.toLocaleString()}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 썸네일 */}
                                            {post.thumbnail_url && (
                                                <div
                                                    style={{
                                                        width: isMobile ? 88 : 156,
                                                        height: isMobile ? 88 : 112,
                                                        borderRadius: 12,
                                                        overflow: 'hidden',
                                                        flexShrink: 0,
                                                        backgroundColor: '#F1F5F9',
                                                        border: '1px solid #E2E8F0',
                                                    }}
                                                >
                                                    <img
                                                        src={post.thumbnail_url}
                                                        alt={post.title}
                                                        loading={idx < 4 ? 'eager' : 'lazy'}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </article>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* 페이지네이션 */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '28px 0 8px' }}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPage(p)}
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            border: p === page ? 'none' : '1px solid #E2E8F0',
                                            backgroundColor: p === page ? BRAND_COLOR : '#FFFFFF',
                                            color: p === page ? '#FFFFFF' : '#475569',
                                            fontSize: 14,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 하단 지역별 장지 가격 · 용어사전 내부 링크 허브 (Google 크롤링 & 내부 링크 강화) */}
                        <div
                            style={{
                                marginTop: 24,
                                backgroundColor: '#FFFFFF',
                                borderRadius: 16,
                                border: '1px solid #E2E8F0',
                                padding: isMobile ? '18px 16px' : '22px 24px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                <MapPin size={16} color={BRAND_COLOR} />
                                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#191F28', letterSpacing: '-0.3px' }}>
                                    지역별 장지 가격표 & 장례 백과사전 바로가기
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {SEO_REGIONAL_LINKS.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '7px 12px',
                                            borderRadius: 10,
                                            backgroundColor: '#F8FAFC',
                                            border: '1px solid #E2E8F0',
                                            color: '#334155',
                                            fontSize: 12.5,
                                            fontWeight: 700,
                                            textDecoration: 'none',
                                        }}
                                    >
                                        <span>{item.label}</span>
                                        <ArrowUpRight size={13} color="#64748B" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 태그 및 비교 사이드바 (PC only) */}
                    {!isMobile && (
                        <div style={{ width: 260, flexShrink: 0 }}>
                            <div style={{ position: 'sticky', top: 124 }}>
                                <div
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: 16,
                                        border: '1px solid #E2E8F0',
                                        padding: 20,
                                        marginBottom: 16,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <Text fw={800} size="sm" c="#191F28">인기 키워드 태그</Text>
                                        {activeTag && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveTag(null)}
                                                style={{
                                                    border: 'none',
                                                    background: 'none',
                                                    fontSize: 11.5,
                                                    fontWeight: 700,
                                                    color: BRAND_COLOR,
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                }}
                                            >
                                                초기화
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {allTags.length > 0 ? (
                                            allTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveTag(activeTag === tag ? null : tag);
                                                        setPage(1);
                                                    }}
                                                    style={{
                                                        padding: '5px 11px',
                                                        borderRadius: 999,
                                                        border: activeTag === tag ? `1.5px solid ${BRAND_COLOR}` : '1px solid #E2E8F0',
                                                        backgroundColor: activeTag === tag ? BRAND_COLOR_LIGHT : '#F8FAFC',
                                                        fontSize: 12,
                                                        fontWeight: activeTag === tag ? 800 : 600,
                                                        color: activeTag === tag ? BRAND_COLOR : '#475569',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    #{tag}
                                                </button>
                                            ))
                                        ) : (
                                            <Text size="xs" c="dimmed">태그를 불러오는 중입니다</Text>
                                        )}
                                    </div>
                                </div>

                                {/* 전국 장지 지도 비교 CTA */}
                                <div
                                    style={{
                                        padding: 22,
                                        backgroundColor: '#FFFFFF',
                                        borderRadius: 16,
                                        border: '1px solid #BFDBFE',
                                        background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)',
                                    }}
                                >
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                                        <BookOpen size={14} color={BRAND_COLOR} />
                                        <span style={{ fontSize: 11.5, fontWeight: 800, color: BRAND_COLOR }}>전국 1,495곳 실거래·분양가 DB</span>
                                    </div>
                                    <Text fw={800} size="md" c="#191F28" mb={6} style={{ letterSpacing: '-0.3px', lineHeight: 1.35 }}>
                                        전화 안 돌리고<br />장지 가격표 바로 보기
                                    </Text>
                                    <Text size="xs" c="#475569" mb={14} style={{ lineHeight: 1.5 }}>
                                        공설·사설 봉안당과 수목장의 단별 가격과 관리비를 지도에서 즉시 비교하세요.
                                    </Text>
                                    <Link
                                        href="/"
                                        style={{
                                            display: 'block',
                                            padding: '11px 16px',
                                            backgroundColor: BRAND_COLOR,
                                            color: '#FFFFFF',
                                            borderRadius: 10,
                                            textAlign: 'center',
                                            textDecoration: 'none',
                                            fontSize: 13,
                                            fontWeight: 800,
                                        }}
                                    >
                                        지도에서 시설 비교하기
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Box>

            {isMobile && <BottomNav />}
        </Box>
    );
}

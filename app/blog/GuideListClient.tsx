'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Text, Loader, Center, Group, Badge, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ChevronLeft, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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

const CATEGORIES = ['전체', '봉안당 가이드', '수목장 가이드', '비용 안내', '장례 절차', '시설 리뷰'];

// 강남언니 스타일 컬러
const BRAND_COLOR = '#1D0098';
const BRAND_COLOR_LIGHT = '#EDE9FF';

export default function GuideListClient({ initialPosts, initialTotalPages }: GuideListClientProps) {
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('전체');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(initialTotalPages);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // 첫 렌더는 서버 데이터 사용 (fetch 안 함)
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        fetchPosts();
    }, [activeCategory, activeTag, page]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '10' });
            if (activeCategory !== '전체') {
                params.set('category', activeCategory);
            }
            if (activeTag) {
                params.set('tag', activeTag);
            }
            const res = await fetch(`/api/blog?${params}`);
            const data = await res.json();
            setPosts(data.posts || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch blog posts:', error);
        } finally {
            setLoading(false);
        }
    };

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
        <Box style={{ minHeight: '100dvh', backgroundColor: '#fafafa' }}>
            {/* 헤더 - 강남언니 스타일 */}
            <Box
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'white',
                    borderBottom: '1px solid #f0f0f0',
                }}
            >
                <Box
                    style={{
                        maxWidth: 1200,
                        margin: '0 auto',
                        padding: isMobile ? '14px 16px' : '16px 40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Group gap={12} align="center">
                        {isMobile && (
                            <ActionIcon variant="transparent" onClick={() => router.push('/')} style={{ color: '#333' }}>
                                <ChevronLeft size={24} />
                            </ActionIcon>
                        )}
                        <Link href="/blog" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text fw={800} size={isMobile ? 'lg' : 'xl'} c="dark.9">
                                대대손손
                            </Text>
                            <Text fw={400} size={isMobile ? 'md' : 'lg'} c="dimmed">
                                블로그
                            </Text>
                        </Link>
                    </Group>
                    {!isMobile && (
                        <Group gap={16}>
                            <Link href="/" style={{ textDecoration: 'none', color: '#666', fontSize: 14 }}>
                                시설 비교
                            </Link>
                            <Link href="/list" style={{ textDecoration: 'none', color: '#666', fontSize: 14 }}>
                                시설 목록
                            </Link>
                        </Group>
                    )}
                </Box>

                {/* 카테고리 탭 - 강남언니 스타일 */}
                <Box style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px' : '0 40px' }}>
                    <div
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
                                onClick={() => { setActiveCategory(cat); setPage(1); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: activeCategory === cat ? `2px solid ${BRAND_COLOR}` : '2px solid transparent',
                                    padding: '12px 0',
                                    fontSize: isMobile ? 14 : 15,
                                    fontWeight: activeCategory === cat ? 700 : 400,
                                    color: activeCategory === cat ? '#111' : '#888',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </Box>
            </Box>

            {/* 콘텐츠 영역 */}
            <Box style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 40px' }}>
                <div style={{ display: 'flex', gap: 48 }}>
                    {/* 왼쪽: 글 목록 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {loading ? (
                            <Center h={300}>
                                <Loader size="lg" color={BRAND_COLOR} />
                            </Center>
                        ) : posts.length === 0 ? (
                            <Center h={300}>
                                <div style={{ textAlign: 'center' }}>
                                    <Text size="xl" fw={600} c="dimmed" mb={8}>아직 작성된 글이 없습니다</Text>
                                    <Text size="sm" c="dimmed">곧 유용한 가이드를 준비하겠습니다!</Text>
                                </div>
                            </Center>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {posts.map((post, idx) => (
                                    <Link
                                        key={post.id}
                                        href={`/blog/${post.slug}`}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: isMobile ? 16 : 24,
                                                padding: isMobile ? '20px 0' : '28px 0',
                                                borderBottom: '1px solid #f0f0f0',
                                                cursor: 'pointer',
                                                transition: 'opacity 0.2s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                        >
                                            {/* 텍스트 영역 */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* 태그들 */}
                                                {post.tags && post.tags.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                                        {post.tags.slice(0, 3).map(tag => (
                                                            <span
                                                                key={tag}
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: '#888',
                                                                    fontWeight: 400,
                                                                }}
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 제목 */}
                                                <h3
                                                    style={{
                                                        margin: 0,
                                                        fontSize: isMobile ? 16 : 20,
                                                        fontWeight: 700,
                                                        lineHeight: 1.4,
                                                        color: '#111',
                                                        marginBottom: 8,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {post.title}
                                                </h3>

                                                {/* 발췌문 (PC만) */}
                                                {!isMobile && post.excerpt && (
                                                    <p
                                                        style={{
                                                            margin: '0 0 12px 0',
                                                            fontSize: 14,
                                                            color: '#666',
                                                            lineHeight: 1.6,
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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#aaa' }}>
                                                    <span>{post.author}</span>
                                                    <span>|</span>
                                                    <span>{formatDate(post.created_at)}</span>
                                                    {post.view_count > 0 && (
                                                        <>
                                                            <span>|</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                                <Eye size={12} />
                                                                {post.view_count.toLocaleString()}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* 카테고리 배지 */}
                                                <Badge
                                                    variant="light"
                                                    size="xs"
                                                    mt={8}
                                                    style={{
                                                        backgroundColor: BRAND_COLOR_LIGHT,
                                                        color: BRAND_COLOR,
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {post.category}
                                                </Badge>
                                            </div>

                                            {/* 썸네일 */}
                                            {post.thumbnail_url && (
                                                <div
                                                    style={{
                                                        width: isMobile ? 80 : 160,
                                                        height: isMobile ? 80 : 120,
                                                        borderRadius: 12,
                                                        overflow: 'hidden',
                                                        flexShrink: 0,
                                                        backgroundColor: '#f5f5f5',
                                                    }}
                                                >
                                                    <img
                                                        src={post.thumbnail_url}
                                                        alt={post.title}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}

                                {/* 페이지네이션 */}
                                {totalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '32px 0' }}>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '50%',
                                                    border: 'none',
                                                    backgroundColor: p === page ? BRAND_COLOR : 'transparent',
                                                    color: p === page ? 'white' : '#666',
                                                    fontSize: 14,
                                                    fontWeight: p === page ? 700 : 400,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 오른쪽: 태그 사이드바 (PC only) */}
                    {!isMobile && (
                        <div style={{ width: 240, flexShrink: 0 }}>
                            <div style={{ position: 'sticky', top: 120 }}>
                                <Text fw={700} size="md" mb={16} c="dark.8">태그</Text>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {allTags.length > 0 ? (
                                        allTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => {
                                                    setActiveTag(activeTag === tag ? null : tag);
                                                    setPage(1);
                                                }}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: 20,
                                                    border: activeTag === tag ? `1px solid ${BRAND_COLOR}` : '1px solid #e0e0e0',
                                                    backgroundColor: activeTag === tag ? BRAND_COLOR_LIGHT : 'white',
                                                    fontSize: 13,
                                                    color: activeTag === tag ? BRAND_COLOR : '#555',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.backgroundColor = BRAND_COLOR_LIGHT;
                                                    e.currentTarget.style.borderColor = BRAND_COLOR;
                                                    e.currentTarget.style.color = BRAND_COLOR;
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.backgroundColor = 'white';
                                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                                    e.currentTarget.style.color = '#555';
                                                }}
                                            >
                                                {tag}
                                            </button>
                                        ))
                                    ) : (
                                        <Text size="sm" c="dimmed">아직 태그가 없습니다</Text>
                                    )}
                                </div>

                                {/* 인기 시설 */}
                                <div style={{ marginTop: 40, padding: '20px', backgroundColor: 'white', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                                    <Text fw={700} size="sm" mb={12}>인기 시설</Text>
                                    <Text size="xs" c="dimmed">지도에서 확인하세요</Text>
                                    <Link
                                        href="/"
                                        style={{
                                            display: 'block',
                                            marginTop: 12,
                                            padding: '10px 16px',
                                            backgroundColor: BRAND_COLOR,
                                            color: 'white',
                                            borderRadius: 8,
                                            textAlign: 'center',
                                            textDecoration: 'none',
                                            fontSize: 13,
                                            fontWeight: 600,
                                        }}
                                    >
                                        시설 비교하기 →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Box>
        </Box>
    );
}

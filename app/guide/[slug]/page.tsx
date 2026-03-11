'use client';

import { useState, useEffect } from 'react';
import { Box, Text, Loader, Center, Badge, Group, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ChevronLeft, Share2, Eye } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    content: string;
    thumbnail_url: string;
    author: string;
    tags: string[];
    view_count: number;
    created_at: string;
    updated_at: string;
}

const BRAND_COLOR = '#1D0098';
const BRAND_COLOR_LIGHT = '#EDE9FF';

export default function GuideDetailPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;
    const isMobile = useMediaQuery('(max-width: 768px)');

    const [post, setPost] = useState<BlogPost | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) fetchPost();
    }, [slug]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/blog/${slug}`);
            if (!res.ok) {
                router.push('/guide');
                return;
            }
            const data = await res.json();
            setPost(data);

            // 관련 글 가져오기
            const relRes = await fetch(`/api/blog?category=${encodeURIComponent(data.category)}&limit=4`);
            const relData = await relRes.json();
            setRelatedPosts((relData.posts || []).filter((p: BlogPost) => p.slug !== slug).slice(0, 3));
        } catch (error) {
            console.error('Failed to fetch post:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: post?.title, url });
            } catch { }
        } else {
            await navigator.clipboard.writeText(url);
            alert('링크가 복사되었습니다!');
        }
    };

    if (loading) {
        return (
            <Center h="100dvh">
                <Loader size="lg" color={BRAND_COLOR} />
            </Center>
        );
    }

    if (!post) {
        return (
            <Center h="100dvh">
                <Text c="dimmed">글을 찾을 수 없습니다.</Text>
            </Center>
        );
    }

    return (
        <Box style={{ minHeight: '100dvh', backgroundColor: 'white' }}>
            {/* 헤더 */}
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
                        <ActionIcon variant="transparent" onClick={() => router.back()} style={{ color: '#333' }}>
                            <ChevronLeft size={24} />
                        </ActionIcon>
                        <Link href="/guide" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text fw={800} size={isMobile ? 'lg' : 'xl'} c="dark.9">
                                대대손손
                            </Text>
                            <Text fw={400} size={isMobile ? 'md' : 'lg'} c="dimmed">
                                Guide
                            </Text>
                        </Link>
                    </Group>
                </Box>
            </Box>

            {/* 본문 영역 */}
            <Box style={{ position: 'relative' }}>
                {/* 아티클 헤더 - 강남언니 스타일 중앙 정렬 */}
                <Box
                    style={{
                        maxWidth: 720,
                        margin: '0 auto',
                        padding: isMobile ? '32px 20px 24px' : '48px 20px 32px',
                        textAlign: 'center',
                    }}
                >
                    {/* 카테고리 */}
                    <Text
                        fw={700}
                        size="sm"
                        style={{ color: BRAND_COLOR, letterSpacing: '0.5px' }}
                        mb={12}
                    >
                        {post.category}
                    </Text>

                    {/* 제목 */}
                    <h1
                        style={{
                            margin: '0 0 12px 0',
                            fontSize: isMobile ? 24 : 32,
                            fontWeight: 800,
                            lineHeight: 1.3,
                            color: '#111',
                            wordBreak: 'keep-all',
                        }}
                    >
                        {post.title}
                    </h1>

                    {/* 부제 */}
                    {post.excerpt && (
                        <p
                            style={{
                                margin: '0 0 20px 0',
                                fontSize: isMobile ? 14 : 16,
                                color: '#888',
                                lineHeight: 1.6,
                            }}
                        >
                            {post.excerpt}
                        </p>
                    )}

                    {/* 작성자 정보 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 14, color: '#999' }}>
                        <span style={{ fontWeight: 500, color: '#555' }}>{post.author}</span>
                        <span>|</span>
                        <span>{formatDate(post.created_at)}</span>
                        <span>|</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={14} />
                            {(post.view_count || 0).toLocaleString()}
                        </span>
                    </div>
                </Box>

                {/* 히어로 이미지 */}
                {post.thumbnail_url && (
                    <Box
                        style={{
                            maxWidth: 720,
                            margin: '0 auto',
                            padding: '0 20px',
                            marginBottom: 40,
                        }}
                    >
                        <div
                            style={{
                                borderRadius: 16,
                                overflow: 'hidden',
                                aspectRatio: '16/9',
                                backgroundColor: '#f5f5f5',
                            }}
                        >
                            <img
                                src={post.thumbnail_url}
                                alt={post.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    </Box>
                )}

                {/* 플로팅 공유 버튼 (PC only) */}
                {!isMobile && (
                    <div
                        style={{
                            position: 'fixed',
                            right: 'calc(50% - 420px)',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            zIndex: 50,
                        }}
                    >
                        <button
                            onClick={handleShare}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                border: '1px solid #e0e0e0',
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = BRAND_COLOR_LIGHT;
                                e.currentTarget.style.borderColor = BRAND_COLOR;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.borderColor = '#e0e0e0';
                            }}
                        >
                            <Share2 size={18} color="#555" />
                        </button>
                    </div>
                )}

                {/* 본문 콘텐츠 */}
                <Box
                    style={{
                        maxWidth: 720,
                        margin: '0 auto',
                        padding: isMobile ? '0 20px 40px' : '0 20px 60px',
                    }}
                >
                    <div
                        className="blog-content"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                        style={{
                            fontSize: isMobile ? 16 : 17,
                            lineHeight: 1.8,
                            color: '#333',
                            wordBreak: 'keep-all',
                        }}
                    />

                    {/* 태그 */}
                    {post.tags && post.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 40, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
                            {post.tags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    size="md"
                                    radius="xl"
                                    style={{
                                        borderColor: '#e0e0e0',
                                        color: '#666',
                                        fontWeight: 400,
                                    }}
                                >
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* 모바일 공유 버튼 */}
                    {isMobile && (
                        <div style={{ marginTop: 24 }}>
                            <button
                                onClick={handleShare}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: 8,
                                    border: '1px solid #e0e0e0',
                                    backgroundColor: 'white',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: '#555',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                            >
                                <Share2 size={16} />
                                공유하기
                            </button>
                        </div>
                    )}
                </Box>

                {/* 관련 글 섹션 */}
                {relatedPosts.length > 0 && (
                    <Box
                        style={{
                            backgroundColor: '#fafafa',
                            padding: isMobile ? '32px 20px 48px' : '48px 20px 64px',
                        }}
                    >
                        <Box style={{ maxWidth: 720, margin: '0 auto' }}>
                            <Text fw={700} size={isMobile ? 'lg' : 'xl'} mb={24} c="dark.9">
                                다른 글 더 보기
                            </Text>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                                    gap: isMobile ? 16 : 20,
                                }}
                            >
                                {relatedPosts.map(rp => (
                                    <Link
                                        key={rp.id}
                                        href={`/guide/${rp.slug}`}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <div
                                            style={{
                                                backgroundColor: 'white',
                                                borderRadius: 12,
                                                overflow: 'hidden',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                cursor: 'pointer',
                                                border: '1px solid #f0f0f0',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {rp.thumbnail_url && (
                                                <div style={{ aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                                                    <img
                                                        src={rp.thumbnail_url}
                                                        alt={rp.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ padding: 16 }}>
                                                <Badge
                                                    variant="light"
                                                    size="xs"
                                                    mb={8}
                                                    style={{
                                                        backgroundColor: BRAND_COLOR_LIGHT,
                                                        color: BRAND_COLOR,
                                                    }}
                                                >
                                                    {rp.category}
                                                </Badge>
                                                <h4
                                                    style={{
                                                        margin: 0,
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        lineHeight: 1.4,
                                                        color: '#333',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {rp.title}
                                                </h4>
                                                <Text size="xs" c="dimmed" mt={8}>
                                                    {formatDate(rp.created_at)}
                                                </Text>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </Box>
                    </Box>
                )}

                {/* CTA - 시설 비교 유도 */}
                <Box
                    style={{
                        padding: isMobile ? '32px 20px 48px' : '48px 20px 64px',
                        textAlign: 'center',
                    }}
                >
                    <Text fw={700} size="lg" mb={8} c="dark.9">
                        장지 가격이 궁금하신가요?
                    </Text>
                    <Text size="sm" c="dimmed" mb={20}>
                        전국 1,495곳의 장지 가격을 한눈에 비교해보세요.
                    </Text>
                    <Link
                        href="/"
                        style={{
                            display: 'inline-block',
                            padding: '14px 32px',
                            backgroundColor: BRAND_COLOR,
                            color: 'white',
                            borderRadius: 12,
                            textDecoration: 'none',
                            fontSize: 15,
                            fontWeight: 700,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        지도에서 비교하기 →
                    </Link>
                </Box>
            </Box>

            {/* CSS for blog content */}
            <style jsx global>{`
                .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 {
                    margin: 2em 0 0.8em;
                    font-weight: 700;
                    color: #111;
                    line-height: 1.3;
                }
                .blog-content h2 { font-size: 1.5em; }
                .blog-content h3 { font-size: 1.25em; }
                .blog-content p { margin: 0 0 1.2em; }
                .blog-content img {
                    max-width: 100%;
                    border-radius: 12px;
                    margin: 1.5em 0;
                }
                .blog-content ul, .blog-content ol {
                    padding-left: 24px;
                    margin: 0 0 1.2em;
                }
                .blog-content li { margin-bottom: 0.5em; }
                .blog-content blockquote {
                    border-left: 3px solid ${BRAND_COLOR};
                    padding: 12px 20px;
                    margin: 1.5em 0;
                    background-color: ${BRAND_COLOR_LIGHT};
                    border-radius: 0 8px 8px 0;
                    color: #444;
                }
                .blog-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1.5em 0;
                }
                .blog-content th, .blog-content td {
                    padding: 10px 14px;
                    border: 1px solid #e0e0e0;
                    text-align: left;
                    font-size: 14px;
                }
                .blog-content th {
                    background-color: #f8f9fa;
                    font-weight: 600;
                }
                .blog-content a {
                    color: ${BRAND_COLOR};
                    text-decoration: underline;
                }
                .blog-content strong {
                    font-weight: 700;
                    color: #111;
                }
                .blog-content hr {
                    border: none;
                    border-top: 1px solid #e0e0e0;
                    margin: 2em 0;
                }
            `}</style>
        </Box>
    );
}

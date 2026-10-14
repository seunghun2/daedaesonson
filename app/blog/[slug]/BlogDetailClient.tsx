'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Text, Badge, Group, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ChevronLeft, Share2, Eye, Clock, ListChecks, MapPin, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import BottomNav from '@/components/common/BottomNav';

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

const BRAND_COLOR = '#2563EB';
const BRAND_COLOR_LIGHT = '#EFF6FF';

interface RelatedPost {
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

interface Props {
    post: BlogPost;
    relatedPosts: RelatedPost[];
}

const INTERNAL_SEO_LINKS = [
    { label: '경기도 봉안당 가격 비교', href: '/지역/경기-봉안당' },
    { label: '경기도 수목장 비용 비교', href: '/지역/경기-수목장' },
    { label: '서울 근교 추모공원 찾기', href: '/지역/서울-봉안당' },
    { label: '인천·부천 봉안당 비교', href: '/지역/인천-봉안당' },
    { label: '전국 1,495곳 시설 목록', href: '/list' },
    { label: '장례·개장 용어 사전', href: '/glossary' },
];

export default function BlogDetailClient({ post, relatedPosts }: Props) {
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [viewCount, setViewCount] = useState(post.view_count || 0);
    const [copied, setCopied] = useState(false);

    // 조회수 증가 (클라이언트 사이드, SSR 블로킹 없음)
    useEffect(() => {
        fetch(`/api/blog/${post.slug}`)
            .then(res => res.json())
            .then(data => {
                if (typeof data?.view_count === 'number') {
                    setViewCount(data.view_count);
                }
            })
            .catch(() => {});
    }, [post.slug]);

    // 본문 내 h2/h3 태그 추출하여 자동 목차(TOC) 생성 및 앵커 id 주입 (Google SERP 점프링크 최적화)
    const { processedHtml, tocItems, readingMinutes } = useMemo(() => {
        const raw = post.content || '';
        const items: { id: string; text: string; level: number }[] = [];
        let idx = 0;

        const withIds = raw.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_full, levelStr, attrs, inner) => {
            const plain = inner.replace(/<[^>]+>/g, '').trim();
            const id = `section-${idx++}`;
            if (plain) {
                items.push({ id, text: plain, level: Number(levelStr) });
            }
            return `<h${levelStr}${attrs} id="${id}">${inner}</h${levelStr}>`;
        });

        const textLength = raw.replace(/<[^>]+>/g, '').trim().length;
        const mins = Math.max(2, Math.round(textLength / 450));

        return {
            processedHtml: DOMPurify.sanitize(withIds, { ADD_ATTR: ['id', 'target'] }),
            tocItems: items,
            readingMinutes: mins,
        };
    }, [post.content]);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: post?.title, url });
            } catch (err: any) {
                if (err?.name !== 'AbortError') {
                    try {
                        await navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    } catch { /* ignore */ }
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch { /* ignore */ }
        }
    };

    return (
        <Box
            style={{
                minHeight: '100dvh',
                backgroundColor: '#FFFFFF',
                paddingBottom: isMobile ? 'calc(76px + env(safe-area-inset-bottom))' : 0,
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
                    }}
                >
                    <Group gap={10} align="center">
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size={36}
                            radius="md"
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.history.length <= 1) {
                                    router.push('/blog');
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

                    <Group gap={10}>
                        <button
                            type="button"
                            onClick={handleShare}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                height: 36,
                                padding: '0 12px',
                                borderRadius: 10,
                                border: '1px solid #CBD5E1',
                                backgroundColor: '#FFFFFF',
                                color: '#334155',
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            {copied ? <CheckCircle2 size={14} color="#16A34A" /> : <Share2 size={14} color="#475569" />}
                            <span>{copied ? '링크 복사됨' : '공유'}</span>
                        </button>
                        <Link
                            href="/"
                            style={{
                                textDecoration: 'none',
                                backgroundColor: BRAND_COLOR,
                                color: '#FFFFFF',
                                fontSize: 12.5,
                                fontWeight: 700,
                                height: 36,
                                padding: '0 14px',
                                borderRadius: 10,
                                display: 'inline-flex',
                                alignItems: 'center',
                            }}
                        >
                            지도에서 비교
                        </Link>
                    </Group>
                </Box>
            </Box>

            {/* 본문 영역 */}
            <Box style={{ position: 'relative' }}>
                {/* 아티클 헤더 */}
                <Box
                    style={{
                        maxWidth: 740,
                        margin: '0 auto',
                        padding: isMobile ? '24px 20px 20px' : '44px 20px 28px',
                    }}
                >
                    {/* 브레드크럼 (시각적 계층 + SEO 내부링크) */}
                    <nav
                        aria-label="Breadcrumb"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12.5,
                            color: '#64748B',
                            fontWeight: 600,
                            marginBottom: 14,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>홈</Link>
                        <span>/</span>
                        <Link href="/blog" style={{ color: '#64748B', textDecoration: 'none' }}>장지 가이드</Link>
                        <span>/</span>
                        <span style={{ color: BRAND_COLOR, fontWeight: 800 }}>{post.category}</span>
                    </nav>

                    {/* 제목 */}
                    <h1
                        style={{
                            margin: '0 0 14px 0',
                            fontSize: isMobile ? 23 : 31,
                            fontWeight: 800,
                            lineHeight: 1.34,
                            color: '#191F28',
                            letterSpacing: '-0.5px',
                            wordBreak: 'keep-all',
                        }}
                    >
                        {post.title}
                    </h1>

                    {/* 부제 */}
                    {post.excerpt && (
                        <p
                            style={{
                                margin: '0 0 18px 0',
                                fontSize: isMobile ? 14.5 : 16,
                                color: '#475569',
                                lineHeight: 1.6,
                                wordBreak: 'keep-all',
                            }}
                        >
                            {post.excerpt}
                        </p>
                    )}

                    {/* 작성자 및 읽기 시간 메타 */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            fontSize: 13,
                            color: '#64748B',
                            fontWeight: 600,
                            paddingTop: 14,
                            borderTop: '1px solid #F1F5F9',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span style={{ fontWeight: 800, color: '#191F28' }}>{post.author || '대대손손 장지연구소'}</span>
                        <span>·</span>
                        <span>{formatDate(post.created_at)}</span>
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} color="#64748B" />
                            약 {readingMinutes}분 소요
                        </span>
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={13} color="#64748B" />
                            {viewCount.toLocaleString()}회 읽음
                        </span>
                    </div>
                </Box>

                {/* 히어로 이미지 */}
                {post.thumbnail_url && (
                    <Box
                        style={{
                            maxWidth: 740,
                            margin: '0 auto 28px',
                            padding: '0 20px',
                        }}
                    >
                        <div
                            style={{
                                borderRadius: 16,
                                overflow: 'hidden',
                                aspectRatio: '16/10',
                                backgroundColor: '#F1F5F9',
                                border: '1px solid #E2E8F0',
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

                {/* 자동 목차 (Table of Contents — 독자 탐색 편의 및 Google SERP Jump Link 최적화) */}
                {tocItems.length >= 2 && (
                    <Box
                        style={{
                            maxWidth: 740,
                            margin: '0 auto 32px',
                            padding: '0 20px',
                        }}
                    >
                        <nav
                            aria-label="목차"
                            style={{
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 16,
                                padding: isMobile ? '16px 18px' : '20px 24px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                <ListChecks size={16} color={BRAND_COLOR} />
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#191F28', letterSpacing: '-0.2px' }}>
                                    이 글의 핵심 목차
                                </span>
                            </div>
                            <ol
                                style={{
                                    margin: 0,
                                    paddingLeft: 18,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                {tocItems.map((item) => (
                                    <li key={item.id} style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.45 }}>
                                        <a
                                            href={`#${item.id}`}
                                            style={{
                                                color: '#334155',
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {item.text}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </Box>
                )}

                {/* 본문 콘텐츠 */}
                <Box
                    style={{
                        maxWidth: 740,
                        margin: '0 auto',
                        padding: isMobile ? '0 20px 36px' : '0 20px 52px',
                    }}
                >
                    <div
                        className="blog-content"
                        dangerouslySetInnerHTML={{ __html: processedHtml }}
                        style={{
                            fontSize: isMobile ? 16 : 17,
                            lineHeight: 1.85,
                            color: '#1E293B',
                            wordBreak: 'keep-all',
                        }}
                    />

                    {/* 태그 */}
                    {post.tags && post.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 36, paddingTop: 24, borderTop: '1px solid #E2E8F0' }}>
                            {post.tags.map(tag => (
                                <Link
                                    key={tag}
                                    href={`/blog`}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 999,
                                        backgroundColor: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        color: '#475569',
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                    }}
                                >
                                    #{tag}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* 지역별·유형별 장지 실시간 비교 내부 링크 박스 (SEO 크롤링 + 전환 유도) */}
                    <div
                        style={{
                            marginTop: 28,
                            padding: isMobile ? '20px 18px' : '24px 26px',
                            borderRadius: 16,
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <MapPin size={16} color={BRAND_COLOR} />
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#191F28', letterSpacing: '-0.3px' }}>
                                지역별 봉안당·수목장 실제 가격표 바로 비교하기
                            </span>
                        </div>
                        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                            전화 상담 전 대대손손이 수집한 전국 1,495곳 공설·사설 장지의 단별 분양가와 관리비를 확인해 보세요.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {INTERNAL_SEO_LINKS.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '8px 13px',
                                        borderRadius: 10,
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #CBD5E1',
                                        color: '#191F28',
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                    }}
                                >
                                    <span>{item.label}</span>
                                    <ArrowUpRight size={13} color={BRAND_COLOR} />
                                </Link>
                            ))}
                        </div>
                    </div>
                </Box>

                {/* 관련 글 섹션 */}
                {relatedPosts.length > 0 && (
                    <Box
                        style={{
                            backgroundColor: '#F8FAFC',
                            borderTop: '1px solid #E2E8F0',
                            padding: isMobile ? '32px 20px 40px' : '48px 20px 56px',
                        }}
                    >
                        <Box style={{ maxWidth: 740, margin: '0 auto' }}>
                            <Text fw={800} size={isMobile ? 'lg' : 'xl'} mb={20} c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                                함께 읽으면 좋은 장지 가이드
                            </Text>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                                    gap: isMobile ? 14 : 18,
                                }}
                            >
                                {relatedPosts.map(rp => (
                                    <Link
                                        key={rp.id}
                                        href={`/blog/${rp.slug}`}
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <div
                                            style={{
                                                backgroundColor: '#FFFFFF',
                                                borderRadius: 14,
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                border: '1px solid #E2E8F0',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
                                            {rp.thumbnail_url && (
                                                <div style={{ aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                                                    <img
                                                        src={rp.thumbnail_url}
                                                        alt={rp.title}
                                                        loading="lazy"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ padding: 15, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                <div>
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            padding: '2px 8px',
                                                            borderRadius: 6,
                                                            backgroundColor: BRAND_COLOR_LIGHT,
                                                            color: BRAND_COLOR,
                                                            fontSize: 11,
                                                            fontWeight: 800,
                                                            marginBottom: 8,
                                                        }}
                                                    >
                                                        {rp.category}
                                                    </span>
                                                    <h4
                                                        style={{
                                                            margin: 0,
                                                            fontSize: 14.5,
                                                            fontWeight: 800,
                                                            lineHeight: 1.4,
                                                            color: '#191F28',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            wordBreak: 'keep-all',
                                                        }}
                                                    >
                                                        {rp.title}
                                                    </h4>
                                                </div>
                                                <Text size="xs" c="#94A3B8" fw={600} mt={10}>
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
                        padding: isMobile ? '36px 20px 48px' : '52px 20px 68px',
                        textAlign: 'center',
                        borderTop: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                    }}
                >
                    <Text fw={800} size={isMobile ? 'lg' : 'xl'} mb={6} c="#191F28" style={{ letterSpacing: '-0.3px' }}>
                        우리 가족에게 맞는 장지 가격이 궁금하신가요?
                    </Text>
                    <Text size="sm" c="#64748B" mb={20}>
                        전국 1,495곳 봉안당·수목장·공원묘지 실제 비용을 지도에서 한눈에 비교해보세요.
                    </Text>
                    <Group justify="center" gap={10}>
                        <Link
                            href="/"
                            style={{
                                display: 'inline-block',
                                padding: '14px 28px',
                                backgroundColor: BRAND_COLOR,
                                color: '#FFFFFF',
                                borderRadius: 12,
                                textDecoration: 'none',
                                fontSize: 15,
                                fontWeight: 800,
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                            }}
                        >
                            지도에서 시설 가격 비교하기
                        </Link>
                        <Link
                            href="/inquiries"
                            style={{
                                display: 'inline-block',
                                padding: '14px 24px',
                                backgroundColor: '#F8FAFC',
                                color: '#191F28',
                                border: '1px solid #CBD5E1',
                                borderRadius: 12,
                                textDecoration: 'none',
                                fontSize: 15,
                                fontWeight: 700,
                            }}
                        >
                            1:1 맞춤 장지 추천 문의
                        </Link>
                    </Group>
                </Box>
            </Box>

            {isMobile && <BottomNav />}

            {/* CSS for blog content */}
            <style jsx global>{`
                .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 {
                    margin: 2.1em 0 0.75em;
                    font-weight: 800;
                    color: #191F28;
                    line-height: 1.35;
                    letter-spacing: -0.3px;
                    scroll-margin-top: 84px;
                }
                .blog-content h2 { font-size: 1.45em; }
                .blog-content h3 { font-size: 1.24em; }
                .blog-content p { margin: 0 0 1.25em; }
                .blog-content img {
                    max-width: 100%;
                    border-radius: 14px;
                    margin: 1.6em 0;
                    border: 1px solid #E2E8F0;
                }
                .blog-content ul, .blog-content ol {
                    padding-left: 22px;
                    margin: 0 0 1.3em;
                }
                .blog-content li { margin-bottom: 0.55em; }
                .blog-content blockquote {
                    border-left: 4px solid ${BRAND_COLOR};
                    padding: 16px 20px;
                    margin: 1.6em 0;
                    background-color: #EFF6FF;
                    border-radius: 0 12px 12px 0;
                    color: #1E3A8A;
                    font-size: 0.96em;
                }
                .blog-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1.6em 0;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #E2E8F0;
                }
                .blog-content th, .blog-content td {
                    padding: 11px 14px;
                    border: 1px solid #E2E8F0;
                    text-align: left;
                    font-size: 14px;
                }
                .blog-content th {
                    background-color: #F8FAFC;
                    font-weight: 800;
                    color: #191F28;
                }
                .blog-content a {
                    color: ${BRAND_COLOR};
                    font-weight: 700;
                    text-decoration: underline;
                }
                .blog-content strong {
                    font-weight: 800;
                    color: #191F28;
                }
                .blog-content hr {
                    border: none;
                    border-top: 1px solid #E2E8F0;
                    margin: 2.2em 0;
                }
            `}</style>
        </Box>
    );
}

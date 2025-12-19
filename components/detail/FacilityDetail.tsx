import { useState, useEffect, useRef } from 'react';
import { Image, Text, Badge, Group, Button, Stack, Box, Paper, Modal, Tabs, Collapse, ActionIcon, Rating, Textarea, TextInput, LoadingOverlay, useMantineTheme, Accordion, Table } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Car, Utensils, Accessibility, Store, Navigation, Globe, ChevronLeft, ChevronRight, TrendingUp, ChevronDown, ChevronUp, Star, Pencil, Camera, X, ImageIcon, Plus, Trash, Archive, Mountain, Trees, Layers } from 'lucide-react';
import StoryPanel from './StoryPanel';
import { Facility, FACILITY_CATEGORY_LABELS, Review } from '@/types';
import { PRICE_TAB_CATEGORIES, OTHER_TAB_CATEGORY } from '@/lib/constants';
import { formatKoreanCurrency } from '@/lib/format';
import { getSingleFacilityImageUrl } from '@/lib/supabaseImage';

// ... (Existing code) ...

// Helper Component for Operator Badge
const OperatorBadge = ({ type, name }: { type?: string, name: string }) => {
    let label = '';
    let color = 'gray';

    // 1. Check explicit type first
    if (type) {
        switch (type) {
            case 'FOUNDATION': label = '재단법인'; color = 'blue'; break;
            case 'CORPORATION': label = '주식회사'; color = 'teal'; break;
            case 'ASSOCIATION': label = '사단법인'; color = 'orange'; break;
            case 'RELIGIOUS': label = '종교법인'; color = 'grape'; break;
            case 'PUBLIC': label = '공설'; color = 'gray'; break;
        }
    }

    // 2. Infer from name if not found
    if (!label) {
        if (name.includes('(재)') || name.includes('재단법인')) { label = '재단법인'; color = 'blue'; }
        else if (name.includes('(주)') || name.includes('주식회사')) { label = '주식회사'; color = 'teal'; }
        else if (name.includes('(사)') || name.includes('사단법인')) { label = '사단법인'; color = 'orange'; }
        else if (name.includes('(종)') || name.includes('종교법인')) { label = '종교법인'; color = 'grape'; }
        else if (name.includes('공설')) { label = '공설'; color = 'gray'; }
    }

    if (!label) return null;

    return (
        <Badge
            size="xs"
            radius="sm"
            color={color}
            variant="filled"
            ml={6}
            style={{ flexShrink: 0, fontWeight: 500 }}
        >
            {label}
        </Badge>
    );
};

// Helper to clean name for presentation
const getDisplayName = (name: string) => {
    return name.replace(/\(재\)/g, '')
        .replace(/재단법인/g, '')
        .replace(/\(주\)/g, '')
        .replace(/주식회사/g, '')
        .replace(/\(사\)/g, '')
        .replace(/사단법인/g, '')
        .replace(/\(종\)/g, '')
        .replace(/종교법인/g, '')
        .trim();
};

function PriceInfoSection({ priceInfo, hasPrice }: { priceInfo: any, hasPrice: boolean }) {
    if (!priceInfo) return null;

    // 1. Data Prep & Fallback
    let priceTable = priceInfo.priceTable;
    if (!priceTable && (priceInfo.products || priceInfo.installationCosts || priceInfo.managementCosts)) {
        priceTable = {};
        if (priceInfo.products) Object.assign(priceTable, priceInfo.products);
        if (priceInfo.installationCosts) priceTable['[별도] 시설설치 및 석물비용'] = priceInfo.installationCosts;
        if (priceInfo.managementCosts) priceTable['[안내] 관리비 및 용역비'] = priceInfo.managementCosts;
    }

    if (!priceTable) {
        return hasPrice ? (
            <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                <Text size="sm" fw={700} mb="xs">가격 상세 정보</Text>
                <Text size="xs" c="dimmed">아직 등록된 상세 가격 정보가 없습니다. 관리실로 문의해주세요.</Text>
            </Box>
        ) : null;
    }

    // 2. Grouping Logic (Burial / Charnel / Natural / Etc)
    const groups: Record<string, { label: string, items: any[], categories: string[] }> = {
        burial: { label: '매장묘', items: [], categories: [] },
        charnel: { label: '봉안(납골)', items: [], categories: [] },
        natural: { label: '수목장(자연장)', items: [], categories: [] },
        etc: { label: '기타/공통', items: [], categories: [] }
    };

    Object.entries(priceTable).forEach(([catName, catData]: [string, any]) => {
        let key = 'etc';
        if (/매장|묘지|봉분|둘레석/.test(catName)) key = 'burial';
        else if (/기본비용/.test(catName)) key = 'burial';
        else if (/봉안|납골|유골/.test(catName)) key = 'charnel';
        else if (/수목|자연|평장|잔디|화초/.test(catName)) key = 'natural';

        const rows = catData.rows || [];
        if (rows.length > 0) {
            groups[key].items.push(...rows);
            groups[key].categories.push(catName);
        }
    });

    const visibleGroups = Object.values(groups).filter(g => g.items.length > 0);

    // 3. Min Price Calculation (Prioritize Representative)
    const getMinPrice = (items: any[]) => {
        // [New Logic] Check Representative First
        const repItem = items.find(i => i.isRepresentative);
        if (repItem && repItem.price > 0) {
            return repItem.price;
        }

        // [Legacy Logic] Calculate Min Price
        const candidates = items.filter(i => {
            const n = i.name || '';
            // 관리비, 석물, 제례비 등 부대비용 제외 (본상품 가격만)
            if (/관리|석물|작업|각자|제례|상석/.test(n)) return false;
            return true;
        });

        if (candidates.length === 0) return 0;

        const prices = candidates.map(i => {
            if (typeof i.price === 'number') return i.price;
            return Number(String(i.price).replace(/,/g, ''));
        }).filter(p => !isNaN(p) && p > 0);

        if (prices.length === 0) return 0;
        return Math.min(...prices);
    };

    // 4. Name Formatter
    const formatName = (name: string) => {
        return name
            .replace(/(\d+)위/g, '$1분 안치')
            .replace(/1분 안치/g, '1분 안치 (개인형)')
            .replace(/2분 안치/g, '2분 안치 (부부형)');
    };

    // 5. Icons Mapping
    const getIcon = (type: string) => {
        switch (type) {
            case 'burial': return <Mountain size={24} color="#495057" />;
            case 'charnel': return <Archive size={24} color="#495057" />;
            case 'natural': return <Trees size={24} color="#495057" />;
            default: return <Layers size={24} color="#495057" />;
        }
    };

    if (visibleGroups.length === 0) return null;

    // Filter out '기타' group as per user request
    const displayGroups = visibleGroups.filter(g => !g.label.includes('기타'));

    return (
        <Box bg="white" p="md" pb="xl" style={{ borderBottom: '8px solid #f8f9fa' }}>
            <Text size="xl" fw={800} mb="xl" style={{ letterSpacing: '-1px' }}>
                사용료
            </Text>

            <Accordion
                variant="default"
                radius="md"
                // 🔒 초기 상태: 모두 닫힘
                styles={{
                    item: { borderBottom: '1px solid #f1f3f5' },
                    control: { padding: '20px 0', '&:hover': { backgroundColor: 'transparent' } },
                    content: { padding: '0 0 24px 0' },
                    chevron: { display: 'none' }
                }}
            >
                {displayGroups.map((group) => {
                    const minPrice = getMinPrice(group.items);
                    const hasMinPrice = minPrice > 0 && minPrice < Infinity;

                    // Identify key for icon
                    let groupKey = 'etc';
                    if (group.label.includes('매장')) groupKey = 'burial';
                    else if (group.label.includes('봉안')) groupKey = 'charnel';
                    else if (group.label.includes('수목')) groupKey = 'natural';

                    return (
                        <Accordion.Item key={group.label} value={group.label}>
                            <Accordion.Control>
                                <Group justify="space-between" wrap="nowrap">
                                    <Group gap="md">
                                        {getIcon(groupKey)}
                                        <Text fw={700} size="lg" c="dark.9">{group.label}</Text>
                                    </Group>

                                    <Group gap="xs">
                                        {hasMinPrice ? (
                                            <Text fw={800} c="#35469C" size="lg">
                                                {formatKoreanCurrency(minPrice)}부터
                                            </Text>
                                        ) : (
                                            <Text size="sm" c="dimmed">가격 문의</Text>
                                        )}
                                        <ChevronRight size={18} color="#adb5bd" />
                                    </Group>
                                </Group>
                            </Accordion.Control>

                            <Accordion.Panel>
                                <Box p="sm" bg="#f8f9fa" style={{ borderRadius: 8 }}>
                                    <Stack gap="lg">
                                        {group.categories.map(cat => {
                                            const rows = priceTable[cat].rows;
                                            const mainRows = rows.filter((r: any) => !/관리|석물|작업|각자|제례|상석/.test(r.name));
                                            const optionRows = rows.filter((r: any) => /관리|석물|작업|각자|제례|상석/.test(r.name));

                                            // Helper for Type Display
                                            const getTypeLabel = (name: string) => {
                                                if (/부부|쌍/.test(name)) return <Badge size="xs" variant="light" color="blue">부부형</Badge>;
                                                if (/합장/.test(name)) return <Badge size="xs" variant="light" color="teal">합장형</Badge>;
                                                if (/가족/.test(name)) return <Badge size="xs" variant="light" color="grape">가족형</Badge>;
                                                if (/개인|1위/.test(name)) return <Badge size="xs" variant="light" color="gray">개인형</Badge>;
                                                return null;
                                            };

                                            return (
                                                <Box key={cat}>
                                                    <Text size="sm" c="dimmed" fw={700} mb="xs">{cat}</Text>

                                                    {/* 메인 상품 리스트 (Compact, Fix Truncation) */}
                                                    <Stack gap="sm" mb={optionRows.length > 0 ? "lg" : 0}>
                                                        {mainRows.map((row: any, idx: number) => (
                                                            <Group key={`main-${idx}`} justify="space-between" align="flex-start" wrap="nowrap"
                                                                style={{ borderBottom: '1px solid #e9ecef', paddingBottom: 12 }}
                                                            >
                                                                <Box style={{ flex: 1, minWidth: 0 }}>
                                                                    <Group gap="xs" mb={4} align="center" wrap="wrap">
                                                                        <Text fw={600} size="md" c="dark.9" style={{ lineHeight: 1.3, wordBreak: 'keep-all' }}>
                                                                            {formatName(row.name)}
                                                                        </Text>
                                                                        {getTypeLabel(row.name)}
                                                                    </Group>
                                                                    {row.grade && <Text size="12px" c="dimmed">{row.grade}</Text>}
                                                                </Box>
                                                                <Text fw={700} size="md" c="black" style={{ whiteSpace: 'nowrap', marginLeft: 8 }}>
                                                                    {formatKoreanCurrency(row.price)}
                                                                </Text>
                                                            </Group>
                                                        ))}
                                                    </Stack>

                                                    {/* 부가 비용 리스트 (Compact) */}
                                                    {optionRows.length > 0 && (
                                                        <Box bg="white" p="xs" style={{ borderRadius: 6, border: '1px solid #f1f3f5' }}>
                                                            <Group justify="space-between" mb="xs">
                                                                <Text size="11px" fw={700} c="dimmed">💡 부가 옵션</Text>
                                                            </Group>
                                                            <Stack gap="xs">
                                                                {optionRows.map((row: any, idx: number) => (
                                                                    <Group key={`opt-${idx}`} justify="space-between">
                                                                        <Text size="xs" c="dark.5">{row.name}</Text>
                                                                        <Text size="xs" fw={600} c="dark.7">{formatKoreanCurrency(row.price)}</Text>
                                                                    </Group>
                                                                ))}
                                                            </Stack>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )
                                        })}
                                    </Stack>
                                </Box>
                            </Accordion.Panel>
                        </Accordion.Item>
                    );
                })}
            </Accordion>

            <Box mt="xl" p="lg" bg="gray.0" style={{ borderRadius: 8 }}>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                    사용료는 <b>e하늘 장사정보 시스템</b>에 등록되어 있는 가격정보를 바탕으로 안내해드리고 있어 상이할 수 있습니다.<br />
                    사용료 정보가 안내되지 않은 시설은 <b>해당 시설에 직접 문의</b>바랍니다.
                </Text>
            </Box>
        </Box>
    );
}

interface FacilityDetailProps {
    facility: Facility;
    onClose: () => void;
}

export default function FacilityDetail({ facility: initialFacility, onClose }: FacilityDetailProps) {
    const [facility, setFacility] = useState<Facility>(initialFacility);
    const [isFetchingDetail, setIsFetchingDetail] = useState(false);

    useEffect(() => {
        setFacility(initialFacility);

        // Check if Lite data (missing description/priceInfo)
        // Note: Even if description is empty string, if it's lite it might be undefined or we check keys.
        // Our Lite API removes 'description' key completely.
        const needsFetch = !('priceInfo' in initialFacility) && !('description' in initialFacility);

        if (needsFetch) {
            setIsFetchingDetail(true);
            fetch(`/api/facilities/${initialFacility.id}`)
                .then(res => res.json())
                .then(fullData => {
                    if (!fullData || fullData.error) return;
                    setFacility(prev => ({ ...prev, ...fullData }));
                })
                .catch(e => console.error('Detail fetch error:', e))
                .finally(() => setIsFetchingDetail(false));
        }
    }, [initialFacility]);
    const [opened, setOpened] = useState(false); // Image Modal state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // 이미지 갤러리 열릴 때 body 스크롤 막기
    useEffect(() => {
        if (opened) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [opened]);
    const [viewCount, setViewCount] = useState(0);
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    // Review State
    const [reviews, setReviews] = useState<Review[]>(facility.reviews || []);
    const [reviewCount, setReviewCount] = useState(facility.reviews?.length || 0);
    const [reviewModalOpened, { open: openReviewModal, close: closeReviewModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        content: '',
        author: '',
        password: '',
        photos: [] as string[]
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [likedReviews, setLikedReviews] = useState<Set<string>>(new Set());
    const [storyOpen, setStoryOpen] = useState(false);

    const phoneNumber = facility.phone || facility.operator?.contact || facility.description || '문의 필요';
    const hasPrice = (facility.priceRange?.max || 0) > 0;

    const handleSubmitReview = async () => {
        if (!reviewForm.content.trim()) {
            alert('리뷰 내용을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/facilities/${facility.id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewForm)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Update local state
                const newReview = data.review;
                setReviews([newReview, ...reviews]);
                setReviewCount(prev => prev + 1);

                // Reset form and close
                setReviewForm({ rating: 5, content: '', author: '', password: '', photos: [] });
                closeReviewModal();
                alert('리뷰가 등록되었습니다!');
            } else {
                alert(data.error || '리뷰 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Limit to 5 photos
        if (reviewForm.photos.length + files.length > 5) {
            alert('사진은 최대 5장까지 첨부할 수 있습니다.');
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReviewForm(prev => ({
                    ...prev,
                    photos: [...prev.photos, reader.result as string]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setReviewForm(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const handleLike = async (reviewId: string) => {
        const isLiked = likedReviews.has(reviewId);
        const action = isLiked ? 'UNLIKE' : 'LIKE';

        // Optimistic UI Update first
        setLikedReviews(prev => {
            const next = new Set(prev);
            if (isLiked) next.delete(reviewId);
            else next.add(reviewId);
            return next;
        });

        setReviews(prev => prev.map(r => {
            if (r.id === reviewId) {
                return { ...r, likes: Math.max(0, (r.likes || 0) + (isLiked ? -1 : 1)) };
            }
            return r;
        }));

        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facilityId: facility.id, reviewId, action })
            });

            if (!res.ok) {
                // Revert on failure (optional, but good practice)
                console.error('Failed to toggle like');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmitReply = async (reviewId: string) => {
        if (!replyContent.trim()) return;

        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId: facility.id,
                    reviewId,
                    action: 'REPLY',
                    content: replyContent,
                    author: '관리자' // Or current user
                })
            });

            if (res.ok) {
                const data = await res.json();
                // Refresh reviews or optimistic update
                // For simplicity, just refetching or manually updating local state if complex structure
                // Let's do manual update
                const newReply = {
                    id: `rep-${Date.now()}`,
                    author: '관리자',
                    content: replyContent,
                    date: new Date().toISOString().split('T')[0]
                };

                setReviews(prev => prev.map(r => {
                    if (r.id === reviewId) {
                        return { ...r, replies: [...(r.replies || []), newReply] };
                    }
                    return r;
                }));

                setReplyingTo(null);
                setReplyContent('');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm('리뷰를 삭제하시겠습니까?')) return;
        try {
            await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facilityId: facility.id, reviewId, action: 'DELETE_REVIEW' })
            });
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (e) { console.error(e); }
    };

    const handleDeleteReply = async (reviewId: string, replyId: string) => {
        if (!confirm('답글을 삭제하시겠습니까?')) return;
        try {
            await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ facilityId: facility.id, reviewId, replyId, action: 'DELETE_REPLY' })
            });
            setReviews(prev => prev.map(r => {
                if (r.id === reviewId) {
                    return { ...r, replies: r.replies?.filter(rep => rep.id !== replyId) };
                }
                return r;
            }));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        // Random view count (simulated) - Client side only
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewCount(Math.floor(Math.random() * 20) + 5);
    }, []);

    // 갤러리 이미지 처리 (엄격한 필터링)
    const galleryImages = (facility.imageGallery || [])
        .filter(img => img && typeof img === 'string' && img.trim() !== '')
        .filter(img => img.startsWith('http') || img.startsWith('/') || img.startsWith('blob:') || img.startsWith('data:'));

    const visibleImages = galleryImages.slice(0, 2);
    const extraInfoCount = galleryImages.length > 2 ? galleryImages.length - 2 : 0;

    // 이미지 클릭 핸들러
    const handleImageClick = (index: number) => {
        setSelectedImageIndex(index);
        setOpened(true);
    };

    // 🎹 키보드 이벤트 (ESC 닫기 + 좌우 화살표)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!opened) return;

            if (e.key === 'Escape') {
                setOpened(false);
            } else if (e.key === 'ArrowLeft') {
                setSelectedImageIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1);
            } else if (e.key === 'ArrowRight') {
                setSelectedImageIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [opened, galleryImages.length]);

    return (
        <Box
            style={{ backgroundColor: '#f8f9fa', height: '100%', position: 'relative', overflowY: 'auto', touchAction: 'pan-y' }}
            onTouchStart={(e) => e.stopPropagation()} // 🚀 지도 터치 간섭 방지 (재적용)
        >
            {/* 1. 호갱노노 스타일 헤더 (Brand Color - Deep Indigo) */}
            <Box bg="brand.8" p="md" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap={4} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                        <ActionIcon variant="transparent" color="white" w={32} h={32} onClick={onClose} style={{ flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back_ios_new</span>
                        </ActionIcon>
                        <Group gap={4} wrap="nowrap" style={{ overflow: 'hidden' }}>
                            <Text size="md" fw={600} c="white" ml={4} truncate>
                                {facility.name}
                            </Text>
                            <OperatorBadge type={facility.operatorType} name={facility.name} />
                        </Group>
                    </Group>
                    <Group gap={0} style={{ flexShrink: 0 }}>
                        <ActionIcon variant="transparent" color="white" w={36} h={36}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>share</span>
                        </ActionIcon>
                        <ActionIcon variant="transparent" color="white" w={36} h={36}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
                        </ActionIcon>
                        <ActionIcon variant="transparent" color="white" w={36} h={36} onClick={onClose} ml={4}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
                        </ActionIcon>
                    </Group>
                </Group>
            </Box>

            {/* 3. 정보 요약 & 소셜 데이터 */}
            <Box bg="white">
                <Box pt="md" px="md" pb="xs">
                    <Group align="center" gap={4} mb="xs">
                        <Text size="sm" c="gray.7" style={{ letterSpacing: '-0.3px' }}>{facility.address}</Text>

                    </Group>

                    {/* 상단 태그 영역 제거됨 -> 하단 통계 섹션으로 이동 */}
                </Box>

                {/* 방문자 통계 & 태그 섹션 (수정됨) */}
                {/* 방문자 통계 & 태그 섹션 (단일 라인 스크롤) */}
                <Box
                    py="sm" px="md"
                    style={{ borderTop: '1px solid #f1f3f5', borderBottom: '8px solid #f8f9fa' }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: '8px'
                    }}>
                        {/* 태그 그룹 (왼쪽 정렬, 필요시 스크롤) */}
                        <div style={{
                            display: 'flex',
                            gap: '6px',
                            overflowX: 'auto',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            whiteSpace: 'nowrap',
                            alignItems: 'center'
                        }}>
                            <Badge
                                size="md" radius="md" variant="light"
                                style={{
                                    textTransform: 'none',
                                    color: '#495057',
                                    backgroundColor: '#f1f3f5',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    height: '28px',
                                    border: 'none',
                                    padding: '0 10px',
                                    flexShrink: 0
                                }}
                            >
                                {facility.isPublic ? '지자체 운영' : '민간 운영'}
                            </Badge>

                            <Badge
                                size="md" radius="md" variant="light"
                                style={{
                                    textTransform: 'none',
                                    color: '#495057',
                                    backgroundColor: '#f1f3f5',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    height: '28px',
                                    border: 'none',
                                    padding: '0 10px',
                                    flexShrink: 0
                                }}
                            >
                                {FACILITY_CATEGORY_LABELS[facility.category]}
                            </Badge>
                        </div>

                        {/* 방문자 통계 텍스트 (오른쪽 정렬) */}
                        <Text size="xs" c="gray.6" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                            최근 {viewCount * 12 + 34}명이 찾아봤어요
                        </Text>
                    </div>
                </Box>
            </Box>



            {/* 가격 정보 섹션 (별도 카드 분리) */}
            {(() => {
                // [Price Logic] Prioritize Representative Price from pricing object
                let displayPriceNum = 0;
                let isRep = false;

                // Collection for sub-items (Label, Price in Won)
                const subRepItems: { label: string; price: number }[] = [];

                if (facility.pricing) {
                    // 1. Collect all representative items
                    Object.keys(facility.pricing).forEach(key => {
                        const cat = facility.pricing[key];
                        // Skip 'Others' or Option-like categories for the main sumamry if desired, 
                        // but user asked for "Main categories". Usually 매장, 봉안, 수목.
                        if (key.includes('옵션') || key.includes('관리비')) return;

                        if (cat && Array.isArray(cat.rows)) {
                            const rep = cat.rows.find((r: any) => r.isRepresentative);
                            if (rep) {
                                let priceVal = Number(rep.price);
                                if (isNaN(priceVal) || priceVal <= 0) return;

                                // Heuristic: Process Unit
                                // If < 10000, assume Man-won -> Convert to Won
                                // If >= 10000, assume Won -> Keep as Won
                                // Special case: very small numbers < 5 might be noise, but let's keep for now if user entered '2' (20000 won)
                                const val = priceVal < 10000 ? priceVal * 10000 : priceVal;

                                subRepItems.push({ label: key, price: val });
                            }
                        }
                    });

                    // 2. Pick Main Display Price (Preferred Category matching)
                    let preferredKeywords: string[] = [];
                    if (facility.category === 'FAMILY_GRAVE') preferredKeywords = ['매장', '묘지'];
                    else if (facility.category === 'CHARNEL_HOUSE') preferredKeywords = ['봉안', '납골'];
                    else if (facility.category === 'NATURAL_BURIAL') preferredKeywords = ['수목', '자연', '잔디', '화초'];

                    // Find first item that matches ANY of the keywords
                    const mainItem = subRepItems.find(i =>
                        preferredKeywords.some(k => i.label.includes(k))
                    ) || subRepItems[0];

                    if (mainItem) {
                        // Convert back to Man-won for the *existing* render logic below which multiplies by 10000
                        displayPriceNum = mainItem.price / 10000;
                        isRep = true;
                    }
                }

                // Fallback: Use priceRange.min if no representative price found
                if (displayPriceNum === 0) {
                    displayPriceNum = facility.priceRange?.min || 0;
                }

                // Fallback attempt with legacy representativePricing if not found in pricing
                if (!isRep && facility.representativePricing) {
                    // (Legacy logic omitted for brevity, keeping existing flow if pricing empty)
                }

                if (displayPriceNum > 0) {
                    return (
                        <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                            <Text size="sm" c="gray.6" mb={8} fw={500}>예상 이용 비용</Text>
                            <Group align="flex-end" gap="xs">
                                <Text style={{ fontSize: '28px', fontWeight: 800, color: 'var(--mantine-color-brand-8)', lineHeight: 1, fontFamily: 'Pretendard' }}>
                                    {formatKoreanCurrency(displayPriceNum * 10000)}{isRep ? '' : '~'}
                                </Text>
                            </Group>

                            <Text size="xs" c="dimmed" mt={8}>
                                ※ 실제 비용은 선택 옵션에 따라 달라질 수 있습니다.
                            </Text>
                        </Box>
                    );
                } else {
                    return (
                        <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                            <Text size="lg" fw={700} c="gray.6">전화 문의 필요</Text>
                        </Box>
                    );
                }
            })()}

            {/* 4. 핵심 지표 (Highlight) */}
            {
                facility.highlight && (
                    <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                        <Group gap="xs" mb="sm">
                            <TrendingUp size={16} color="var(--mantine-color-brand-6)" />
                            <Text size="sm" fw={700} c="brand.8">핵심 지표</Text>
                        </Group>
                        <Group gap="md">
                            {facility.highlight.price && (
                                <Box>
                                    <Text size="xs" c="dimmed">가격</Text>
                                    <Text size="sm" fw={600} c="brand.7">{facility.highlight.price}</Text>
                                </Box>
                            )}
                            {facility.highlight.accessibility && (
                                <Box>
                                    <Text size="xs" c="dimmed">접근성</Text>
                                    <Text size="sm" fw={600}>{facility.highlight.accessibility}</Text>
                                </Box>
                            )}
                            {facility.highlight.environment && (
                                <Box>
                                    <Text size="xs" c="dimmed">자연환경</Text>
                                    <Text size="sm" fw={600}>{facility.highlight.environment}</Text>
                                </Box>
                            )}
                        </Group>
                    </Box>
                )
            }

            {/* 5. 시설 정보 카드 */}
            <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                <Text size="sm" fw={700} mb="md">시설 정보</Text>
                <Group gap="lg" grow>
                    <Box ta="center">
                        <Box style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: facility.hasParking ? 'var(--mantine-color-brand-0)' : '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                            <Car size={24} color={facility.hasParking ? 'var(--mantine-color-brand-6)' : '#adb5bd'} />
                        </Box>
                        <Text size="xs" fw={facility.hasParking ? 600 : 400} c={facility.hasParking ? 'dark' : 'dimmed'}>주차장</Text>
                    </Box>

                    <Box ta="center">
                        <Box style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: facility.hasRestaurant ? 'var(--mantine-color-brand-0)' : '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                            <Utensils size={24} color={facility.hasRestaurant ? 'var(--mantine-color-brand-6)' : '#adb5bd'} />
                        </Box>
                        <Text size="xs" fw={facility.hasRestaurant ? 600 : 400} c={facility.hasRestaurant ? 'dark' : 'dimmed'}>식당</Text>
                    </Box>

                    <Box ta="center">
                        <Box style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: facility.hasAccessibility ? 'var(--mantine-color-brand-0)' : '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                            <Accessibility size={24} color={facility.hasAccessibility ? 'var(--mantine-color-brand-6)' : '#adb5bd'} />
                        </Box>
                        <Text size="xs" fw={facility.hasAccessibility ? 600 : 400} c={facility.hasAccessibility ? 'dark' : 'dimmed'}>편의시설</Text>
                    </Box>

                    <Box ta="center">
                        <Box style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: facility.hasStore ? 'var(--mantine-color-brand-0)' : '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                            <Store size={24} color={facility.hasStore ? 'var(--mantine-color-brand-6)' : '#adb5bd'} />
                        </Box>
                        <Text size="xs" fw={facility.hasStore ? 600 : 400} c={facility.hasStore ? 'dark' : 'dimmed'}>매점</Text>
                    </Box>


                </Group>
            </Box>

            {/* 6. 사진 갤러리 (수정됨: 2개 노출 + 오버레이 + 클릭 시 팝업) */}
            {
                galleryImages.length > 0 && (
                    <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                        <Text size="sm" fw={700} mb="md">시설 사진</Text>
                        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                            {visibleImages.map((img, idx) => {
                                const isLastAndMore = idx === 1 && extraInfoCount > 0;
                                return (
                                    <Box
                                        key={idx}
                                        onClick={() => handleImageClick(idx)}
                                        style={{ position: 'relative', paddingBottom: '100%', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
                                    >
                                        <Image
                                            src={getSingleFacilityImageUrl(img)}
                                            // fallbackSrc removed to avoid showing random fake images
                                            alt={`${facility.name} ${idx + 1}`}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        {/* 오버레이 (+7) */}
                                        {isLastAndMore && (
                                            <Box
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    backgroundColor: 'rgba(0,0,0,0.3)', // 요청사항: 오버레이 30%
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '24px',
                                                    fontWeight: 700
                                                }}
                                            >
                                                +{extraInfoCount}
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )
            }

            {/* 7. 시설 소개 */}
            {
                facility.description && facility.description !== phoneNumber && (
                    <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                        <Text size="sm" fw={700} mb="sm">시설 소개</Text>
                        <Text size="sm" lh={1.6} c="dark.7">{facility.description}</Text>
                    </Box>
                )
            }

            {/* 8. 가격 정보 (상세) - 리팩토링된 컴포넌트 사용 */}
            <PriceInfoSection priceInfo={facility.priceInfo} hasPrice={hasPrice} />




            {/* 9. 위치 및 교통 (홈페이지 바로가기 버튼 추가됨) */}
            <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                <Text size="sm" fw={700} mb="sm">위치</Text>
                <Text size="sm" mb="md" c="dark.7">{facility.address}</Text>

                <Group grow>
                    <Button
                        variant="outline"
                        color="brand"
                        size="sm"
                        component="a"
                        href={facility.transportInfo?.naverMapUrl || `https://map.naver.com/v5/search/${encodeURIComponent(facility.address)}`}
                        target="_blank"
                        leftSection={<Navigation size={16} />}
                        styles={{ root: { borderColor: 'var(--mantine-color-brand-3)' } }}
                    >
                        길찾기
                    </Button>
                    {facility.websiteUrl && (
                        <Button
                            variant="outline"
                            color="gray"
                            size="sm"
                            component="a"
                            href={facility.websiteUrl}
                            target="_blank"
                            leftSection={<Globe size={16} />}
                        >
                            홈페이지
                        </Button>
                    )}
                </Group>
            </Box>

            {/* 10. 전화 상담 */}




            {/* 전화상담 */}
            <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                <Text size="sm" fw={700} mb="md">전화상담</Text>
                <Text size="lg" fw={700} c="dark.9">
                    {facility.phone || '문의 필요'}
                </Text>
            </Box>

            {/* 시설 정보 */}
            <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                <Text size="sm" fw={700} mb="md">시설 정보</Text>
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Text size="sm" c="gray.6">운영형태</Text>
                        <Text size="sm" fw={500} c="dark.9">
                            {facility.isPublic ? '공설' : '사설'}
                        </Text>
                    </Group>
                    <Group justify="space-between">
                        <Text size="sm" c="gray.6">시설종류</Text>
                        <Text size="sm" fw={500} c="dark.9">
                            {facility.category ? FACILITY_CATEGORY_LABELS[facility.category] || facility.category : '정보 없음'}
                        </Text>
                    </Group>

                    {/* 총매장능력 (값이 있을 때만 노출) */}
                    {facility.capacity && facility.capacity > 0 && (
                        <Group justify="space-between">
                            <Text size="sm" c="gray.6">총매장능력</Text>
                            <Text size="sm" fw={500} c="dark.9">
                                {facility.capacity.toLocaleString()}기
                            </Text>
                        </Group>
                    )}

                    <Group justify="space-between">
                        <Text size="sm" c="gray.6">업데이트</Text>
                        <Text size="sm" fw={500} c="dark.9">
                            {facility.lastUpdated || '정보 없음'}
                        </Text>
                    </Group>
                </Stack>
            </Box>

            {/* 13. 이용자 리뷰 */}
            <Box bg="white" p="md" pb={100}>
                <Group justify="space-between" mb="md" align="center">
                    <Group justify="space-between">
                        <Text size="lg" fw={700} style={{ cursor: 'pointer' }} onClick={() => setStoryOpen(true)}>방문자 리뷰</Text>
                        <ChevronRight size={20} style={{ cursor: 'pointer' }} onClick={() => setStoryOpen(true)} />
                    </Group>
                    <Group gap={4} style={{ cursor: 'pointer' }} onClick={() => setStoryOpen(true)}>
                        <Text size="xs" c="dimmed">사진 전체</Text>
                        <ChevronRight size={14} color="gray" />
                    </Group>
                </Group>


                {/* Photo Strip (Simulated for now) - If reviews have photos, show here */}
                {/* <Box mb="lg" ... /> */}

                {/* Review List */}
                {/* Inline Write Box (HogangNono Style) - Moved to Top */}
                <Paper
                    withBorder radius="md" p="md" mb="lg"
                    onClick={openReviewModal}
                    style={{ cursor: 'pointer', borderColor: '#e9ecef', backgroundColor: '#f8f9fa' }}
                >
                    <Group justify="space-between">
                        <Text c="gray.5" size="sm">
                            궁금한 점이나 솔직한 후기를 남겨주세요.
                        </Text>
                        <Group gap={12}>
                            <Camera size={20} color="#5c7cfa" />
                            <Pencil size={20} color="#5c7cfa" />
                        </Group>
                    </Group>
                </Paper>

                {/* Review List */}
                <Stack gap="md" mb="xl">
                    {reviews.length > 0 ? (
                        reviews.map((review) => (
                            <Box key={review.id} style={{ borderBottom: '1px solid #f1f3f5' }} pb="md">
                                <Group justify="space-between" mb={4}>
                                    <Group gap="xs">
                                        <Box w={24} h={24} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#adb5bd' }}>account_circle</span>
                                        </Box>
                                        <Text size="sm" fw={600} c="dark.8">{review.author}</Text>
                                        <Text size="xs" c="dimmed">· {review.date}</Text>
                                    </Group>
                                    <ActionIcon variant="transparent" color="gray" size="sm" onClick={() => handleDeleteReview(review.id)}>
                                        <Trash size={14} />
                                    </ActionIcon>
                                </Group>
                                <Text size="md" mb="xs" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#343a40' }}>
                                    {review.content}
                                </Text>
                                {/* Review Photos */}
                                {review.photos && review.photos.length > 0 && (
                                    <Group gap="xs" mb="sm">
                                        {review.photos.map((photo, idx) => (
                                            <Image key={idx} src={photo} w={100} h={100} radius="md" style={{ objectFit: 'cover', border: '1px solid #f1f3f5' }} />
                                        ))}
                                    </Group>
                                )}

                                <Group gap="lg">
                                    <Group gap={4} style={{ cursor: 'pointer' }} onClick={() => handleLike(review.id)}>
                                        <span
                                            className="material-symbols-outlined"
                                            style={{
                                                fontSize: '18px',
                                                color: likedReviews.has(review.id) ? '#fa5252' : '#adb5bd',
                                                fontVariationSettings: likedReviews.has(review.id) ? "'FILL' 1" : "'FILL' 0"
                                            }}
                                        >
                                            favorite
                                        </span>
                                        <Text size="xs" c={likedReviews.has(review.id) ? 'red.6' : 'dimmed'} fw={likedReviews.has(review.id) ? 600 : 400}>
                                            좋아요 {review.likes || 0}
                                        </Text>
                                    </Group>
                                    <Group gap={4} style={{ cursor: 'pointer' }} onClick={() => {
                                        setReplyingTo(replyingTo === review.id ? null : review.id);
                                        setReplyContent('');
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#adb5bd' }}>chat_bubble</span>
                                        <Text size="xs" c="dimmed">답글달기</Text>
                                    </Group>
                                </Group>

                                {/* Reply Input */}
                                {replyingTo === review.id && (
                                    <Box mt="sm" p="sm" bg="gray.0" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                                        <Group gap="xs" mb="sm">
                                            <TextInput
                                                placeholder="답글을 입력하세요"
                                                style={{ flex: 1 }}
                                                size="sm"
                                                variant="unstyled"
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.currentTarget.value)}
                                            />
                                        </Group>
                                        <Group justify="flex-end">
                                            <Button size="xs" variant="text" c="dimmed" onClick={() => setReplyingTo(null)}>취소</Button>
                                            <Button size="xs" variant="filled" color="brand" radius="xl" onClick={() => handleSubmitReply(review.id)}>등록</Button>
                                        </Group>
                                    </Box>
                                )}

                                {/* Reply List */}
                                {review.replies && review.replies.length > 0 && (
                                    <Box mt="md" bg="gray.0" p="sm" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
                                        {review.replies.map(reply => (
                                            <Box key={reply.id} mb="sm">
                                                <Group gap="xs" mb={4}>
                                                    <Text size="sm" fw={700} c="dark.8">{reply.author}</Text>
                                                    <Text size="xs" c="dimmed">{reply.date}</Text>
                                                    <ActionIcon variant="transparent" color="gray" size="xs" onClick={() => handleDeleteReply(review.id, reply.id)} ml="auto">
                                                        <X size={12} />
                                                    </ActionIcon>
                                                </Group>
                                                <Text size="sm" c="dark.7">{reply.content}</Text>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        ))
                    ) : (
                        <Box ta="center" py="xl">
                            <Text size="sm" c="dimmed">아직 작성된 리뷰가 없습니다.<br />첫 번째 리뷰를 남겨보세요!</Text>
                        </Box>
                    )}
                </Stack>


                {/* 'Current Reviews' Count Button - Open Story Panel */}
                {reviews.length > 0 && (
                    <Button
                        variant="filled" color="gray.0" fullWidth size="lg" radius="md"
                        styles={{ root: { color: '#495057', height: '52px' } }}
                        onClick={() => setStoryOpen(true)}
                    >
                        방문자 리뷰 {reviews.length}개 더보기
                    </Button>
                )}
                {/* 14. 면책 조항 (법적 보호) */}
                <Box mt="xl" pt="xl" style={{ borderTop: '1px solid #f1f3f5' }}>
                    <Text size="xs" c="dimmed" ta="center" lh={1.6}>
                        [면책 공고]<br />
                        대대손손은 정보 제공 플랫폼이며, 해당 시설과의 계약 및 서비스 이용에 대한 책임은 각 시설 제공자에게 있습니다.<br />
                        실제 가격과 정보는 시기에 따라 변동될 수 있으므로, 방문 전 반드시 해당 시설에 확인하시기 바랍니다.
                    </Text>
                </Box>

                {/* 하단 여백 */}
                <Box h={100} />
            </Box>


            {/* Story Panel Overlay */}
            <StoryPanel facility={facility} isOpen={storyOpen} onClose={() => setStoryOpen(false)} />

            {/* Floating Button Removed */}

            {/* 🖼️ 호갱노노 스타일 전체화면 이미지 갤러리 */}
            {opened && galleryImages.length > 0 && (
                <Box
                    pos="fixed"
                    top={0}
                    left={0}
                    w="100%"
                    h="100dvh"
                    onClick={() => setOpened(false)} // 배경 클릭 시 닫기
                    style={{
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', // 80% opacity로 더 어둡게
                        cursor: 'pointer',
                    }}
                >
                    {/* 상단 헤더 */}
                    <Box
                        pos="absolute"
                        top={0}
                        left={0}
                        w="100%"
                        p="md"
                        style={{
                            zIndex: 10000,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
                        }}
                    >
                        <Group justify="space-between" align="center">
                            <Text c="white" fw={600} size="md">
                                {selectedImageIndex + 1} / {galleryImages.length}
                            </Text>
                            <ActionIcon
                                variant="transparent"
                                c="white"
                                size="lg"
                                onClick={() => setOpened(false)}
                            >
                                <X size={28} />
                            </ActionIcon>
                        </Group>
                    </Box>

                    {/* 이미지 영역 (스와이프 + 마우스 드래그 + 애니메이션) */}
                    <Box
                        pos="absolute"
                        top="50%"
                        left="50%"
                        w="100%"
                        maw="90vw"
                        onClick={(e) => e.stopPropagation()} // 이미지 영역 클릭 시 닫히지 않게
                        style={{
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            touchAction: 'pan-x',
                            overflow: 'hidden',
                            cursor: 'grab',
                        }}
                        // 📱 터치 이벤트 (모바일)
                        onTouchStart={(e) => {
                            const touch = e.touches[0];
                            (e.currentTarget as any).startX = touch.clientX;
                            (e.currentTarget as any).currentX = touch.clientX;
                        }}
                        onTouchMove={(e) => {
                            const touch = e.touches[0];
                            (e.currentTarget as any).currentX = touch.clientX;
                            const diff = (e.currentTarget as any).startX - touch.clientX;
                            const imgEl = e.currentTarget.querySelector('img');
                            if (imgEl) {
                                imgEl.style.transform = `translateX(${-diff * 0.3}px)`;
                            }
                        }}
                        onTouchEnd={(e) => {
                            const startX = (e.currentTarget as any).startX || 0;
                            const endX = e.changedTouches[0].clientX;
                            const diff = startX - endX;
                            const imgEl = e.currentTarget.querySelector('img');

                            // 이미지가 1개면 무시
                            if (galleryImages.length <= 1) {
                                if (imgEl) {
                                    imgEl.style.transition = 'transform 0.2s ease-out';
                                    imgEl.style.transform = 'translateX(0)';
                                }
                                return;
                            }

                            if (Math.abs(diff) > 50) {
                                // 현재 이미지가 나가는 방향 (스와이프 방향으로)
                                const direction = diff > 0 ? -100 : 100;
                                if (imgEl) {
                                    imgEl.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
                                    imgEl.style.transform = `translateX(${direction}%)`;
                                    imgEl.style.opacity = '0';
                                }

                                setTimeout(() => {
                                    // 인덱스 업데이트 (순환 포함)
                                    if (diff > 0) {
                                        setSelectedImageIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0);
                                    } else {
                                        setSelectedImageIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1);
                                    }
                                    if (imgEl) {
                                        // 새 이미지가 반대편에서 들어옴 (방향 반대)
                                        imgEl.style.transition = 'none';
                                        imgEl.style.transform = `translateX(${-direction}%)`;
                                        imgEl.style.opacity = '0';
                                        requestAnimationFrame(() => {
                                            imgEl.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
                                            imgEl.style.transform = 'translateX(0)';
                                            imgEl.style.opacity = '1';
                                        });
                                    }
                                }, 80);
                            } else {
                                if (imgEl) {
                                    imgEl.style.transition = 'transform 0.2s ease-out';
                                    imgEl.style.transform = 'translateX(0)';
                                }
                            }
                        }}
                        // 🖱️ 마우스 드래그 이벤트 (PC)
                        onMouseDown={(e) => {
                            e.preventDefault();
                            (e.currentTarget as any).isDragging = true;
                            (e.currentTarget as any).startX = e.clientX;
                            (e.currentTarget as any).style.cursor = 'grabbing';
                        }}
                        onMouseMove={(e) => {
                            if (!(e.currentTarget as any).isDragging) return;
                            const diff = (e.currentTarget as any).startX - e.clientX;
                            const imgEl = e.currentTarget.querySelector('img');
                            if (imgEl) {
                                imgEl.style.transform = `translateX(${-diff * 0.3}px)`;
                            }
                        }}
                        onMouseUp={(e) => {
                            if (!(e.currentTarget as any).isDragging) return;
                            (e.currentTarget as any).isDragging = false;
                            (e.currentTarget as any).style.cursor = 'grab';

                            const startX = (e.currentTarget as any).startX || 0;
                            const diff = startX - e.clientX;
                            const imgEl = e.currentTarget.querySelector('img');

                            // 이미지가 1개면 무시
                            if (galleryImages.length <= 1) {
                                if (imgEl) {
                                    imgEl.style.transition = 'transform 0.2s ease-out';
                                    imgEl.style.transform = 'translateX(0)';
                                }
                                return;
                            }

                            if (Math.abs(diff) > 50) {
                                const direction = diff > 0 ? -100 : 100;
                                if (imgEl) {
                                    imgEl.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
                                    imgEl.style.transform = `translateX(${direction}%)`;
                                    imgEl.style.opacity = '0';
                                }

                                setTimeout(() => {
                                    if (diff > 0) {
                                        setSelectedImageIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0);
                                    } else {
                                        setSelectedImageIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1);
                                    }
                                    if (imgEl) {
                                        // 새 이미지가 반대편에서 들어옴
                                        imgEl.style.transition = 'none';
                                        imgEl.style.transform = `translateX(${-direction}%)`;
                                        imgEl.style.opacity = '0';
                                        requestAnimationFrame(() => {
                                            imgEl.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
                                            imgEl.style.transform = 'translateX(0)';
                                            imgEl.style.opacity = '1';
                                        });
                                    }
                                }, 80);
                            } else {
                                if (imgEl) {
                                    imgEl.style.transition = 'transform 0.2s ease-out';
                                    imgEl.style.transform = 'translateX(0)';
                                }
                            }
                        }}
                        onMouseLeave={(e) => {
                            if ((e.currentTarget as any).isDragging) {
                                (e.currentTarget as any).isDragging = false;
                                (e.currentTarget as any).style.cursor = 'grab';
                                const imgEl = e.currentTarget.querySelector('img');
                                if (imgEl) {
                                    imgEl.style.transition = 'transform 0.2s ease-out';
                                    imgEl.style.transform = 'translateX(0)';
                                }
                            }
                        }}
                    >
                        <Image
                            src={getSingleFacilityImageUrl(galleryImages[selectedImageIndex])}
                            fit="contain"
                            h="80vh"
                            w="100%"
                            alt={`${facility.name} 사진 ${selectedImageIndex + 1}`}
                            style={{
                                transition: 'transform 0.25s ease-out, opacity 0.25s ease-out',
                                pointerEvents: 'none', // 이미지 드래그 방지
                            }}
                        />
                    </Box>

                    {/* 하단 dot indicator (PC만) */}
                    {!isMobile && (
                        <Box
                            pos="absolute"
                            bottom={40}
                            left={0}
                            w="100%"
                            style={{ zIndex: 10000 }}
                        >
                            <Group justify="center" gap={8}>
                                {galleryImages.map((_, idx) => (
                                    <Box
                                        key={idx}
                                        w={idx === selectedImageIndex ? 10 : 8}
                                        h={idx === selectedImageIndex ? 10 : 8}
                                        style={{
                                            borderRadius: '50%',
                                            backgroundColor: idx === selectedImageIndex ? 'white' : 'rgba(255,255,255,0.4)',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImageIndex(idx);
                                        }}
                                    />
                                ))}
                            </Group>
                        </Box>
                    )}

                    {/* 좌우 네비게이션 (PC만) */}
                    {!isMobile && galleryImages.length > 1 && (
                        <>
                            <ActionIcon
                                variant="transparent"
                                c="white"
                                size="xl"
                                pos="absolute"
                                left={20}
                                top="50%"
                                style={{ transform: 'translateY(-50%)', zIndex: 10000 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex(prev => prev > 0 ? prev - 1 : galleryImages.length - 1);
                                }}
                            >
                                <ChevronLeft size={40} />
                            </ActionIcon>
                            <ActionIcon
                                variant="transparent"
                                c="white"
                                size="xl"
                                pos="absolute"
                                right={20}
                                top="50%"
                                style={{ transform: 'translateY(-50%)', zIndex: 10000 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImageIndex(prev => prev < galleryImages.length - 1 ? prev + 1 : 0);
                                }}
                            >
                                <ChevronRight size={40} />
                            </ActionIcon>
                        </>
                    )}
                </Box>
            )}
            {/* Review Write Panel (HogangNono Style - Slide Panel) */}
            {
                reviewModalOpened && (
                    <Paper
                        shadow="xl"
                        radius={0}
                        style={{
                            position: 'fixed', // Fixed to escape parent overflow
                            top: 0,
                            left: isMobile ? 0 : 400, // Desktop: Start after the 400px sidebar
                            width: isMobile ? '100%' : '400px',
                            height: '100dvh', // Use dynamic viewport height for mobile
                            zIndex: 9999, // Above map and other elements
                            backgroundColor: 'white',
                            borderLeft: isMobile ? 'none' : '1px solid #e9ecef',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'left 0.3s ease' // Smooth transition
                        }}
                    >
                        <LoadingOverlay visible={isSubmitting} />

                        {/* Header */}
                        <Box px="md" h={56} style={{ borderBottom: '1px solid #f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
                            <ActionIcon variant="transparent" c="black" onClick={closeReviewModal} style={{ zIndex: 1 }}>
                                <X size={24} />
                            </ActionIcon>

                            <Text size="md" fw={700} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 0 }}>
                                글쓰기
                            </Text>

                            <Button
                                variant="light"
                                color="brand"
                                c="brand.8"
                                size="sm"
                                radius="md"
                                fw={700}
                                onClick={handleSubmitReview}
                                disabled={!reviewForm.content.trim()}
                                style={{ zIndex: 1, backgroundColor: 'var(--mantine-color-brand-0)', border: 'none' }}
                            >
                                등록
                            </Button>
                        </Box>

                        {/* Content */}
                        <Box p="md" style={{ flex: 1, overflowY: 'auto' }}>
                            {/* Disclaimer Box */}
                            <Paper p="sm" radius="md" mb="lg" bg="#f1f3f5">
                                <Text size="xs" c="gray.7" style={{ lineHeight: 1.5, wordBreak: 'keep-all' }}>
                                    다른 사람을 비방하거나, 타인에게 불쾌감을 유발하는 부적절한 표현, 영리 목적의 광고는 삼가해주세요.
                                </Text>
                                <Text size="xs" c="dimmed" style={{ textDecoration: 'underline', marginTop: 6, cursor: 'pointer' }}>
                                    운영 정책 보기
                                </Text>
                            </Paper>

                            {/* Facility Name Dropdown */}
                            <Group justify="space-between" mb="xl" style={{ cursor: 'pointer' }}>
                                <Text fw={600} size="md">시설: {facility.name}</Text>
                                <ChevronDown size={20} color="#adb5bd" />
                            </Group>

                            {/* Hidden Rating Field */}
                            <Box mb="lg" style={{ display: 'none' }}>
                                <Rating value={reviewForm.rating} onChange={(v) => setReviewForm({ ...reviewForm, rating: v })} />
                            </Box>

                            {/* Photo Add Button (Square with border) */}
                            <Box mb="lg">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoChange}
                                />
                                <Group gap="xs" align="flex-start">
                                    <Button
                                        variant="outline"
                                        color="gray.4"
                                        w={80} h={80}
                                        radius="md"
                                        bg="white"
                                        style={{
                                            border: '1px solid #dee2e6',
                                            flexDirection: 'column',
                                            gap: 4,
                                            height: '80px',
                                            padding: 0,
                                            flexShrink: 0,
                                            color: '#868e96'
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera size={24} strokeWidth={1.5} />
                                        <Text size="xs" fw={400}>
                                            {reviewForm.photos.length}/5
                                        </Text>
                                    </Button>

                                    {/* Photo Previews */}
                                    {reviewForm.photos.map((photo, idx) => (
                                        <Box key={idx} pos="relative" w={80} h={80}>
                                            <Image src={photo} w={80} h={80} radius="md" style={{ objectFit: 'cover', border: '1px solid #dee2e6' }} />
                                            <ActionIcon
                                                size="xs" radius="xl" color="dark" variant="filled"
                                                style={{ position: 'absolute', top: -6, right: -6 }}
                                                onClick={() => removePhoto(idx)}
                                            >
                                                <X size={10} />
                                            </ActionIcon>
                                        </Box>
                                    ))}
                                </Group>
                            </Box>

                            {/* Text Input */}
                            <Textarea
                                placeholder="솔직한 후기를 남겨주세요."
                                variant="unstyled"
                                size="md"
                                autosize
                                minRows={10}
                                value={reviewForm.content}
                                onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                                styles={{
                                    input: {
                                        padding: 0,
                                        fontSize: '16px',
                                        color: '#343a40',
                                        '::placeholder': { color: '#adb5bd' }
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                )
            }
        </Box >
    );
}


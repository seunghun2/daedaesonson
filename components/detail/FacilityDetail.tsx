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

    // 3. Min Price Calculation
    const getMinPrice = (items: any[]) => {
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
                이 명당의 시설사용료
            </Text>

            <Accordion
                variant="default"
                radius="md"
                defaultValue={displayGroups[0]?.label}
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
                    시설사용료는 <b>e하늘 장사정보 시스템</b>에 등록되어 있는 가격정보를 바탕으로 안내해드리고 있어 상이할 수 있습니다.<br />
                    사용료 정보가 안내되지 않은 시설은 <b>명당에 직접 문의</b>바랍니다.
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

    return (
        <Box
            style={{ backgroundColor: '#f8f9fa', height: '100%', position: 'relative', overflowY: 'auto', touchAction: 'pan-y' }}
            onTouchStart={(e) => e.stopPropagation()} // 🚀 지도 터치 간섭 방지
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
            {hasPrice ? (
                <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                    <Text size="sm" c="gray.6" mb={8} fw={500}>예상 이용 비용</Text>
                    <Group align="flex-end" gap="xs">
                        <Text style={{ fontSize: '28px', fontWeight: 800, color: 'var(--mantine-color-brand-8)', lineHeight: 1, fontFamily: 'Pretendard' }}>
                            {formatKoreanCurrency(facility.priceRange.min * 10000)}~
                        </Text>
                    </Group>
                    <Text size="xs" c="dimmed" mt={8}>
                        ※ 실제 비용은 선택 옵션에 따라 달라질 수 있습니다.
                    </Text>
                </Box>
            ) : (
                <Box bg="white" p="md" style={{ borderBottom: '8px solid #f8f9fa' }}>
                    <Text size="lg" fw={700} c="gray.6">전화 문의 필요</Text>
                </Box>
            )}

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
            <Box bg="white" p="md" pb={100} style={{ borderBottom: '8px solid #f8f9fa' }}>
                <Group justify="space-between" mb="md">
                    <Text size="sm" fw={700}>위치 및 교통</Text>
                    {/* 홈페이지 버튼 (우측 상단) */}
                    {facility.homepageUrl && (
                        <Button
                            component="a"
                            href={facility.homepageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline"
                            color="gray"
                            size="xs"
                            radius="xl"
                            leftSection={<Globe size={14} />}
                            styles={{
                                root: { height: 28, borderColor: '#dee2e6' },
                                label: { color: '#495057', fontWeight: 600 }
                            }}
                        >
                            홈페이지
                        </Button>
                    )}
                </Group>

                <Box style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e9ecef', height: 200, marginBottom: 16, position: 'relative' }}>
                    <Image
                        src={`https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=600&h=400&center=${facility.coordinates.lng},${facility.coordinates.lat}&level=15&scale=2&markers=type:d|size:mid|pos:${facility.coordinates.lng} ${facility.coordinates.lat}&clientID=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
                        h="100%"
                        w="100%"
                        fit="cover"
                        alt="Map"
                    />
                    <Box
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '12px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}
                    >
                        <Button
                            size="xs"
                            variant="white"
                            color="dark"
                            leftSection={<Navigation size={14} />}
                            onClick={() => {
                                const url = `nmap://route/car?dlat=${facility.coordinates.lat}&dlng=${facility.coordinates.lng}&dname=${encodeURIComponent(facility.name)}&appname=com.daedaesonson.app`;
                                window.location.href = url;
                            }}
                        >
                            길찾기
                        </Button>
                    </Box>
                </Box>

                <Group align="flex-start" gap="xs">
                    <Box mt={4}><Navigation size={16} color="#868e96" /></Box>
                    <Box>
                        <Text size="sm" fw={600} c="dark.9">{facility.address}</Text>
                        <Text size="xs" c="dimmed" mt={2}>지번: {facility.address}</Text>
                        {/* 지번 데이터가 없으므로 도로명과 동일하게 표시하거나 생략 */}
                    </Box>
                </Group>
            </Box>

            {/* 하단 고정 버튼 (문의하기) */}
            <Paper
                shadow="sm"
                p="md"
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    borderTop: '1px solid #e9ecef'
                }}
            >
                <Group grow>
                    <Button
                        size="lg"
                        color="brand.8" // Deep Indigo
                        component="a"
                        href={`tel:${phoneNumber.replace(/[^0-9]/g, '')}`}
                        leftSection={<span className="material-symbols-outlined">call</span>}
                        styles={{
                            root: { height: 52 },
                            label: { fontSize: '17px', fontWeight: 700 }
                        }}
                    >
                        전화 상담하기
                    </Button>
                </Group>
            </Paper>

            {/* 🖼️ [호갱노노 스타일] 프리미엄 이미지 뷰어 */}
            {opened && (
                <Box
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)', // 더 짙은 검정 (사진 집중)
                        display: 'flex',
                        flexDirection: 'column',
                        backdropFilter: 'blur(5px)' // 고급스러운 블러 처리
                    }}
                >
                    {/* 뷰어 헤더 (우측 상단 아이콘) */}
                    <Group justify="space-between" align="center" style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', zIndex: 10000 }}>
                        {/* 페이지 카운터 */}
                        <Text c="white" size="sm" fw={500}>
                            {selectedImageIndex + 1} / {galleryImages.length}
                        </Text>

                        <Group gap="xs">
                            <ActionIcon variant="transparent" color="white" size="lg" onClick={() => alert('확대/축소 기능 준비중')}>
                                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>search</span>
                            </ActionIcon>
                            <ActionIcon variant="transparent" color="white" size="lg" onClick={() => setOpened(false)}>
                                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>close</span>
                            </ActionIcon>
                        </Group>
                    </Group>

                    {/* 메인 이미지 영역 (Pinch Zoom & Drag 지원 예정) */}
                    <Box
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            width: '100%',
                            height: '100%'
                        }}
                        onClick={() => setOpened(false)} // 배경 클릭 시 닫기
                    >
                        <Image
                            src={getSingleFacilityImageUrl(galleryImages[selectedImageIndex])}
                            alt="Full View"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                width: 'auto',
                                height: 'auto',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                transition: 'transform 0.2s ease'
                            }}
                            onClick={(e) => {
                                e.stopPropagation(); // 이미지 클릭 시 닫기 방지 (확대 등 동작 위해)
                            }}
                        />

                        {/* 좌우 네비게이션 (데스크탑용, 모바일은 스와이프) */}
                        {!isMobile && selectedImageIndex > 0 && (
                            <ActionIcon
                                variant="transparent" color="white" size="xl"
                                style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }}
                                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev - 1); }}
                            >
                                <ChevronLeft size={48} />
                            </ActionIcon>
                        )}
                        {!isMobile && selectedImageIndex < galleryImages.length - 1 && (
                            <ActionIcon
                                variant="transparent" color="white" size="xl"
                                style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)' }}
                                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => prev + 1); }}
                            >
                                <ChevronRight size={48} />
                            </ActionIcon>
                        )}
                    </Box>

                    {/* 하단 썸네일 스트립 (선택사항, 깔끔함을 위해 제외 가능) */}
                </Box>
            )}

            {/* 리뷰 작성 모달 */}
            <Modal opened={reviewModalOpened} onClose={closeReviewModal} title="리뷰 작성" centered zIndex={2000}>
                <Box>
                    <Group mb="md">
                        <Text fw={700}>별점</Text>
                        <Rating value={reviewForm.rating} onChange={(v) => setReviewForm({ ...reviewForm, rating: v })} size="lg" />
                    </Group>

                    <TextInput
                        label="작성자"
                        placeholder="이름 (익명 가능)"
                        mb="sm"
                        value={reviewForm.author}
                        onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })}
                    />
                    <TextInput
                        label="비밀번호"
                        type="password"
                        placeholder="나중에 수정/삭제할 때 필요해요"
                        mb="md"
                        value={reviewForm.password}
                        onChange={(e) => setReviewForm({ ...reviewForm, password: e.target.value })}
                    />

                    <Group mb="xs" justify="space-between">
                        <Text fw={700}>사진 첨부 (최대 5장)</Text>
                        <Group>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handlePhotoChange}
                            />
                            <ActionIcon variant="subtle" color="gray" onClick={() => fileInputRef.current?.click()}>
                                <Camera size={20} />
                            </ActionIcon>
                        </Group>
                    </Group>

                    {/* Photo Previews */}
                    <Box mb="md" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
                        <Group gap="xs">
                            {reviewForm.photos.map((photo, idx) => (
                                <Box key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                                    <Image
                                        src={photo}
                                        w={80}
                                        h={80}
                                        radius="md"
                                        style={{ objectFit: 'cover' }}
                                    />
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
                        variant="default" // unstyled -> default for better visibility
                        size="md"
                        autosize
                        minRows={4}
                        value={reviewForm.content}
                        onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                    />

                    <Group justify="flex-end" mt="xl">
                        <Button variant="default" onClick={closeReviewModal}>취소</Button>
                        <Button color="brand" loading={isSubmitting} onClick={handleSubmitReview}>
                            등록하기
                        </Button>
                    </Group>
                </Box>
            </Modal>
        </Box>
    );
}

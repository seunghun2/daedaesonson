'use client';

import { useState, useEffect, useRef } from 'react';
import { Title, Table, Badge, ActionIcon, Paper, Text, Group, TextInput, Modal, Button, Stack, LoadingOverlay, Card, Image as MantineImage, Box, Textarea, Divider } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Search, Trash, Eye, Star, Image as ImageIcon, MessageCircle, X, Send } from 'lucide-react';

interface Reply {
    id: string;
    reviewId: string;
    author: string;
    content: string;
    photos: string[];
    createdAt: string;
}

interface Review {
    id: string;
    facilityId: string;
    facilityName: string;
    author: string;
    content: string;
    rating: number;
    photos: string[];
    likes: number;
    createdAt: string;
    replies: Reply[];
}

export default function ReviewsAdminPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
    const isMobile = useMediaQuery('(max-width: 768px)', undefined, { getInitialValueInEffect: true });

    // 대댓글 작성 상태
    const [replyContent, setReplyContent] = useState('');
    const [replyPhotos, setReplyPhotos] = useState<string[]>([]);
    const [replySubmitting, setReplySubmitting] = useState(false);
    const replyFileRef = useRef<HTMLInputElement>(null);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/reviews');
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const filtered = reviews.filter(r =>
        r.author.toLowerCase().includes(search.toLowerCase()) ||
        r.content.toLowerCase().includes(search.toLowerCase()) ||
        r.facilityId.toLowerCase().includes(search.toLowerCase()) ||
        r.facilityName.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 후기를 삭제하시겠습니까?')) return;
        try {
            const res = await fetch('/api/admin/reviews', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId: id })
            });
            if (res.ok) {
                setReviews(prev => prev.filter(r => r.id !== id));
                if (selectedReview?.id === id) closeDetail();
                alert('삭제되었습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    const handleView = (review: Review) => {
        setSelectedReview(review);
        setReplyContent('');
        setReplyPhotos([]);
        openDetail();
    };

    // 대댓글 작성
    const handleSubmitReply = async () => {
        if (!selectedReview || !replyContent.trim()) return;
        setReplySubmitting(true);
        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId: selectedReview.facilityId,
                    reviewId: selectedReview.id,
                    action: 'REPLY',
                    content: replyContent,
                    photos: replyPhotos,
                    author: '관리자',
                    isAdmin: true
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newReply: Reply = {
                    id: data.reply?.id || `rep-${Date.now()}`,
                    reviewId: selectedReview.id,
                    author: '관리자',
                    content: replyContent,
                    photos: replyPhotos,
                    createdAt: new Date().toISOString()
                };

                // 로컬 상태 업데이트
                setReviews(prev => prev.map(r => {
                    if (r.id === selectedReview.id) {
                        return { ...r, replies: [...(r.replies || []), newReply] };
                    }
                    return r;
                }));
                setSelectedReview(prev => prev ? { ...prev, replies: [...(prev.replies || []), newReply] } : prev);
                setReplyContent('');
                setReplyPhotos([]);
            } else {
                alert('대댓글 등록에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('대댓글 등록 중 오류가 발생했습니다.');
        } finally {
            setReplySubmitting(false);
        }
    };

    // 대댓글 삭제
    const handleDeleteReply = async (reviewId: string, replyId: string) => {
        if (!confirm('이 답글을 삭제하시겠습니까?')) return;
        try {
            const res = await fetch('/api/reviews/interact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewId,
                    replyId,
                    action: 'DELETE_REPLY',
                    isAdmin: true
                })
            });
            if (res.ok) {
                setReviews(prev => prev.map(r => {
                    if (r.id === reviewId) {
                        return { ...r, replies: (r.replies || []).filter(rep => rep.id !== replyId) };
                    }
                    return r;
                }));
                setSelectedReview(prev => prev ? { ...prev, replies: (prev.replies || []).filter(rep => rep.id !== replyId) } : prev);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // 대댓글 이미지 업로드
    const handleReplyPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (replyPhotos.length + files.length > 3) {
            alert('이미지는 최대 3장까지 첨부할 수 있습니다.');
            return;
        }
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                setReplyPhotos(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const renderStars = (rating: number) => {
        return (
            <Group gap={2}>
                {[1, 2, 3, 4, 5].map(s => (
                    <Star
                        key={s}
                        size={14}
                        color={s <= rating ? '#fbbf24' : '#dee2e6'}
                        fill={s <= rating ? '#fbbf24' : 'none'}
                        strokeWidth={1.5}
                    />
                ))}
            </Group>
        );
    };

    // 평균 별점
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    return (
        <div>
            <Group justify="space-between" mb="lg" wrap="wrap">
                <Title order={isMobile ? 3 : 2}>방문후기 관리</Title>
                <Group gap="xs">
                    <Badge size="lg" variant="light" color="yellow" leftSection={<Star size={12} fill="#fbbf24" color="#fbbf24" />}>
                        평균 {avgRating}
                    </Badge>
                    <Badge size="lg" variant="light" color="blue">
                        총 {reviews.length}건
                    </Badge>
                </Group>
            </Group>

            <Paper p="sm" radius="md" withBorder mb="md">
                <TextInput
                    placeholder="닉네임, 내용, 시설명 검색..."
                    leftSection={<Search size={16} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    styles={{ input: { fontSize: '16px' } }}
                />
            </Paper>

            {/* 모바일: 카드 뷰 */}
            {isMobile ? (
                <Stack gap="sm" pos="relative">
                    <LoadingOverlay visible={loading} />
                    {filtered.length > 0 ? (
                        filtered.map((review) => (
                            <Card key={review.id} p="sm" radius="md" withBorder onClick={() => handleView(review)} style={{ cursor: 'pointer' }}>
                                <Group justify="space-between" mb={4}>
                                    <Group gap={6}>
                                        {renderStars(review.rating)}
                                        {review.photos?.length > 0 && (
                                            <Badge size="xs" variant="light" color="gray" leftSection={<ImageIcon size={10} />}>
                                                {review.photos.length}
                                            </Badge>
                                        )}
                                        {review.replies?.length > 0 && (
                                            <Badge size="xs" variant="light" color="teal" leftSection={<MessageCircle size={10} />}>
                                                {review.replies.length}
                                            </Badge>
                                        )}
                                    </Group>
                                    <ActionIcon variant="subtle" color="red" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(review.id); }}>
                                        <Trash size={14} />
                                    </ActionIcon>
                                </Group>
                                <Text size="sm" fw={600} mb={2}>{review.author}</Text>
                                <Text size="xs" c="dimmed" lineClamp={2} mb={4}>{review.content}</Text>
                                <Group justify="space-between">
                                    <Text size="xs" c="blue">{review.facilityName}</Text>
                                    <Text size="xs" c="dimmed">
                                        {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                                    </Text>
                                </Group>
                            </Card>
                        ))
                    ) : (
                        !loading && <Text c="dimmed" ta="center" py="xl">등록된 후기가 없습니다.</Text>
                    )}
                </Stack>
            ) : (
                /* PC: 테이블 뷰 */
                <Paper radius="md" withBorder style={{ overflow: 'hidden', position: 'relative' }}>
                    <LoadingOverlay visible={loading} />
                    <Table verticalSpacing="sm" striped highlightOnHover>
                        <Table.Thead bg="gray.1">
                            <Table.Tr>
                                <Table.Th>시설명</Table.Th>
                                <Table.Th>닉네임</Table.Th>
                                <Table.Th>별점</Table.Th>
                                <Table.Th>내용</Table.Th>
                                <Table.Th>답글</Table.Th>
                                <Table.Th>좋아요</Table.Th>
                                <Table.Th>날짜</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>관리</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.length > 0 ? (
                                filtered.map((review) => (
                                    <Table.Tr key={review.id}>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{review.facilityName}</Text>
                                            <Text size="xs" c="dimmed">{review.facilityId}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" fw={500}>{review.author}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {renderStars(review.rating)}
                                        </Table.Td>
                                        <Table.Td style={{ maxWidth: 300 }}>
                                            <Text size="sm" lineClamp={2}>{review.content}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {review.replies?.length > 0 ? (
                                                <Badge variant="light" color="teal" size="sm" leftSection={<MessageCircle size={10} />}>
                                                    {review.replies.length}
                                                </Badge>
                                            ) : (
                                                <Text size="xs" c="dimmed">—</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" color="pink" size="sm">♥ {review.likes}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs" c="dimmed">
                                                {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td align="right">
                                            <Group gap="xs" justify="flex-end">
                                                <ActionIcon variant="subtle" color="blue" onClick={() => handleView(review)}>
                                                    <Eye size={16} />
                                                </ActionIcon>
                                                <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(review.id)}>
                                                    <Trash size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={8} align="center" py="xl">
                                        {!loading && <Text c="dimmed">등록된 후기가 없습니다.</Text>}
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Paper>
            )}

            {/* 상세 모달 */}
            <Modal
                opened={detailOpened}
                onClose={closeDetail}
                title="후기 상세"
                size={isMobile ? 'full' : 'lg'}
                fullScreen={isMobile}
            >
                {selectedReview && (
                    <Stack>
                        <Group justify="space-between" wrap="wrap">
                            <Group gap="sm">
                                <Text size="lg" fw={700}>{selectedReview.author}</Text>
                                {renderStars(selectedReview.rating)}
                            </Group>
                            <Badge variant="light" color="pink">♥ {selectedReview.likes}</Badge>
                        </Group>

                        <Group gap="xs">
                            <Badge variant="light" color="blue" size="sm">{selectedReview.facilityName}</Badge>
                            <Text size="xs" c="dimmed">{selectedReview.facilityId}</Text>
                        </Group>

                        <Text size="xs" c="dimmed">
                            {new Date(selectedReview.createdAt).toLocaleString('ko-KR')}
                        </Text>

                        <Paper p="md" bg="gray.0" radius="md">
                            <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedReview.content}</Text>
                        </Paper>

                        {/* 사진 */}
                        {selectedReview.photos?.length > 0 && (
                            <Stack gap="xs">
                                <Text size="sm" fw={600}>첨부 사진</Text>
                                <Group gap="sm">
                                    {selectedReview.photos.map((photo, idx) => (
                                        <MantineImage
                                            key={idx}
                                            src={photo}
                                            w={120}
                                            h={120}
                                            radius="md"
                                            style={{ objectFit: 'cover', border: '1px solid #dee2e6' }}
                                        />
                                    ))}
                                </Group>
                            </Stack>
                        )}

                        <Divider my="sm" />

                        {/* 대댓글 섹션 */}
                        <Box>
                            <Group gap="xs" mb="sm">
                                <MessageCircle size={16} />
                                <Text size="sm" fw={700}>답글 ({selectedReview.replies?.length || 0})</Text>
                            </Group>

                            {/* 대댓글 목록 */}
                            {selectedReview.replies?.length > 0 ? (
                                <Stack gap="xs" mb="md">
                                    {selectedReview.replies.map((reply) => (
                                        <Paper key={reply.id} p="sm" bg="gray.0" radius="md" withBorder>
                                            <Group justify="space-between" mb={4}>
                                                <Group gap="xs">
                                                    <Badge size="xs" variant="filled" color="teal">{reply.author}</Badge>
                                                    <Text size="xs" c="dimmed">
                                                        {new Date(reply.createdAt).toLocaleString('ko-KR')}
                                                    </Text>
                                                </Group>
                                                <ActionIcon variant="subtle" color="red" size="xs" onClick={() => handleDeleteReply(selectedReview.id, reply.id)}>
                                                    <Trash size={12} />
                                                </ActionIcon>
                                            </Group>
                                            <Text size="sm">{reply.content}</Text>
                                            {reply.photos?.length > 0 && (
                                                <Group gap={6} mt="xs">
                                                    {reply.photos.map((photo, idx) => (
                                                        <MantineImage
                                                            key={idx}
                                                            src={photo}
                                                            w={80}
                                                            h={80}
                                                            radius="sm"
                                                            style={{ objectFit: 'cover', border: '1px solid #dee2e6' }}
                                                        />
                                                    ))}
                                                </Group>
                                            )}
                                        </Paper>
                                    ))}
                                </Stack>
                            ) : (
                                <Text size="sm" c="dimmed" mb="md">아직 답글이 없습니다.</Text>
                            )}

                            {/* 대댓글 작성 */}
                            <Paper p="sm" radius="md" withBorder style={{ border: '1px solid #e9ecef' }}>
                                <Textarea
                                    placeholder="관리자 답글을 입력하세요..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.currentTarget.value)}
                                    minRows={2}
                                    autosize
                                    variant="unstyled"
                                    styles={{ input: { fontSize: '14px' } }}
                                />

                                {/* 이미지 미리보기 */}
                                {replyPhotos.length > 0 && (
                                    <Group gap={6} mt="xs">
                                        {replyPhotos.map((photo, idx) => (
                                            <Box key={idx} pos="relative">
                                                <MantineImage src={photo} w={60} h={60} radius="sm" style={{ objectFit: 'cover', border: '1px solid #dee2e6' }} />
                                                <ActionIcon
                                                    variant="filled"
                                                    color="dark"
                                                    size={16}
                                                    radius="xl"
                                                    pos="absolute"
                                                    top={2}
                                                    right={2}
                                                    onClick={() => setReplyPhotos(prev => prev.filter((_, i) => i !== idx))}
                                                >
                                                    <X size={10} />
                                                </ActionIcon>
                                            </Box>
                                        ))}
                                    </Group>
                                )}

                                <Group justify="space-between" mt="xs">
                                    <Group gap={4}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            ref={replyFileRef}
                                            style={{ display: 'none' }}
                                            onChange={handleReplyPhotoUpload}
                                        />
                                        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => replyFileRef.current?.click()}>
                                            <ImageIcon size={16} />
                                        </ActionIcon>
                                        <Text size="xs" c="dimmed">{replyPhotos.length}/3</Text>
                                    </Group>
                                    <Button
                                        size="xs"
                                        variant="filled"
                                        color="teal"
                                        radius="xl"
                                        leftSection={<Send size={12} />}
                                        onClick={handleSubmitReply}
                                        disabled={!replyContent.trim()}
                                        loading={replySubmitting}
                                    >
                                        답글 등록
                                    </Button>
                                </Group>
                            </Paper>
                        </Box>

                        <Divider my="xs" />

                        <Group>
                            {isMobile && (
                                <Button variant="light" color="gray" onClick={closeDetail} flex={1}>
                                    닫기
                                </Button>
                            )}
                            <Button
                                color="red"
                                variant="light"
                                leftSection={<Trash size={16} />}
                                onClick={() => handleDelete(selectedReview.id)}
                                flex={1}
                            >
                                삭제
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import {
    Box, Text, Button, Group, Table, Badge, ActionIcon, Modal, TextInput,
    Textarea, Switch, Select, TagsInput, Stack, Loader, Center, Paper, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Plus, Edit, Trash2, Eye, ExternalLink } from 'lucide-react';

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
    is_published: boolean;
    view_count: number;
    created_at: string;
    updated_at: string;
}

const CATEGORIES = [
    { value: '봉안당 가이드', label: '봉안당 가이드' },
    { value: '수목장 가이드', label: '수목장 가이드' },
    { value: '비용 안내', label: '비용 안내' },
    { value: '장례 절차', label: '장례 절차' },
    { value: '시설 리뷰', label: '시설 리뷰' },
    { value: '가이드', label: '가이드' },
    { value: '공지사항', label: '공지사항' },
];

const defaultPost: Partial<BlogPost> = {
    title: '',
    slug: '',
    category: '가이드',
    excerpt: '',
    content: '',
    thumbnail_url: '',
    author: '대대손손',
    tags: [],
    is_published: false,
};

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost>>(defaultPost);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/blog');
            const data = await res.json();
            setPosts(data.posts || []);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingPost({ ...defaultPost });
        setIsEditing(false);
        open();
    };

    const handleEdit = (post: BlogPost) => {
        setEditingPost({ ...post });
        setIsEditing(true);
        open();
    };

    const handleSave = async () => {
        if (!editingPost.title || !editingPost.slug || !editingPost.content) {
            alert('제목, 슬러그, 본문은 필수입니다.');
            return;
        }

        setSaving(true);
        try {
            const url = isEditing
                ? `/api/admin/blog/${editingPost.id}`
                : '/api/admin/blog';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPost),
            });

            if (res.ok) {
                close();
                fetchPosts();
            } else {
                const err = await res.json();
                alert(`저장 실패: ${err.error}`);
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchPosts();
                setDeleteConfirm(null);
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleTogglePublish = async (post: BlogPost) => {
        try {
            await fetch(`/api/admin/blog/${post.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_published: !post.is_published }),
            });
            fetchPosts();
        } catch (error) {
            console.error('Toggle publish error:', error);
        }
    };

    // 제목에서 자동 슬러그 생성
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^가-힣a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
        <Box>
            {/* 헤더 */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Text fw={700} size="xl">블로그 관리</Text>
                    <Text size="sm" c="dimmed">가이드 글 작성 및 관리</Text>
                </div>
                <Button leftSection={<Plus size={16} />} onClick={handleNew} color="violet">
                    새 글 작성
                </Button>
            </Group>

            {/* 통계 카드 */}
            <Group mb="lg" gap="md">
                <Paper p="md" radius="md" withBorder style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">전체 글</Text>
                    <Text fw={700} size="xl">{posts.length}</Text>
                </Paper>
                <Paper p="md" radius="md" withBorder style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">발행됨</Text>
                    <Text fw={700} size="xl" c="green">{posts.filter(p => p.is_published).length}</Text>
                </Paper>
                <Paper p="md" radius="md" withBorder style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">임시저장</Text>
                    <Text fw={700} size="xl" c="orange">{posts.filter(p => !p.is_published).length}</Text>
                </Paper>
                <Paper p="md" radius="md" withBorder style={{ flex: 1 }}>
                    <Text size="xs" c="dimmed">총 조회수</Text>
                    <Text fw={700} size="xl">{posts.reduce((sum, p) => sum + (p.view_count || 0), 0).toLocaleString()}</Text>
                </Paper>
            </Group>

            {/* 글 테이블 */}
            {loading ? (
                <Center h={200}>
                    <Loader />
                </Center>
            ) : posts.length === 0 ? (
                <Center h={200}>
                    <Stack align="center">
                        <Text c="dimmed">아직 작성된 글이 없습니다.</Text>
                        <Button onClick={handleNew} variant="light" color="violet">첫 글 작성하기</Button>
                    </Stack>
                </Center>
            ) : (
                <Table.ScrollContainer minWidth={700}>
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>상태</Table.Th>
                                <Table.Th>제목</Table.Th>
                                <Table.Th>카테고리</Table.Th>
                                <Table.Th>조회수</Table.Th>
                                <Table.Th>작성일</Table.Th>
                                <Table.Th>관리</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {posts.map(post => (
                                <Table.Tr key={post.id}>
                                    <Table.Td>
                                        <Badge
                                            color={post.is_published ? 'green' : 'gray'}
                                            variant="light"
                                            size="sm"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleTogglePublish(post)}
                                        >
                                            {post.is_published ? '발행' : '임시'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={500} size="sm" lineClamp={1} style={{ maxWidth: 300 }}>
                                            {post.title}
                                        </Text>
                                        <Text size="xs" c="dimmed">/guide/{post.slug}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="outline" size="xs">{post.category}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <Eye size={12} />
                                            <Text size="sm">{(post.view_count || 0).toLocaleString()}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed">{formatDate(post.created_at)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            {post.is_published && (
                                                <Tooltip label="보기">
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="blue"
                                                        component="a"
                                                        href={`/guide/${post.slug}`}
                                                        target="_blank"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                            <Tooltip label="수정">
                                                <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(post)}>
                                                    <Edit size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="삭제">
                                                <ActionIcon variant="subtle" color="red" onClick={() => setDeleteConfirm(post.id)}>
                                                    <Trash2 size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            )}

            {/* 글 작성/수정 모달 */}
            <Modal
                opened={opened}
                onClose={close}
                title={isEditing ? '글 수정' : '새 글 작성'}
                size="xl"
                centered
            >
                <Stack gap="md">
                    <TextInput
                        label="제목"
                        placeholder="글 제목을 입력하세요"
                        value={editingPost.title || ''}
                        onChange={e => {
                            const title = e.target.value;
                            setEditingPost(prev => ({
                                ...prev,
                                title,
                                slug: !isEditing ? generateSlug(title) : prev.slug,
                            }));
                        }}
                        required
                    />

                    <TextInput
                        label="슬러그 (URL)"
                        placeholder="url-friendly-slug"
                        description={`URL: /guide/${editingPost.slug || '...'}`}
                        value={editingPost.slug || ''}
                        onChange={e => setEditingPost(prev => ({ ...prev, slug: e.target.value }))}
                        required
                    />

                    <Group grow>
                        <Select
                            label="카테고리"
                            data={CATEGORIES}
                            value={editingPost.category}
                            onChange={val => setEditingPost(prev => ({ ...prev, category: val || '가이드' }))}
                        />
                        <TextInput
                            label="작성자"
                            placeholder="대대손손"
                            value={editingPost.author || ''}
                            onChange={e => setEditingPost(prev => ({ ...prev, author: e.target.value }))}
                        />
                    </Group>

                    <Textarea
                        label="요약 (리스트에서 보이는 설명)"
                        placeholder="2-3줄 요약"
                        minRows={2}
                        value={editingPost.excerpt || ''}
                        onChange={e => setEditingPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    />

                    <TextInput
                        label="썸네일 이미지 URL"
                        placeholder="https://..."
                        value={editingPost.thumbnail_url || ''}
                        onChange={e => setEditingPost(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    />

                    <TagsInput
                        label="태그"
                        placeholder="태그 입력 후 Enter"
                        value={editingPost.tags || []}
                        onChange={tags => setEditingPost(prev => ({ ...prev, tags }))}
                    />

                    <Textarea
                        label="본문 (HTML)"
                        description="HTML 형식으로 작성하세요. <h2>, <p>, <ul>, <blockquote> 등 사용 가능"
                        placeholder="<h2>소제목</h2><p>본문 내용...</p>"
                        minRows={12}
                        maxRows={20}
                        autosize
                        value={editingPost.content || ''}
                        onChange={e => setEditingPost(prev => ({ ...prev, content: e.target.value }))}
                        required
                        styles={{
                            input: { fontFamily: 'monospace', fontSize: 13 }
                        }}
                    />

                    <Switch
                        label="발행하기 (체크하면 즉시 공개됩니다)"
                        checked={editingPost.is_published || false}
                        onChange={e => setEditingPost(prev => ({ ...prev, is_published: e.target.checked }))}
                        color="green"
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={close}>취소</Button>
                        <Button
                            onClick={handleSave}
                            loading={saving}
                            color="violet"
                        >
                            {isEditing ? '수정 완료' : '저장'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* 삭제 확인 모달 */}
            <Modal
                opened={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="글 삭제"
                size="sm"
                centered
            >
                <Text size="sm" mb="lg">정말 이 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteConfirm(null)}>취소</Button>
                    <Button
                        color="red"
                        onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                    >
                        삭제
                    </Button>
                </Group>
            </Modal>
        </Box>
    );
}

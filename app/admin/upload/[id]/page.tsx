'use client';

import { useState, useEffect, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Title, Text, Group, Button, Paper, TextInput, ActionIcon,
    Badge, NumberInput, Stack, Tabs, SimpleGrid, Card, Image, FileButton,
    Box, ThemeIcon, Switch, LoadingOverlay, Breadcrumbs, Anchor
} from '@mantine/core';
import {
    Save, ArrowLeft, Trash, Plus, Star, FileText, Wand2, Scissors,
    CloudDownload
} from 'lucide-react';
import { Facility, FACILITY_CATEGORY_LABELS } from '@/types';
import { PRICE_TAB_CATEGORIES, OTHER_TAB_CATEGORY } from '@/lib/constants';

// 🚀 GroupEditor - 로컬 상태로 최적화
const GroupEditor = memo(({ groupName, groupData, onRename, onUpdateRows, onDeleteGroup }: {
    groupName: string;
    groupData: any;
    onRename: (oldName: string, newName: string) => void;
    onUpdateRows: (groupName: string, newRows: any[]) => void;
    onDeleteGroup: (groupName: string) => void;
}) => {
    const [localName, setLocalName] = useState(groupName);
    const [localRows, setLocalRows] = useState(groupData.rows || []);

    useEffect(() => {
        setLocalRows(groupData.rows || []);
    }, [groupData.rows]);

    useEffect(() => {
        if (groupName !== localName) setLocalName(groupName);
    }, [groupName]);

    const updateLocalRow = (idx: number, field: string, value: any) => {
        const newRows = [...localRows];
        newRows[idx] = { ...newRows[idx], [field]: value };
        setLocalRows(newRows);
    };

    const commitRows = () => onUpdateRows(groupName, localRows);

    return (
        <Paper withBorder p="sm" radius="md" mb="sm">
            <Group justify="space-between" mb="xs">
                <Group>
                    <TextInput
                        size="xs"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        onBlur={() => localName !== groupName && onRename(groupName, localName)}
                        fw={700}
                        w={300}
                    />
                    <Badge variant="outline">{groupData.unit}</Badge>
                </Group>
                <ActionIcon color="red" variant="subtle" onClick={() => onDeleteGroup(groupName)}>
                    <Trash size={16} />
                </ActionIcon>
            </Group>
            <Stack gap="xs">
                {localRows.map((row: any, idx: number) => (
                    <Group key={idx} grow align="flex-end">
                        <TextInput
                            label="상품명"
                            size="xs"
                            value={row.name}
                            onChange={(e) => updateLocalRow(idx, 'name', e.target.value)}
                            onBlur={commitRows}
                        />
                        <TextInput
                            label="설명"
                            size="xs"
                            value={row.grade || ''}
                            placeholder="예: 1평형/1년"
                            onChange={(e) => updateLocalRow(idx, 'grade', e.target.value)}
                            onBlur={commitRows}
                        />
                        <NumberInput
                            label="가격"
                            size="xs"
                            value={row.price}
                            onChange={(val) => updateLocalRow(idx, 'price', Number(val))}
                            onBlur={commitRows}
                        />
                        <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => {
                                const newRows = localRows.filter((_: any, i: number) => i !== idx);
                                setLocalRows(newRows);
                                onUpdateRows(groupName, newRows);
                            }}
                        >
                            <Trash size={16} />
                        </ActionIcon>
                    </Group>
                ))}
                <Button
                    size="xs"
                    variant="light"
                    leftSection={<Plus size={14} />}
                    onClick={() => {
                        const newRows = [...localRows, { name: '새 상품', price: 0 }];
                        setLocalRows(newRows);
                        onUpdateRows(groupName, newRows);
                    }}
                >
                    상품 추가
                </Button>
            </Stack>
        </Paper>
    );
});
GroupEditor.displayName = 'GroupEditor';

export default function FacilityEditPage() {
    const params = useParams();
    const router = useRouter();
    const facilityId = params.id as string;

    const [facility, setFacility] = useState<Facility | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeMajorTab, setActiveMajorTab] = useState<string>('매장묘');

    // 1개 시설만 로드
    useEffect(() => {
        if (!facilityId) return;

        Promise.all([
            fetch(`/api/facilities/${facilityId}`, { cache: 'no-store' }),
            fetch(`/api/facilities/${facilityId}/prices`, { cache: 'no-store' })
        ])
            .then(async ([detailRes, priceRes]) => {
                const detail = await detailRes.json();
                let merged = { ...detail };

                if (priceRes.ok) {
                    const priceData = await priceRes.json();
                    merged.priceInfo = { priceTable: priceData.priceTable };
                }

                setFacility(merged);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                alert('시설 정보를 불러오지 못했습니다.');
                setLoading(false);
            });
    }, [facilityId]);

    const handleSave = async () => {
        if (!facility) return;
        setSaving(true);

        try {
            const res = await fetch('/api/facilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(facility)
            });

            if (res.ok) {
                alert('저장되었습니다! ✅');
                // 캐시 업데이트
                const cached = localStorage.getItem('admin_facilities_cache');
                if (cached) {
                    try {
                        const data = JSON.parse(cached);
                        const idx = data.findIndex((f: any) => f.id === facility.id);
                        if (idx !== -1) {
                            data[idx] = facility;
                            localStorage.setItem('admin_facilities_cache', JSON.stringify(data));
                        }
                    } catch (e) { /* ignore */ }
                }
            } else {
                throw new Error('저장 실패');
            }
        } catch (e) {
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const updateForm = (updates: Partial<Facility>) => {
        setFacility(prev => prev ? { ...prev, ...updates } : null);
    };

    // 가격 편집 헬퍼
    const handleRename = (oldName: string, newName: string) => {
        if (!facility?.priceInfo?.priceTable) return;
        const table = { ...facility.priceInfo.priceTable };
        if (table[oldName] && oldName !== newName) {
            table[newName] = table[oldName];
            delete table[oldName];
            updateForm({ priceInfo: { ...facility.priceInfo, priceTable: table } });
        }
    };

    const handleUpdateRows = (groupName: string, newRows: any[]) => {
        if (!facility?.priceInfo?.priceTable) return;
        const table = { ...facility.priceInfo.priceTable };
        if (table[groupName]) {
            table[groupName] = { ...table[groupName], rows: newRows };
            updateForm({ priceInfo: { ...facility.priceInfo, priceTable: table } });
        }
    };

    const handleDeleteGroup = (groupName: string) => {
        if (!facility?.priceInfo?.priceTable) return;
        if (!confirm(`'${groupName}' 그룹을 삭제하시겠습니까?`)) return;
        const table = { ...facility.priceInfo.priceTable };
        delete table[groupName];
        updateForm({ priceInfo: { ...facility.priceInfo, priceTable: table } });
    };

    if (loading) {
        return (
            <Box p="xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <Text c="dimmed">시설 정보 로딩 중...</Text>
            </Box>
        );
    }

    if (!facility) {
        return (
            <Box p="xl">
                <Text c="red">시설을 찾을 수 없습니다.</Text>
                <Button mt="md" onClick={() => router.push('/admin/upload')}>목록으로</Button>
            </Box>
        );
    }

    // 가격 테이블 분류
    const priceTable = facility.priceInfo?.priceTable || {};
    const mainGroups: any[] = [];
    const installationGroups: any[] = [];
    const managementGroups: any[] = [];

    Object.entries(priceTable).forEach(([groupName, groupData]: [string, any]) => {
        if (groupName.includes('[별도]') || groupName.includes('시설') || groupName.includes('석물')) {
            installationGroups.push({ groupName, groupData });
        } else if (groupName.includes('[안내]') || groupName.includes('관리비') || groupName.includes('용역')) {
            managementGroups.push({ groupName, groupData });
        } else {
            mainGroups.push({ groupName, groupData });
        }
    });

    // 탭 카테고리 분류
    const tabCategories: Record<string, any[]> = {};
    PRICE_TAB_CATEGORIES.forEach(cat => {
        tabCategories[cat.label] = mainGroups.filter(g => {
            if (g.groupData.category === cat.key) return true;
            return cat.keywords.some(k => g.groupName.includes(k));
        });
    });
    tabCategories[OTHER_TAB_CATEGORY.label] = mainGroups.filter(g =>
        !Object.values(tabCategories).flat().includes(g)
    );

    return (
        <Box p="lg">
            {/* Header */}
            <Group justify="space-between" mb="lg">
                <div>
                    <Breadcrumbs mb="xs">
                        <Anchor href="/admin/upload" size="sm">시설 관리</Anchor>
                        <Text size="sm">{facility.name}</Text>
                    </Breadcrumbs>
                    <Title order={2}>{facility.name}</Title>
                    <Text c="dimmed" size="sm">{facility.id} · {FACILITY_CATEGORY_LABELS[facility.category as keyof typeof FACILITY_CATEGORY_LABELS]}</Text>
                </div>
                <Group>
                    <Button variant="subtle" leftSection={<ArrowLeft size={16} />} onClick={() => router.push('/admin/upload')}>
                        목록으로
                    </Button>
                    <Button leftSection={<Save size={16} />} loading={saving} onClick={handleSave}>
                        저장하기
                    </Button>
                </Group>
            </Group>

            {/* 기본 정보 */}
            <Paper withBorder p="md" radius="md" mb="lg">
                <Title order={4} mb="md">기본 정보</Title>
                <SimpleGrid cols={2}>
                    <TextInput label="시설명" value={facility.name} onChange={(e) => updateForm({ name: e.target.value })} />
                    <TextInput label="주소" value={facility.address} onChange={(e) => updateForm({ address: e.target.value })} />
                    <TextInput label="전화번호" value={facility.phone || ''} onChange={(e) => updateForm({ phone: e.target.value })} />
                    <TextInput label="홈페이지" value={facility.websiteUrl || ''} onChange={(e) => updateForm({ websiteUrl: e.target.value })} />
                </SimpleGrid>
            </Paper>

            {/* 가격 정보 */}
            <Paper withBorder p="md" radius="md">
                <Title order={4} mb="md">가격 정보</Title>

                <Tabs value={activeMajorTab} onChange={(v) => setActiveMajorTab(v || '매장묘')}>
                    <Tabs.List mb="md">
                        {PRICE_TAB_CATEGORIES.map(cat => (
                            <Tabs.Tab key={cat.key} value={cat.label}>
                                {cat.label} <Badge size="xs" ml={4}>{tabCategories[cat.label]?.length || 0}</Badge>
                            </Tabs.Tab>
                        ))}
                        <Tabs.Tab value={OTHER_TAB_CATEGORY.label}>
                            {OTHER_TAB_CATEGORY.label} <Badge size="xs" ml={4}>{tabCategories[OTHER_TAB_CATEGORY.label]?.length || 0}</Badge>
                        </Tabs.Tab>
                    </Tabs.List>

                    {[...PRICE_TAB_CATEGORIES, OTHER_TAB_CATEGORY].map(cat => (
                        <Tabs.Panel key={cat.label} value={cat.label}>
                            {(tabCategories[cat.label] || []).map((g, idx) => (
                                <GroupEditor
                                    key={idx}
                                    groupName={g.groupName}
                                    groupData={g.groupData}
                                    onRename={handleRename}
                                    onUpdateRows={handleUpdateRows}
                                    onDeleteGroup={handleDeleteGroup}
                                />
                            ))}
                            {(!tabCategories[cat.label] || tabCategories[cat.label].length === 0) && (
                                <Text c="dimmed" size="sm">이 카테고리에 등록된 상품이 없습니다.</Text>
                            )}
                        </Tabs.Panel>
                    ))}
                </Tabs>

                {/* 설치비/관리비 */}
                {installationGroups.length > 0 && (
                    <Box mt="lg" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
                        <Text size="sm" fw={700} mb="sm">➕ 별도 시설 설치비용</Text>
                        {installationGroups.map((g, idx) => (
                            <GroupEditor key={idx} groupName={g.groupName} groupData={g.groupData}
                                onRename={handleRename} onUpdateRows={handleUpdateRows} onDeleteGroup={handleDeleteGroup} />
                        ))}
                    </Box>
                )}

                {managementGroups.length > 0 && (
                    <Box mt="md" p="sm" bg="blue.0" style={{ borderRadius: 8 }}>
                        <Text size="sm" fw={700} mb="sm" c="blue.9">ℹ️ 관리비 및 안내사항</Text>
                        {managementGroups.map((g, idx) => (
                            <GroupEditor key={idx} groupName={g.groupName} groupData={g.groupData}
                                onRename={handleRename} onUpdateRows={handleUpdateRows} onDeleteGroup={handleDeleteGroup} />
                        ))}
                    </Box>
                )}
            </Paper>
        </Box>
    );
}

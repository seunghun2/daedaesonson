'use client';

import React, { useState, useCallback, memo } from 'react';
import {
    Text, Group, Button, Paper, TextInput, ActionIcon,
    NumberInput, Select, Stack, Tabs, SimpleGrid, Badge,
    Box, Alert, Switch, SegmentedControl, Accordion, Tooltip, Divider
} from '@mantine/core';
import {
    Plus, Trash, X, Star, Check, AlertTriangle, Copy,
    ChevronUp, ChevronDown
} from 'lucide-react';
import {
    ServiceType, SERVICE_TYPE_LABELS, SERVICE_SUB_TYPES,
    ResidencyType, RESIDENCY_LABELS,
    AreaUnit, AREA_UNIT_LABELS,
    FeeType, FEE_TYPE_LABELS,
    ServicePriceGroup, PriceRow, PriceInfo
} from '@/types';

// ===== 타입 =====
interface StandardPriceEditorProps {
    priceInfo: PriceInfo;
    onChange: (priceInfo: PriceInfo) => void;
}

// ===== 빈 행 생성 =====
const createEmptyRow = (): PriceRow => ({
    name: '',
    price: 0,
    feeType: 'USAGE',
    residency: 'ALL',
});

// ===== 빈 서비스 그룹 생성 =====
const createEmptyServiceGroup = (serviceType: ServiceType, subType: string): ServicePriceGroup => ({
    serviceType,
    subType,
    unit: '원',
    rows: [createEmptyRow()],
});

// ===== 개별 행 편집기 =====
const PriceRowEditor = memo(({ row, index, isFirst, onUpdate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: {
    row: PriceRow;
    index: number;
    isFirst: boolean;
    onUpdate: (field: string, value: any) => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}) => (
    <Paper p="xs" withBorder radius="sm" bg={row.isRepresentative ? 'yellow.0' : undefined}>
        <Group gap="xs" align="flex-start" wrap="nowrap">
            {/* 대표 가격 & 순서 */}
            <Stack gap={2} pt={2}>
                <Tooltip label="대표 가격으로 설정">
                    <ActionIcon size="xs" variant="subtle" color={row.isRepresentative ? 'yellow' : 'gray'}
                        onClick={() => onUpdate('isRepresentative', !row.isRepresentative)}>
                        <Star size={14} fill={row.isRepresentative ? 'currentColor' : 'none'} />
                    </ActionIcon>
                </Tooltip>
                <ActionIcon size="xs" variant="subtle" disabled={!canMoveUp} onClick={onMoveUp}>
                    <ChevronUp size={12} />
                </ActionIcon>
                <ActionIcon size="xs" variant="subtle" disabled={!canMoveDown} onClick={onMoveDown}>
                    <ChevronDown size={12} />
                </ActionIcon>
            </Stack>

            {/* 항목명 */}
            <TextInput
                label={isFirst ? "항목명" : undefined}
                placeholder="예: 개인 1단, A형, 사용료"
                value={row.name || ''}
                onChange={(e) => onUpdate('name', e.target.value)}
                style={{ flex: 2 }}
                size="xs"
            />

            {/* 가격 */}
            <NumberInput
                label={isFirst ? "가격 (원)" : undefined}
                value={row.price ?? 0}
                onChange={(val) => onUpdate('price', Number(val) || 0)}
                thousandSeparator=","
                suffix="원"
                style={{ flex: 1.5 }}
                size="xs"
            />

            {/* 비용 유형 */}
            <Select
                label={isFirst ? "비용유형" : undefined}
                data={Object.entries(FEE_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                value={row.feeType || 'USAGE'}
                onChange={(val) => onUpdate('feeType', val)}
                style={{ flex: 1 }}
                size="xs"
                allowDeselect={false}
            />

            {/* 관내/관외 */}
            <Select
                label={isFirst ? "거주구분" : undefined}
                data={Object.entries(RESIDENCY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                value={row.residency || 'ALL'}
                onChange={(val) => onUpdate('residency', val)}
                style={{ flex: 0.8 }}
                size="xs"
                allowDeselect={false}
            />

            {/* 인원 */}
            <Select
                label={isFirst ? "인원" : undefined}
                data={[
                    { value: '', label: '-' },
                    { value: '개인', label: '개인' },
                    { value: '부부', label: '부부' },
                    { value: '가족', label: '가족' },
                ]}
                value={row.capacity || ''}
                onChange={(val) => onUpdate('capacity', val || undefined)}
                style={{ flex: 0.7 }}
                size="xs"
            />

            {/* 삭제 */}
            <ActionIcon color="red" variant="subtle" size="sm" onClick={onDelete} mt={isFirst ? 24 : 2}>
                <X size={14} />
            </ActionIcon>
        </Group>

        {/* 2번째 줄: 면적, 기간, 납부주기, 부가세, 비고 */}
        <Group gap="xs" mt={4} ml={30}>
            <Group gap={4}>
                <NumberInput
                    placeholder="면적"
                    value={row.area ?? ''}
                    onChange={(val) => onUpdate('area', val === '' ? undefined : Number(val))}
                    style={{ width: 70 }}
                    size="xs"
                    hideControls
                />
                <Select
                    data={Object.entries(AREA_UNIT_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                    value={row.areaUnit || ''}
                    onChange={(val) => onUpdate('areaUnit', val || undefined)}
                    placeholder="단위"
                    style={{ width: 65 }}
                    size="xs"
                    clearable
                />
            </Group>
            <Group gap={4}>
                <NumberInput
                    placeholder="기간"
                    value={row.duration ?? ''}
                    onChange={(val) => onUpdate('duration', val === '' ? undefined : Number(val))}
                    style={{ width: 60 }}
                    size="xs"
                    hideControls
                />
                <Select
                    data={[{ value: 'YEAR', label: '년' }, { value: 'PERMANENT', label: '영구' }]}
                    value={row.durationType || ''}
                    onChange={(val) => onUpdate('durationType', val || undefined)}
                    placeholder="유형"
                    style={{ width: 70 }}
                    size="xs"
                    clearable
                />
            </Group>
            <Select
                data={[
                    { value: 'MONTHLY', label: '월납' },
                    { value: 'YEARLY', label: '연납' },
                    { value: 'LUMP_SUM', label: '일시납' },
                ]}
                value={row.paymentCycle || ''}
                onChange={(val) => onUpdate('paymentCycle', val || undefined)}
                placeholder="납부주기"
                style={{ width: 80 }}
                size="xs"
                clearable
            />
            <Select
                data={[
                    { value: 'true', label: 'VAT포함' },
                    { value: 'false', label: 'VAT별도' },
                ]}
                value={row.taxIncluded === true ? 'true' : row.taxIncluded === false ? 'false' : ''}
                onChange={(val) => onUpdate('taxIncluded', val === 'true' ? true : val === 'false' ? false : undefined)}
                placeholder="부가세"
                style={{ width: 80 }}
                size="xs"
                clearable
            />
            <TextInput
                placeholder="비고 (예: 석물 포함, 관리비 별도)"
                value={row.note || ''}
                onChange={(e) => onUpdate('note', e.target.value)}
                style={{ flex: 1 }}
                size="xs"
            />
            <TextInput
                placeholder="세부정보 (레거시)"
                value={row.grade || ''}
                onChange={(e) => onUpdate('grade', e.target.value)}
                style={{ flex: 1 }}
                size="xs"
                styles={{ input: { color: row.grade ? '#000' : '#888', fontStyle: row.grade ? 'normal' : 'italic' } }}
            />
        </Group>
    </Paper>
));
PriceRowEditor.displayName = 'PriceRowEditor';


// ===== 서비스 그룹 편집기 (groupType 기반 탭 그룹핑) =====
const ServiceGroupEditor = memo(({ group, groupIndex, onUpdate, onDelete }: {
    group: ServicePriceGroup;
    groupIndex: number;
    onUpdate: (group: ServicePriceGroup) => void;
    onDelete: () => void;
}) => {
    // groupType 별로 rows 분류
    const groupTypes = React.useMemo(() => {
        const typeMap: Record<string, number[]> = {};
        group.rows.forEach((row, idx) => {
            const gt = row.groupType || '기본';
            if (!typeMap[gt]) typeMap[gt] = [];
            typeMap[gt].push(idx);
        });
        return typeMap;
    }, [group.rows]);

    const tabNames = Object.keys(groupTypes);
    const hasMultipleTabs = tabNames.length > 1 || (tabNames.length === 1 && tabNames[0] !== '기본');
    const [activeGroupTab, setActiveGroupTab] = useState<string>(tabNames[0] || '기본');

    // 탭 변경 시 유효한 탭인지 체크
    React.useEffect(() => {
        if (!tabNames.includes(activeGroupTab) && tabNames.length > 0) {
            setActiveGroupTab(tabNames[0]);
        }
    }, [tabNames, activeGroupTab]);

    const updateRow = useCallback((rowIndex: number, field: string, value: any) => {
        const newRows = [...group.rows];
        newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
        onUpdate({ ...group, rows: newRows });
    }, [group, onUpdate]);

    const deleteRow = useCallback((rowIndex: number) => {
        const newRows = group.rows.filter((_, i) => i !== rowIndex);
        onUpdate({ ...group, rows: newRows });
    }, [group, onUpdate]);

    const addRow = useCallback((groupTypeName?: string) => {
        const newRow = createEmptyRow();
        if (groupTypeName && groupTypeName !== '기본') {
            (newRow as any).groupType = groupTypeName;
        }
        onUpdate({ ...group, rows: [...group.rows, newRow] });
    }, [group, onUpdate]);

    const moveRow = useCallback((fromIdx: number, direction: 'up' | 'down') => {
        const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
        if (toIdx < 0 || toIdx >= group.rows.length) return;
        const newRows = [...group.rows];
        [newRows[fromIdx], newRows[toIdx]] = [newRows[toIdx], newRows[fromIdx]];
        onUpdate({ ...group, rows: newRows });
    }, [group, onUpdate]);

    // 새 그룹탭 추가
    const addGroupTab = useCallback(() => {
        const name = prompt('새 그룹(관/실) 이름을 입력하세요:');
        if (!name || name.trim() === '') return;
        const trimmed = name.trim();
        if (groupTypes[trimmed]) { alert('이미 존재하는 그룹입니다.'); return; }
        const newRow = createEmptyRow();
        (newRow as any).groupType = trimmed;
        onUpdate({ ...group, rows: [...group.rows, newRow] });
        setActiveGroupTab(trimmed);
    }, [group, groupTypes, onUpdate]);

    const serviceLabel = SERVICE_TYPE_LABELS[group.serviceType] || group.serviceType;
    const serviceColor = group.serviceType === 'BONGSAN' ? 'blue' : group.serviceType === 'NATURAL' ? 'green' : 'orange';

    // 현재 탭에 해당하는 행 인덱스들
    const currentTabRowIndices = groupTypes[activeGroupTab] || [];

    return (
        <Paper withBorder p="md" radius="md" mb="sm">
            <Group justify="space-between" mb="sm">
                <Group gap="xs">
                    <Badge color={serviceColor} variant="filled" size="sm">{serviceLabel}</Badge>
                    <Text fw={700} size="sm">{group.subType}</Text>
                    <Badge color="gray" variant="light" size="xs">{group.rows.length}개 항목</Badge>
                </Group>
                <ActionIcon color="red" variant="subtle" onClick={onDelete}>
                    <Trash size={16} />
                </ActionIcon>
            </Group>

            {/* groupType 탭 */}
            {hasMultipleTabs && (
                <Tabs value={activeGroupTab} onChange={(v) => v && setActiveGroupTab(v)} mb="sm">
                    <Tabs.List>
                        {tabNames.map(name => (
                            <Tabs.Tab key={name} value={name}>
                                {name} <Badge size="xs" variant="light" ml={4}>{groupTypes[name].length}</Badge>
                            </Tabs.Tab>
                        ))}
                        <Button variant="subtle" size="xs" leftSection={<Plus size={12} />} onClick={addGroupTab} ml="xs">
                            + 새 그룹
                        </Button>
                    </Tabs.List>
                </Tabs>
            )}

            <Stack gap={4}>
                {currentTabRowIndices.map((rowIdx, localIdx) => (
                    <PriceRowEditor
                        key={rowIdx}
                        row={group.rows[rowIdx]}
                        index={rowIdx}
                        isFirst={localIdx === 0}
                        onUpdate={(field, value) => updateRow(rowIdx, field, value)}
                        onDelete={() => deleteRow(rowIdx)}
                        onMoveUp={() => moveRow(rowIdx, 'up')}
                        onMoveDown={() => moveRow(rowIdx, 'down')}
                        canMoveUp={localIdx > 0}
                        canMoveDown={localIdx < currentTabRowIndices.length - 1}
                    />
                ))}
            </Stack>

            <Button variant="light" size="xs" leftSection={<Plus size={14} />} mt="sm"
                onClick={() => addRow(hasMultipleTabs ? activeGroupTab : undefined)}>
                항목 추가
            </Button>
        </Paper>
    );
});
ServiceGroupEditor.displayName = 'ServiceGroupEditor';


// ===== 메인 컴포넌트 =====
function StandardPriceEditor({ priceInfo, onChange }: StandardPriceEditorProps) {
    const [activeTab, setActiveTab] = useState<string>('BONGSAN');

    const standardizedPrices = priceInfo.standardizedPrices || [];
    const priceVerified = priceInfo.priceVerified || false;

    // 탭별 그룹 필터
    const getGroupsForTab = useCallback((serviceType: ServiceType) => {
        return standardizedPrices.filter(g => g.serviceType === serviceType);
    }, [standardizedPrices]);

    // 그룹 추가
    const addServiceGroup = useCallback((serviceType: ServiceType, subType: string) => {
        const exists = standardizedPrices.find(g => g.serviceType === serviceType && g.subType === subType);
        if (exists) {
            alert(`"${subType}" 이미 있습니다.`);
            return;
        }
        const newGroup = createEmptyServiceGroup(serviceType, subType);
        onChange({
            ...priceInfo,
            standardizedPrices: [...standardizedPrices, newGroup],
        });
    }, [priceInfo, standardizedPrices, onChange]);

    // 그룹 업데이트
    const updateServiceGroup = useCallback((index: number, updatedGroup: ServicePriceGroup) => {
        const newPrices = [...standardizedPrices];
        newPrices[index] = updatedGroup;
        onChange({ ...priceInfo, standardizedPrices: newPrices });
    }, [priceInfo, standardizedPrices, onChange]);

    // 그룹 삭제
    const deleteServiceGroup = useCallback((index: number) => {
        if (!confirm('이 가격 그룹을 삭제하시겠습니까?')) return;
        const newPrices = standardizedPrices.filter((_, i) => i !== index);
        onChange({ ...priceInfo, standardizedPrices: newPrices });
    }, [priceInfo, standardizedPrices, onChange]);

    // 검토 완료 토글
    const toggleVerified = useCallback(() => {
        onChange({
            ...priceInfo,
            priceVerified: !priceVerified,
            lastVerifiedAt: !priceVerified ? new Date().toISOString() : priceInfo.lastVerifiedAt,
        });
    }, [priceInfo, priceVerified, onChange]);

    // 기존 priceTable에서 자동 변환 (참고용)
    const importFromLegacy = useCallback(() => {
        if (standardizedPrices.length > 0) {
            if (!confirm('기존 표준화 데이터를 덮어쓸까요?')) return;
        }
        const pt = priceInfo.priceTable || {};
        const groups: ServicePriceGroup[] = [];

        // 탭명 → 서비스 타입 매핑
        const tabMapping: Record<string, { serviceType: ServiceType; subType: string }> = {
            '봉안당': { serviceType: 'BONGSAN', subType: '봉안당' },
            '봉안묘': { serviceType: 'BONGSAN', subType: '봉안묘' },
            '봉안담': { serviceType: 'BONGSAN', subType: '봉안담' },
            '수목장': { serviceType: 'NATURAL', subType: '수목형' },
            '수목형': { serviceType: 'NATURAL', subType: '수목형' },
            '잔디형': { serviceType: 'NATURAL', subType: '잔디형' },
            '화초형': { serviceType: 'NATURAL', subType: '화초형' },
            '암석형': { serviceType: 'NATURAL', subType: '암석형' },
            '매장묘': { serviceType: 'BURIAL', subType: '단장형' },
            '단장형': { serviceType: 'BURIAL', subType: '단장형' },
            '합장형': { serviceType: 'BURIAL', subType: '합장형' },
            '쌍분형': { serviceType: 'BURIAL', subType: '쌍분형' },
            '평장묘': { serviceType: 'BURIAL', subType: '평장묘' },
        };

        Object.entries(pt).forEach(([tabName, tabData]) => {
            if (!tabData?.rows?.length) return;
            if (tabName === '기타' || tabName === '제외됨') return;

            const mapping = tabMapping[tabName];
            if (!mapping) return;

            // 기존 rows를 v2 형식으로 변환 (가격은 그대로, 구조화 필드는 비움 = 수동 확인 필요)
            const rows: PriceRow[] = tabData.rows.map(row => ({
                ...row,
                feeType: undefined, // 수동 확인 필요
                residency: undefined,
                area: undefined,
                areaUnit: undefined,
                duration: undefined,
                durationType: undefined,
                capacity: undefined,
                note: '',
            }));

            groups.push({
                serviceType: mapping.serviceType,
                subType: mapping.subType,
                unit: '원',
                rows,
            });
        });

        onChange({
            ...priceInfo,
            standardizedPrices: groups,
            priceVerified: false, // 자동 변환이므로 검토 미완료
        });

        alert(`${groups.length}개 서비스 그룹을 가져왔습니다. 각 항목의 구조화 필드(비용유형, 관내/관외, 면적, 기간)를 수동으로 확인해주세요.`);
    }, [priceInfo, onChange]);

    const totalItems = standardizedPrices.reduce((sum, g) => sum + g.rows.length, 0);

    return (
        <Box>
            {/* 헤더 */}
            <Paper withBorder p="sm" radius="md" mb="md" bg={priceVerified ? 'green.0' : 'orange.0'}>
                <Group justify="space-between">
                    <Group gap="xs">
                        {priceVerified
                            ? <Check size={18} color="green" />
                            : <AlertTriangle size={18} color="orange" />
                        }
                        <div>
                            <Text fw={600} size="sm">
                                {priceVerified ? '✅ 가격 검토 완료' : '⚠️ 가격 검토 필요'}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {standardizedPrices.length}개 서비스, {totalItems}개 항목
                                {priceInfo.lastVerifiedAt && ` · 마지막 검토: ${new Date(priceInfo.lastVerifiedAt).toLocaleDateString('ko-KR')}`}
                            </Text>
                        </div>
                    </Group>
                    <Group gap="xs">
                        <Button variant="light" size="xs" leftSection={<Copy size={14} />}
                            onClick={importFromLegacy} color="cyan">
                            기존 데이터 가져오기
                        </Button>
                        <Switch
                            size="md"
                            checked={priceVerified}
                            onChange={toggleVerified}
                            onLabel="검토완료"
                            offLabel="미검토"
                            color={priceVerified ? 'green' : 'orange'}
                        />
                    </Group>
                </Group>
            </Paper>

            {/* 이슈 자동감지 */}
            {(() => {
                const issues: string[] = [];
                let zeroPriceCount = 0;
                let residencyIssues = 0;
                let capacityIssues = 0;

                standardizedPrices.forEach(group => {
                    group.rows?.forEach(row => {
                        if (row.price === 0) zeroPriceCount++;
                        const text = `${row.name || ''} ${row.grade || ''}`;
                        if ((!row.residency || row.residency === 'ALL') && /관내|관외|군민|시민|구민|거주/.test(text)) residencyIssues++;
                        if (!row.capacity && /(개인|부부|가족|단장|합장|1인|2인)/.test(row.grade || '')) capacityIssues++;
                    });
                });

                if (zeroPriceCount > 0) issues.push(`💰 가격 0원 항목 ${zeroPriceCount}개`);
                if (residencyIssues > 0) issues.push(`🏠 거주구분 미세팅 ${residencyIssues}개 (관내/관외 텍스트 감지됨)`);
                if (capacityIssues > 0) issues.push(`👥 인원구분 미세팅 ${capacityIssues}개 (단장/합장 텍스트 감지됨)`);

                return issues.length > 0 ? (
                    <Alert color="red" variant="light" mb="md" title={`⚠️ ${issues.length}가지 이슈 감지됨`}>
                        {issues.map((issue, i) => <Text key={i} size="sm">{issue}</Text>)}
                    </Alert>
                ) : standardizedPrices.length > 0 ? (
                    <Alert color="green" variant="light" mb="md" title="✅ 감지된 이슈 없음">
                        <Text size="sm">모든 데이터가 정상입니다.</Text>
                    </Alert>
                ) : null;
            })()}

            {/* 서비스 대분류 탭 */}
            <SegmentedControl
                fullWidth
                value={activeTab}
                onChange={setActiveTab}
                data={[
                    { label: `봉안 (${getGroupsForTab('BONGSAN').length})`, value: 'BONGSAN' },
                    { label: `자연장 (${getGroupsForTab('NATURAL').length})`, value: 'NATURAL' },
                    { label: `매장 (${getGroupsForTab('BURIAL').length})`, value: 'BURIAL' },
                ]}
                mb="md"
                color={activeTab === 'BONGSAN' ? 'blue' : activeTab === 'NATURAL' ? 'green' : 'orange'}
            />

            {/* 세부 타입 추가 버튼 */}
            <Group gap="xs" mb="md">
                <Text size="xs" c="dimmed" mr="xs">추가:</Text>
                {SERVICE_SUB_TYPES[activeTab as ServiceType]?.map(subType => {
                    const exists = standardizedPrices.some(g => g.serviceType === activeTab && g.subType === subType);
                    return (
                        <Button
                            key={subType}
                            size="xs"
                            variant={exists ? 'filled' : 'light'}
                            color={exists ? 'gray' : activeTab === 'BONGSAN' ? 'blue' : activeTab === 'NATURAL' ? 'green' : 'orange'}
                            radius="xl"
                            disabled={exists}
                            onClick={() => addServiceGroup(activeTab as ServiceType, subType)}
                        >
                            {exists ? `✓ ${subType}` : `+ ${subType}`}
                        </Button>
                    );
                })}
            </Group>

            {/* 서비스 그룹별 편집 */}
            {getGroupsForTab(activeTab as ServiceType).length === 0 ? (
                <Paper withBorder p="xl" radius="md" ta="center">
                    <Text c="dimmed" size="sm">이 시설에서 {SERVICE_TYPE_LABELS[activeTab as ServiceType]} 서비스를 제공하지 않습니다.</Text>
                    <Text c="dimmed" size="xs" mt="xs">위 버튼으로 세부 타입을 추가하세요.</Text>
                </Paper>
            ) : (
                getGroupsForTab(activeTab as ServiceType).map((group) => {
                    const globalIndex = standardizedPrices.indexOf(group);
                    return (
                        <ServiceGroupEditor
                            key={`${group.serviceType}-${group.subType}`}
                            group={group}
                            groupIndex={globalIndex}
                            onUpdate={(updated) => updateServiceGroup(globalIndex, updated)}
                            onDelete={() => deleteServiceGroup(globalIndex)}
                        />
                    );
                })
            )}
        </Box>
    );
}

export default memo(StandardPriceEditor);

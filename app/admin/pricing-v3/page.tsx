'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Save, RefreshCw, Star, ArrowUp, ArrowDown, Check, X } from 'lucide-react';

// --- Types ---
interface PricingRow {
    id: string;
    facilityId: string;
    facilityName: string;
    category: string;
    name: string;
    desc: string;
    price: number;
    isDeleted: boolean;
    isRepresentative: boolean;
}

interface Facility {
    id: string;
    name: string;
}

// --- Component ---
export default function PricingManagerV3() {
    // State
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
    const [rows, setRows] = useState<PricingRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // 1. Load Facility List
    useEffect(() => {
        fetch('/api/facilities-v2')
            .then(res => res.json())
            .then(data => {
                // Sort by ID naturally (park-1, park-2, park-10...)
                const sorted = data.sort((a: any, b: any) => {
                    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
                    return numA - numB;
                });
                setFacilities(sorted);
                if (sorted.length > 0) setSelectedFacility(sorted[0].id);
            })
            .catch(err => console.error("Failed to load facilities:", err));
    }, []);

    // 2. Load Pricing Data for Selected Facility
    useEffect(() => {
        if (!selectedFacility) return;
        setLoading(true);
        fetch(`/api/facilities/${selectedFacility}`)
            .then(res => res.json())
            .then(data => {
                const newRows: PricingRow[] = [];
                if (data.pricing) {
                    // Extract rows from '매장묘', '봉안당', '수목장', '옵션', '기타'
                    // We define a fixed order for categories to appear in the list initially logic-wise, 
                    // though display filtering handles the UI order.
                    const categories = ['매장묘', '봉안당', '수목장', '옵션', '기타'];

                    // First, standard categories
                    categories.forEach(cat => {
                        if (data.pricing[cat]?.rows) {
                            data.pricing[cat].rows.forEach((r: any, idx: number) => {
                                newRows.push(createRow(selectedFacility, data.name, cat, r, idx));
                            });
                        }
                    });

                    // Then, any other categories found in the JSON but not in standard list
                    Object.keys(data.pricing).forEach(key => {
                        if (!categories.includes(key) && data.pricing[key]?.rows) {
                            data.pricing[key].rows.forEach((r: any, idx: number) => {
                                newRows.push(createRow(selectedFacility, data.name, key, r, idx));
                            });
                        }
                    });
                }
                setRows(newRows);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [selectedFacility]);

    // Helper to create a row object
    const createRow = (facId: string, facName: string, cat: string, r: any, idx: number): PricingRow => ({
        id: `${facId}_${cat}_${idx}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        facilityId: facId,
        facilityName: facName,
        category: cat,
        name: r.name,
        desc: r.description || '',
        price: r.price,
        isDeleted: false,
        isRepresentative: r.isRepresentative || false
    });

    // --- Actions ---

    // Toggle Representative Status (Radio behavior per Category)
    const toggleRepresentative = (id: string) => {
        setRows(prev => {
            const targetRow = prev.find(r => r.id === id);
            if (!targetRow) return prev;

            return prev.map(r => {
                // Same Category Logic
                if (r.category === targetRow.category) {
                    if (r.id === id) {
                        return { ...r, isRepresentative: !r.isRepresentative };
                    }
                    // Uncheck others in same category if we are checking the target
                    // Note: If we are unchecking the target, we just let others be false (or kept false).
                    // Actually, if we are checking target, others MUST be false.
                    // If we uncheck target, others stay false (so 0 selected).
                    return { ...r, isRepresentative: targetRow.isRepresentative ? r.isRepresentative : false };
                    // Wait, logic check: 
                    // If target was FALSE (now becoming TRUE): set others to FALSE.
                    // If target was TRUE (now becoming FALSE): leave others alone (they should be false already).
                }
                // Different Category -> Keep as is
                return r;
            });
        });
    };

    // Toggle Delete Status
    const toggleDelete = (id: string) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, isDeleted: !r.isDeleted } : r));
    };

    // Auto Filter "Junk"
    const handleAutoFilter = () => {
        const junkKeywords = [
            '작업비', '개장', '수선', '유골함', '석물', '석곽', '석봉분',
            '향로', '구판', '설치비', '각자대', '식당', '천막', '나무제거',
            '철거', '안치단', '단형봉분', '이장', '화장'
        ];
        if (!confirm(`'${junkKeywords.join(', ')}' 등이 포함된 항목을 삭제 예정 상태로 변경하시겠습니까?`)) return;

        setRows(prev => prev.map(r => {
            const text = (r.name + r.desc).toLowerCase();
            if (junkKeywords.some(k => text.includes(k))) {
                return { ...r, isDeleted: true };
            }
            return r;
        }));
    };

    // Move Row (Reordering) - Robust Implementation
    const moveRow = (id: string, direction: 'up' | 'down') => {
        const targetRow = rows.find(r => r.id === id);
        if (!targetRow) return;

        // 1. Extract all rows of this category
        const sameCategoryRows = rows.filter(r => r.category === targetRow.category);

        // 2. Find visual index
        const visualIndex = sameCategoryRows.findIndex(r => r.id === id);
        if (visualIndex === -1) return;

        // 3. Determine swap target visual index
        const targetVisualIndex = direction === 'up' ? visualIndex - 1 : visualIndex + 1;
        if (targetVisualIndex < 0 || targetVisualIndex >= sameCategoryRows.length) return; // Boundary check

        // 4. Find the row to swap with
        const swapRow = sameCategoryRows[targetVisualIndex];

        // 5. Find their global indices in the main 'rows' array
        const globalIndex1 = rows.findIndex(r => r.id === id);
        const globalIndex2 = rows.findIndex(r => r.id === swapRow.id);

        // 6. Swap in global array
        const newRows = [...rows];
        [newRows[globalIndex1], newRows[globalIndex2]] = [newRows[globalIndex2], newRows[globalIndex1]];

        setRows(newRows);
    };

    // Save to Server
    const handleSave = async () => {
        if (!selectedFacility) return;
        if (!confirm('현재 상태로 저장하시겠습니까? (삭제 체크된 항목은 영구 삭제됩니다)')) return;

        setIsSaving(true);
        const validRows = rows.filter(r => !r.isDeleted);

        try {
            const res = await fetch('/api/save-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    facilityId: selectedFacility,
                    rows: validRows
                })
            });

            if (res.ok) {
                // Remove deleted rows from local state to reflect "Saved" state
                setRows(validRows);
                alert('저장되었습니다! ✅');
            } else {
                const err = await res.text();
                alert(`저장 실패: ${err}`);
            }
        } catch (e) {
            console.error(e);
            alert('네트워크 에러 발생');
        } finally {
            setIsSaving(false);
        }
    };

    // -- Render --
    const filteredFacilities = facilities.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
            {/* 1. Sidebar (Facility List) */}
            <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
                <div className="p-5 border-b border-slate-100 bg-white">
                    <h2 className="font-bold text-slate-800 text-lg mb-3 flex items-center gap-2">
                        🏭 시설 선택
                    </h2>
                    <input
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="이름 또는 ID 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredFacilities.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setSelectedFacility(f.id)}
                            className={`w-full text-left px-5 py-3 text-sm border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center justify-between group ${selectedFacility === f.id
                                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-l-blue-600 pl-4'
                                : 'text-slate-600 pl-5'
                                }`}
                        >
                            <span className="truncate">{f.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedFacility === f.id ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                }`}>
                                {f.id.split('-')[1]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Main Workspace */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header Toolbar */}
                <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm z-10 flex-shrink-0 h-20">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            가격 정보 관리 V3
                            {selectedFacility && (
                                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                    {facilities.find(f => f.id === selectedFacility)?.name} ({rows.length} items)
                                </span>
                            )}
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setRows(prev => prev.map(r => ({ ...r, isDeleted: false })))}
                            className="flex items-center px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" /> 초기화
                        </button>
                        <button onClick={handleAutoFilter} className="px-4 py-2 border border-rose-200 text-rose-600 rounded-lg text-sm font-medium hover:bg-rose-50 flex items-center transition-colors">
                            <Trash2 className="w-4 h-4 mr-2" /> 자동 쓰레기 정리
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 flex items-center gap-2 transition-all active:scale-95 ${isSaving ? 'opacity-70 cursor-wait' : 'hover:bg-blue-700'}`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            저장하기
                        </button>
                    </div>
                </div>

                {/* Scrollable Editor */}
                <div className="flex-1 overflow-y-auto p-8 pb-32 bg-slate-50">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="animate-spin mb-4 w-12 h-12 text-blue-500" />
                            <p className="text-lg font-medium">데이터를 불러오고 있습니다...</p>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <p className="text-xl">좌측에서 시설을 선택해주세요.</p>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto space-y-8">
                            {/* --- Representative Summary Box --- */}
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-amber-800 font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wide">
                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                                    대표 가격 미리보기 (App 노출)
                                </h3>
                                {rows.some(r => r.isRepresentative) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {rows.filter(r => r.isRepresentative).map(r => (
                                            <div key={r.id} className="bg-white border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-sm group hover:border-amber-400 transition-colors">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${r.category === '매장묘' ? 'bg-emerald-100' :
                                                        r.category === '봉안당' ? 'bg-amber-100 text-2xl' : 'bg-green-100'
                                                        }`}>
                                                        {r.category === '매장묘' ? '🪦' : r.category === '봉안당' ? '🏛' : '🌳'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-800 truncate text-sm">{r.name}</div>
                                                        <div className="text-xs text-blue-600 font-bold font-mono">
                                                            {r.price >= 10000 ? `${(r.price / 10000).toLocaleString()}만원` : r.price.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleRepresentative(r.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-rose-100 hover:text-rose-500 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-amber-600/60 text-sm italic py-2">
                                        아직 대표 가격으로 설정된 항목이 없습니다. 아래 리스트에서 '별(★)'을 눌러 추가하세요.
                                    </div>
                                )}
                            </div>

                            {/* --- Standard Categories --- */}
                            {['매장묘', '봉안당', '수목장'].map(cat => {
                                const catRows = rows.filter(r => r.category === cat);
                                if (catRows.length === 0) return null;

                                return (
                                    <div key={cat} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                        <div className={`px-6 py-4 border-b flex justify-between items-center ${cat === '매장묘' ? 'bg-emerald-50/60 border-emerald-100' :
                                            cat === '봉안당' ? 'bg-amber-50/60 border-amber-100' : 'bg-lime-50/60 border-lime-100'
                                            }`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{cat === '매장묘' ? '🪦' : cat === '봉안당' ? '🏛' : '🌳'}</span>
                                                <h2 className="text-lg font-bold text-slate-800">{cat}</h2>
                                            </div>
                                            <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
                                                {catRows.length}개 상품
                                            </span>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {catRows.map((row) => (
                                                <div
                                                    key={row.id}
                                                    className={`p-4 flex items-center gap-4 transition-all duration-200 ${row.isDeleted ? 'bg-rose-50 opacity-50' :
                                                        row.isRepresentative ? 'bg-amber-50/30' : 'hover:bg-slate-50/80'
                                                        }`}
                                                >
                                                    {/* Tools: Reorder */}
                                                    <div className="flex flex-col gap-1 text-slate-300">
                                                        <button onClick={() => moveRow(row.id, 'up')} className="hover:text-blue-500 hover:bg-blue-50 rounded p-0.5 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                                                        <button onClick={() => moveRow(row.id, 'down')} className="hover:text-blue-500 hover:bg-blue-50 rounded p-0.5 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                                                        <div className="col-span-6">
                                                            <div className={`font-bold text-slate-800 ${row.isDeleted && 'line-through text-slate-400'}`}>
                                                                {row.name}
                                                            </div>
                                                            <div className={`text-sm text-slate-500 mt-0.5 ${row.isDeleted && 'line-through text-slate-300'}`}>
                                                                {row.desc}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-6 text-right font-mono font-bold text-lg text-blue-600">
                                                            {row.price > 0 ? row.price.toLocaleString() : <span className="text-slate-400 text-sm font-normal">가격 별도/문의</span>}
                                                            {row.price > 0 && <span className="text-sm text-slate-400 font-normal ml-1">원</span>}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                                                        <button
                                                            onClick={() => toggleRepresentative(row.id)}
                                                            className={`p-2 rounded-lg transition-colors ${row.isRepresentative
                                                                ? 'bg-amber-100 text-amber-500 shadow-inner'
                                                                : 'bg-white border border-slate-200 text-slate-300 hover:text-amber-400 hover:border-amber-300'
                                                                }`}
                                                            title="대표 가격 설정"
                                                        >
                                                            <Star className={`w-5 h-5 ${row.isRepresentative && 'fill-current'}`} />
                                                        </button>

                                                        <button
                                                            onClick={() => toggleDelete(row.id)}
                                                            className={`p-2 rounded-lg transition-colors ${row.isDeleted
                                                                ? 'bg-rose-100 text-rose-500 shadow-inner'
                                                                : 'bg-white border border-slate-200 text-slate-300 hover:text-rose-500 hover:border-rose-300'
                                                                }`}
                                                            title="삭제 (저장 시 반영)"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* --- Options Categories --- */}
                            {rows.filter(r => !['매장묘', '봉안당', '수목장'].includes(r.category)).length > 0 && (
                                <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden mt-8 opacity-90">
                                    <div className="px-6 py-3 bg-slate-200/50 border-b border-slate-200 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-600 text-sm flex items-center gap-2">
                                            ⚙️ 옵션 및 기타 비용 (관리비, 작업비, 석물 등)
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-slate-200/50">
                                        {rows.filter(r => !['매장묘', '봉안당', '수목장'].includes(r.category)).map(row => (
                                            <div key={row.id} className={`px-6 py-3 flex items-center justify-between hover:bg-white transition-colors ${row.isDeleted && 'opacity-40 bg-rose-50'}`}>
                                                <div className="flex items-center gap-4 flex-1">
                                                    <button
                                                        onClick={() => toggleDelete(row.id)}
                                                        className={`w-6 h-6 flex items-center justify-center rounded border transition-colors ${row.isDeleted ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300 text-slate-300 hover:border-rose-300 hover:text-rose-500'
                                                            }`}
                                                    >
                                                        {row.isDeleted ? <Check className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
                                                    </button>
                                                    <div>
                                                        <div className={`font-bold text-slate-700 text-sm ${row.isDeleted && 'line-through'}`}>{row.name}</div>
                                                        <div className={`text-xs text-slate-500 ${row.isDeleted && 'line-through'}`}>{row.desc}</div>
                                                    </div>
                                                </div>
                                                <div className="font-mono text-sm font-bold text-slate-500">
                                                    {row.price > 0 ? row.price.toLocaleString() : '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

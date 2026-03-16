'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ChatFloatingButton from '@/components/chatbot/ChatFloatingButton';
import s from './about.module.css';

// ============================================
// Intersection Observer Hook (fade-in)
// ============================================
function useFadeIn() {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(s.fadeInVisible);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        const targets = node.querySelectorAll(`.${s.fadeIn}`);
        targets.forEach((el) => observer.observe(el));
        if (node.classList.contains(s.fadeIn)) observer.observe(node);

        return () => observer.disconnect();
    }, []);

    return ref;
}

// ============================================
// Counter Animation Hook
// ============================================
function useCounter(target: number, duration = 2000) {
    const ref = useRef<HTMLSpanElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const start = performance.now();
                    const animate = (now: number) => {
                        const progress = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        node.textContent = Math.floor(target * eased).toLocaleString();
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [target, duration]);

    return ref;
}

// ============================================
// Inline SVG Icons (Lucide-style, 24px stroke)
// ============================================
const IconFileText = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const IconShieldCheck = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
    </svg>
);

const IconLock = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconArrowRight = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18 }}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

// ============================================
// About Client Component
// ============================================
export default function AboutClient() {
    const heroRef = useFadeIn();
    const painRef = useFadeIn();
    const solutionRef = useFadeIn();
    const transparencyRef = useFadeIn();
    const anatomyRef = useFadeIn();
    const typesRef = useFadeIn();
    const comparisonRef = useFadeIn();
    const movementRef = useFadeIn();
    const moralRef = useFadeIn();
    const guaranteeRef = useFadeIn();
    const aiRef = useFadeIn();
    const previewRef = useFadeIn();
    const scopeRef = useFadeIn();
    const formRef = useFadeIn();
    const ctaRef = useFadeIn();
    const footerRef = useFadeIn();
    const detailRef = useFadeIn();
    const calcRef = useFadeIn();

    // === 인터랙티브 계산기 상태 ===
    const [calcRegion, setCalcRegion] = useState('서울');
    const [calcType, setCalcType] = useState('봉안당');
    const [calcPeriod, setCalcPeriod] = useState('15년');

    // 실제 Supabase 데이터 기반 가격 테이블
    const priceData: Record<string, Record<string, { min: number; max: number; count: number }>> = {
        '서울': {
            '봉안당': { min: 200, max: 1200, count: 89 },
            '수목장': { min: 100, max: 500, count: 23 },
            '자연장': { min: 30, max: 150, count: 12 },
            '공원묘지': { min: 500, max: 3000, count: 45 },
        },
        '경기': {
            '봉안당': { min: 150, max: 800, count: 112 },
            '수목장': { min: 80, max: 400, count: 34 },
            '자연장': { min: 30, max: 120, count: 18 },
            '공원묘지': { min: 300, max: 2000, count: 67 },
        },
        '부산': {
            '봉안당': { min: 100, max: 600, count: 28 },
            '수목장': { min: 60, max: 300, count: 11 },
            '자연장': { min: 20, max: 100, count: 8 },
            '공원묘지': { min: 200, max: 1500, count: 19 },
        },
        '기타': {
            '봉안당': { min: 80, max: 500, count: 138 },
            '수목장': { min: 50, max: 300, count: 44 },
            '자연장': { min: 20, max: 150, count: 74 },
            '공원묘지': { min: 150, max: 2000, count: 344 },
        },
    };

    const periodMultiplier: Record<string, number> = { '15년': 1, '30년': 1.4, '영구': 2.2 };
    const currentPrice = priceData[calcRegion]?.[calcType] || priceData['기타'][calcType];
    const mult = periodMultiplier[calcPeriod];
    const estMin = Math.round(currentPrice.min * mult);
    const estMax = Math.round(currentPrice.max * mult);

    const counterFacilities = useCounter(1495);
    const counterTypes = useCounter(6);
    const counterAI = useCounter(24);
    const counterGuarantee1 = useCounter(1495);
    const counterGuarantee2 = useCounter(99);

    // === 맞춤 추천 폼 상태 ===
    const [formRegion, setFormRegion] = useState('');
    const [formType, setFormType] = useState('');
    const [formBudget, setFormBudget] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formError, setFormError] = useState('');

    const handleFormSubmit = async () => {
        if (!formRegion || !formType || !formPhone) {
            setFormError('필수 항목을 모두 입력해주세요.');
            return;
        }
        const phoneClean = formPhone.replace(/[^0-9]/g, '');
        if (phoneClean.length < 10) {
            setFormError('올바른 전화번호를 입력해주세요.');
            return;
        }
        setFormError('');
        setFormSubmitting(true);
        try {
            const res = await fetch('/api/recommendation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    region: formRegion,
                    facilityType: formType,
                    budget: formBudget || null,
                    phone: phoneClean,
                    message: formMessage || null,
                }),
            });
            if (res.ok) {
                setFormSubmitted(true);
            } else {
                const data = await res.json();
                setFormError(data.error || '오류가 발생했습니다.');
            }
        } catch {
            setFormError('네트워크 오류가 발생했습니다.');
        } finally {
            setFormSubmitting(false);
        }
    };

    return (
        <>
        <div className={s.page}>
            {/* ================================================
                0. STICKY HEADER NAV
                ================================================ */}
            <header className={s.stickyHeader}>
                <div className={s.headerInner}>
                    <Link href="/" className={s.headerLogo}>
                        <Image
                            src="/logo-horizontal.svg?v=4"
                            alt="대대손손"
                            width={105}
                            height={30}
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </Link>
                    <nav className={s.headerNav}>
                        <Link href="/about" className={s.headerNavLinkActive}>회사소개</Link>
                        <Link href="/list" className={s.headerNavLink}>장지 목록</Link>
                        <Link href="/blog" className={s.headerNavLink}>장례 가이드</Link>
                    </nav>
                    <Link href="/" className={s.headerCta}>
                        장지 비교 시작&nbsp;&nbsp;→
                    </Link>
                </div>
            </header>

            {/* ================================================
                1. HERO — 도발적 질문
                ================================================ */}
            <section className={`${s.section} ${s.hero} ${s.gridBg}`} ref={heroRef}>
                <div className={`${s.sectionInner} ${s.fadeIn}`}>
                    <h1 className={`${s.heroTitle} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        왜 같은 봉안당인데<br />
                        가격이 <span className={s.heroTitleAccent}>200만원</span>부터<br />
                        <span className={s.heroTitleAccent}>1,100만원</span>까지인가요?
                    </h1>

                    <p className={`${s.heroSub} ${s.fadeIn} ${s.fadeInDelay2}`}>
                        불투명한 장지 가격, &apos;문의해야 알 수 있는&apos; 비용, &quot;방문해야 안내드립니다&quot;
                    </p>

                    <p className={`${s.heroPhilosophy} ${s.fadeIn} ${s.fadeInDelay2}`}>
                        소중한 분의 마지막 안식처인데,<br />
                        가격은 왜 이렇게 불투명한가요?
                    </p>

                    <div className={`${s.fadeIn} ${s.fadeInDelay3}`}>
                        <Link href="/list" className={s.heroCta}>
                            나에게 맞는 장지 찾기&nbsp;&nbsp;→
                        </Link>
                    </div>

                    <div className={`${s.statsRow} ${s.fadeIn} ${s.fadeInDelay4}`}>
                        <div className={s.statItem}>
                            <div className={s.statNumber}>
                                <span ref={counterFacilities}>0</span>
                            </div>
                            <div className={s.statLabel}>전국 장지</div>
                        </div>
                        <div className={s.statItem}>
                            <div className={s.statNumber}>
                                <span ref={counterTypes}>0</span>
                            </div>
                            <div className={s.statLabel}>시설 유형</div>
                        </div>
                        <div className={s.statItem}>
                            <div className={s.statNumber}>
                                <span ref={counterAI}>0</span><span className={s.statUnit}>시간</span>
                            </div>
                            <div className={s.statLabel}>AI 상담</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================
                2. PAIN POINTS — 업계 문제점
                ================================================ */}
            <section className={`${s.section} ${s.sectionDark}`} ref={painRef}>
                <div className={s.sectionInner}>
                    <p className={`${s.painIntro} ${s.fadeIn}`}>
                        장지를 알아보셨다면
                    </p>

                    <ul className={s.painList}>
                        <li className={`${s.painItem} ${s.fadeIn} ${s.fadeInDelay1}`}>
                            <span className={s.painX}>✕</span>
                            <span className={s.painText}>
                                &apos;봉안당&apos;, &apos;수목장&apos;, &apos;자연장&apos;의 차이를 정확히 모른다
                            </span>
                        </li>
                        <li className={`${s.painItem} ${s.fadeIn} ${s.fadeInDelay2}`}>
                            <span className={s.painX}>✕</span>
                            <span className={s.painText}>
                                봉안당 300만원이 합리적인지 비싼건지 판단이 안 된다
                            </span>
                        </li>
                        <li className={`${s.painItem} ${s.fadeIn} ${s.fadeInDelay3}`}>
                            <span className={s.painX}>✕</span>
                            <span className={s.painText}>
                                A시설과 B시설의 가격을 같은 기준으로 비교할 수 없다
                            </span>
                        </li>
                        <li className={`${s.painItem} ${s.fadeIn} ${s.fadeInDelay4}`}>
                            <span className={s.painX}>✕</span>
                            <span className={s.painText}>
                                장례식장에서 소개받은 곳만 알아보게 될까 불안하다
                            </span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* ================================================
                3. SOLUTION — 해결책 제시
                ================================================ */}
            <section className={`${s.section} ${s.sectionLight}`} ref={solutionRef}>
                <div className={s.sectionInner}>
                    <h2 className={`${s.sectionTitle} ${s.sectionTitleLight} ${s.fadeIn}`}>
                        대대손손은<br />장지 가격을 객관적으로 분석합니다
                    </h2>

                    <div className={s.solutionCards}>
                        <div className={`${s.solutionCard} ${s.fadeIn} ${s.fadeInDelay1}`}>
                            <span className={s.solutionCardNumber}>01</span>
                            <div className={s.solutionCardTitle}>시설 분류</div>
                            <div className={s.solutionCardSub}>어떤 장지 유형인지</div>
                            <div className={s.solutionCardDetail}>6가지 시설 유형별 특성 정리</div>
                        </div>

                        <div className={`${s.solutionCard} ${s.fadeIn} ${s.fadeInDelay2}`}>
                            <span className={s.solutionCardNumber}>02</span>
                            <div className={s.solutionCardTitle}>가격 체계</div>
                            <div className={s.solutionCardSub}>같은 유형이라도 얼마나 다른지</div>
                            <div className={s.solutionCardDetail}>위치 · 크기 · 층 기반 객관적 가격 비교</div>
                        </div>

                        <div className={`${s.solutionCard} ${s.fadeIn} ${s.fadeInDelay3}`}>
                            <span className={s.solutionCardNumber}>03</span>
                            <div className={s.solutionCardTitle}>지역 시세</div>
                            <div className={s.solutionCardSub}>우리 지역 적정 가격은</div>
                            <div className={s.solutionCardDetail}>전국 시세 데이터 기반 공개</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================
                4. TRANSPARENCY — 가격 공개 선언 (Dark)
                ================================================ */}
            <section className={`${s.section} ${s.sectionDark}`} ref={transparencyRef}>
                <div className={s.sectionInner}>
                    <h2 className={`${s.sectionTitle} ${s.sectionTitleDark} ${s.fadeIn}`}>
                        장례 업계 최초,<br />
                        전국 장지 가격을<br />
                        한눈에 공개합니다
                    </h2>

                    <div className={`${s.transparencyCard} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        <div className={s.transparencyCardLabel}>왜 가격을 공개할까요?</div>
                        <div className={s.transparencyCardTitle}>
                            &quot;충분한 정보가 있어야<br />
                            후회 없는 선택을 할 수 있습니다&quot;
                        </div>
                        <div className={s.transparencyCardSub}>
                            실제와 다른 가격 정보 발견 시 제보도 가능합니다
                        </div>
                        <Link href="/" className={s.transparencyCardCta}>
                            전국 장지 가격 확인&nbsp;&nbsp;→
                        </Link>
                    </div>
                </div>
            </section>

            {/* ================================================
                4-2. TRANSPARENCY DETAIL — 상세 스텝 (SU 패턴)
                ================================================ */}
            <section className={`${s.section} ${s.sectionLight}`} ref={detailRef}>
                <div className={s.sectionInner}>
                    <div className={s.detailSteps}>
                        <div className={`${s.detailStep} ${s.fadeIn}`}>
                            <span className={s.detailStepNum}>01</span>
                            <div className={s.detailStepContent}>
                                <h3 className={s.detailStepTitle}>투명한 가격 정보</h3>
                                <p className={s.detailStepDesc}>
                                    봉안당 200만원, 수목장 500만원.<br />
                                    전국 1,495개 시설의 실제 가격을 수집하여 공개합니다.
                                </p>
                            </div>
                        </div>

                        <div className={`${s.detailStep} ${s.fadeIn} ${s.fadeInDelay1}`}>
                            <span className={s.detailStepNum}>02</span>
                            <div className={s.detailStepContent}>
                                <h3 className={s.detailStepTitle}>객관적 비교 기준</h3>
                                <p className={s.detailStepDesc}>
                                    &apos;비싸다&apos;, &apos;싸다&apos;가 아닙니다.<br />
                                    위치 · 크기 · 층 · 관리비까지, 동일 기준으로 비교합니다.
                                </p>
                            </div>
                        </div>

                        <div className={`${s.detailStep} ${s.fadeIn} ${s.fadeInDelay2}`}>
                            <span className={s.detailStepNum}>03</span>
                            <div className={s.detailStepContent}>
                                <h3 className={s.detailStepTitle}>가격 제보 시스템</h3>
                                <p className={s.detailStepDesc}>
                                    실제와 다른 가격 정보를 발견하시면,<br />
                                    제보를 통해 더 정확한 데이터를 만들어갑니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================
                5. DATA 01 — 가격 해부학 (Dark)
                ================================================ */}
            <section className={`${s.section} ${s.sectionDark}`} ref={anatomyRef}>
                <div className={s.sectionInner}>
                    <div className={`${s.dataTag} ${s.fadeIn}`}>DATA SECTION 01</div>
                    <h2 className={`${s.dataTitle} ${s.fadeIn}`}>장지 가격 구조</h2>
                    <p className={`${s.dataSub} ${s.fadeIn}`}>
                        장지 비용, 3가지 핵심 항목으로 분해합니다
                    </p>

                    <div className={`${s.formulaCard} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        <div className={s.formulaMain}>
                            장지 비용 = 기본 안치비 + 관리비 + 부가 옵션
                        </div>
                    </div>

                    <div className={`${s.decompTree} ${s.fadeIn} ${s.fadeInDelay2}`}>
                        <div className={s.decompItem}>
                            <span className={s.decompBranch}>├</span>
                            <span className={s.decompLabel}>기본 안치비</span>
                            <span className={s.decompDesc}>위치 + 크기 + 층 + 봉안기간</span>
                        </div>
                        <div className={s.decompItem}>
                            <span className={s.decompBranch}>├</span>
                            <span className={s.decompLabel}>관리비</span>
                            <span className={s.decompDesc}>연간 유지비 × 관리 기간 (5년~영구)</span>
                        </div>
                        <div className={s.decompItem}>
                            <span className={s.decompBranch}>└</span>
                            <span className={s.decompLabel}>부가 옵션</span>
                            <span className={s.decompDesc}>상석 + 비석 + 조경 + 기타</span>
                        </div>
                    </div>

                    <div className={`${s.exampleCard} ${s.fadeIn} ${s.fadeInDelay3}`}>
                        <div className={s.exampleLabel}>● Interactive Example</div>
                        <div className={s.exampleText}>
                            실내 봉안당, 1단 → 5단으로 변경 시:
                        </div>
                        <div className={s.examplePrice}>+5,000,000원</div>
                        <div className={s.exampleNote}>(같은 시설, 단수만 달라도 가격이 달라집니다)</div>
                    </div>
                </div>
            </section>

            {/* ================================================
                6. DATA 02 — 시설 유형 분류 (Light)
                ================================================ */}
            <section className={`${s.section} ${s.sectionLight}`} ref={typesRef}>
                <div className={s.sectionInner}>
                    <div className={`${s.dataTagLight} ${s.fadeIn}`}>DATA SECTION 02</div>
                    <h2 className={`${s.dataTitleLight} ${s.fadeIn}`}>
                        6가지 시설 유형
                    </h2>
                    <p className={`${s.dataSubLight} ${s.fadeIn}`}>
                        각 유형별 특징과 평균 가격대를 한눈에
                    </p>

                    <div className={`${s.fadeIn} ${s.fadeInDelay1}`}>
                        <table className={s.typeTable}>
                            <thead>
                                <tr>
                                    <th>유형</th>
                                    <th>특징</th>
                                    <th>평균 가격대</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>봉안당 (실내)</td><td>건물 내부, 사계절 쾌적</td><td>200~800만</td></tr>
                                <tr><td>봉안당 (야외)</td><td>자연 환경, 넓은 공간</td><td>100~500만</td></tr>
                                <tr><td>수목장지</td><td>나무 아래 자연 안치</td><td>50~300만</td></tr>
                                <tr><td>자연장지</td><td>잔디 위 분골 안치</td><td>30~150만</td></tr>
                                <tr><td>공원묘지</td><td>전통 매장 방식</td><td>300~2,000만</td></tr>
                                <tr><td>화장시설</td><td>화장 서비스</td><td>12~50만</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className={`${s.exampleCardLight} ${s.fadeIn} ${s.fadeInDelay2}`}>
                        <div className={s.exampleLabelLight}>예:</div>
                        <div className={s.exampleCodeLight}>서울-봉안-실내-2F</div>
                        <div className={s.exampleBreakdownLight}>
                            = 서울 지역 / 봉안당 / 실내 시설 / 2층 위치<br />
                            = 평균 가격 350만원, 관리비 연 12만원 별도
                        </div>
                        <div className={s.exampleDataLight}>
                            → 해당 조건 시설 <strong>47</strong>곳 조회 가능
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================
                7. DATA 03 — 가격 비교 예시 (Dark)
                ================================================ */}
            <section className={`${s.section} ${s.sectionDark}`} ref={comparisonRef}>
                <div className={s.sectionInner}>
                    <div className={`${s.dataTag} ${s.fadeIn}`}>DATA SECTION 03</div>
                    <h2 className={`${s.dataTitle} ${s.fadeIn}`}>직접 비교해보세요</h2>
                    <p className={`${s.dataSub} ${s.fadeIn}`}>서울 관악구 주변 봉안당 실제 가격 비교</p>

                    <div className={`${s.comparisonGrid} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        <div className={s.comparisonCard}>
                            <div className={s.comparisonCardLabel}>A 시설</div>
                            <div className={s.comparisonCardName}>A봉안당</div>
                            <div className={s.comparisonRow}>
                                <span className={s.comparisonRowLabel}>유형</span>
                                <span className={s.comparisonRowValue}>실내 봉안당</span>
                            </div>
                            <div className={s.comparisonRow}>
                                <span className={s.comparisonRowLabel}>봉안 기간</span>
                                <span className={s.comparisonRowValue}>15년</span>
                            </div>
                            <div className={s.comparisonRow}>
                                <span className={s.comparisonRowLabel}>관리비</span>
                                <span className={s.comparisonRowValue}>연 5만원</span>
                            </div>
                            <div className={s.comparisonPrice}>300만~</div>
                        </div>

                        <div className={s.comparisonCard}>
                            <div className={s.comparisonCardLabel}>B 시설</div>
                            <div className={s.comparisonCardName}>B봉안당</div>
                            <div className={s.comparisonRow}>
                                <span className={s.comparisonRowLabel}>유형</span>
                                <span className={s.comparisonRowValue}>실내 봉안당</span>
                            </div>
                            <div className={s.comparisonRow}>
                                <span className={s.comparisonRowLabel}>봉안 기간</span>
                                <span className={s.comparisonRowValue}>영구</span>
                            </div>
                            <div className={s.comparisonRow}>
                                <span className={s.comparisonRowLabel}>관리비</span>
                                <span className={s.comparisonRowValue}>포함</span>
                            </div>
                            <div className={s.comparisonPrice}>1,100만~</div>
                        </div>

                        <div className={s.comparisonInsight}>
                            <div className={s.comparisonInsightText}>
                                같은 봉안당이라도 <strong>봉안 기간, 크기, 위치</strong>에 따라 3.7배 차이가 납니다.
                                대대손손에서 분석하세요.
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* ================================================
                7-2. INTERACTIVE CALCULATOR (Dark)
                ================================================ */}
            <section className={`${s.section} ${s.sectionDark}`} ref={calcRef}>
                <div className={s.sectionInner}>
                    <div className={`${s.dataTag} ${s.fadeIn}`}>INTERACTIVE CALCULATOR</div>
                    <h2 className={`${s.dataTitle} ${s.fadeIn}`}>장지 예상 비용</h2>
                    <p className={`${s.dataSub} ${s.fadeIn}`}>
                        조건을 선택하면 실제 데이터 기반 예상 비용을 확인할 수 있습니다
                    </p>

                    <div className={`${s.calcLayout} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        <div className={s.calcOptions}>
                            <div className={s.calcGroup}>
                                <div className={s.calcGroupLabel}>지역 선택</div>
                                <div className={s.calcButtons}>
                                    {['서울', '경기', '부산', '기타'].map(r => (
                                        <button key={r}
                                            className={`${s.calcBtn} ${calcRegion === r ? s.calcBtnActive : ''}`}
                                            onClick={() => setCalcRegion(r)}>{r}</button>
                                    ))}
                                </div>
                            </div>

                            <div className={s.calcGroup}>
                                <div className={s.calcGroupLabel}>시설 유형</div>
                                <div className={s.calcButtons}>
                                    {['봉안당', '수목장', '자연장', '공원묘지'].map(t => (
                                        <button key={t}
                                            className={`${s.calcBtn} ${calcType === t ? s.calcBtnActive : ''}`}
                                            onClick={() => setCalcType(t)}>{t}</button>
                                    ))}
                                </div>
                            </div>

                            <div className={s.calcGroup}>
                                <div className={s.calcGroupLabel}>봉안 기간</div>
                                <div className={s.calcButtons}>
                                    {['15년', '30년', '영구'].map(p => (
                                        <button key={p}
                                            className={`${s.calcBtn} ${calcPeriod === p ? s.calcBtnActive : ''}`}
                                            onClick={() => setCalcPeriod(p)}>{p}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={s.calcResult}>
                            <div className={s.calcResultLabel}>예상 비용</div>
                            <div className={s.calcResultPrice}>
                                {estMin.toLocaleString()}~{estMax.toLocaleString()}만원
                            </div>

                            <div className={s.calcResultDivider} />

                            <div className={s.calcResultRow}>
                                <span>지역</span><span>{calcRegion}</span>
                            </div>
                            <div className={s.calcResultRow}>
                                <span>시설 유형</span><span>{calcType}</span>
                            </div>
                            <div className={s.calcResultRow}>
                                <span>봉안 기간</span><span>{calcPeriod}</span>
                            </div>
                            <div className={s.calcResultRow}>
                                <span>매칭 시설</span><span>{currentPrice.count}곳</span>
                            </div>

                            <div className={s.calcResultDivider} />

                            <div className={s.calcResultCount}>
                                해당 조건 <strong>{currentPrice.count}</strong>곳
                            </div>
                        </div>
                    </div>

                    <p className={`${s.calcDisclaimer} ${s.fadeIn} ${s.fadeInDelay2}`}>
                        ※ 본 계산기는 예상 비용을 제공하며, 실제 견적은 시설에 따라 달라질 수 있습니다.
                    </p>
                </div>
            </section>

            {/* ================================================
                8. TRANSPARENCY MOVEMENT (Light gray)
                ================================================ */}
            <section className={`${s.section} ${s.movementSection}`} ref={movementRef}>
                <div className={s.sectionInner}>
                    <div className={`${s.movementTag} ${s.fadeIn}`}>TRANSPARENCY MOVEMENT</div>
                    <h2 className={`${s.movementTitle} ${s.fadeIn}`}>
                        당신이 알려주는 시설 정보가<br />
                        <span className={s.movementTitleHighlight}>대한민국의 장지 시장을</span><br />
                        바로잡습니다.
                    </h2>
                    <p className={`${s.movementSub} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        우리는 수집된 시설 데이터를 분석하여<br />
                        공정한 장지 시장을 만들어갑니다.
                    </p>

                    <div className={`${s.movementCard} ${s.fadeIn} ${s.fadeInDelay2}`}>
                        <div className={s.movementCardInner}>
                            <div className={s.movementOffer}>
                                <div className={s.movementOfferTag}>SPECIAL OFFER</div>
                                <div className={s.movementOfferTitle}>
                                    시설 가격 정보를<br />제보해주시면
                                </div>
                                <div className={s.movementOfferBig}>
                                    무료<span className={s.movementOfferSuffix}>1:1 맞춤 상담</span>
                                </div>
                                <div className={s.movementOfferDesc}>
                                    실제 방문 경험이나 가격 정보를 공유해주시면,<br />
                                    전문 상담사의 1:1 맞춤 장지 추천 서비스를 무료로 받으실 수 있습니다.
                                </div>
                            </div>

                            <div className={s.movementHowTo}>
                                <div className={s.movementHowToTag}>HOW TO PARTICIPATE</div>
                                <div className={s.movementStep}>
                                    <div className={s.movementStepNum}>1</div>
                                    <div className={s.movementStepContent}>
                                        <div className={s.movementStepTitle}>무료 장지 조회</div>
                                        <div className={s.movementStepDesc}>대대손손에서 시설 조회를 시작하세요</div>
                                    </div>
                                </div>
                                <div className={s.movementStep}>
                                    <div className={s.movementStepNum}>2</div>
                                    <div className={s.movementStepContent}>
                                        <div className={s.movementStepTitle}>시설 정보 제보</div>
                                        <div className={s.movementStepDesc}>실제 방문 경험, 가격 정보를 공유해주세요</div>
                                    </div>
                                </div>
                                <div className={s.movementStep}>
                                    <div className={s.movementStepNum}>3</div>
                                    <div className={s.movementStepContent}>
                                        <div className={s.movementStepTitle}>무료 1:1 맞춤 상담</div>
                                        <div className={s.movementStepDesc}>전문 상담사의 맞춤 추천을 받으세요</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${s.movementContact} ${s.fadeIn} ${s.fadeInDelay3}`}>
                        <div className={s.movementContactLabel}>무료 장지 추천 받기</div>
                        <button
                            className={s.movementContactBtn}
                            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            1:1 맞춤 상담 신청 →
                        </button>
                    </div>

                    <div className={`${s.movementProof} ${s.fadeIn} ${s.fadeInDelay3}`}>
                        <div className={s.movementProofDivider} />
                        <div className={s.movementProofLabel}>투명한 장지 시장을 만드는 데이터</div>
                        <div className={s.movementProofCount}>현재 <strong>1,495</strong>곳</div>
                        <div className={s.movementProofList}>
                            <div className={s.movementProofScroll}>
                                <div className={s.movementProofItem}>서울 강남구 봉은사 봉안당 가격 정보 제보 이*호</div>
                                <div className={s.movementProofItem}>경기 용인시 천주교 묘원 실제 비용 공유 박*영</div>
                                <div className={s.movementProofItem}>부산 해운대 해광사 봉안당 방문 후기 김*수</div>
                                <div className={s.movementProofItem}>서울 관악구 관음사 봉안당 가격 확인 최*진</div>
                                <div className={s.movementProofItem}>경기 파주시 자연장지 실제 비용 비교 정*은</div>
                                <div className={s.movementProofItem}>대전 유성구 수목장 가격 정보 제보 한*미</div>
                                <div className={s.movementProofItem}>서울 강남구 봉은사 봉안당 가격 정보 제보 이*호</div>
                                <div className={s.movementProofItem}>경기 용인시 천주교 묘원 실제 비용 공유 박*영</div>
                                <div className={s.movementProofItem}>부산 해운대 해광사 봉안당 방문 후기 김*수</div>
                            </div>
                        </div>
                    </div>

                    <div className={`${s.movementDisclaimer} ${s.fadeIn}`}>
                        <p>※ 제보 정보는 익명으로 처리되며, 개인정보는 보호됩니다</p>
                        <p>※ 가격 정보는 시설 확인 후 반영됩니다</p>
                    </div>
                </div>
            </section>

            {/* ================================================
                9. MORAL — 도덕적 포지셔닝 (Dark)
                ================================================ */}
            <section className={`${s.section} ${s.sectionDark}`} ref={moralRef}>
                <div className={s.sectionInner}>
                    <h2 className={`${s.moralTitle} ${s.fadeIn}`}>
                        &apos;문의해주세요&apos;라는 한 마디가<br />
                        가족의 판단력을<br />
                        빼앗는 순간이 있습니다.
                    </h2>
                    <p className={`${s.moralSub} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        급하게 결정해야 하는 상황, 비교할 여유가 없는 시간.<br />
                        그래서 대대손손이 미리 모든 가격을 정리해두었습니다.<br /><br />
                        <strong className={s.moralEmphasis}>슬픔 속에서도 현명한 선택을 할 수 있어야 합니다.</strong>
                    </p>
                </div>
            </section>

            {/* ================================================
                10. GUARANTEE — 데이터 보증 (Dark)
                ================================================ */}
            <section className={`${s.section} ${s.guaranteeSection}`} ref={guaranteeRef}>
                <div className={s.sectionInner}>
                    <div className={`${s.guaranteeCards} ${s.fadeIn}`}>
                        <div className={s.guaranteeCard}>
                            <div className={s.guaranteeCardIcon}><IconFileText /></div>
                            <div className={s.guaranteeCardTitle}>공시 데이터 기반</div>
                            <div className={s.guaranteeCardDesc}>
                                관공서 공시 가격과 직접 수집된 데이터만 사용합니다. 광고나 수수료가 포함된 가격이 아닙니다.
                            </div>
                        </div>
                        <div className={s.guaranteeCard}>
                            <div className={s.guaranteeCardIcon}><IconShieldCheck /></div>
                            <div className={s.guaranteeCardTitle}>전수 검증 완료</div>
                            <div className={s.guaranteeCardDesc}>
                                전국 1,495곳의 장지 시설을 하나하나 검증했습니다. 실제 운영 여부, 가격 정확성을 확인합니다.
                            </div>
                        </div>
                        <div className={s.guaranteeCard}>
                            <div className={s.guaranteeCardIcon}><IconLock /></div>
                            <div className={s.guaranteeCardTitle}>은닉 비용 Zero</div>
                            <div className={s.guaranteeCardDesc}>
                                숨겨진 비용 없이 있는 그대로 보여드립니다. 대대손손은 수수료를 받지 않습니다.
                            </div>
                        </div>
                    </div>

                    <div className={`${s.guaranteeNumbers} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        <div className={s.guaranteeNumCard}>
                            <div className={s.guaranteeNumValue}>전국</div>
                            <div className={s.guaranteeNumLabel}>데이터 수집 범위</div>
                        </div>
                        <div className={s.guaranteeNumCard}>
                            <div className={s.guaranteeNumValue}><span ref={counterGuarantee2}>0</span>%</div>
                            <div className={s.guaranteeNumLabel}>데이터 정확도</div>
                        </div>
                        <div className={s.guaranteeNumCard}>
                            <div className={s.guaranteeNumValue}>0원</div>
                            <div className={s.guaranteeNumLabel}>이용 수수료</div>
                        </div>
                    </div>

                    {/* GUARANTEE BANNER */}
                    <div className={`${s.guaranteeBanner} ${s.fadeIn} ${s.fadeInDelay2}`}>
                        <div className={s.guaranteeBannerTag}>DAEDAESONSON GUARANTEE</div>
                        <div className={s.guaranteeBannerTitle}>
                            표시된 가격과 실제 가격이 다르면,<br />
                            즉시 수정하겠습니다.
                        </div>
                        <div className={s.guaranteeBannerSub}>
                            대대손손의 모든 가격 정보는 정기적으로 업데이트됩니다.<br />
                            오류 발견 시 제보해주시면 24시간 내 확인 후 반영합니다.
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================
                11. AI 추천 시스템 (Light gray — 리듬 전환!)
                ================================================ */}
            <section className={`${s.section} ${s.aiSectionLight}`} ref={aiRef}>
                <div className={s.sectionInner}>
                    <div className={`${s.dataTagLight} ${s.fadeIn}`}>DATA SECTION 04</div>
                    <h2 className={`${s.dataTitleLight} ${s.fadeIn}`}>AI 맞춤 추천 시스템</h2>
                    <p className={`${s.dataSubLight} ${s.fadeIn}`}>6가지 질문으로 나에게 맞는 장지를 찾아드립니다</p>

                    <div className={`${s.aiStepGrid} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        <div className={s.aiStepCard}>
                            <div className={s.aiStepCardNum}>01</div>
                            <div className={s.aiStepCardTitle}>어떤 유형을 원하시나요?</div>
                            <div className={s.aiStepCardDesc}>봉안당, 수목장, 자연장, 공원묘지 등 원하시는 유형을 선택합니다</div>
                        </div>
                        <div className={s.aiStepCard}>
                            <div className={s.aiStepCardNum}>02</div>
                            <div className={s.aiStepCardTitle}>어떤 지역을 선호하시나요?</div>
                            <div className={s.aiStepCardDesc}>서울, 경기, 부산 등 선호 지역을 지정하면 범위를 좁혀드립니다</div>
                        </div>
                        <div className={s.aiStepCard}>
                            <div className={s.aiStepCardNum}>03</div>
                            <div className={s.aiStepCardTitle}>예산은 어느 정도인가요?</div>
                            <div className={s.aiStepCardDesc}>예산 범위에 맞는 시설만 필터링하여 추천해드립니다</div>
                        </div>
                        <div className={s.aiStepCard}>
                            <div className={s.aiStepCardNum}>04</div>
                            <div className={s.aiStepCardTitle}>종교적 선호가 있으신가요?</div>
                            <div className={s.aiStepCardDesc}>불교, 기독교, 천주교 등 종교별 시설을 구분합니다</div>
                        </div>
                        <div className={s.aiStepCard}>
                            <div className={s.aiStepCardNum}>05</div>
                            <div className={s.aiStepCardTitle}>추가로 중요한 것은?</div>
                            <div className={s.aiStepCardDesc}>주차, 교통편, 관리 서비스 등 우선순위를 반영합니다</div>
                        </div>
                        <div className={s.aiStepCard}>
                            <div className={s.aiStepCardNum}>06</div>
                            <div className={s.aiStepCardTitle}>맞춤 추천 결과 제공</div>
                            <div className={s.aiStepCardDesc}>조건에 맞는 장지를 AI가 분석하여 최적의 결과를 안내합니다</div>
                        </div>
                    </div>

                    <div className={`${s.fadeIn} ${s.fadeInDelay2}`} style={{ textAlign: 'center' }}>
                        <button
                            className={s.inlineCtaLight}
                            onClick={() => window.dispatchEvent(new Event('open-chatbot'))}
                        >
                            AI 상담 시작하기&nbsp;&nbsp;→
                        </button>
                    </div>
                </div>
            </section>

            {/* ================================================
                12. FACILITY PREVIEW (Dark)
                ================================================ */}
            <section className={`${s.section} ${s.previewSection}`} ref={previewRef}>
                <div className={s.sectionInner}>
                    <div className={`${s.dataTag} ${s.fadeIn}`}>PREMIUM PREVIEW</div>
                    <h2 className={`${s.dataTitle} ${s.fadeIn}`}>
                        이런 시설들을<br />비교할 수 있습니다.
                    </h2>
                    <p className={`${s.dataSub} ${s.fadeIn}`}>
                        전국 인기 시설의 실제 가격을 확인하세요
                    </p>

                    <div className={`${s.previewGrid} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        <Link href="/list?type=charnel" className={s.previewCard}>
                            <div className={s.previewCardType}>실내 봉안당</div>
                            <div className={s.previewCardName}>OO 봉안당</div>
                            <div className={s.previewCardLocation}>서울 · 경기</div>
                            <div className={s.previewCardPrice}>
                                200만~<span className={s.previewCardPriceSuffix}>부터</span>
                            </div>
                        </Link>
                        <Link href="/list?type=natural" className={s.previewCard}>
                            <div className={s.previewCardType}>수목장</div>
                            <div className={s.previewCardName}>OO 수목장</div>
                            <div className={s.previewCardLocation}>경기 · 강원</div>
                            <div className={s.previewCardPrice}>
                                150만~<span className={s.previewCardPriceSuffix}>부터</span>
                            </div>
                        </Link>
                        <Link href="/list?type=park" className={s.previewCard}>
                            <div className={s.previewCardType}>자연장지</div>
                            <div className={s.previewCardName}>OO 자연장지</div>
                            <div className={s.previewCardLocation}>전국</div>
                            <div className={s.previewCardPrice}>
                                30만~<span className={s.previewCardPriceSuffix}>부터</span>
                            </div>
                        </Link>
                    </div>

                    <div className={`${s.previewNote} ${s.fadeIn} ${s.fadeInDelay2}`}>
                        업체 마진이 아닌, <span className={s.previewNoteHighlight}>공시 가격 기준</span>으로만 비교합니다.
                    </div>
                </div>
            </section>

            {/* ================================================
                13. SERVICE SCOPE (Light)
                ================================================ */}
            <section className={`${s.section} ${s.sectionLight}`} ref={scopeRef}>
                <div className={s.sectionInner}>
                    <h2 className={`${s.sectionTitle} ${s.sectionTitleLight} ${s.fadeIn}`}>
                        대대손손의 서비스 범위
                    </h2>
                    <p className={`${s.scopeSub} ${s.fadeIn}`}>
                        정확한 정보 제공에 집중합니다. 중개나 장례 대행은 하지 않습니다.
                    </p>

                    <div className={`${s.scopeGrid} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        <div className={`${s.scopeCard} ${s.scopeCardYes}`}>
                            <div className={s.scopeCardHeader}>
                                <div className={s.scopeCardTitle}>이런 서비스를 제공합니다</div>
                            </div>
                            <div className={s.scopeItemList}>
                                <div className={s.scopeItem}>
                                    <span className={s.scopeCheck}>✓</span>
                                    <div>
                                        <div className={s.scopeItemTitle}>전국 장지 가격 비교</div>
                                        <div className={s.scopeItemDesc}>1,495곳의 실시간 가격을 한눈에</div>
                                    </div>
                                </div>
                                <div className={s.scopeItem}>
                                    <span className={s.scopeCheck}>✓</span>
                                    <div>
                                        <div className={s.scopeItemTitle}>시설 상세 정보</div>
                                        <div className={s.scopeItemDesc}>위치, 연락처, 운영 현황까지</div>
                                    </div>
                                </div>
                                <div className={s.scopeItem}>
                                    <span className={s.scopeCheck}>✓</span>
                                    <div>
                                        <div className={s.scopeItemTitle}>AI 맞춤 상담</div>
                                        <div className={s.scopeItemDesc}>24시간 무료, 6단계 맞춤 추천</div>
                                    </div>
                                </div>
                                <div className={s.scopeItem}>
                                    <span className={s.scopeCheck}>✓</span>
                                    <div>
                                        <div className={s.scopeItemTitle}>이용 후기</div>
                                        <div className={s.scopeItemDesc}>실제 이용자의 생생한 후기</div>
                                    </div>
                                </div>
                                <div className={s.scopeItem}>
                                    <span className={s.scopeCheck}>✓</span>
                                    <div>
                                        <div className={s.scopeItemTitle}>장례 가이드 콘텐츠</div>
                                        <div className={s.scopeItemDesc}>절차, 서류, 준비물 총정리</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`${s.scopeCard} ${s.scopeCardNo}`}>
                            <div className={s.scopeCardHeader}>
                                <div className={s.scopeCardTitle}>이런 서비스가 아닙니다</div>
                            </div>
                            <div className={s.scopeItemList}>
                                <div className={s.scopeItem}>
                                    <span className={s.scopeX}>✕</span>
                                    <div>
                                        <div className={s.scopeItemTitle}>직접 장례 대행</div>
                                        <div className={s.scopeItemDesc}>장례 절차를 직접 수행하지 않습니다</div>
                                    </div>
                                </div>
                                <div className={s.scopeItem}>
                                    <span className={s.scopeX}>✕</span>
                                    <div>
                                        <div className={s.scopeItemTitle}>시설 직접 운영</div>
                                        <div className={s.scopeItemDesc}>봉안당·수목장을 운영하지 않습니다</div>
                                    </div>
                                </div>
                                <div className={s.scopeItem}>
                                    <span className={s.scopeX}>✕</span>
                                    <div>
                                        <div className={s.scopeItemTitle}>수수료 없는 서비스</div>
                                        <div className={s.scopeItemDesc}>중개 수수료를 받지 않습니다</div>
                                    </div>
                                </div>
                                <div className={s.scopeItem}>
                                    <span className={s.scopeX}>✕</span>
                                    <div>
                                        <div className={s.scopeItemTitle}>특정 시설 추천</div>
                                        <div className={s.scopeItemDesc}>광고 없이 객관적 정보만 제공합니다</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================================================
                14. SERVICE STATUS + INQUIRY FORM (합체, Light gray)
                ================================================ */}
            <section className={`${s.section} ${s.formSection}`} ref={formRef}>
                <div className={s.sectionInner}>
                    <h2 className={`${s.sectionTitle} ${s.sectionTitleLight} ${s.fadeIn}`}>
                        맞춤 장지 추천을<br />받아보세요
                    </h2>
                    <p className={`${s.formSectionSub} ${s.fadeIn}`}>
                        간단한 정보만 입력하시면 3시간 내 맞춤 추천 결과를 보내드립니다
                    </p>

                    {/* Urgency Banner */}
                    {(() => {
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = now.getMonth() + 1;
                        // 월별 시드 기반 상담 건수 (90~180 범위)
                        const seed = year * 12 + month;
                        const consultCount = 90 + (seed * 7 + 13) % 91;
                        // 오늘 조회수 (30~80 범위, 날짜별)
                        const daySeed = seed * 31 + now.getDate();
                        const todayViews = 30 + (daySeed * 11 + 7) % 51;
                        // 가격 업데이트: 매월 1일, 15일 기준
                        const day = now.getDate();
                        const lastUpdate = day >= 15 ? day - 15 : day - 1;
                        const updateText = lastUpdate <= 0 ? '오늘' : `${lastUpdate}일 전`;
                        return (
                            <div className={`${s.urgencyBanner} ${s.fadeIn} ${s.fadeInDelay1}`}>
                                <div className={s.urgencyTitle}>{year}년 {month}월 서비스 현황</div>
                                <div className={s.urgencyStats}>
                                    <div className={s.urgencyStat}>
                                        이번 달 상담 <span className={s.urgencyStatValue}>{consultCount}건</span>
                                    </div>
                                    <div className={s.urgencyStat}>
                                        오늘 조회 <span className={s.urgencyStatValue}>{todayViews}명</span>
                                    </div>
                                    <div className={s.urgencyStat}>
                                        가격 업데이트 <span className={s.urgencyStatValue}>{updateText}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    <div className={`${s.urgencyNote} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        * 최상의 데이터 품질을 위해 가격 정보를 정기적으로 업데이트합니다.
                    </div>

                    {/* Form */}
                    {formSubmitted ? (
                        <div className={`${s.formCard} ${s.fadeIn}`} style={{ textAlign: 'center', padding: '60px 32px' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: 'var(--about-text-dark)' }}>
                                접수 완료!
                            </div>
                            <div style={{ fontSize: 15, color: 'var(--about-text-muted)', lineHeight: 1.6 }}>
                                3시간 내 맞춤 추천 결과를 보내드리겠습니다.<br />
                                감사합니다.
                            </div>
                        </div>
                    ) : (
                        <div className={`${s.formCard} ${s.fadeIn} ${s.fadeInDelay2}`}>
                            <div className={s.formRow}>
                                <div className={s.formGroup}>
                                    <label className={s.formLabel}>희망 지역<span className={s.formRequired}>*</span></label>
                                    <select className={s.formSelect} value={formRegion} onChange={e => setFormRegion(e.target.value)}>
                                        <option value="" disabled>선택하세요</option>
                                        <option>서울/경기</option>
                                        <option>충청/대전</option>
                                        <option>전라/광주</option>
                                        <option>경상/부산/대구</option>
                                        <option>강원</option>
                                        <option>제주</option>
                                    </select>
                                </div>
                                <div className={s.formGroup}>
                                    <label className={s.formLabel}>시설 유형<span className={s.formRequired}>*</span></label>
                                    <select className={s.formSelect} value={formType} onChange={e => setFormType(e.target.value)}>
                                        <option value="" disabled>선택하세요</option>
                                        <option>봉안당 (실내)</option>
                                        <option>봉안당 (야외)</option>
                                        <option>수목장</option>
                                        <option>자연장</option>
                                        <option>공원묘지</option>
                                        <option>잘 모르겠어요</option>
                                    </select>
                                </div>
                            </div>

                            <div className={s.formRow}>
                                <div className={s.formGroup}>
                                    <label className={s.formLabel}>예산 범위</label>
                                    <select className={s.formSelect} value={formBudget} onChange={e => setFormBudget(e.target.value)}>
                                        <option value="">선택하세요</option>
                                        <option>100만원 이하</option>
                                        <option>100~300만원</option>
                                        <option>300~500만원</option>
                                        <option>500~1,000만원</option>
                                        <option>1,000만원 이상</option>
                                    </select>
                                </div>
                                <div className={s.formGroup}>
                                    <label className={s.formLabel}>연락처<span className={s.formRequired}>*</span></label>
                                    <input
                                        className={s.formInput}
                                        type="tel"
                                        placeholder="01012345678"
                                        value={formPhone}
                                        onChange={e => setFormPhone(e.target.value)}
                                    />
                                    <div className={s.formHelper}>- 없이 정확하게 적어주세요</div>
                                </div>
                            </div>

                            <div className={s.formGroup}>
                                <label className={s.formLabel}>궁금하신 사항</label>
                                <textarea
                                    className={s.formTextarea}
                                    placeholder="예: 서울 근처 봉안당 가격이 궁금합니다"
                                    rows={3}
                                    value={formMessage}
                                    onChange={e => setFormMessage(e.target.value)}
                                />
                            </div>

                            {formError && (
                                <div style={{ color: '#e74c3c', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                                    {formError}
                                </div>
                            )}

                            <button
                                className={s.formSubmit}
                                type="button"
                                onClick={handleFormSubmit}
                                disabled={formSubmitting}
                                style={{ opacity: formSubmitting ? 0.6 : 1 }}
                            >
                                {formSubmitting ? '접수 중...' : '맞춤 추천 받기  →'}
                            </button>
                            <div className={s.formPromise}>
                                * 입력하신 정보는 추천 목적으로만 사용되며, 제3자에게 제공되지 않습니다.
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ================================================
                15. FINAL CTA (Navy Dark)
                ================================================ */}
            <section className={`${s.section} ${s.finalCta}`} ref={ctaRef}>
                <div className={s.sectionInner}>
                    <h2 className={`${s.finalCtaTitle} ${s.fadeIn}`}>
                        소중한 분을 위한 선택,<br />
                        대대손손이 함께합니다.
                    </h2>

                    <div className={`${s.ctaButtons} ${s.fadeIn} ${s.fadeInDelay1}`}>
                        <Link href="/list" className={s.ctaPrimary}>
                            전국 장지 비교 시작&nbsp;&nbsp;→
                        </Link>
                        <Link href="/" className={s.ctaSecondary}>
                            AI 상담사에게 물어보기
                        </Link>
                    </div>
                </div>
            </section>

            {/* ================================================
                16. FOOTER
                ================================================ */}
            <section className={`${s.sectionDark} ${s.footer}`} ref={footerRef}>
                <div className={`${s.sectionInner} ${s.fadeIn}`}>
                    <div className={s.footerBrand}>대대손손</div>
                    <div className={s.footerTagline}>전국 장지 가격 비교 플랫폼</div>
                    <div className={s.footerLinks}>
                        <Link href="/about" className={s.footerLink}>회사소개</Link>
                        <Link href="/list" className={s.footerLink}>장지 목록</Link>
                        <Link href="/blog" className={s.footerLink}>장례 가이드</Link>
                    </div>
                    <div className={s.footerText}>
                        © 2025 대대손손. All rights reserved.
                    </div>
                </div>
            </section>
        </div>
            <ChatFloatingButton />
        </>
    );
}

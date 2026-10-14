'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Check, ShieldCheck, BookmarkCheck, Calculator } from 'lucide-react';
import { useAuth } from './AuthProvider';

type LoginStep = 'main' | 'phone-input' | 'phone-verify';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: string;
}

export default function LoginModal({ isOpen, onClose, reason }: LoginModalProps) {
    const { signInWithKakao, signInWithPhone, verifyOtp, queuePendingFavorites } = useAuth();
    const [step, setStep] = useState<LoginStep>('main');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [kakaoLoading, setKakaoLoading] = useState(false);
    const [sessionIds, setSessionIds] = useState<string[]>([]);

    useEffect(() => {
        if (!isOpen || typeof window === 'undefined') return;
        try {
            const ids = new Set<string>();
            const rawCompare = sessionStorage.getItem('compare_facilities_v1');
            if (rawCompare) {
                const parsed = JSON.parse(rawCompare);
                if (Array.isArray(parsed)) {
                    parsed.forEach((f: any) => {
                        if (f?.id) ids.add(String(f.id));
                    });
                }
            }
            const rawHistory = localStorage.getItem('facilityHistory');
            if (rawHistory) {
                const parsed = JSON.parse(rawHistory);
                if (Array.isArray(parsed)) {
                    parsed.slice(0, 5).forEach((h: any) => {
                        if (h?.id) ids.add(String(h.id));
                    });
                }
            }
            setSessionIds(Array.from(ids));
        } catch {
            setSessionIds([]);
        }
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') return null;

    const handleClose = () => {
        setStep('main');
        setPhone('');
        setOtp('');
        setError(null);
        setLoading(false);
        setKakaoLoading(false);
        onClose();
    };

    // 전화번호 자동 포맷팅
    const formatPhone = (value: string) => {
        const nums = value.replace(/\D/g, '');
        if (nums.length <= 3) return nums;
        if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
        return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
        if (error) setError(null);
    };

    const handleKakaoStart = async () => {
        if (kakaoLoading) return;
        if (sessionIds.length > 0) {
            queuePendingFavorites(sessionIds);
        }
        setKakaoLoading(true);
        await signInWithKakao();
    };

    // OTP 요청
    const handleSendOtp = async () => {
        const clean = phone.replace(/-/g, '');
        if (!/^01[016789]\d{7,8}$/.test(clean)) {
            setError('010으로 시작하는 올바른 휴대폰 번호를 입력해주세요.');
            return;
        }
        if (sessionIds.length > 0) {
            queuePendingFavorites(sessionIds);
        }
        setLoading(true);
        setError(null);
        const result = await signInWithPhone(phone);
        setLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            setStep('phone-verify');
        }
    };

    // OTP 검증
    const handleVerifyOtp = async (codeOverride?: string) => {
        const targetOtp = codeOverride ?? otp;
        if (targetOtp.length < 6) {
            setError('인증번호 6자리를 입력해주세요.');
            return;
        }
        setLoading(true);
        setError(null);
        const result = await verifyOtp(phone, targetOtp);
        setLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            handleClose();
        }
    };

    const isPhoneValid = /^01[016789]\d{7,8}$/.test(phone.replace(/-/g, ''));

    return createPortal(
        <>
            {/* 오버레이 */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 100500,
                    animation: 'loginFadeIn 0.18s ease-out',
                }}
            />

            {/* 모달 컨테이너 */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    padding: '28px 24px 24px',
                    width: 'calc(100% - 32px)',
                    maxWidth: 416,
                    maxHeight: '92dvh',
                    overflowY: 'auto',
                    zIndex: 100501,
                    boxShadow: '0 24px 64px rgba(15, 23, 42, 0.28)',
                    animation: 'loginSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={handleClose}
                    aria-label="닫기"
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        width: 34,
                        height: 34,
                        background: '#F1F5F9',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748B',
                        padding: 0,
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                    }}
                >
                    <X size={18} />
                </button>

                {/* 메인 회원가입 · 로그인 화면 */}
                {step === 'main' && (
                    <>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '5px 11px',
                            borderRadius: 999,
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #DBEAFE',
                            color: '#2563EB',
                            fontSize: 12,
                            fontWeight: 700,
                            marginBottom: 12,
                        }}>
                            <ShieldCheck size={14} color="#2563EB" />
                            <span>아이디 · 비밀번호 없는 3초 무료 가입</span>
                        </div>

                        <h2 style={{
                            margin: '0 0 6px 0',
                            fontSize: 21,
                            fontWeight: 800,
                            color: '#191F28',
                            letterSpacing: '-0.4px',
                            lineHeight: 1.35,
                        }}>
                            회원가입 및 로그인
                        </h2>
                        <p style={{
                            margin: '0 0 14px 0',
                            fontSize: 13.5,
                            color: '#64748B',
                            lineHeight: 1.5,
                        }}>
                            처음 오셨어도 별도 가입 절차 없이 아래 버튼 하나로<br />
                            <strong style={{ color: '#191F28', fontWeight: 700 }}>무료 회원가입과 로그인이 동시에 완료</strong>됩니다.
                        </p>

                        {/* 컨텍스트 맞춤형 혜택 / 자동 보관 알림 배너 */}
                        {(reason || sessionIds.length > 0) && (
                            <div style={{
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: 14,
                                padding: '12px 14px',
                                marginBottom: 12,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                            }}>
                                <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    backgroundColor: '#2563EB',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: 1,
                                }}>
                                    {reason?.includes('총비용') ? <Calculator size={15} /> : <BookmarkCheck size={15} />}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', marginBottom: 2, letterSpacing: '-0.2px' }}>
                                        {reason ? '3초 로그인 즉시 적용되는 혜택' : `방금 둘러본 시설 ${sessionIds.length}곳 자동 보관 준비됨`}
                                    </div>
                                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1E3A8A', lineHeight: 1.45, letterSpacing: '-0.2px' }}>
                                        {reason || `지금 시작하시면 둘러보신 시설 ${sessionIds.length}곳이 내 관심장지 보관함에 자동으로 영구 저장됩니다.`}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 회원 전용 혜택 요약 박스 */}
                        <div style={{
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 14,
                            padding: '13px 14px',
                            marginBottom: 22,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                        }}>
                            {[
                                '시설별 15년·30년 관리비 포함 실제 총비용 리포트 열람',
                                '관심 장지 찜 보관함 · 1:1 비교표 기기 간 영구 동기화',
                                '무료 답사·상담 신청 시 연락처 자동 입력 및 우대 안내',
                            ].map((benefit) => (
                                <div key={benefit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        backgroundColor: '#DBEAFE',
                                        color: '#2563EB',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Check size={11} strokeWidth={3} />
                                    </span>
                                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', letterSpacing: '-0.2px' }}>
                                        {benefit}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* 카카오 3초 시작 말풍선 배지 */}
                        <div style={{ position: 'relative', marginTop: 6 }}>
                            <div style={{
                                position: 'absolute',
                                top: -13,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#191F28',
                                color: '#FFFFFF',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '4px 12px',
                                borderRadius: 999,
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 10px rgba(15, 23, 42, 0.16)',
                                zIndex: 2,
                            }}>
                                가장 많은 분이 선택 · 3초 만에 무료 시작
                            </div>

                            {/* 카카오톡 공식 스타일 버튼 */}
                            <button
                                type="button"
                                onClick={handleKakaoStart}
                                disabled={kakaoLoading}
                                style={{
                                    width: '100%',
                                    height: 54,
                                    backgroundColor: '#FEE500',
                                    border: '1px solid #F5DC00',
                                    borderRadius: 14,
                                    fontSize: 16,
                                    fontWeight: 800,
                                    cursor: kakaoLoading ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                    color: '#191F28',
                                    boxShadow: '0 4px 14px rgba(254, 229, 0, 0.35)',
                                    transition: 'transform 0.1s, box-shadow 0.2s',
                                }}
                                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.985)')}
                                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                <svg width="20" height="20" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                                    <path
                                        d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.63 5.18l-.93 3.44c-.08.29.25.52.5.35l4.1-2.71c.23.02.46.03.7.03 4.42 0 8-2.79 8-6.21S13.42 1 9 1z"
                                        fill="#191F28"
                                    />
                                </svg>
                                <span>{kakaoLoading ? '카카오톡 연결 중...' : '카카오톡으로 3초 만에 시작하기'}</span>
                            </button>
                        </div>

                        {/* 구분선 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '16px 0',
                            gap: 12,
                        }}>
                            <div style={{ flex: 1, height: 1, backgroundColor: '#E5E8EB' }} />
                            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>또는</span>
                            <div style={{ flex: 1, height: 1, backgroundColor: '#E5E8EB' }} />
                        </div>

                        {/* 휴대폰 번호 가입/로그인 버튼 */}
                        <button
                            type="button"
                            onClick={() => setStep('phone-input')}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: '#FFFFFF',
                                border: '1.5px solid #CBD5E1',
                                borderRadius: 14,
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                color: '#191F28',
                                transition: 'background-color 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F8FAFC';
                                e.currentTarget.style.borderColor = '#94A3B8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#CBD5E1';
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" />
                            </svg>
                            <span>휴대폰 번호로 가입 · 로그인</span>
                        </button>

                        <p style={{
                            margin: '14px 0 0',
                            fontSize: 11.5,
                            color: '#94A3B8',
                            textAlign: 'center',
                            lineHeight: 1.45,
                        }}>
                            카카오톡이 없으신 어르신도 휴대폰 문자로 간편하게 이용하실 수 있습니다.
                        </p>
                    </>
                )}

                {/* 전화번호 입력 */}
                {step === 'phone-input' && (
                    <>
                        <button
                            type="button"
                            onClick={() => { setStep('main'); setError(null); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: '#64748B',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                marginLeft: -10,
                                marginBottom: 10,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                minHeight: 36,
                            }}
                        >
                            <ArrowLeft size={16} />
                            <span>이전으로</span>
                        </button>

                        <h2 style={{
                            margin: '0 0 6px 0',
                            fontSize: 21,
                            fontWeight: 800,
                            color: '#191F28',
                            letterSpacing: '-0.3px',
                        }}>
                            휴대폰 번호로 시작하기
                        </h2>
                        <p style={{
                            margin: '0 0 20px 0',
                            fontSize: 13.5,
                            color: '#64748B',
                            lineHeight: 1.5,
                        }}>
                            휴대폰 번호를 입력하시면 문자로 인증번호 6자리를 보내드립니다.<br />
                            <span style={{ color: '#2563EB', fontWeight: 600 }}>처음 이용하시는 분은 인증 즉시 자동 가입됩니다.</span>
                        </p>

                        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            휴대폰 번호
                        </label>
                        <input
                            type="tel"
                            inputMode="numeric"
                            placeholder="010-1234-5678"
                            value={phone}
                            onChange={handlePhoneChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && isPhoneValid && !loading) {
                                    handleSendOtp();
                                }
                            }}
                            maxLength={13}
                            style={{
                                width: '100%',
                                height: 52,
                                border: `1.5px solid ${error ? '#EF4444' : '#CBD5E1'}`,
                                borderRadius: 12,
                                padding: '0 16px',
                                fontSize: 18,
                                fontWeight: 600,
                                color: '#191F28',
                                backgroundColor: '#FFFFFF',
                                outline: 'none',
                                boxSizing: 'border-box',
                                letterSpacing: 0.5,
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                            }}
                            onFocus={(e) => {
                                if (!error) {
                                    e.currentTarget.style.borderColor = '#2563EB';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                }
                            }}
                            onBlur={(e) => {
                                if (!error) {
                                    e.currentTarget.style.borderColor = '#CBD5E1';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                            autoFocus
                        />

                        {error && (
                            <p style={{ color: '#EF4444', fontSize: 13, margin: '8px 0 0', fontWeight: 600 }}>
                                {error}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={loading || !isPhoneValid}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: isPhoneValid ? '#2563EB' : '#E2E8F0',
                                color: isPhoneValid ? '#FFFFFF' : '#94A3B8',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: isPhoneValid ? 'pointer' : 'default',
                                marginTop: 16,
                                transition: 'background-color 0.15s',
                            }}
                        >
                            {loading ? '인증문자 발송 중...' : '인증번호 문자 받기'}
                        </button>
                    </>
                )}

                {/* OTP 입력 */}
                {step === 'phone-verify' && (
                    <>
                        <button
                            type="button"
                            onClick={() => { setStep('phone-input'); setOtp(''); setError(null); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: 13.5,
                                fontWeight: 600,
                                color: '#64748B',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                marginLeft: -10,
                                marginBottom: 10,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                minHeight: 36,
                            }}
                        >
                            <ArrowLeft size={16} />
                            <span>번호 다시 입력</span>
                        </button>

                        <h2 style={{
                            margin: '0 0 6px 0',
                            fontSize: 21,
                            fontWeight: 800,
                            color: '#191F28',
                            letterSpacing: '-0.3px',
                        }}>
                            문자 인증번호 6자리 입력
                        </h2>
                        <p style={{
                            margin: '0 0 20px 0',
                            fontSize: 13.5,
                            color: '#64748B',
                            lineHeight: 1.5,
                        }}>
                            <strong style={{ color: '#2563EB' }}>{phone}</strong> 번호로 발송된<br />
                            인증번호 6자리를 입력하시면 바로 완료됩니다.
                        </p>

                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => {
                                const nextOtp = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setOtp(nextOtp);
                                if (error) setError(null);
                                if (nextOtp.length === 6 && !loading) {
                                    handleVerifyOtp(nextOtp);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && otp.length === 6 && !loading) {
                                    handleVerifyOtp();
                                }
                            }}
                            maxLength={6}
                            style={{
                                width: '100%',
                                height: 54,
                                border: `1.5px solid ${error ? '#EF4444' : '#CBD5E1'}`,
                                borderRadius: 12,
                                padding: '0 16px',
                                fontSize: 24,
                                fontWeight: 700,
                                color: '#191F28',
                                backgroundColor: '#FFFFFF',
                                textAlign: 'center',
                                letterSpacing: 10,
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                            }}
                            onFocus={(e) => {
                                if (!error) {
                                    e.currentTarget.style.borderColor = '#2563EB';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                }
                            }}
                            onBlur={(e) => {
                                if (!error) {
                                    e.currentTarget.style.borderColor = '#CBD5E1';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                            autoFocus
                        />

                        {error && (
                            <p style={{ color: '#EF4444', fontSize: 13, margin: '8px 0 0', fontWeight: 600 }}>
                                {error}
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => handleVerifyOtp()}
                            disabled={loading || otp.length < 6}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: otp.length >= 6 ? '#2563EB' : '#E2E8F0',
                                color: otp.length >= 6 ? '#FFFFFF' : '#94A3B8',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: otp.length >= 6 ? 'pointer' : 'default',
                                marginTop: 16,
                                transition: 'background-color 0.15s',
                            }}
                        >
                            {loading ? '인증 확인 중...' : '인증 완료하고 시작하기'}
                        </button>

                        <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={loading}
                            style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                color: '#64748B',
                                fontSize: 13.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginTop: 12,
                                textDecoration: 'underline',
                            }}
                        >
                            문자가 오지 않나요? 인증번호 다시 받기
                        </button>
                    </>
                )}
            </div>

            <style jsx global>{`
                @keyframes loginFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes loginSlideUp {
                    from {
                        opacity: 0;
                        transform: translate(-50%, calc(-50% + 24px));
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
            `}</style>
        </>,
        document.body
    );
}



'use client';

import { useState } from 'react';
import { X, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from './AuthProvider';

type LoginStep = 'main' | 'phone-input' | 'phone-verify';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { signInWithKakao, signInWithPhone, verifyOtp } = useAuth();
    const [step, setStep] = useState<LoginStep>('main');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        setStep('main');
        setPhone('');
        setOtp('');
        setError(null);
        setLoading(false);
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
    };

    // OTP 요청
    const handleSendOtp = async () => {
        if (phone.replace(/-/g, '').length < 10) {
            setError('올바른 휴대전화번호를 입력해주세요.');
            return;
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
    const handleVerifyOtp = async () => {
        if (otp.length < 6) {
            setError('인증번호 6자리를 입력해주세요.');
            return;
        }
        setLoading(true);
        setError(null);
        const result = await verifyOtp(phone, otp);
        setLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            handleClose();
        }
    };

    return (
        <>
            {/* 오버레이 */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(25, 31, 40, 0.5)',
                    zIndex: 9998,
                }}
            />

            {/* 모달 */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: '32px 24px',
                    width: 'calc(100% - 32px)',
                    maxWidth: 400,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    zIndex: 9999,
                    boxShadow: '0 20px 60px rgba(25, 31, 40, 0.24)',
                }}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={handleClose}
                    aria-label="닫기"
                    style={{
                        position: 'absolute',
                        top: 14,
                        right: 14,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#8B95A1',
                        padding: 8,
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                    }}
                >
                    <X size={20} />
                </button>

                {/* 메인 로그인 화면 */}
                {step === 'main' && (
                    <>
                        <div style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: 999,
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            fontSize: 12,
                            fontWeight: 700,
                            marginBottom: 10,
                        }}>
                            3초 간편 회원가입 · 로그인
                        </div>
                        <h2 style={{
                            margin: '0 0 6px 0',
                            fontSize: 21,
                            fontWeight: 800,
                            color: '#191F28',
                            letterSpacing: '-0.3px',
                        }}>
                            대대손손을 더 편하게 이용하세요
                        </h2>
                        <p style={{
                            margin: '0 0 18px 0',
                            fontSize: 13.5,
                            color: '#6B7684',
                            lineHeight: 1.5,
                        }}>
                            로그인 한 번으로 비교했던 장지 정보와 문의 내역을 언제든 이어볼 수 있습니다.
                        </p>

                        {/* 회원 전용 혜택 요약 박스 */}
                        <div style={{
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 12,
                            padding: '12px 14px',
                            marginBottom: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                        }}>
                            {[
                                '관심 시설 찜하기 및 1:1 비교함 자동 저장',
                                '시설 문의·상담 신청 시 연락처 자동 입력',
                                '내가 남긴 시설 질문·방문 이야기 모아보기',
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
                                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                                        {benefit}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* 카카오 로그인 버튼 */}
                        <button
                            onClick={signInWithKakao}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: '#FEE500',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                color: '#191F28',
                                marginBottom: 12,
                                transition: 'transform 0.1s, box-shadow 0.2s',
                            }}
                            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path
                                    d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.63 5.18l-.93 3.44c-.08.29.25.52.5.35l4.1-2.71c.23.02.46.03.7.03 4.42 0 8-2.79 8-6.21S13.42 1 9 1z"
                                    fill="#191F28"
                                />
                            </svg>
                            카카오로 3초 만에 시작하기
                        </button>

                        {/* 구분선 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '20px 0',
                            gap: 12,
                        }}>
                            <div style={{ flex: 1, height: 1, backgroundColor: '#E5E8EB' }} />
                            <span style={{ fontSize: 13, color: '#8B95A1' }}>또는</span>
                            <div style={{ flex: 1, height: 1, backgroundColor: '#E5E8EB' }} />
                        </div>

                        {/* 휴대전화 로그인 버튼 */}
                        <button
                            onClick={() => setStep('phone-input')}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                color: '#191F28',
                                transition: 'background-color 0.2s, border-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#191F28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" />
                            </svg>
                            휴대전화번호로 로그인
                        </button>
                    </>
                )}

                {/* 전화번호 입력 */}
                {step === 'phone-input' && (
                    <>
                        <button
                            onClick={() => { setStep('main'); setError(null); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: 14,
                                fontWeight: 500,
                                color: '#6B7684',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                marginLeft: -10,
                                marginBottom: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                minHeight: 38,
                            }}
                        >
                            <ArrowLeft size={16} />
                            <span>뒤로</span>
                        </button>

                        <h2 style={{
                            margin: '0 0 8px 0',
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#191F28',
                            letterSpacing: '-0.3px',
                        }}>
                            휴대전화 인증
                        </h2>
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: 14,
                            color: '#6B7684',
                            lineHeight: 1.5,
                        }}>
                            휴대전화번호를 입력하면<br />인증번호를 보내드립니다.
                        </p>

                        <input
                            type="tel"
                            placeholder="010-0000-0000"
                            value={phone}
                            onChange={handlePhoneChange}
                            maxLength={13}
                            style={{
                                width: '100%',
                                height: 52,
                                border: `1.5px solid ${error ? '#EF4444' : '#E2E8F0'}`,
                                borderRadius: 12,
                                padding: '0 16px',
                                fontSize: 18,
                                color: '#191F28',
                                backgroundColor: '#F8FAFC',
                                outline: 'none',
                                boxSizing: 'border-box',
                                letterSpacing: 1,
                                transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
                            }}
                            onFocus={(e) => {
                                if (!error) {
                                    e.currentTarget.style.borderColor = '#2563EB';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }
                            }}
                            onBlur={(e) => {
                                if (!error) {
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                                }
                            }}
                            autoFocus
                        />

                        {error && (
                            <p style={{ color: '#EF4444', fontSize: 13, margin: '8px 0 0', fontWeight: 500 }}>
                                {error}
                            </p>
                        )}

                        <button
                            onClick={handleSendOtp}
                            disabled={loading || phone.replace(/-/g, '').length < 10}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: phone.replace(/-/g, '').length >= 10 ? '#2563EB' : '#E5E8EB',
                                color: phone.replace(/-/g, '').length >= 10 ? '#FFFFFF' : '#8B95A1',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: phone.replace(/-/g, '').length >= 10 ? 'pointer' : 'default',
                                marginTop: 16,
                                transition: 'background-color 0.2s, transform 0.1s',
                            }}
                        >
                            {loading ? '전송 중...' : '인증번호 받기'}
                        </button>
                    </>
                )}

                {/* OTP 입력 */}
                {step === 'phone-verify' && (
                    <>
                        <button
                            onClick={() => { setStep('phone-input'); setOtp(''); setError(null); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: 14,
                                fontWeight: 500,
                                color: '#6B7684',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                marginLeft: -10,
                                marginBottom: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                minHeight: 38,
                            }}
                        >
                            <ArrowLeft size={16} />
                            <span>뒤로</span>
                        </button>

                        <h2 style={{
                            margin: '0 0 8px 0',
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#191F28',
                            letterSpacing: '-0.3px',
                        }}>
                            인증번호 입력
                        </h2>
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: 14,
                            color: '#6B7684',
                            lineHeight: 1.5,
                        }}>
                            {phone}으로 전송된<br />인증번호 6자리를 입력하세요.
                        </p>

                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            style={{
                                width: '100%',
                                height: 52,
                                border: `1.5px solid ${error ? '#EF4444' : '#E2E8F0'}`,
                                borderRadius: 12,
                                padding: '0 16px',
                                fontSize: 24,
                                fontWeight: 600,
                                color: '#191F28',
                                backgroundColor: '#F8FAFC',
                                textAlign: 'center',
                                letterSpacing: 8,
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
                            }}
                            onFocus={(e) => {
                                if (!error) {
                                    e.currentTarget.style.borderColor = '#2563EB';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                }
                            }}
                            onBlur={(e) => {
                                if (!error) {
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                                }
                            }}
                            autoFocus
                        />

                        {error && (
                            <p style={{ color: '#EF4444', fontSize: 13, margin: '8px 0 0', fontWeight: 500 }}>
                                {error}
                            </p>
                        )}

                        <button
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.length < 6}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: otp.length >= 6 ? '#2563EB' : '#E5E8EB',
                                color: otp.length >= 6 ? '#FFFFFF' : '#8B95A1',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: otp.length >= 6 ? 'pointer' : 'default',
                                marginTop: 16,
                                transition: 'background-color 0.2s, transform 0.1s',
                            }}
                        >
                            {loading ? '확인 중...' : '확인'}
                        </button>

                        <button
                            onClick={handleSendOtp}
                            style={{
                                width: '100%',
                                background: 'none',
                                border: 'none',
                                color: '#6B7684',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                                marginTop: 12,
                                textDecoration: 'underline',
                            }}
                        >
                            인증번호 재전송
                        </button>
                    </>
                )}
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translate(-50%, calc(-50% + 40px));
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
            `}</style>
        </>
    );
}

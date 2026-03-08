'use client';

import { useState } from 'react';
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
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: '32px 28px',
                    width: '100%',
                    maxWidth: 400,
                    zIndex: 9999,
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                }}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'none',
                        border: 'none',
                        fontSize: 20,
                        cursor: 'pointer',
                        color: '#868e96',
                        padding: 4,
                        lineHeight: 1,
                    }}
                >
                    ✕
                </button>

                {/* 메인 로그인 화면 */}
                {step === 'main' && (
                    <>
                        <h2 style={{
                            margin: '0 0 8px 0',
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#212529',
                        }}>
                            로그인
                        </h2>
                        <p style={{
                            margin: '0 0 28px 0',
                            fontSize: 14,
                            color: '#868e96',
                        }}>
                            관심 시설 저장, 가격 알림 등<br />편리한 서비스를 이용하세요.
                        </p>

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
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                color: '#191919',
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
                                    fill="#191919"
                                />
                            </svg>
                            카카오 계정으로 로그인
                        </button>

                        {/* 구분선 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '20px 0',
                            gap: 12,
                        }}>
                            <div style={{ flex: 1, height: 1, backgroundColor: '#e9ecef' }} />
                            <span style={{ fontSize: 13, color: '#adb5bd' }}>또는</span>
                            <div style={{ flex: 1, height: 1, backgroundColor: '#e9ecef' }} />
                        </div>

                        {/* 휴대전화 로그인 버튼 */}
                        <button
                            onClick={() => setStep('phone-input')}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #dee2e6',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                color: '#495057',
                                transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e9ecef')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#495057" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                color: '#868e96',
                                cursor: 'pointer',
                                padding: 0,
                                marginBottom: 16,
                            }}
                        >
                            ← 뒤로
                        </button>

                        <h2 style={{
                            margin: '0 0 8px 0',
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#212529',
                        }}>
                            휴대전화 인증
                        </h2>
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: 14,
                            color: '#868e96',
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
                                border: `2px solid ${error ? '#fa5252' : '#dee2e6'}`,
                                borderRadius: 12,
                                padding: '0 16px',
                                fontSize: 18,
                                outline: 'none',
                                boxSizing: 'border-box',
                                letterSpacing: 1,
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => {
                                if (!error) e.currentTarget.style.borderColor = '#5c3fbf';
                            }}
                            onBlur={(e) => {
                                if (!error) e.currentTarget.style.borderColor = '#dee2e6';
                            }}
                            autoFocus
                        />

                        {error && (
                            <p style={{ color: '#fa5252', fontSize: 13, margin: '8px 0 0' }}>
                                {error}
                            </p>
                        )}

                        <button
                            onClick={handleSendOtp}
                            disabled={loading || phone.replace(/-/g, '').length < 10}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: phone.replace(/-/g, '').length >= 10 ? '#5c3fbf' : '#e9ecef',
                                color: phone.replace(/-/g, '').length >= 10 ? 'white' : '#adb5bd',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: phone.replace(/-/g, '').length >= 10 ? 'pointer' : 'default',
                                marginTop: 16,
                                transition: 'background-color 0.2s',
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
                                color: '#868e96',
                                cursor: 'pointer',
                                padding: 0,
                                marginBottom: 16,
                            }}
                        >
                            ← 뒤로
                        </button>

                        <h2 style={{
                            margin: '0 0 8px 0',
                            fontSize: 22,
                            fontWeight: 700,
                            color: '#212529',
                        }}>
                            인증번호 입력
                        </h2>
                        <p style={{
                            margin: '0 0 24px 0',
                            fontSize: 14,
                            color: '#868e96',
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
                                border: `2px solid ${error ? '#fa5252' : '#dee2e6'}`,
                                borderRadius: 12,
                                padding: '0 16px',
                                fontSize: 24,
                                fontWeight: 600,
                                textAlign: 'center',
                                letterSpacing: 8,
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => {
                                if (!error) e.currentTarget.style.borderColor = '#5c3fbf';
                            }}
                            onBlur={(e) => {
                                if (!error) e.currentTarget.style.borderColor = '#dee2e6';
                            }}
                            autoFocus
                        />

                        {error && (
                            <p style={{ color: '#fa5252', fontSize: 13, margin: '8px 0 0' }}>
                                {error}
                            </p>
                        )}

                        <button
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.length < 6}
                            style={{
                                width: '100%',
                                height: 52,
                                backgroundColor: otp.length >= 6 ? '#5c3fbf' : '#e9ecef',
                                color: otp.length >= 6 ? 'white' : '#adb5bd',
                                border: 'none',
                                borderRadius: 12,
                                fontSize: 16,
                                fontWeight: 600,
                                cursor: otp.length >= 6 ? 'pointer' : 'default',
                                marginTop: 16,
                                transition: 'background-color 0.2s',
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
                                color: '#868e96',
                                fontSize: 14,
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

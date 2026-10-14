'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function TermsModal() {
    const { needsTerms, agreeToTerms, profile } = useAuth();
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [agreedMarketing, setAgreedMarketing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showTermsDetail, setShowTermsDetail] = useState(false);
    const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);

    if (!needsTerms) return null;

    const allRequired = agreedTerms && agreedPrivacy;

    const handleAgreeAll = () => {
        const newState = !(agreedTerms && agreedPrivacy && agreedMarketing);
        setAgreedTerms(newState);
        setAgreedPrivacy(newState);
        setAgreedMarketing(newState);
    };

    const handleSubmit = async () => {
        setLoading(true);
        if (!allRequired) {
            setAgreedTerms(true);
            setAgreedPrivacy(true);
            setAgreedMarketing(true);
            await agreeToTerms(true);
        } else {
            await agreeToTerms(agreedMarketing);
        }
        setLoading(false);
    };

    return (
        <>
            {/* 오버레이 */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.55)',
                zIndex: 10000,
                backdropFilter: 'blur(4px)',
            }} />

            {/* 모달 */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#FFFFFF', borderRadius: 24,
                width: 'calc(100% - 32px)', maxWidth: 420, maxHeight: '90vh',
                overflowY: 'auto',
                zIndex: 10001,
                boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
                border: '1px solid #F1F5F9',
                animation: 'termsSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {/* 상단 컬러바 */}
                <div style={{
                    height: 4, borderRadius: '24px 24px 0 0',
                    background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)',
                }} />

                <div style={{ padding: '28px 24px 24px' }}>
                    {/* 환영 메시지 */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 12px',
                            borderRadius: 999,
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            marginBottom: 12,
                        }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5" />
                            </svg>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', letterSpacing: '-0.2px' }}>
                                가입 완료 전 마지막 단계
                            </span>
                        </div>
                        <h2 style={{
                            margin: '0 0 6px', fontSize: 21, fontWeight: 800, color: '#191F28', letterSpacing: '-0.4px',
                        }}>
                            {profile?.nickname || '회원'}님, 환영합니다
                        </h2>
                        <p style={{
                            margin: 0, fontSize: 13.5, color: '#64748B', lineHeight: 1.55,
                        }}>
                            안전한 관심 시설 보관과 맞춤 상담 이용을 위해<br />
                            서비스 이용약관에 동의해 주세요.
                        </p>
                    </div>

                    {/* 전체 동의 */}
                    <button
                        type="button"
                        onClick={handleAgreeAll}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                            padding: '15px 16px', borderRadius: 14,
                            border: agreedTerms && agreedPrivacy && agreedMarketing ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
                            backgroundColor: agreedTerms && agreedPrivacy && agreedMarketing ? '#EFF6FF' : '#F8FAFC',
                            cursor: 'pointer', marginBottom: 12,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <CheckCircle checked={agreedTerms && agreedPrivacy && agreedMarketing} />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{
                                fontSize: 15, fontWeight: 800,
                                color: agreedTerms && agreedPrivacy && agreedMarketing ? '#1D4ED8' : '#191F28',
                            }}>
                                약관 전체 동의하기 (선택 포함)
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                                필수 및 선택 약관에 한 번에 동의합니다
                            </div>
                        </div>
                    </button>

                    <div style={{
                        height: 1, backgroundColor: '#F1F5F9', margin: '4px 0 10px',
                    }} />

                    {/* 서비스 이용약관 */}
                    <AgreementRow
                        checked={agreedTerms}
                        onChange={() => setAgreedTerms(!agreedTerms)}
                        label="서비스 이용약관 동의"
                        required
                        onDetail={() => setShowTermsDetail(!showTermsDetail)}
                    />
                    {showTermsDetail && (
                        <DetailBox text="본 서비스는 전국 장례·추모 시설 정보를 비교 및 안내합니다. 사용자는 본 서비스에서 제공하는 정보를 참고 목적으로 이용하며, 세부 계약 조건은 해당 시설과 직접 확인하시기 바랍니다." />
                    )}

                    {/* 개인정보 수집·이용 */}
                    <AgreementRow
                        checked={agreedPrivacy}
                        onChange={() => setAgreedPrivacy(!agreedPrivacy)}
                        label="개인정보 수집·이용 동의"
                        required
                        onDetail={() => setShowPrivacyDetail(!showPrivacyDetail)}
                    />
                    {showPrivacyDetail && (
                        <DetailBox text="수집 항목: 닉네임, 프로필 이미지 또는 휴대전화번호. 수집 목적: 회원 식별, 관심 시설 저장, 문의 및 상담 내역 관리. 보유 기간: 회원 탈퇴 시 즉시 파기." />
                    )}

                    {/* 마케팅 수신 */}
                    <AgreementRow
                        checked={agreedMarketing}
                        onChange={() => setAgreedMarketing(!agreedMarketing)}
                        label="장지 비용 혜택 및 가이드 알림 수신"
                        required={false}
                    />

                    {/* 가입 완료 버튼 (미체크 상태에서도 원탭으로 전체 동의 후 즉시 시작 가능) */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            width: '100%', height: 52, marginTop: 20,
                            borderRadius: 14, border: 'none',
                            backgroundColor: '#2563EB',
                            color: '#FFFFFF',
                            fontSize: 15.5, fontWeight: 800,
                            cursor: loading ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                            letterSpacing: '-0.2px',
                        }}
                    >
                        {loading
                            ? '저장 중...'
                            : allRequired
                                ? '동의하고 대대손손 시작하기'
                                : '전체 동의하고 3초 만에 시작하기'}
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes termsSlideUp {
                    from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }
            `}</style>
        </>
    );
}

function CheckCircle({ checked }: { checked: boolean }) {
    return (
        <div style={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
            border: checked ? 'none' : '1.5px solid #CBD5E1',
            backgroundColor: checked ? '#2563EB' : '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
        }}>
            {checked && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )}
        </div>
    );
}

function AgreementRow({ checked, onChange, label, required, onDetail }: {
    checked: boolean;
    onChange: () => void;
    label: string;
    required: boolean;
    onDetail?: () => void;
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 4px',
        }}>
            <button
                type="button"
                onClick={onChange}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    textAlign: 'left',
                }}
            >
                <CheckCircle checked={checked} />
                <span style={{ fontSize: 13.5, color: '#334155', fontWeight: 600 }}>
                    <span style={{
                        color: required ? '#2563EB' : '#94A3B8',
                        fontSize: 12, fontWeight: 800, marginRight: 5,
                    }}>
                        {required ? '[필수]' : '[선택]'}
                    </span>
                    {label}
                </span>
            </button>
            {onDetail && (
                <button
                    type="button"
                    onClick={onDetail}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#94A3B8', fontSize: 12, fontWeight: 600, textDecoration: 'underline',
                        padding: '4px 0', flexShrink: 0,
                    }}
                >
                    내용보기
                </button>
            )}
        </div>
    );
}

function DetailBox({ text }: { text: string }) {
    return (
        <div style={{
            backgroundColor: '#F8FAFC', borderRadius: 10,
            border: '1px solid #E2E8F0',
            padding: '12px 14px', margin: '2px 4px 8px',
            fontSize: 12, color: '#64748B', lineHeight: 1.6,
        }}>
            {text}
        </div>
    );
}

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
        if (!allRequired) return;
        setLoading(true);
        await agreeToTerms(agreedMarketing);
        setLoading(false);
    };

    return (
        <>
            {/* 오버레이 */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                zIndex: 10000,
                backdropFilter: 'blur(4px)',
            }} />

            {/* 모달 */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'white', borderRadius: 20,
                width: '100%', maxWidth: 420, maxHeight: '90vh',
                overflowY: 'auto',
                zIndex: 10001,
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35)',
                animation: 'termsSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
                {/* 상단 컬러바 */}
                <div style={{
                    height: 4, borderRadius: '20px 20px 0 0',
                    background: 'linear-gradient(90deg, #5c3fbf 0%, #7c5ce0 50%, #9b7bf4 100%)',
                }} />

                <div style={{ padding: '28px 24px 24px' }}>
                    {/* 환영 메시지 */}
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #5c3fbf, #7c5ce0)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 4px 16px rgba(92, 63, 191, 0.3)',
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <h2 style={{
                            margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#212529',
                        }}>
                            환영합니다!
                        </h2>
                        <p style={{
                            margin: 0, fontSize: 14, color: '#868e96', lineHeight: 1.5,
                        }}>
                            {profile?.nickname || '사용자'}님, 서비스 이용을 위해<br />
                            아래 약관에 동의해주세요.
                        </p>
                    </div>

                    {/* 전체 동의 */}
                    <button
                        onClick={handleAgreeAll}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 16px', borderRadius: 12, border: 'none',
                            backgroundColor: agreedTerms && agreedPrivacy && agreedMarketing ? '#f3f0ff' : '#f8f9fa',
                            cursor: 'pointer', marginBottom: 12,
                            transition: 'background-color 0.2s',
                        }}
                    >
                        <CheckCircle checked={agreedTerms && agreedPrivacy && agreedMarketing} accent />
                        <span style={{
                            fontSize: 16, fontWeight: 700,
                            color: agreedTerms && agreedPrivacy && agreedMarketing ? '#5c3fbf' : '#212529',
                        }}>
                            전체 동의하기
                        </span>
                    </button>

                    <div style={{
                        height: 1, backgroundColor: '#e9ecef', margin: '4px 0 12px',
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
                        <DetailBox text="본 서비스는 전국 장례 시설 정보를 제공합니다. 사용자는 본 서비스에서 제공하는 정보를 참고 목적으로만 이용해야 하며, 시설 정보의 정확성은 해당 시설에 직접 확인하시기 바랍니다. 부정한 목적으로의 이용, 허위 정보 등록 등은 제재될 수 있습니다." />
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
                        <DetailBox text="수집 항목: 카카오 닉네임, 프로필 사진 또는 휴대전화번호. 수집 목적: 회원 식별 및 서비스 제공. 보유 기간: 회원 탈퇴 시까지. 동의를 거부하실 수 있으나, 거부 시 서비스 이용이 제한됩니다." />
                    )}

                    {/* 마케팅 수신 */}
                    <AgreementRow
                        checked={agreedMarketing}
                        onChange={() => setAgreedMarketing(!agreedMarketing)}
                        label="마케팅 정보 수신 동의"
                        required={false}
                    />

                    {/* 가입 완료 버튼 */}
                    <button
                        onClick={handleSubmit}
                        disabled={!allRequired || loading}
                        style={{
                            width: '100%', height: 52, marginTop: 24,
                            borderRadius: 12, border: 'none',
                            background: allRequired
                                ? 'linear-gradient(135deg, #5c3fbf, #7c5ce0)'
                                : '#e9ecef',
                            color: allRequired ? 'white' : '#adb5bd',
                            fontSize: 16, fontWeight: 700,
                            cursor: allRequired ? 'pointer' : 'default',
                            transition: 'all 0.3s',
                            boxShadow: allRequired ? '0 4px 16px rgba(92, 63, 191, 0.3)' : 'none',
                        }}
                    >
                        {loading ? '처리 중...' : '가입 완료'}
                    </button>
                </div>
            </div>

            <style jsx global>{`
                @keyframes termsSlideUp {
                    from { opacity: 0; transform: translate(-50%, calc(-50% + 30px)); }
                    to { opacity: 1; transform: translate(-50%, -50%); }
                }
            `}</style>
        </>
    );
}

function CheckCircle({ checked, accent }: { checked: boolean; accent?: boolean }) {
    return (
        <div style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            border: checked ? 'none' : '2px solid #ced4da',
            backgroundColor: checked ? (accent ? '#5c3fbf' : '#5c3fbf') : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
        }}>
            {checked && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
            padding: '10px 4px',
        }}>
            <button
                onClick={onChange}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
            >
                <CheckCircle checked={checked} />
                <span style={{ fontSize: 14, color: '#495057' }}>
                    <span style={{
                        color: required ? '#5c3fbf' : '#868e96',
                        fontSize: 12, fontWeight: 600, marginRight: 4,
                    }}>
                        {required ? '[필수]' : '[선택]'}
                    </span>
                    {label}
                </span>
            </button>
            {onDetail && (
                <button
                    onClick={onDetail}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#adb5bd', fontSize: 12, textDecoration: 'underline',
                        padding: '4px 0',
                    }}
                >
                    보기
                </button>
            )}
        </div>
    );
}

function DetailBox({ text }: { text: string }) {
    return (
        <div style={{
            backgroundColor: '#f8f9fa', borderRadius: 8,
            padding: '12px 14px', margin: '0 4px 8px',
            fontSize: 12, color: '#868e96', lineHeight: 1.6,
        }}>
            {text}
        </div>
    );
}

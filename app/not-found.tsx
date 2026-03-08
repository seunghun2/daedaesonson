import Link from 'next/link';

export default function NotFound() {
    return (
        <>
            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.2); opacity: 0.15; }
                }
                .star {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    background: #fff;
                    border-radius: 50%;
                    animation: twinkle ease-in-out infinite;
                }
                .circle-deco {
                    position: absolute;
                    border-radius: 50%;
                    animation: pulse 4s ease-in-out infinite;
                }
                .not-found-btn {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .not-found-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                }
            `}</style>
            <div style={{
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', padding: '20px', textAlign: 'center',
                background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #1a3a5c 100%)',
            }}>
                {/* 별 파티클들 */}
                {Array.from({ length: 40 }).map((_, i) => (
                    <span key={i} className="star" style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${1 + Math.random() * 3}px`,
                        height: `${1 + Math.random() * 3}px`,
                        animationDuration: `${2 + Math.random() * 3}s`,
                        animationDelay: `${Math.random() * 3}s`,
                    }} />
                ))}

                {/* 장식 원 */}
                <div className="circle-deco" style={{
                    top: '10%', left: '-5%', width: '200px', height: '200px',
                    background: 'rgba(45, 106, 79, 0.4)',
                }} />
                <div className="circle-deco" style={{
                    bottom: '5%', right: '-8%', width: '300px', height: '300px',
                    background: 'rgba(26, 58, 92, 0.5)', animationDelay: '2s',
                }} />
                <div className="circle-deco" style={{
                    top: '60%', left: '10%', width: '80px', height: '80px',
                    background: 'rgba(64, 145, 108, 0.3)', animationDelay: '1s',
                }} />

                {/* 메인 콘텐츠 */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* 큰 404 */}
                    <div style={{
                        fontSize: 'clamp(120px, 25vw, 220px)',
                        fontWeight: 900,
                        color: 'rgba(255,255,255,0.08)',
                        lineHeight: 1,
                        letterSpacing: '-8px',
                        userSelect: 'none',
                        animation: 'float 6s ease-in-out infinite',
                    }}>
                        404
                    </div>



                    {/* 텍스트 */}
                    <h1 style={{
                        fontSize: 'clamp(20px, 4vw, 28px)',
                        fontWeight: 700,
                        color: '#fff',
                        margin: '0 0 12px 0',
                    }}>
                        길을 잃으셨나요?
                    </h1>
                    <p style={{
                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                        color: 'rgba(255,255,255,0.6)',
                        margin: '0 auto 40px auto',
                        maxWidth: '400px',
                    }}>
                        요청하신 페이지가 존재하지 않거나 이동되었습니다.
                    </p>

                    {/* 버튼 */}
                    <Link href="/" className="not-found-btn" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '14px 32px', borderRadius: '50px',
                        background: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        color: '#fff', fontSize: '15px', fontWeight: 600,
                        textDecoration: 'none',
                    }}>
                        홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </>
    );
}

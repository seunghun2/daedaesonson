'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('Runtime error:', error);
    }, [error]);

    return (
        <>
            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 1; }
                }
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    75% { transform: rotate(5deg); }
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
                .error-btn {
                    transition: transform 0.2s, box-shadow 0.2s;
                    cursor: pointer;
                }
                .error-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                }
            `}</style>
            <div style={{
                position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', padding: '20px', textAlign: 'center',
                background: 'linear-gradient(135deg, #4a1942 0%, #553555 40%, #1a3a5c 100%)',
            }}>
                {Array.from({ length: 30 }).map((_, i) => (
                    <span key={i} className="star" style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${1 + Math.random() * 3}px`,
                        height: `${1 + Math.random() * 3}px`,
                        animationDuration: `${2 + Math.random() * 3}s`,
                        animationDelay: `${Math.random() * 3}s`,
                    }} />
                ))}

                <div className="circle-deco" style={{
                    top: '15%', right: '-5%', width: '200px', height: '200px',
                    background: 'rgba(74, 25, 66, 0.5)',
                }} />
                <div className="circle-deco" style={{
                    bottom: '10%', left: '-5%', width: '250px', height: '250px',
                    background: 'rgba(26, 58, 92, 0.4)', animationDelay: '2s',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        fontSize: '64px', marginBottom: '8px',
                        animation: 'shake 2s ease-in-out infinite',
                    }}>
                        ⚠️
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(20px, 4vw, 28px)',
                        fontWeight: 700, color: '#fff',
                        margin: '0 0 12px 0',
                    }}>
                        문제가 발생했습니다
                    </h1>
                    <p style={{
                        fontSize: 'clamp(14px, 2.5vw, 16px)',
                        color: 'rgba(255,255,255,0.6)',
                        margin: '0 0 40px 0',
                        maxWidth: '400px',
                    }}>
                        일시적인 오류가 발생했습니다. 다시 시도해 주세요.
                    </p>

                    <button onClick={reset} className="error-btn" style={{
                        padding: '14px 32px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.25)',
                        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                        color: '#fff', fontSize: '15px', fontWeight: 600,
                    }}>
                        🔄 다시 시도하기
                    </button>
                </div>
            </div>
        </>
    );
}

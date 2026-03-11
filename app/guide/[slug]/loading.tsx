export default function BlogDetailLoading() {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100dvh',
            backgroundColor: 'white',
        }}>
            <div style={{
                width: 32,
                height: 32,
                border: '3px solid #EDE9FF',
                borderTop: '3px solid #1D0098',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

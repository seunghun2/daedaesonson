/** @type {import('next').NextConfig} */
const nextConfig = {
    // reactCompiler: true,
    typescript: {
        ignoreBuildErrors: false,
    },
    images: {
        // WebP 자동 변환 (원본 대비 70~90% 압축)
        formats: ['image/webp', 'image/avif'],
        // 반응형 이미지 사이즈 프리셋
        deviceSizes: [640, 750, 828, 1080, 1200],
        imageSizes: [16, 32, 48, 64, 96, 128, 256],
        // 이미지 캐시 TTL (60일)
        minimumCacheTTL: 5184000,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'jbydmhfuqnpukfutvrgs.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    serverExternalPackages: ['@prisma/client', 'prisma'],
    // 🔗 한글 URL → 영문 라우트 매핑 (Next.js 16 Turbopack은 한글 디렉토리 미지원)
    async rewrites() {
        return [
            {
                source: '/%EC%A7%80%EC%97%AD/:slug*',
                destination: '/region/:slug*',
            },
        ];
    },
    // 🚀 번들 최적화
    experimental: {
        optimizePackageImports: ['@mantine/core', '@mantine/hooks', '@turf/helpers', '@turf/union', '@turf/center-of-mass', 'lucide-react'],
    },
};

export default nextConfig;

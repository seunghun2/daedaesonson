/** @type {import('next').NextConfig} */
const nextConfig = {
    // reactCompiler: true,
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'jbydmhfuqnpukfutvrgs.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;

'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const AuthProvider = dynamic(
    () => import('./AuthProvider').then(mod => ({ default: mod.AuthProvider })),
    { ssr: false }
);

const TermsModal = dynamic(() => import('./TermsModal'), { ssr: false });

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <TermsModal />
        </AuthProvider>
    );
}

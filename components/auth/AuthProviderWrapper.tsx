'use client';

import { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import TermsModal from './TermsModal';

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <TermsModal />
        </AuthProvider>
    );
}

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const UTM_STORAGE_KEY = 'dds_utm_attribution';
const UTM_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export default function AccessLogger() {
  const pathname = usePathname();
  const lastLoggedRef = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return;
    if (!pathname || pathname.startsWith('/admin')) return;

    const search = window.location.search || '';
    const fullPath = `${pathname}${search}`;
    if (lastLoggedRef.current === fullPath) return;
    lastLoggedRef.current = fullPath;

    // 광고 유입 파라미터(n_query, utm_term 등) 7일 보존
    try {
      const params = new URLSearchParams(search);
      const nQuery = params.get('n_query') || params.get('n_keyword');
      const utmSource = params.get('utm_source') || (params.get('n_media') ? 'naver_ad' : (params.get('gclid') ? 'google_ad' : null));
      const utmTerm = params.get('utm_term') || nQuery;
      if (utmSource || utmTerm) {
        localStorage.setItem(
          UTM_STORAGE_KEY,
          JSON.stringify({
            utm_source: utmSource,
            utm_term: utmTerm,
            n_query: nQuery,
            landing_page: fullPath,
            captured_at: new Date().toISOString(),
            expires_at: Date.now() + UTM_EXPIRY_MS,
          })
        );
      }
    } catch {
      // ignore storage errors
    }

    fetch('/api/access-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: fullPath.slice(0, 500),
        referer: (document.referrer || '').slice(0, 1000),
        userAgent: (navigator.userAgent || '').slice(0, 500),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}

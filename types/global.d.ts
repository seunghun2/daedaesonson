/* eslint-disable @typescript-eslint/no-explicit-any */

// Google Analytics gtag
interface GtagEventParams {
    [key: string]: any;
}

// Window 인터페이스 확장
declare global {
    interface Window {
        gtag: (command: string, ...args: any[]) => void;
        dataLayer: any[];
        requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
        cancelIdleCallback: (handle: number) => void;
    }
}

interface IdleRequestCallback {
    (deadline: IdleDeadline): void;
}

interface IdleDeadline {
    didTimeout: boolean;
    timeRemaining: () => number;
}

interface IdleRequestOptions {
    timeout?: number;
}

export { };

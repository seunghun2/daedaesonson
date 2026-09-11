// Simple in-memory rate limiter for serverless
// Note: Per-instance only (not shared across Vercel instances), but still prevents single-origin abuse

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}, 60000);

export function rateLimit({
    key,
    limit,
    windowMs,
}: {
    key: string;
    limit: number;
    windowMs: number;
}): { success: boolean; remaining: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return { success: true, remaining: limit - 1 };
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0 };
    }

    entry.count++;
    return { success: true, remaining: limit - entry.count };
}

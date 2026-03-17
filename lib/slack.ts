/**
 * 대대손손 Slack 알림 시스템
 * 
 * 채널별 Webhook URL 환경변수:
 * SLACK_02_01_CHATBOT    → 02_01_챗봇상담
 * SLACK_02_02_RECOMMEND  → 02_02_맞춤추천
 * SLACK_02_03_CONSULT    → 02_03_시설상담
 * SLACK_02_04_INQUIRY    → 02_04_댓글문의
 * SLACK_02_05_CORRECTION → 02_05_정보수정
 * SLACK_02_06_REVIEW     → 02_06_이용후기
 * SLACK_02_07_PARTNERSHIP→ 02_07_제휴문의
 * SLACK_02_99_ERROR      → 02_99_에러알림
 */

type SlackChannel =
    | 'chatbot'
    | 'recommend'
    | 'consult'
    | 'inquiry'
    | 'correction'
    | 'review'
    | 'partnership'
    | 'error';

const WEBHOOK_MAP: Record<SlackChannel, string> = {
    chatbot: 'SLACK_02_01_CHATBOT',
    recommend: 'SLACK_02_02_RECOMMEND',
    consult: 'SLACK_02_03_CONSULT',
    inquiry: 'SLACK_02_04_INQUIRY',
    correction: 'SLACK_02_05_CORRECTION',
    review: 'SLACK_02_06_REVIEW',
    partnership: 'SLACK_02_07_PARTNERSHIP',
    error: 'SLACK_02_99_ERROR',
};

export async function sendSlack(channel: SlackChannel, message: string): Promise<boolean> {
    const envKey = WEBHOOK_MAP[channel];
    const webhookUrl = process.env[envKey];

    if (!webhookUrl) {
        console.warn(`[Slack] ${envKey} 환경변수 미설정 → 알림 생략`);
        return false;
    }

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }),
        });
        if (!res.ok) {
            console.error(`[Slack] ${channel} 전송 실패:`, res.status);
            return false;
        }
        return true;
    } catch (e) {
        console.error(`[Slack] ${channel} 전송 에러:`, e);
        return false;
    }
}

// 에러 알림 헬퍼
export async function sendSlackError(apiName: string, error: unknown): Promise<void> {
    const msg = error instanceof Error ? error.message : String(error);
    await sendSlack('error', `🚨 *API 에러 발생*\n• API: ${apiName}\n• 에러: ${msg}\n• 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
}

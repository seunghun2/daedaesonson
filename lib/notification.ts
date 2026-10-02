/**
 * 대대손손 통합 알림 서비스 (Notification Service)
 * 
 * 1. 카카오 알림톡 (고객 접수 확인 알림)
 * 2. 대체 LMS/SMS 발송 (카카오 미사용자/전송실패 시)
 * 3. 관리자 실시간 Slack & SMS 듀얼 노티
 * 
 * 연동 프로바이더: Solapi (구 쿨에스엠에스) v4 REST API
 * 환경변수 미설정 시 안전하게 Mock 로깅 후 진행 (서비스 중단 방지)
 */

import { sendSlack, escapeSlack } from '@/lib/slack';
import crypto from 'crypto';

interface ConsultNotificationParams {
    consultId: string | number;
    facilityName: string;
    customerName: string;
    customerPhone: string;
    preferredTime?: string;
    question?: string;
    consultMethod?: string;
    message?: string;
}

/**
 * Solapi v4 API 인증 헤더 생성 (HMAC-SHA256)
 */
function getSolapiAuthHeaders(apiKey: string, apiSecret: string): Record<string, string> {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(date + salt)
        .digest('hex');

    return {
        'Content-Type': 'application/json',
        'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
    };
}

/**
 * 카카오 알림톡/LMS 발송 기본 함수
 */
export async function sendAlimtalk(params: {
    to: string;
    text: string;
    templateId?: string;
    variables?: Record<string, string>;
}): Promise<{ success: boolean; messageId?: string; mock?: boolean }> {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const sender = process.env.SOLAPI_SENDER_PHONE;
    const pfId = process.env.SOLAPI_PFID; // 카카오톡 채널 발신프로필 ID

    const cleanTo = params.to.replace(/[^0-9]/g, '');

    // 필수 환경변수 부재 시 Mock 모드로 동작 (서비스 에러 방지)
    if (!apiKey || !apiSecret || !sender) {
        console.log(`[Notification MOCK] 알림 발송 시뮬레이션 (${cleanTo}):\n${params.text}`);
        return { success: true, mock: true };
    }

    try {
        const url = 'https://api.solapi.com/messages/v4/send';
        const headers = getSolapiAuthHeaders(apiKey, apiSecret);

        const messagePayload: any = {
            to: cleanTo,
            from: sender.replace(/[^0-9]/g, ''),
            text: params.text,
        };

        // 카카오 알림톡 템플릿이 설정된 경우
        if (pfId && params.templateId) {
            messagePayload.kakaoOptions = {
                pfId,
                templateId: params.templateId,
                variables: params.variables || {},
                disableSms: false, // 실패 시 SMS 대체 발송
            };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message: messagePayload })
        });

        const data = await res.json();
        if (!res.ok) {
            console.error('[Notification] Solapi API 전송 실패:', data);
            return { success: false };
        }

        return { success: true, messageId: data.groupInfo?._id || data.messageId };
    } catch (err) {
        console.error('[Notification] 발송 통신 에러:', err);
        return { success: false };
    }
}

/**
 * 시설 상담 신청 시 듀얼 노티피케이션 (고객 안내 + 관리자 슬랙)
 */
export async function sendConsultNotification(params: ConsultNotificationParams): Promise<void> {
    const {
        consultId,
        facilityName,
        customerName,
        customerPhone,
        preferredTime = '시간 무관',
        question = '가격 및 상세 안내',
        consultMethod = '전화 상담',
        message
    } = params;

    const methodLabel = consultMethod === 'phone' ? '전화 상담' : consultMethod === 'field' ? '방문 상담' : consultMethod;

    // 1. 관리자 Slack 실시간 알림 (비동기)
    sendSlack(
        'consult',
        `📞 *새 시설 상담 신청 (알림 파이프라인)*\n` +
        `• 시설명: *${escapeSlack(facilityName)}*\n` +
        `• 고객명: ${escapeSlack(customerName)}\n` +
        `• 연락처: \`${escapeSlack(customerPhone)}\`\n` +
        `• 희망시간: ${escapeSlack(preferredTime)}\n` +
        `• 상담방법: ${escapeSlack(methodLabel)}\n` +
        `• 문의사항: ${escapeSlack(question)}\n` +
        `• 메시지: ${escapeSlack(message || '없음')}\n` +
        `• 접수번호: #${consultId}`
    ).catch(e => console.error('[Notification] Slack 전송 실패:', e));

    // 2. 고객 안내 알림톡/LMS 발송
    const customerNoticeText =
        `[대대손손] 상담 신청이 정상 접수되었습니다.\n\n` +
        `안녕하세요, ${customerName} 고객님.\n` +
        `신청해주신 [${facilityName}] 상담 안내입니다.\n\n` +
        `• 신청 시설: ${facilityName}\n` +
        `• 상담 방식: ${methodLabel}\n` +
        `• 희망 시간: ${preferredTime}\n\n` +
        `전문 상담사가 접수 내용을 확인 후 기재해주신 희망 시간에 맞춰 빠르고 친절하게 안내드리겠습니다.\n\n` +
        `궁금하신 사항은 고객센터(1600-0000)로 문의바랍니다.\n감사합니다.`;

    sendAlimtalk({
        to: customerPhone,
        text: customerNoticeText,
        templateId: process.env.SOLAPI_TEMPLATE_CONSULT,
        variables: {
            '#{고객명}': customerName,
            '#{시설명}': facilityName,
            '#{상담방식}': methodLabel,
            '#{희망시간}': preferredTime,
        }
    }).catch(e => console.error('[Notification] 고객 알림 발송 실패:', e));
}

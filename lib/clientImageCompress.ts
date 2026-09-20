/**
 * 브라우저 캔버스를 이용한 클라이언트 이미지 압축 유틸리티
 * - 최대 해상도 제한 (기본 1200px)
 * - JPEG 0.8 품질 압축으로 용량 90% 이상 절감
 * - Vercel Serverless Payload 한도(4.5MB) 초과 방지
 */
export async function compressImageFile(
    file: File,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;

        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;

            if (width > maxWidth || height > maxHeight) {
                if (width / height > maxWidth / maxHeight) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                } else {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // Canvas를 지원하지 않는 환경 fallback
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('FileReader error'));
                reader.readAsDataURL(file);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('이미지 로딩 실패'));
        };
    });
}

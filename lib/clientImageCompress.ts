/**
 * 클라이언트 브라우저 캔버스를 이용한 고효율 이미지 압축
 * - 원본 5~10MB 사진을 1200px 이하 / JPEG 70%로 리사이즈하여 50~100KB로 압축
 * - Vercel 4.5MB Payload 한도 초과(413) 방지 및 네트워크 전송 속도 극대화
 */
export function compressImageFile(file: File, maxDim = 1200, quality = 0.7): Promise<string> {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            resolve('');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const rawDataUrl = e.target?.result as string;
            if (!rawDataUrl) {
                resolve('');
                return;
            }

            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                } else {
                    resolve(rawDataUrl);
                }
            };
            img.onerror = () => resolve(rawDataUrl);
            img.src = rawDataUrl;
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
}

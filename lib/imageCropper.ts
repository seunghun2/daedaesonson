
/**
 * 이미지(스크린샷)를 분석하여 격자(Grid) 형태의 사진들을 자동으로 분리해주는 유틸리티
 */
export const cropImagesFromScreenshot = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject('Canvas context not available');
                return;
            }

            // 1. 캔버스에 원본 그리기
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const { width, height } = canvas;
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // 2. 투영(Projection) 분석을 통한 여백 감지
            // 배경색 추정 (좌상단 픽셀)
            const bgColor = { r: data[0], g: data[1], b: data[2] };
            const isBackground = (r: number, g: number, b: number) => {
                // 색상 차이가 적으면 배경으로 간주 (Threshold: 30)
                return Math.abs(r - bgColor.r) < 30 &&
                    Math.abs(g - bgColor.g) < 30 &&
                    Math.abs(b - bgColor.b) < 30;
            };

            // Y축 스캔 (Horizontal Slices)
            const rowIsContent = new Array(height).fill(false);
            for (let y = 0; y < height; y++) {
                let contentPixels = 0;
                for (let x = 0; x < width; x += 5) { // 5px 단위로 샘플링 (속도 최적화)
                    const idx = (y * width + x) * 4;
                    if (!isBackground(data[idx], data[idx + 1], data[idx + 2])) {
                        contentPixels++;
                    }
                }
                // 해당 줄의 10% 이상이 배경이 아니면 콘텐츠 구간으로 간주
                if (contentPixels > width * 0.1) rowIsContent[y] = true;
            }

            // Y축 구간 추출
            const yRanges: { start: number, end: number }[] = [];
            let inContent = false;
            let startY = 0;

            for (let y = 0; y < height; y++) {
                if (rowIsContent[y] && !inContent) {
                    inContent = true;
                    startY = y;
                } else if (!rowIsContent[y] && inContent) {
                    inContent = false;
                    // 높이가 50px 이상인 것만 유효
                    if (y - startY > 50) yRanges.push({ start: startY, end: y });
                }
            }

            const croppedUrls: string[] = [];

            // 3. 각 Y구간 내에서 X축 스캔 (Vertical Slices)
            yRanges.forEach(yRange => {
                const rangeHeight = yRange.end - yRange.start;
                const colIsContent = new Array(width).fill(false);

                for (let x = 0; x < width; x++) {
                    let contentPixels = 0;
                    for (let y = yRange.start; y < yRange.end; y += 5) {
                        const idx = (y * width + x) * 4;
                        if (!isBackground(data[idx], data[idx + 1], data[idx + 2])) {
                            contentPixels++;
                        }
                    }
                    // 해당 열의 5% 이상이 내용이면
                    if (contentPixels > rangeHeight * 0.05) colIsContent[x] = true;
                }

                // X축 구간 추출 및 크롭
                let inCol = false;
                let startX = 0;

                for (let x = 0; x < width; x++) {
                    if (colIsContent[x] && !inCol) {
                        inCol = true;
                        startX = x;
                    } else if (!colIsContent[x] && inCol) {
                        inCol = false;
                        const w = x - startX;
                        const h = rangeHeight;

                        // 너무 작은 조각(아이콘 등)은 무시 (100x100 이상)
                        if (w > 100 && h > 100) {
                            const subCanvas = document.createElement('canvas');
                            subCanvas.width = w;
                            subCanvas.height = h;
                            const subCtx = subCanvas.getContext('2d');
                            if (subCtx) {
                                subCtx.drawImage(canvas, startX, yRange.start, w, h, 0, 0, w, h);
                                croppedUrls.push(subCanvas.toDataURL('image/jpeg', 0.9));
                            }
                        }
                    }
                }
            });

            // 만약 아무것도 못 찾았으면 원본 그대로 리턴하지만, 보통은 찾음
            if (croppedUrls.length === 0) {
                resolve([img.src]);
            } else {
                resolve(croppedUrls);
            }
        };

        img.onerror = (e) => reject(e);
    });
};

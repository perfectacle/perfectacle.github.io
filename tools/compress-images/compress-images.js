import fg from 'fast-glob';
import fs from 'fs/promises'; // fs/promises 사용
import path from 'path';
import { fileURLToPath } from 'url';

// Imagemin 플러그인 (기존 사용하던 것 그대로)
import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';

// 리사이징을 위한 Sharp
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const directoryPath = path.resolve(path.dirname(__filename), '../../source');

// ⭐ 블로그용 최대 가로 폭 설정
const MAX_WIDTH = 1600;

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const dm = i < 2 ? 0 : 2;
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const run = async () => {
  console.log(`🚀 Imagemin + Sharp 조합 시작 (최대 너비: ${MAX_WIDTH}px)...`);

  try {
    const files = await fg(`${directoryPath}/**/*.{jpg,jpeg,png}`, {
      onlyFiles: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    });

    let totalSavedBytes = 0;

    for (const filePath of files) {
      try {
        const ext = path.extname(filePath).toLowerCase();
        const originalBuffer = await fs.readFile(filePath);
        const originalSize = originalBuffer.length;

        // 1단계: Sharp로 리사이징 및 기본 압축 적용 (imagemin으로 넘길 준비)
        let sharpPipeline = sharp(originalBuffer);
        const metadata = await sharpPipeline.metadata();
        let resizedBuffer;
        let isResized = false;

        if (metadata.width > MAX_WIDTH) {
          sharpPipeline = sharpPipeline.resize({ width: MAX_WIDTH });
          isResized = true;
        }

        // Sharp 출력 포맷을 설정하여 Buffer로 변환
        if (ext === '.jpg' || ext === '.jpeg') {
          // Sharp의 Mozjpeg 옵션 적용 (Imagemin 대신 sharp가 처리)
          resizedBuffer = await sharpPipeline.jpeg({ quality: 75, mozjpeg: true }).toBuffer();
        } else if (ext === '.png') {
          // PNG는 Imagemin-pngquant가 더 강력하므로 임시 PNG Buffer 생성
          resizedBuffer = await sharpPipeline.png().toBuffer();
        } else {
             continue; // JPG, PNG 외에는 처리하지 않음
        }

        // 2단계: Imagemin으로 최종 압축 (PNG 파일에만 적용)
        let optimizedBuffer = resizedBuffer;
        const plugins = [];

        if (ext === '.png') {
            // PNG만 pngquant 사용 (JPEG는 이미 sharp에서 처리했으므로 생략)
            plugins.push(imageminPngquant({ quality: [0.6, 0.8] }));
            optimizedBuffer = await imagemin.buffer(resizedBuffer, { plugins });
        }

        // JPEG는 1단계에서 이미 최적화된 상태이므로, resizedBuffer가 곧 optimizedBuffer가 됩니다.

        const optimizedSize = optimizedBuffer.length;

        // 최종 파일 덮어쓰기 및 결과 출력
        if (optimizedSize < originalSize) {
          await fs.writeFile(filePath, optimizedBuffer);
          const saved = originalSize - optimizedSize;
          totalSavedBytes += saved;
          const percent = ((saved / originalSize) * 100).toFixed(1);

          console.log(`✅ ${path.basename(filePath)}`);
          if (isResized) {
              console.log(`   해상도: ${metadata.width}x${metadata.height} → ${MAX_WIDTH}px 너비로 리사이징`);
          }
          console.log(`   용량: ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (-${percent}%)`);
          console.log('--------------------------------------------------');
        } else {
            console.log(`⏩ [스킵] ${path.basename(filePath)}: 변화 없음`);
        }

      } catch (e) {
        console.error(`❌ [실패] ${path.basename(filePath)}:`, e.message);
      }
    }

    console.log('--------------------------------------------------');
    console.log(`🎉 작업 완료! 총 절약한 용량: **${formatBytes(totalSavedBytes)}**`);

  } catch (err) {
    console.error('Error:', err);
  }
};

run().catch(console.error);
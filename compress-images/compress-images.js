import fg from 'fast-glob';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.resolve(process.cwd(), '..');

const run = async () => {
  try {
    // 모든 이미지 수집
    const files = await fg(`${directoryPath}/**/*.{jpg,jpeg,png,gif,svg}`, {
      onlyFiles: true,
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/fonts/**',
      ],
    });

    for (const filePath of files) {
      try {
        const ext = path.extname(filePath).toLowerCase();

        // 공통 sharp 파이프라인
        let pipeline = sharp(filePath);

        // SVG → raster 변환(픽셀 이미지로)
        if (ext === '.svg') {
          pipeline = pipeline.png(); // 원하는 출력 포맷 지정
        }

        // GIF는 sharp가 첫 프레임만 처리함 (애니 GIF는 지원 안됨)
        if (ext === '.gif') {
          pipeline = pipeline.png(); // GIF → PNG 변환 추천
        }

        // JPEG/PNG는 품질 적용
        if (ext === '.jpg' || ext === '.jpeg') {
          pipeline = pipeline.jpeg({ quality: 75 });
        } else if (ext === '.png') {
          pipeline = pipeline.png({ quality: 80 });
        }

        const optimized = await pipeline.toBuffer();

        fs.writeFileSync(filePath, optimized);

//        console.log(`optimized: ${filePath}`);

      } catch (e) {
        console.error(`처리 실패: ${filePath}`, e.message);
      }
    }

    console.log('Images optimized and original files overwritten');

  } catch (err) {
    console.error('Error:', err);
  }
};

run().catch(console.error);
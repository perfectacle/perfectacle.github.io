import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminSvgo from 'imagemin-svgo';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 현재 스크립트 파일의 디렉토리를 파일 시스템 경로로 변환합니다.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 현재 작업 디렉토리에서 상위 디렉토리를 가져옵니다.
const directoryPath = path.resolve(process.cwd(), '..');

const run = async () => {
  try {
    // 이미지 파일들을 찾고 압축합니다.
    const files = await imagemin([`${directoryPath}/**/*.{jpg,jpeg,png,gif,svg}`], {
      destination: directoryPath,
      plugins: [
        imageminMozjpeg({ quality: 75 }),
        imageminPngquant({ quality: [0.6, 0.8] }),
        imageminGifsicle(),
        imageminSvgo()
      ]
    });

    // 압축된 파일들을 원본 파일에 덮어씁니다.
    files.forEach(file => {
      const destPath = path.join(directoryPath, path.relative(directoryPath, file.sourcePath));
      fs.copyFileSync(file.destinationPath, destPath);
    });

    console.log('Images optimized and original files overwritten');
  } catch (err) {
    console.error(err);
  }
};

run().catch(err => {
    console.error(err);
});

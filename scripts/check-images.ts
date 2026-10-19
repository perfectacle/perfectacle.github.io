// Post images are kept as WebP (SVG allowed); `pnpm images` converts anything else.
import { readdirSync } from 'node:fs';
import { POSTS_ROOT } from '../src/lib/post-files.ts';

const offenders = readdirSync(POSTS_ROOT, { recursive: true, encoding: 'utf8' }).filter(f =>
  /\.(png|jpe?g|gif|bmp|tiff?|avif|heic)$/i.test(f),
);
if (offenders.length) {
  console.error(`Non-WebP images (run \`pnpm images\`):\n${offenders.join('\n')}`);
  process.exit(1);
}
console.log('check-images: ok');

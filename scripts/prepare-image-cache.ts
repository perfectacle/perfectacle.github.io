import { prepareImageCache } from '../src/lib/image-cache.ts';

console.log(`prepare-image-cache: content cache ${(await prepareImageCache()) ? 'invalidated' : 'unchanged'}`);

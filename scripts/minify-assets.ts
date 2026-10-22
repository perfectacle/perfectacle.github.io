import { minifyAssets } from '../src/lib/minify-assets.ts';

for (const [kind, stats] of Object.entries(await minifyAssets('dist'))) {
  console.log(
    `minify-assets: ${kind}: ${stats.changed}/${stats.files} files, ${stats.before} → ${stats.after} bytes (saved ${stats.before - stats.after})`,
  );
}

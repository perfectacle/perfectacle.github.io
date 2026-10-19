// Every page the Hexo-era site published must still exist; external links and search results point at them.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const missing = readFileSync('tests/fixtures/legacy-paths.txt', 'utf8')
  .split('\n')
  .filter(Boolean)
  .filter(path => !existsSync(join('dist', path)));
if (missing.length) {
  console.error(`Missing legacy URLs (${missing.length}):\n${missing.join('\n')}`);
  process.exit(1);
}
console.log('check-legacy-urls: ok');

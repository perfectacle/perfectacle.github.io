// Published post, archive and feed URLs must keep existing; external links, search results and comments point at them.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const missing = readFileSync('tests/fixtures/published-paths.txt', 'utf8')
  .split('\n')
  .filter(Boolean)
  .filter(path => !existsSync(join('dist', path)));
if (missing.length) {
  console.error(`Missing published URLs (${missing.length}):\n${missing.join('\n')}`);
  process.exit(1);
}
console.log('check-published-urls: ok');

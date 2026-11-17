// Normalized fingerprint of the rendered site, so two builds can be compared for real output changes.
// Usage: node scripts/snapshot-output.ts <dist-dir> <out.json>
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeOutput } from '../src/lib/output-snapshot.ts';

const [dist = 'dist', out = 'output-snapshot.json'] = process.argv.slice(2);

const mainOf = (html: string) => /<main[^>]*>([\s\S]*)<\/main>/.exec(html)?.[1] ?? html;

const files = readdirSync(dist, { recursive: true, encoding: 'utf8' })
  .filter(f => !f.startsWith('_astro/') && !f.startsWith('pagefind/'))
  .sort();

const snapshot: Record<string, string> = {};
for (const file of files) {
  let content: string | Buffer;
  try {
    content = readFileSync(join(dist, file));
  } catch {
    continue; // directory entry
  }
  if (file.endsWith('.html')) content = normalizeOutput(mainOf(content.toString('utf8')));
  else if (/\.(xml|txt|json)$/.test(file)) content = normalizeOutput(content.toString('utf8'));
  snapshot[file] = typeof content === 'string' ? content : createHash('sha256').update(content).digest('hex');
}
writeFileSync(out, JSON.stringify(snapshot));
console.log(`snapshot-output: ${Object.keys(snapshot).length} files → ${out}`);

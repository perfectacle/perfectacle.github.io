// Normalized fingerprint of the rendered site, so two builds can be compared for real output changes.
// Usage: node scripts/snapshot-output.ts <dist-dir> <out.json>
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dist = 'dist', out = 'output-snapshot.json'] = process.argv.slice(2);

// Whitespace between table parts (`<tr> <td>`, `</td> </tr>`) is dropped by CSS table layout, even
// with `.prose table { display: block }`. HTML parsers differ on whether they keep it, so a parser
// update would otherwise flag every table. Cell contents (`<td> <b>`) are left alone.
const tableGap =
  /(<\/?(?:table|thead|tbody|tfoot|tr|colgroup)\b[^>]*>|<\/t[hd]>|<\/caption>)\s+(?=<\/?(?:table|thead|tbody|tfoot|tr|th|td|caption|colgroup|col)\b)/g;

// Build-specific noise that changes without the page changing: content-hashed asset names,
// Astro's per-component scope attributes, and whitespace.
const normalize = (html: string) =>
  html
    .replace(/\/_astro\/([^"'\s)]+?)\.[\w-]{8}(?:_[\w-]+)?\.(\w+)/g, '/_astro/$1.$2')
    .replace(/\sdata-astro-cid-\w+(?:="[^"]*")?/g, '')
    .replace(/\s+/g, ' ')
    .replace(tableGap, '$1')
    .trim();

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
  if (file.endsWith('.html')) content = normalize(mainOf(content.toString('utf8')));
  else if (/\.(xml|txt|json)$/.test(file)) content = normalize(content.toString('utf8'));
  snapshot[file] = typeof content === 'string' ? content : createHash('sha256').update(content).digest('hex');
}
writeFileSync(out, JSON.stringify(snapshot));
console.log(`snapshot-output: ${Object.keys(snapshot).length} files → ${out}`);

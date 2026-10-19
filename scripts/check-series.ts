// A missing or repeated seriesOrder would silently reorder a series on the site. This reads the posts, so it runs
// in the build rather than in `pnpm test`, whose CI job checks out the code without them.
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { listPostDirs, POSTS_ROOT } from '../src/lib/post-files.ts';

const problems: string[] = [];
const bySeries = new Map<string, number[]>();
for (const dir of listPostDirs()) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dir, 'index.md'), 'utf8'))?.[1] ?? '';
  const hasSeries = /^series:/m.test(fm);
  const series = /^series:\s*'((?:[^']|'')*)'\s*$/m.exec(fm)?.[1]?.replaceAll("''", "'");
  const order = /^seriesOrder:\s*(\S+)\s*$/m.exec(fm)?.[1];
  if (!hasSeries && order === undefined) continue;
  const post = relative(POSTS_ROOT, dir);
  if (!series || order === undefined) {
    problems.push(`${post}: needs both a quoted series name and seriesOrder`);
    continue;
  }
  bySeries.set(series, [...(bySeries.get(series) ?? []), Number(order)]);
}
if (!bySeries.size) problems.push('no series posts found');
for (const [name, orders] of bySeries) {
  const sorted = orders.toSorted((a, b) => a - b);
  if (sorted.some((n, i) => n !== i + 1))
    problems.push(`${name}: seriesOrder must be 1..${orders.length}, got ${sorted.join(', ')}`);
}
if (problems.length) {
  console.error(`check-series: ${problems.length} problem(s)\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`check-series: ok (${bySeries.size} series)`);

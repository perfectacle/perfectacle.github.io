// Fails when the rendered site differs between two snapshots (see snapshot-output.ts).
// Used on dependency-update PRs: an update that changes what readers see must not auto-merge.
// Usage: node scripts/compare-output.ts <base.json> <head.json>
import { appendFileSync, readFileSync } from 'node:fs';

const [basePath = '', headPath = ''] = process.argv.slice(2);
const base = JSON.parse(readFileSync(basePath, 'utf8')) as Record<string, string>;
const head = JSON.parse(readFileSync(headPath, 'utf8')) as Record<string, string>;

const added = Object.keys(head).filter(f => !(f in base));
const removed = Object.keys(base).filter(f => !(f in head));
const changed = Object.keys(head).filter(f => f in base && base[f] !== head[f]);

const firstDifference = (a: string, b: string) => {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - 80);
  return `    base: …${a.slice(from, i + 160)}…\n    head: …${b.slice(from, i + 160)}…`;
};

const lines = [
  ...added.map(f => `+ ${f}`),
  ...removed.map(f => `- ${f}`),
  ...changed.flatMap(f => [`~ ${f}`, firstDifference(base[f] ?? '', head[f] ?? '')]),
];

if (!lines.length) {
  console.log(`compare-output: identical (${Object.keys(head).length} files)`);
  process.exit(0);
}

const report = `Rendered output changed: ${added.length} added, ${removed.length} removed, ${changed.length} changed\n${lines.slice(0, 60).join('\n')}`;
console.error(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\`\`\`\n${report}\n\`\`\`\n`);
process.exit(1);

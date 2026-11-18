// The audit check: fails on high or critical advisories in production dependencies that a patched release fixes.
// Advisories with no patched release are printed as warnings (see src/lib/audit-gate.ts for why they do not fail).
// Usage: node scripts/audit.ts
import { spawnSync } from 'node:child_process';
import { type Advisory, splitAdvisories } from '../src/lib/audit-gate.ts';

const ATTEMPTS = 3;

// A registry hiccup must not read as "no advisories": only a report with an `advisories` map counts as an answer.
const audit = () => {
  let output = '';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const { stdout, stderr } = spawnSync('pnpm', ['audit', '--prod', '--json'], {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    });
    output = `${stdout}\n${stderr}`;
    try {
      const report = JSON.parse(stdout) as { advisories?: Record<string, Advisory> };
      if (report.advisories) return Object.values(report.advisories);
    } catch {
      // Not JSON: fall through to the retry.
    }
  }
  console.error(`audit: pnpm audit gave no report after ${ATTEMPTS} attempts\n${output.trim()}`);
  process.exit(1);
};

const describe = (a: Advisory) => `${a.module_name}: ${a.github_advisory_id} (${a.severity}) ${a.url ?? ''}`.trim();

const { blocking, unpatched } = splitAdvisories(audit());

for (const a of unpatched) {
  const line = `${describe(a)} has no patched release yet`;
  console.log(process.env.GITHUB_ACTIONS ? `::warning title=audit::${line}` : `warning: ${line}`);
}

if (blocking.length) {
  console.error(`audit: ${blocking.length} advisory(ies) with a patched release`);
  for (const a of blocking) console.error(`  ${describe(a)} patched in ${a.patched_versions}`);
  process.exit(1);
}

console.log(`audit: ok (${unpatched.length} without a patched release)`);

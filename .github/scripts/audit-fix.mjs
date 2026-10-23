// Lifts packages flagged by `pnpm audit` to a patched release inside the major their dependents already use, and
// drops cooldown exceptions that have aged out. Run from the repository root after `pnpm install`; it only edits
// pnpm-workspace.yaml and pnpm-lock.yaml; committing and opening the PR is the workflow's job.
//
// Order of attempts per package: a lockfile refresh within the existing ranges (respects the 7-day cooldown), then an
// override pinned to the patched version. A patched version younger than the cooldown goes into
// minimumReleaseAgeExclude with its advisory, the documented security exception. A fix that needs a new major is left
// for a person and reported as unresolved.
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const WORKSPACE = 'pnpm-workspace.yaml';
const LEVELS = new Set(['high', 'critical']);

// pnpm defaults to --frozen-lockfile on CI, which would refuse every lockfile change this script makes.
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

const npmView = (spec, field) => {
  const { stdout } = run('npm', ['view', spec, field, '--json']);
  return stdout.trim() ? JSON.parse(stdout) : null;
};

const audit = () => {
  const { stdout } = run('pnpm', ['audit', '--prod', '--json']);
  const { advisories = {} } = JSON.parse(stdout || '{}');
  return Object.values(advisories).filter(a => LEVELS.has(a.severity));
};

// pnpm-workspace.yaml is edited as text so its comments survive.
const quote = s => (/^[@'"!&*%|>#]/.test(s) ? `'${s}'` : s);
const readWorkspace = () => readFileSync(WORKSPACE, 'utf8');
// pnpm's own cooldown, in minutes.
const COOLDOWN_MS = Number(readWorkspace().match(/^minimumReleaseAge:\s*(\d+)/m)?.[1] ?? 10080) * 60 * 1000;

const blockRange = (lines, key) => {
  const start = lines.indexOf(`${key}:`);
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && /^(\s+\S|\s*$)/.test(lines[end]) && !/^\S/.test(lines[end])) end++;
  while (end > start + 1 && lines[end - 1].trim() === '') end--;
  return [start, end];
};

const addEntry = (key, line, comment) => {
  const lines = readWorkspace().split('\n');
  const range = blockRange(lines, key);
  const entry = [`  # ${comment}`, `  ${line}`];
  if (range) lines.splice(range[1], 0, ...entry);
  else {
    while (lines.at(-1) === '') lines.pop();
    lines.push('', `${key}:`, ...entry, '');
  }
  writeFileSync(WORKSPACE, lines.join('\n'));
};

// Sets a map entry, replacing the value in place when the key is already there (YAML forbids duplicate keys).
const setEntry = (key, name, value, comment) => {
  const lines = readWorkspace().split('\n');
  const range = blockRange(lines, key);
  const i = range ? lines.findIndex((l, n) => n > range[0] && n < range[1] && l.trim().startsWith(`${name}:`)) : -1;
  if (i < 0) return addEntry(key, `${name}: ${value}`, comment);
  lines.splice(i, 1, `  # ${comment}`, `  ${name}: ${value}`);
  writeFileSync(WORKSPACE, lines.join('\n'));
};

const listEntries = key => {
  const lines = readWorkspace().split('\n');
  const range = blockRange(lines, key);
  if (!range) return [];
  return lines
    .slice(range[0] + 1, range[1])
    .map(l => l.match(/^\s+-\s+'?([^'\s]+)'?\s*$/)?.[1])
    .filter(Boolean);
};

// Removes a list item; the block (with its comments) goes too once no item is left.
const removeListItem = (key, item) => {
  const lines = readWorkspace().split('\n');
  const range = blockRange(lines, key);
  if (!range) return;
  const i = lines.findIndex(
    (l, n) => n > range[0] && n < range[1] && l.match(/^\s+-\s+'?([^'\s]+)'?\s*$/)?.[1] === item,
  );
  if (i < 0) return;
  lines.splice(i, 1);
  const after = blockRange(lines, key);
  if (!lines.slice(after[0] + 1, after[1]).some(l => /^\s+-\s/.test(l))) {
    const from = after[0] > 0 && lines[after[0] - 1] === '' ? after[0] - 1 : after[0];
    lines.splice(from, after[1] - from);
  }
  writeFileSync(WORKSPACE, lines.join('\n'));
};

const releasedAt = spec => {
  const at = spec.lastIndexOf('@');
  const times = npmView(spec.slice(0, at), 'time') ?? {};
  return times[spec.slice(at + 1)] ? Date.parse(times[spec.slice(at + 1)]) : NaN;
};
const isYoung = spec => !(Date.now() - releasedAt(spec) >= COOLDOWN_MS);

// Installs, adding every release the cooldown rejects (the fix and anything new it pulls in) as an exception.
const install = advisory => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { status, stdout, stderr } = run('pnpm', ['install', '--no-frozen-lockfile']);
    if (status === 0) return true;
    const young = [...`${stdout}\n${stderr}`.matchAll(/(\S+@\d[^\s]*) was published at/g)].map(m => m[1]);
    if (!young.length) {
      console.error(stdout, stderr);
      return false;
    }
    for (const spec of young) {
      if (!listEntries('minimumReleaseAgeExclude').includes(spec)) {
        addEntry(
          'minimumReleaseAgeExclude',
          `- ${quote(spec)}`,
          `Security fix (${advisory}); drop once past the cooldown.`,
        );
      }
    }
  }
  return false;
};

const report = [];
const unresolved = [];

// 1. Cooldown exceptions that have aged out only skip a check now; keep the removal only if the install still holds.
for (const spec of listEntries('minimumReleaseAgeExclude')) {
  if (isYoung(spec)) continue;
  const before = readWorkspace();
  removeListItem('minimumReleaseAgeExclude', spec);
  if (run('pnpm', ['install', '--frozen-lockfile']).status === 0)
    report.push(`- Dropped aged-out cooldown exception \`${spec}\``);
  else writeFileSync(WORKSPACE, before);
}

// 2. Refresh the vulnerable packages within their current ranges.
let found = audit();
if (found.length) {
  const names = [...new Set(found.map(a => a.module_name))];
  run('pnpm', ['update', '--depth', 'Infinity', ...names]);
  const still = new Set(audit().map(a => a.github_advisory_id));
  for (const a of found) {
    if (!still.has(a.github_advisory_id))
      report.push(`- \`${a.module_name}\`: ${a.github_advisory_id} fixed by a lockfile refresh`);
  }
}

// 3. Pin what the refresh could not move, per installed major.
found = audit();
for (const name of [...new Set(found.map(a => a.module_name))]) {
  const advisories = found.filter(a => a.module_name === name);
  const ids = [...new Set(advisories.map(a => a.github_advisory_id))].join(', ');
  const majors = [...new Set(advisories.flatMap(a => a.findings.map(f => Number(f.version.split('.')[0]))))];
  for (const major of majors) {
    const range = [`>=${major}.0.0`, `<${major + 1}.0.0-0`, ...advisories.map(a => a.patched_versions)].join(' ');
    const candidates = [npmView(`${name}@${range}`, 'version') ?? []].flat();
    if (!candidates.length) {
      unresolved.push(`- \`${name}@${major}\`: ${ids} has no patched release in major ${major}`);
      continue;
    }
    const mature = candidates.filter(v => !isYoung(`${name}@${v}`));
    const target = mature.at(-1) ?? candidates[0];
    const before = readWorkspace();
    setEntry('overrides', quote(`${name}@${major}`), target, `${ids}; pinned by the audit workflow.`);
    if (install(ids)) report.push(`- \`${name}@${major}\`: ${ids} fixed by overriding to ${target}`);
    else {
      writeFileSync(WORKSPACE, before);
      run('pnpm', ['install', '--no-frozen-lockfile']);
      unresolved.push(`- \`${name}@${major}\`: ${ids} could not install ${target}`);
    }
  }
}

for (const a of audit()) {
  const line = `- \`${a.module_name}\`: ${a.github_advisory_id} (${a.severity}) still open`;
  if (!unresolved.some(u => u.includes(a.github_advisory_id))) unresolved.push(line);
}

const summary = [
  report.length ? `## Fixed\n\n${report.join('\n')}` : '',
  unresolved.length ? `## Needs a person\n\n${unresolved.join('\n')}` : '',
]
  .filter(Boolean)
  .join('\n\n');
writeFileSync(`${process.env.RUNNER_TEMP ?? '.'}/audit-report.md`, `${summary || 'Nothing to change.'}\n`);
console.log(summary || 'Nothing to change.');

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `unresolved=${unresolved.length > 0}\n`);
}

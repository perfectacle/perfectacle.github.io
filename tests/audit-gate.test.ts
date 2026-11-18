import { expect, test } from 'vitest';
import { hasPatchedRelease, splitAdvisories } from '../src/lib/audit-gate.ts';

const advisory = (severity: string, patched_versions: string | null) => ({
  module_name: 'pkg',
  severity,
  github_advisory_id: `GHSA-${severity}-${patched_versions ?? 'none'}`,
  patched_versions,
});

test('an advisory with a patched release blocks', () => {
  const { blocking, unpatched } = splitAdvisories([advisory('high', '>=4.0.8'), advisory('critical', '>=2.3.3')]);
  expect(blocking).toHaveLength(2);
  expect(unpatched).toHaveLength(0);
});

test('an advisory nothing fixes yet is reported, not blocking', () => {
  const { blocking, unpatched } = splitAdvisories([advisory('high', null), advisory('critical', '<0.0.0')]);
  expect(blocking).toHaveLength(0);
  expect(unpatched).toHaveLength(2);
});

test('severities below high are ignored either way', () => {
  expect(splitAdvisories([advisory('moderate', '>=1.0.1'), advisory('low', null)])).toEqual({
    blocking: [],
    unpatched: [],
  });
});

test.each([null, '', '  ', '<0.0.0'])('%j means no patched release', range => {
  expect(hasPatchedRelease({ patched_versions: range })).toBe(false);
});

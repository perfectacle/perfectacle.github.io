// Decides which `pnpm audit` advisories fail the audit check.
//
// An advisory blocks only when a patched release exists: that is the one case a change to this repository can fix.
// One without any patched release would fail every dependency PR until upstream ships, whatever the PR contains, so
// it is reported instead and left to the daily audit workflow, which keeps an issue open for it and opens the fix PR
// the day a patched release appears.

export interface Advisory {
  module_name: string;
  severity: string;
  github_advisory_id: string;
  // null (or the range `<0.0.0`) when no release fixes the advisory yet.
  patched_versions: string | null;
  url?: string;
}

const BLOCKING_LEVELS = new Set(['high', 'critical']);

export const hasPatchedRelease = (advisory: Pick<Advisory, 'patched_versions'>) => {
  const range = advisory.patched_versions?.trim() ?? '';
  return range !== '' && range !== '<0.0.0';
};

export const splitAdvisories = <T extends Advisory>(advisories: readonly T[]) => {
  const severe = advisories.filter(a => BLOCKING_LEVELS.has(a.severity));
  return {
    blocking: severe.filter(hasPatchedRelease),
    unpatched: severe.filter(a => !hasPatchedRelease(a)),
  };
};

import { KR_PATCH_TOOLKIT_URL, sourceFileUrl, toolkitFileUrl, type KrPatch } from '../../lib/kr-patches.ts';
import { GUIDE_CHAPTERS, toolHref } from '../romhacking/chapters.ts';

/** Toolkit Lua scripts are named by their path under this folder, as `krpatch sfc lua` takes them. */
export const TOOLKIT_LUA = 'src/kr_patch/sfc/lua/';
const LUA_MARK = ' (krpatch sfc lua)';

// Commands the guide already explains link to that section of the toolkit README; the longest match wins, so
// `krpatch ips make` goes to the `krpatch ips` section.
const commands = GUIDE_CHAPTERS.flatMap(c => c.tools).sort((a, b) => b.command.length - a.command.length);

export interface SourceLink {
  label: string;
  href: string;
  /** Kept beside the link, such as the `(krpatch sfc lua)` that marks a toolkit script. */
  note?: string;
}

/**
 * Where a file named in a note lives on GitHub: a `krpatch` command goes to its section of the toolkit README, a
 * script marked `(krpatch sfc lua)` to the toolkit, and anything else to the game's patch source.
 */
export const sourceLink = (patch: KrPatch, name: string): SourceLink => {
  if (name.endsWith(LUA_MARK)) {
    const file = name.slice(0, -LUA_MARK.length);
    return { label: file, note: LUA_MARK.trim(), href: toolkitFileUrl(`${TOOLKIT_LUA}${file}`) };
  }
  if (name.startsWith('krpatch ')) {
    const tool = commands.find(t => name.startsWith(t.command));
    return { label: name, href: tool ? toolHref(tool) : KR_PATCH_TOOLKIT_URL };
  }
  return { label: name, href: sourceFileUrl(patch, name) };
};

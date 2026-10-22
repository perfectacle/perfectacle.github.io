import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import config from '../scripts/patch-fonts.json';
import manifest from '../scripts/patch-fonts.manifest.json';

const root = resolve(import.meta.dirname, '..');
const temporary: string[] = [];

async function inputs(workspace: string) {
  const paths = config.files.map(file => join(workspace, file));
  async function collect(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (config.extensions.includes(extname(path))) paths.push(path);
    }
  }
  for (const directory of config.directories) await collect(join(workspace, directory));
  return paths;
}

function missingCharacters(text: string, available: string) {
  const supported = new Set(available);
  const required = new Set([...text].filter(char => /[가-힣]/u.test(char)));
  for (let code = 32; code < 127; code++) required.add(String.fromCodePoint(code));
  for (const char of config.requiredCharacters) required.add(char);
  return [...required].filter(char => !supported.has(char)).sort();
}

afterEach(async () => {
  await Promise.all(temporary.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe('patch website fonts', () => {
  it('covers the current pages, nested components and shared runtime messages in both weights', async () => {
    const text = (await Promise.all((await inputs(root)).map(path => readFile(path, 'utf8')))).join('');
    for (const font of manifest.fonts) {
      expect(
        missingCharacters(text, font.characters),
        `${font.output}: regenerate with scripts/subset-patch-fonts.py`,
      ).toEqual([]);
    }
    expect(new Set(manifest.fonts.map(font => font.characters)).size).toBe(1);
  });

  it('binds the recorded glyph coverage to the actual font bytes and the 50 KiB budget', async () => {
    expect(manifest.tools).toEqual(config.tools);
    expect(
      manifest.fonts.map(({ source, sourceSha256, output, weight }) => ({ source, sourceSha256, output, weight })),
    ).toEqual(config.fonts);
    let total = 0;
    for (const font of manifest.fonts) {
      const bytes = await readFile(join(root, 'public/games/kr-patches/fonts', font.output));
      expect(bytes.toString('ascii', 0, 4)).toBe('wOF2');
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(font.sha256);
      expect(bytes.length).toBe(font.bytes);
      total += bytes.length;
    }
    expect(total).toBeLessThanOrEqual(50 * 1024);
  });

  it('detects a newly added Hangul glyph and a missing bold glyph', () => {
    const font = manifest.fonts[0];
    if (!font) throw new Error('Missing regular font');
    const unused = Array.from({ length: 11172 }, (_, i) => String.fromCodePoint(0xac00 + i)).find(
      char => !font.characters.includes(char),
    );
    if (!unused) throw new Error('Expected a subset of Hangul');
    expect(missingCharacters(`새 안내 ${unused}`, font.characters)).toEqual([unused]);
    expect(missingCharacters('제절초', font.characters.replace('절', ''))).toEqual(['절']);
  });

  it('discovers new nested components, runtime files and JSON title data without a fixed file list', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'blog-patch-fonts-'));
    temporary.push(workspace);
    for (const directory of config.directories) await mkdir(join(workspace, directory), { recursive: true });
    const component = 'src/components/kr-patch/nested/NewNotice.astro';
    const runtime = 'src/lib/nested/new-runtime.ts';
    const json = 'src/components/kakusei/nested/new-endings.json';
    for (const path of [component, runtime, json]) {
      await mkdir(join(workspace, path, '..'), { recursive: true });
      await writeFile(join(workspace, path), '새 안내');
    }
    const paths = await inputs(workspace);
    expect(paths).toContain(join(workspace, component));
    expect(paths).toContain(join(workspace, runtime));
    expect(paths).toContain(join(workspace, json));
  });
});

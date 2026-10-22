import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { minify } from 'html-minifier-terser';
import { transform, transformStyleAttribute } from 'lightningcss';
import { crc32, deflateSync, inflateSync } from 'node:zlib';
import { optimize } from 'svgo';
import { minify_sync, type MinifyOptions } from 'terser';

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const LICENSE = /^!|@license|@preserve|copyright/i;
const KINDS = ['html', 'js', 'css', 'json', 'svg', 'png'] as const;
type Kind = (typeof KINDS)[number];
export interface AssetSummary {
  files: number;
  changed: number;
  before: number;
  after: number;
}

function smaller(original: string, candidate: string): string {
  return Buffer.byteLength(candidate) < Buffer.byteLength(original) ? candidate : original;
}

export function createTextMinifier() {
  const javascript = new Map<string, string>();
  const styles = new Map<string, string>();
  function js(source: string, inline = false): string {
    const key = `${inline}:${source}`;
    const cached = javascript.get(key);
    if (cached !== undefined) return cached;
    const options = {
      ecma: 2024,
      compress: false,
      mangle: false,
      module: false,
      parse: { bare_returns: inline },
      format: { comments: LICENSE, inline_script: true },
    } satisfies MinifyOptions;
    let result;
    try {
      result = minify_sync(source, options);
    } catch (cause) {
      if (inline) throw cause;
      result = minify_sync(source, { ...options, module: true });
    }
    const output = smaller(source, result.code ?? '');
    javascript.set(key, output);
    return output;
  }
  function css(source: string, type?: string): string {
    const key = `${type}:${source}`;
    const cached = styles.get(key);
    if (cached !== undefined) return cached;
    const code = Buffer.from(source);
    const result =
      type === 'inline'
        ? transformStyleAttribute({ code, minify: true, errorRecovery: false })
        : transform({ filename: 'asset.css', code, minify: true, errorRecovery: false });
    // CSS parsers retain bang comments, but ordinary copyright notices also belong in the output.
    const licenses = [...source.matchAll(/\/\*([\s\S]*?)\*\//g)]
      .filter(match => LICENSE.test(match[1] ?? ''))
      .map(match => match[0]);
    let output = result.code.toString();
    output = licenses.filter(license => !output.includes(license)).join('') + output;
    output = smaller(source, output);
    styles.set(key, output);
    return output;
  }
  return async (source: string, kind: Exclude<Kind, 'png'>): Promise<string> => {
    let result: string;
    switch (kind) {
      case 'html':
        result = await minify(source, {
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseInlineTagWhitespace: false,
          removeComments: true,
          ignoreCustomComments: [LICENSE, /^\[if\b/i, /^\s*<!\[endif/i],
          removeAttributeQuotes: false,
          quoteCharacter: '"',
          removeOptionalTags: false,
          removeRedundantAttributes: false,
          removeEmptyAttributes: false,
          decodeEntities: false,
          ignoreCustomFragments: [/<(pre|code|textarea|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi],
          minifyJS: async (source: string, inline?: boolean) => js(source, inline),
          minifyCSS: async (source: string, type?: string) => css(source, type),
        });
        break;
      case 'js':
        result = js(source);
        break;
      case 'css':
        result = css(source);
        break;
      case 'json':
        JSON.parse(source);
        result = source.replace(/("(?:[^"\\]|\\.)*")|[ \t\r\n]+/g, '$1');
        break;
      case 'svg':
        result = optimize(source, {
          plugins: [
            'removeDoctype',
            'removeXMLProcInst',
            { name: 'removeComments', params: { preservePatterns: [LICENSE] } },
          ],
        }).data;
        break;
    }
    return smaller(source, result);
  };
}

export function minifyPng(original: Buffer): Buffer {
  if (!original.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Invalid PNG signature');
  }
  const chunks: { type: string; bytes: Buffer; data: Buffer }[] = [];
  let offset = 8;
  while (offset < original.length) {
    if (offset + 12 > original.length) throw new Error('Truncated PNG chunk');
    const size = original.readUInt32BE(offset);
    const end = offset + 12 + size;
    if (end > original.length) throw new Error('Truncated PNG data');
    const bytes = original.subarray(offset, end);
    const type = bytes.toString('ascii', 4, 8);
    if (crc32(bytes.subarray(4, size + 8)) !== bytes.readUInt32BE(size + 8)) {
      throw new Error(`Invalid PNG ${type} checksum`);
    }
    chunks.push({ type, bytes, data: bytes.subarray(8, size + 8) });
    offset = end;
  }
  if (chunks[0]?.type !== 'IHDR' || chunks.at(-1)?.type !== 'IEND') {
    throw new Error('Invalid PNG structure');
  }
  if (chunks.some(chunk => chunk.type === 'acTL')) return original;
  const image = chunks.filter(chunk => chunk.type === 'IDAT');
  if (!image.length) throw new Error('Missing PNG image data');
  // Recompressing the same filtered bytes preserves pixels and every ancillary metadata chunk.
  const compressed = deflateSync(inflateSync(Buffer.concat(image.map(chunk => chunk.data))), {
    level: 9,
  });
  const replacement = Buffer.alloc(compressed.length + 12);
  replacement.writeUInt32BE(compressed.length);
  replacement.write('IDAT', 4);
  compressed.copy(replacement, 8);
  replacement.writeUInt32BE(crc32(replacement.subarray(4, -4)), replacement.length - 4);
  let replaced = false;
  const output = Buffer.concat([
    original.subarray(0, 8),
    ...chunks.flatMap(chunk => {
      if (chunk.type !== 'IDAT') return [chunk.bytes];
      if (replaced) return [];
      replaced = true;
      return [replacement];
    }),
  ]);
  return output.length < original.length ? output : original;
}

export async function minifyAssets(root: string): Promise<Record<Kind, AssetSummary>> {
  const summary = Object.fromEntries(
    KINDS.map(kind => [kind, { files: 0, changed: 0, before: 0, after: 0 }]),
  ) as Record<Kind, AssetSummary>;
  const text = createTextMinifier();
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      const path = relative(root, file).split(sep).join('/');
      if (entry.isDirectory()) {
        if (path !== 'pagefind') await visit(file);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = extname(entry.name).slice(1).toLowerCase();
      let kind = KINDS.find(candidate => candidate === extension);
      if (!kind) continue;
      if (path.startsWith('_astro/') && (kind === 'js' || kind === 'css')) continue;
      if (kind === 'html' && /^(google|naver)[a-z\d]+\.html$/i.test(entry.name)) continue;
      const original = await readFile(file);
      if (original.subarray(0, 8).equals(PNG_SIGNATURE)) kind = 'png';
      let candidate: Buffer;
      try {
        candidate = kind === 'png' ? minifyPng(original) : Buffer.from(await text(original.toString('utf8'), kind));
      } catch (cause) {
        throw new Error(`Could not minify ${path}`, { cause });
      }
      const output = candidate.length < original.length ? candidate : original;
      const stats = summary[kind];
      stats.files++;
      stats.before += original.length;
      stats.after += output.length;
      if (output !== original) {
        await writeFile(file, output);
        stats.changed++;
      }
    }
  }
  await visit(root);
  return summary;
}

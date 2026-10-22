import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { crc32 } from 'node:zlib';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { createTextMinifier, minifyAssets, minifyPng } from '../src/lib/minify-assets.ts';

const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(temporary.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

async function directory(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'minify-assets-'));
  temporary.push(path);
  return path;
}

describe('text assets', () => {
  it('preserves significant HTML whitespace, quoted URLs and anchors', async () => {
    const minify = createTextMinifier();
    const fragments = [
      '<pre><code>  const x = 1;\n    x++;\n</code></pre>',
      '<code> a  +  b </code>',
      '<textarea>  a\n  b </textarea>',
      '<svg viewBox="0 0 2 2"><text> a  b </text></svg>',
    ];
    const html = `<!doctype html>\n<html><body>\n<!-- remove -->\n<!-- @license keep -->\n<p><span>Hello</span>  <a href="/old/path/#Heading" id="Heading">world</a></p>\n${fragments.join('\n')}\n</body></html>`;
    const result = await minify(html, 'html');
    expect(result.length).toBeLessThan(html.length);
    for (const fragment of fragments) expect(result).toContain(fragment);
    expect(result).toContain('</span> <a href="/old/path/#Heading" id="Heading">');
    expect(result).toContain('<!-- @license keep -->');
    expect(result).not.toContain('<!-- remove -->');
    expect(result).toContain('</body></html>');
    expect(await minify(result, 'html')).toBe(result);
  });

  it('keeps public JavaScript names, licenses and event handler scope', async () => {
    const minify = createTextMinifier();
    const code =
      '/*! @license public API */\nvar publicValue = 3;\nfunction publicFunction(value) { return { publicProperty: value + publicValue }; }';
    const result = await minify(code, 'js');
    expect(result).toContain('/*! @license public API */');
    expect(result).toContain('publicProperty');
    expect(runInNewContext(`${result};publicFunction(2).publicProperty`)).toBe(5);
    const html = await minify(
      '<button onclick="var publicValue = this.value; return publicValue;">go</button>',
      'html',
    );
    expect(html).toContain('return publicValue');
    expect(html).toContain('this.value');
    expect(await minify(result, 'js')).toBe(result);
  });

  it.each([
    ['var await = 1; window.x = await;', 1],
    ['var x = 010; window.x = x;', 8],
  ] as const)('keeps classic script syntax valid: %s', async (source, expected) => {
    const minify = createTextMinifier();
    const script = await minify(source, 'js');
    expect(runInNewContext(`${script};window.x`, { window: {} })).toBe(expected);
    const html = await minify(`<script>${source}</script>`, 'html');
    const body = html.slice('<script>'.length, -'</script>'.length);
    expect(runInNewContext(`${body};window.x`, { window: {} })).toBe(expected);
  });

  it('supports top-level await in module scripts without mangling globals', async () => {
    const source =
      '<script type="module">const { publicValue }   =   await import("./module.js");    window.publicValue   =   publicValue;</script>';
    const result = await createTextMinifier()(source, 'html');
    expect(result).toMatch(/await\s*\(?import\("\.\/module\.js"\)/);
    expect(result).toContain('window.publicValue=publicValue');
  });

  it('minifies inline CSS and JavaScript and keeps CSS copyright notices', async () => {
    const minify = createTextMinifier();
    const html =
      '<style>/* copyright retained */\np { color: red; padding: 0px; }</style><script>var publicValue = 3;  publicValue += 1;</script><p style="color: red; padding: 0px;">hello</p>';
    const result = await minify(html, 'html');
    expect(result).toContain('/* copyright retained */');
    expect(result).toContain('p{color:red;padding:0}');
    expect(result).toContain('var publicValue=3;publicValue+=1;');
    expect(result).toContain('style="color:red;padding:0"');
  });

  it('minifies style and script blocks alongside protected code fragments', async () => {
    const source =
      '<style>p { color: red; padding: 0px; }</style><script>var publicName = 1; window.publicName = publicName;</script><pre><code>  a  b\n c </code></pre>';
    const result = await createTextMinifier()(source, 'html');
    expect(result).toContain('<style>p{color:red;padding:0}</style>');
    expect(result).toContain('var publicName=1;window.publicName=publicName;');
    expect(result).toContain('<pre><code>  a  b\n c </code></pre>');
  });

  it('preserves SVG text, IDs, fonts, viewBox and numeric precision', async () => {
    const minify = createTextMinifier();
    const source =
      '<?xml version="1.0"?>\n<!-- @license retained -->\n<svg viewBox="0 0 20 20"><!-- remove --><defs><font id="font"><glyph unicode=" " d="M0.123456789 1.987654321"/></font></defs><text xml:space="preserve">  x  y </text><use href="#font"/></svg>';
    const result = await minify(source, 'svg');
    for (const value of [
      '@license retained',
      'viewBox="0 0 20 20"',
      'id="font"',
      'glyph unicode=" "',
      '0.123456789 1.987654321',
      '>  x  y </text>',
      'href="#font"',
    ]) {
      expect(result).toContain(value);
    }
    expect(result).not.toContain('<!-- remove -->');
    expect(await minify(result, 'svg')).toBe(result);
  });

  it('keeps JSON values and already compact data unchanged', async () => {
    const minify = createTextMinifier();
    const json = '{ "name": "a  b", "number": 123, "nested": [true, null] }';
    expect(JSON.parse(await minify(json, 'json'))).toEqual(JSON.parse(json));
    expect(await minify('{"a":1}', 'json')).toBe('{"a":1}');
  });

  it('preserves raw JSON number and string tokens, including duplicate keys', async () => {
    const source = String.raw`{
      "large": 9007199254740993, "negative": -0, "overflow": 1e999,
      "decimal": 1.2300e+04, "escaped": "\u0061\/\"\\\t",
      "duplicate": 1, "duplicate": 2
    }`;
    const expected = String.raw`{"large":9007199254740993,"negative":-0,"overflow":1e999,"decimal":1.2300e+04,"escaped":"\u0061\/\"\\\t","duplicate":1,"duplicate":2}`;
    const minify = createTextMinifier();
    expect(await minify(source, 'json')).toBe(expected);
    expect(await minify(expected, 'json')).toBe(expected);
  });

  it.each([
    ['json', '{broken'],
    ['js', 'function {'],
    ['css', 'p { color: red; } }'],
    ['svg', '<svg><broken></svg>'],
    ['html', '<script>function {</script>'],
  ] as const)('rejects invalid %s', async (kind, source) => {
    await expect(createTextMinifier()(source, kind)).rejects.toThrow();
  });
});

describe('distribution minification', () => {
  it('skips generated bundles, search files, ownership files and other binaries', async () => {
    const root = await directory();
    await mkdir(join(root, '_astro'));
    await mkdir(join(root, 'pagefind'));
    const untouched = [
      '_astro/hash.js',
      '_astro/hash.css',
      'pagefind/index.json',
      'google123abc.html',
      'naver123abc.html',
      'feed.xml',
      'image.webp',
      'archive.zip',
      'patch.ips',
      'font.woff2',
      'search.wasm',
    ];
    for (const path of untouched) await writeFile(join(root, path), '  preserve bytes\n');
    await writeFile(join(root, 'demo.js'), 'var publicName = 1;\n');
    await writeFile(join(root, 'data.json'), '{ "a": 1 }');
    const result = await minifyAssets(root);
    for (const path of untouched) expect(await readFile(join(root, path), 'utf8')).toBe('  preserve bytes\n');
    expect(await readFile(join(root, 'demo.js'), 'utf8')).toBe('var publicName=1;');
    expect(result.js.changed).toBe(1);
    expect(result.json.before).toBe(10);
    expect(result.json.after).toBe(7);
    const second = await minifyAssets(root);
    expect(Object.values(second).every(stats => stats.changed === 0)).toBe(true);
  });

  it('handles PNG bytes under an SVG filename without changing the URL', async () => {
    const root = await directory();
    const original = await sharp({ create: { width: 8, height: 8, channels: 4, background: 'red' } })
      .png({ compressionLevel: 0 })
      .toBuffer();
    const file = join(root, 'safari-pinned-tab.svg');
    await writeFile(file, original);
    const result = await minifyAssets(root);
    expect(result.png.files).toBe(1);
    expect(result.svg.files).toBe(0);
    expect(
      await sharp(await readFile(file))
        .raw()
        .toBuffer(),
    ).toEqual(await sharp(original).raw().toBuffer());
  });

  it('names malformed files in errors instead of silently skipping them', async () => {
    const root = await directory();
    await writeFile(join(root, 'broken.json'), '{broken');
    await expect(minifyAssets(root)).rejects.toThrow('Could not minify broken.json');
  });
});

describe('lossless PNG recompression', () => {
  it('preserves pixels, alpha and ancillary metadata and is idempotent', async () => {
    const image = await sharp({
      create: { width: 64, height: 64, channels: 4, background: { r: 10, g: 20, b: 30, alpha: 0.5 } },
    })
      .png({ compressionLevel: 0 })
      .toBuffer();
    const text = Buffer.from('Comment\0copyright test metadata');
    const chunk = Buffer.alloc(text.length + 12);
    chunk.writeUInt32BE(text.length);
    chunk.write('tEXt', 4);
    text.copy(chunk, 8);
    chunk.writeUInt32BE(crc32(chunk.subarray(4, -4)), chunk.length - 4);
    const original = Buffer.concat([image.subarray(0, 33), chunk, image.subarray(33)]);
    const result = minifyPng(original);
    expect(result.length).toBeLessThan(original.length);
    expect(result.includes(chunk)).toBe(true);
    expect(await sharp(result).raw().toBuffer()).toEqual(await sharp(original).raw().toBuffer());
    expect(minifyPng(result)).toEqual(result);
  });

  it('preserves 16-bit channels', async () => {
    const original = await sharp({ create: { width: 16, height: 16, channels: 3, background: 'red' } })
      .toColourspace('rgb16')
      .png({ compressionLevel: 0 })
      .toBuffer();
    expect(original[24]).toBe(16);
    const result = minifyPng(original);
    expect(result[24]).toBe(16);
    expect(await sharp(result).raw({ depth: 'ushort' }).toBuffer()).toEqual(
      await sharp(original).raw({ depth: 'ushort' }).toBuffer(),
    );
  });

  it('leaves animated PNG bytes unchanged', async () => {
    const image = await sharp({ create: { width: 2, height: 2, channels: 4, background: 'red' } })
      .png({ compressionLevel: 0 })
      .toBuffer();
    const control = Buffer.alloc(20);
    control.writeUInt32BE(8);
    control.write('acTL', 4);
    control.writeUInt32BE(1, 8);
    control.writeUInt32BE(crc32(control.subarray(4, -4)), control.length - 4);
    const original = Buffer.concat([image.subarray(0, 33), control, image.subarray(33)]);
    expect(minifyPng(original)).toBe(original);
  });

  it('rejects malformed PNGs', () => {
    expect(() => minifyPng(Buffer.from('not png'))).toThrow('signature');
    expect(() => minifyPng(Buffer.from('89504e470d0a1a0a00', 'hex'))).toThrow('Truncated');
  });
});

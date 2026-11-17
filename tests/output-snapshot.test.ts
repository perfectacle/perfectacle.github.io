import { expect, test } from 'vitest';
import { normalizeOutput } from '../src/lib/output-snapshot.ts';

test('scope markers are dropped, whichever way the compiler wrote them', () => {
  const marked = '<img src="/a.webp" class="astro-p75qekmk" width="256" data-astro-cid-p75qekmk>';
  const unmarked = '<img src="/a.webp" width="256" data-astro-cid-p75qekmk>';
  expect(normalizeOutput(marked)).toBe('<img src="/a.webp" width="256">');
  expect(normalizeOutput(marked)).toBe(normalizeOutput(unmarked));
  expect(normalizeOutput('<span class="patch-picture astro-atf6ivoc smooth" data-astro-cid-atf6ivoc="">')).toBe(
    '<span class="patch-picture smooth">',
  );
});

test('classes an author wrote stay, so a real change to them still shows', () => {
  expect(normalizeOutput('<p class="lead">')).not.toBe(normalizeOutput('<p class="note">'));
  expect(normalizeOutput('<p class="lead">')).not.toBe(normalizeOutput('<p>'));
  // Only the compiler's own shape counts as a marker: `astro-` and eight lower-case letters or digits.
  for (const name of ['astro-island', 'astro-code', 'astro-p75qekmkx', 'astro-P75QEKMK', 'xastro-p75qekmk'])
    expect(normalizeOutput(`<div class="${name}">`), name).toBe(`<div class="${name}">`);
});

test('text that only looks like a marker is content', () => {
  expect(normalizeOutput('<code>class="astro-p75qekmk"</code>')).toBe('<code>class="astro-p75qekmk"</code>');
  expect(normalizeOutput('<p>astro-p75qekmk</p>')).toBe('<p>astro-p75qekmk</p>');
});

test('hashed asset names, whitespace and gaps between table parts are noise', () => {
  expect(normalizeOutput('<link href="/_astro/index.BxK2a9Qz.css">\n\n  <p>a   b</p>')).toBe(
    '<link href="/_astro/index.css"> <p>a b</p>',
  );
  expect(normalizeOutput('<table> <tr> <td> <b>x</b></td> </tr> </table>')).toBe(
    '<table><tr><td> <b>x</b></td></tr></table>',
  );
});

import { join } from 'node:path';
import sharp from 'sharp';

/** Images narrower than this are shown at twice their size, so one game pixel stays a whole number of dots. */
const SMALL = 320;
/** Game screens captured at their own size, a pair side by side included, are always doubled. */
const CAPTURE = /\/shot-[^/]*$/;

/**
 * Gives every image of a journal page its real size, so the page does not shift while images load. Journal pages are
 * Markdown, where an image carries no size of its own; the files live under `public/`.
 */
export async function sizeJournalImages(html: string, publicDir = 'public'): Promise<string> {
  const tags = [...html.matchAll(/<img\b[^>]*>/g)];
  const sized = await Promise.all(
    tags.map(async ([tag]) => {
      const src = /\ssrc="([^"]+)"/.exec(tag)?.[1];
      if (!src?.startsWith('/')) throw new Error(`journal image must be a root path under public/: ${tag}`);
      const alt = /\salt="([^"]*)"/.exec(tag)?.[1];
      if (!alt) throw new Error(`journal image needs alt text: ${src}`);
      const { width, height } = await sharp(join(publicDir, decodeURIComponent(src))).metadata();
      if (!width || !height) throw new Error(`cannot read the size of ${src}`);
      const shown = width <= SMALL || CAPTURE.test(src) ? width * 2 : width;
      return `<img src="${src}" alt="${alt}" width="${width}" height="${height}" loading="lazy" decoding="async" class="journal-image" style="--journal-image-width: ${shown}px">`;
    }),
  );
  let i = 0;
  return html.replace(/<img\b[^>]*>/g, () => sized[i++] ?? '');
}

/**
 * Wide tables scroll sideways on phones, and so does the source of a diagram until it is drawn. A region that scrolls
 * has to be reachable with the keyboard.
 */
export function focusableScrollers(html: string): string {
  return html
    .replace(/<table>/g, '<table tabindex="0">')
    .replace(/<pre><code class="language-mermaid">/g, '<pre tabindex="0"><code class="language-mermaid">');
}

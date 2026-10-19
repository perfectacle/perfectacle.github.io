import type { Element, Root } from 'hast';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

// Images may use the post column up to 960px. Astro derives srcset/sizes from the image width (it ignores a
// `sizes` set here), so the width is capped at that; it never upscales smaller images.
export const POST_IMAGE_WIDTH = 960;

/** Matches the `sizes` Astro writes for a constrained image of width W: `(min-width: Wpx) Wpx, 100vw`. */
export const ASTRO_SIZES = /sizes="\(min-width: (\d+)px\) \1px, 100vw"/g;

/**
 * The real rendered width of a post image, for `sizes`. Astro's default ignores the gutters and, above 1100px,
 * the contents sidebar, so 2x screens fetched a variant one step too large (the LCP image included).
 *
 * Mirrors the CSS and must change with it: --gutter is clamp(16px, 4vw - 10px, 48px), so the page frame minus
 * gutters is 100vw - 32px below 650px and 92vw + 20px above; the sidebar takes 280px plus a 56px gap from 1101px.
 */
export function postImageSizes(hasSidebar: boolean, W = POST_IMAGE_WIDTH): string {
  const frame = (offset: number) => `calc(92vw ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}px)`;
  // Viewport width from which `92vw + offset` is at least W. Entries are matched first to last, so a small image's
  // cap may come before the sidebar breakpoint and still be right: the box is min(W, column) everywhere.
  const capAt = (offset: number) => Math.ceil(((W - offset) * 100) / 92);
  const narrow = [`(min-width: ${capAt(20)}px) ${W}px`, `(min-width: 650px) ${frame(20)}`, 'calc(100vw - 32px)'];
  if (!hasSidebar) return narrow.join(', ');
  return [`(min-width: ${capAt(-316)}px) ${W}px`, `(min-width: 1101px) ${frame(-316)}`, ...narrow].join(', ');
}

/** Width of a local image file, or undefined when it can't be read (remote URL, missing file). */
async function originalWidth(src: unknown, postFile: string | undefined): Promise<number | undefined> {
  if (typeof src !== 'string' || !postFile || /^(?:[a-z]+:)?\/\//i.test(src) || src.startsWith('/')) return undefined;
  try {
    return (await sharp(resolve(dirname(postFile), decodeURI(src))).metadata()).width;
  } catch {
    return undefined;
  }
}

export function rehypePostImages() {
  return async (tree: Root, file: VFile) => {
    const images: Element[] = [];
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'img') images.push(node);
    });
    // Asking Astro for more than the original's width gives a srcset whose only file is smaller than the box,
    // so the browser stretches it. Capping at the original keeps every image at its own size or less.
    await Promise.all(
      images.map(async node => {
        const own = await originalWidth(node.properties['src'], file.path);
        node.properties['width'] = own ? Math.min(own, POST_IMAGE_WIDTH) : POST_IMAGE_WIDTH;
      }),
    );
    // The first image is usually on screen at load and is the LCP element; lazy-loading it delays the paint.
    const [first] = images;
    if (first) {
      first.properties['loading'] = 'eager';
      first.properties['fetchpriority'] = 'high';
    }
  };
}

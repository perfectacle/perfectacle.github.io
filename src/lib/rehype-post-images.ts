import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

// The post column is at most 720px wide. Astro derives srcset/sizes from the image width (it ignores a
// `sizes` set here), so the width is capped at the column; it never upscales smaller images.
export const POST_IMAGE_WIDTH = 720;

export function rehypePostImages() {
  return (tree: Root) => {
    let first = true;
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return;
      node.properties['width'] = POST_IMAGE_WIDTH;
      // The first image is usually on screen at load and is the LCP element; lazy-loading it delays the paint.
      if (first) {
        node.properties['loading'] = 'eager';
        node.properties['fetchpriority'] = 'high';
        first = false;
      }
    });
  };
}

import type { Root } from 'hast';
import { describe, expect, it } from 'vitest';
import { rehypeYoutubeFacade } from '../src/lib/rehype-youtube-facade.ts';

const run = (value: string) => {
  const tree: Root = { type: 'root', children: [{ type: 'raw', value }] };
  rehypeYoutubeFacade()(tree);
  return (tree.children[0] as { value: string }).value;
};

describe('rehypeYoutubeFacade', () => {
  it('replaces the embed iframe with a thumbnail button', () => {
    const out = run(
      '<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/S6_3_7lbVnk" title="YouTube video" loading="lazy" allowfullscreen></iframe></div>',
    );
    expect(out).toContain('data-yt="S6_3_7lbVnk"');
    expect(out).toContain('https://i.ytimg.com/vi/S6_3_7lbVnk/hqdefault.jpg');
    expect(out).not.toContain('<iframe');
  });

  it('keeps the start time and drops share-tracking parameters', () => {
    const out = run(
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/G3sbCAv0gBE?si=mu860hnbor6Hwmko&amp;start=512" allowfullscreen></iframe>',
    );
    expect(out).toContain('data-start="512"');
    expect(out).not.toContain('si=');
  });

  it('leaves other iframes alone', () => {
    const html = '<iframe src="https://w.soundcloud.com/player/?url=x"></iframe>';
    expect(run(html)).toBe(html);
  });
});

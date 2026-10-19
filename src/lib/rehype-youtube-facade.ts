import type { Root } from 'hast';
import { visit } from 'unist-util-visit';

// Posts embed YouTube as raw <iframe> HTML. Each iframe pulls ~80KB+ of player script on page load,
// so a post with dozens of videos was slow. They become a thumbnail button that swaps in the player on click
// (see YoutubeFacade.astro). Runs before Astro's rehype-raw, so the HTML is still a `raw` string here.
const IFRAME =
  /<iframe\s[^>]*src="https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})([^"]*)"[^>]*><\/iframe>/g;

export function youtubeFacade(id: string, query = ''): string {
  // Only the start time matters for playback; `si` and the like are share-tracking parameters.
  const start = /[?&;](?:amp;)?start=(\d+)/.exec(query)?.[1];
  return (
    `<span class="yt-frame"><button type="button" class="yt-facade" data-yt="${id}"` +
    (start ? ` data-start="${start}"` : '') +
    ` aria-label="YouTube 동영상 재생">` +
    `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async">` +
    `</button></span>`
  );
}

export function rehypeYoutubeFacade() {
  return (tree: Root) => {
    visit(tree, 'raw', node => {
      node.value = node.value.replace(IFRAME, (_, id: string, query: string) => youtubeFacade(id, query));
    });
  };
}

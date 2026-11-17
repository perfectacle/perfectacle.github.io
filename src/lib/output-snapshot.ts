// Whitespace between table parts (`<tr> <td>`, `</td> </tr>`) is dropped by CSS table layout, even
// with `.prose table { display: block }`. HTML parsers differ on whether they keep it, so a parser
// update would otherwise flag every table. Cell contents (`<td> <b>`) are left alone.
const tableGap =
  /(<\/?(?:table|thead|tbody|tfoot|tr|colgroup)\b[^>]*>|<\/t[hd]>|<\/caption>)\s+(?=<\/?(?:table|thead|tbody|tfoot|tr|th|td|caption|colgroup|col)\b)/g;

/** Astro marks a component's elements for its scoped styles with `astro-` and an eight-character hash. */
const scopeClass = /^astro-[a-z0-9]{8}$/;

/**
 * Astro's per-component scope markers. Scoped styles select `data-astro-cid-*`; the compiler has also written the
 * same hash as a class on elements that spread their attributes, and which elements get it changes between compiler
 * releases. Both are dropped, so a compiler update is not read as a change to the page. Whether scoped styles still
 * reach those elements is checked where it shows: the end-to-end tests read the computed styles.
 */
const dropScopeMarkers = (html: string) =>
  html.replace(/\sdata-astro-cid-\w+(?:="[^"]*")?/g, '').replace(/\sclass="([^"]*)"/g, (_, value: string) => {
    const kept = value.split(/\s+/).filter(name => name && !scopeClass.test(name));
    return kept.length ? ` class="${kept.join(' ')}"` : '';
  });

/**
 * Strips build-specific noise that changes without the page changing: content-hashed asset names, Astro's scope
 * markers and whitespace. What is left is compared between two builds of a dependency update.
 */
export const normalizeOutput = (html: string) =>
  dropScopeMarkers(html.replace(/\/_astro\/([^"'\s)]+?)\.[\w-]{8}(?:_[\w-]+)?\.(\w+)/g, '/_astro/$1.$2'))
    .replace(/\s+/g, ' ')
    .replace(tableGap, '$1')
    .trim();

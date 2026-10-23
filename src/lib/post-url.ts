/** The published URL of a post: `/YYYY/MM/DD/<slug>/`. Both the Astro routes and the build scripts build it here. */
export const postUrl = (y: string, m: string, d: string, slug: string) => `/${y}/${m}/${d}/${slug}/`;

// Same rules as hexo-util's slugize, so tag/category/heading URLs stay identical to the Hexo era.
// eslint-disable-next-line no-control-regex -- stripping control characters is the point, as in hexo-util.
const rControl = /[\u0000-\u001f]/g;
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'<>,.?/]+/g;

export function slugize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

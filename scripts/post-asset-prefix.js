'use strict';

// Posts reference images as `<post-name>/<file>` so editors can preview them
// relative to the .md file. hexo-renderer-marked's `postAsset` resolves paths
// relative to the asset folder itself, so the prefix is stripped before rendering.
const { basename, extname } = require('path');

const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

hexo.extend.filter.register('before_post_render', data => {
  if (!data.source || !data.source.startsWith('_posts/') && !data.source.startsWith('_drafts/')) return data;

  const name = escapeRegExp(basename(data.source, extname(data.source)));
  const { url_for } = hexo.extend.helper.store;

  // Raw <img> is not seen by the marked image renderer, so it gets an absolute URL here.
  data.content = data.content
    .replace(new RegExp(`(!\\[[^\\]]*\\]\\(<?)${name}/`, 'g'), '$1')
    .replace(new RegExp(`(<img[^>]*?\\ssrc=["'])${name}/`, 'g'),
      (_, head) => head + url_for.call(hexo, data.path));
  return data;
});

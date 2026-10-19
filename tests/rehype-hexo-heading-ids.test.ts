import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { rehypeHexoHeadingIds } from '../src/lib/rehype-hexo-heading-ids.ts';

const render = (md: string) =>
  String(unified().use(remarkParse).use(remarkRehype).use(rehypeHexoHeadingIds).use(rehypeStringify).processSync(md));

describe('rehypeHexoHeadingIds', () => {
  it('slugizes heading text keeping case and Korean', () => {
    expect(render('## Writing tests is a design activity')).toContain('id="Writing-tests-is-a-design-activity"');
    expect(render('### 6장 보안')).toContain('id="6장-보안"');
  });

  it('includes inline code text', () => {
    expect(render('## `@Transactional` 동작')).toContain('id="Transactional-동작"');
  });

  it('numbers duplicates like marked: x, x-1, x-2', () => {
    const html = render('## 정리\n\n## 정리\n\n## 정리');
    expect(html).toMatch(/id="정리"[\s\S]*id="정리-1"[\s\S]*id="정리-2"/);
  });
});

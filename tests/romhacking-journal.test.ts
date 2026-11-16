import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { JOURNALS, journalPart, journalPartLabel, journalPartPath } from '../src/components/romhacking/journal.ts';

const root = resolve(import.meta.dirname, '..');

test('every part of a journal has its own page that names it', () => {
  for (const journal of JOURNALS) {
    expect(new Set(journal.parts.map(p => p.slug)).size).toBe(journal.parts.length);
    for (const part of journal.parts) {
      const file = resolve(root, `src/pages${journalPartPath(journal, part).replace(/\/$/, '')}.md`);
      expect(existsSync(file), file).toBe(true);
      expect(readFileSync(file, 'utf8')).toMatch(
        new RegExp(`^---\\n[\\s\\S]*?\\npart: ${part.slug}\\n[\\s\\S]*?---\\n`),
      );
    }
  }
});

test('parts are numbered from the overview, which is part 0', () => {
  const [journal] = JOURNALS;
  if (!journal) throw new Error('no journal');
  expect(journalPartLabel(journal, journalPart(journal, 'overview'))).toBe('0편');
  expect(journalPartLabel(journal, journalPart(journal, 'chapter1'))).toBe(`${journal.parts.length - 1}편`);
  expect(() => journalPart(journal, 'missing')).toThrow();
});

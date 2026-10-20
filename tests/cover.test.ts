import { describe, expect, it } from 'vitest';
import { COVER_ACCENTS, coverFor, seedOf } from '../src/lib/cover.ts';

describe('seedOf', () => {
  it('is the 32-bit FNV-1a hash', () => {
    // Reference values of FNV-1a 32 for ASCII input.
    expect(seedOf('')).toBe(0x811c9dc5);
    expect(seedOf('a')).toBe(0xe40c292c);
    expect(seedOf('foobar')).toBe(0xbf9cf968);
  });

  it('handles Hangul slugs and stays unsigned', () => {
    const h = seedOf('해외여행');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });
});

describe('coverFor', () => {
  it('is deterministic per slug', () => {
    expect(coverFor('hikari-cp-time-config')).toEqual(coverFor('hikari-cp-time-config'));
  });

  it('picks an accent from the palette and line widths within 30–85%', () => {
    for (const slug of [
      'netty-byte-buf',
      'fail-fast-iterator',
      'kotlin-de-serialize-dto',
      'how-to-remove-instanceof',
    ]) {
      const { accent, lines } = coverFor(slug);
      expect(COVER_ACCENTS).toContain(accent);
      expect(lines).toHaveLength(3);
      for (const w of lines) {
        expect(w).toBeGreaterThanOrEqual(30);
        expect(w).toBeLessThanOrEqual(85);
      }
    }
  });

  it('spreads real image-less posts across the palette', () => {
    const slugs = [
      'kotlin-de-serialize-dto',
      'kotlin-request-nullable-non-null',
      'how-to-set-read-more-in-next-theme',
      'change-inheritance-hierarchy-without-affecting-client',
      'how-to-make-subclasses-easy-to-remove',
      'how-to-remove-instanceof',
      'dependency-injection-in-junit',
      'spring-properties-file',
      'detecting-test-configuration-in-spring-boot-test',
      'netty-byte-buf',
      'fail-fast-iterator',
      'spring-web-request-deserialization-for-null',
      'spring-web-response-deserialization-for-null',
      'hikari-cp-time-config',
    ];
    const used = new Set(slugs.map(s => coverFor(s).accent));
    expect(used.size).toBeGreaterThanOrEqual(4);
  });
});

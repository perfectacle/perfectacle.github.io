import { expect, test } from 'vitest';
import {
  encodeFat,
  encodeFnt,
  hexBytes,
  listFiles,
  parseFat,
  parseFnt,
  parseHeader,
  walk,
  type FntDir,
} from '../src/lib/nds-fs.ts';
import { SAMPLE, SAMPLE_PATH, fileGroups, walkSteps } from '../src/components/romhacking/nds-walk.ts';
import sample from '../src/components/romhacking/ghost-trick-fs.json';

// Bytes below were read from Ghost Trick (J) with `krpatch nds` and xxd.
test('the sample tables encode to the bytes in the ROM', () => {
  expect(SAMPLE.fnt.length).toBe(0x1654);
  expect(SAMPLE.fat.length).toBe(0x720);
  expect(hexBytes(SAMPLE.fnt.subarray(0, 16))).toBe('70 00 00 00 07 00 0E 00 83 02 00 00 25 00 00 F0');
  expect(hexBytes(SAMPLE.fnt.subarray(0x225, 0x22c))).toBe('84 73 74 30 31 01 F0');
  expect(hexBytes(SAMPLE.fat.subarray(38 * 8, 39 * 8))).toBe('00 62 F5 05 A8 65 F5 05');
});

test('parsing the encoded tables gives the sample back', () => {
  expect(parseFnt(encodeFnt(sample.dirs as FntDir[]))).toEqual(sample.dirs);
  expect(parseFat(SAMPLE.fat)).toEqual(sample.entries);
  expect(encodeFat(parseFat(SAMPLE.fat))).toEqual(SAMPLE.fat);
});

test('files are numbered from each folder’s first id in name order, after the seven unnamed overlays', () => {
  const files = listFiles(parseFnt(SAMPLE.fnt));
  expect(files).toHaveLength(221);
  expect(files[0]).toEqual({ id: 7, path: 'balloon_font.imb' });
  expect(files.find(f => f.path === 'fonts2bpp_new.imb')?.id).toBe(16);
  expect(files.find(f => f.path === 'st04/_st04_game001_Expand.xml.lz')?.id).toBe(114);
  expect(files.at(-1)).toEqual({ id: 227, path: 'system/system_0000.msg.xml.bin' });
});

test('a path leads through the FNT to a file id and through the FAT to its bytes', () => {
  const w = walk(SAMPLE.fnt, SAMPLE.fat, SAMPLE_PATH);
  expect(w.id).toBe(38);
  expect([w.start, w.end]).toEqual([0x5f56200, 0x5f565a8]);
  expect(w.dirs.map(d => [d.dir, d.mainAt, d.matchAt, d.skippedFiles, d.skippedDirs, d.next])).toEqual([
    [0xf000, 0, 0x225, 30, 0, 0xf001],
    [0xf001, 8, 0x29e, 1, 0, undefined],
  ]);
  expect(walk(SAMPLE.fnt, SAMPLE.fat, 'system/system_0000.msg.xml.bin').dirs[0]?.skippedDirs).toBe(12);
});

test('names that are missing, or a folder asked for as a file, are errors', () => {
  expect(() => walk(SAMPLE.fnt, SAMPLE.fat, 'st08/x')).toThrow('이 롬에 없는 이름');
  expect(() => walk(SAMPLE.fnt, SAMPLE.fat, 'st01')).toThrow('이 롬에 없는 이름');
  expect(() => walk(SAMPLE.fnt, SAMPLE.fat, 'balloon_font.imb/x')).toThrow('이 롬에 없는 이름');
});

test('the widget spells out each step with the ROM offset', () => {
  const steps = walkSteps(SAMPLE, SAMPLE_PATH);
  expect(steps.map(s => s.at)).toEqual([0x40, 0xbce00, 0xbd025, 0xbce08, 0xbd09e, 0xbe730]);
  expect(steps[0]?.bytes).toBe('00 CE 0B 00 54 16 00 00 00 E6 0B 00 20 07 00 00');
  expect(steps[1]?.text).toContain('맨 위 폴더를 포함한 폴더 수 14입니다');
  expect(steps[2]?.text).toContain('앞의 파일 이름 30개를 지나 「st01」 칸을 찾습니다');
  expect(steps[2]?.text).toContain('폴더 번호 F001');
  expect(steps[3]?.text).toContain('부모 폴더 번호 F000입니다');
  expect(steps[4]?.text).toContain('첫 파일 번호 37 + 앞의 파일 1개 = 38번 파일');
  expect(steps[5]?.text).toContain('936바이트');
  expect(fileGroups(SAMPLE).map(g => g.folder)).toEqual([
    '',
    ...['01', '02', '03', '04', '05', '06', '07', '09', '11', '13', '14', '15'].map(n => `st${n}`),
    'system',
  ]);
});

test('the header gives the tables and the card size', () => {
  const b = new Uint8Array(0x200);
  b.set(new TextEncoder().encode('GHOSTTRICK-JBGTJ'));
  b[0x14] = 10;
  b.set(encodeFat([SAMPLE.header.fnt, SAMPLE.header.fat]), 0x40);
  const h = parseHeader(b);
  expect([h.title, h.code, 0x20000 << h.capacity]).toEqual(['GHOSTTRICK-J', 'BGTJ', 0x8000000]);
  expect([h.fnt, h.fat]).toEqual([
    [0xbce00, 0x1654],
    [0xbe600, 0x720],
  ]);
  expect(() => parseHeader(b.subarray(0, 0x100))).toThrow();
});

test('step texts never put a Korean particle right after a number, whatever file is chosen', () => {
  const texts = listFiles(parseFnt(SAMPLE.fnt)).flatMap(f => walkSteps(SAMPLE, f.path).map(s => s.text));
  for (const text of texts) expect(text).not.toMatch(/[0-9A-F](이라|을|를|은|는|이|가|과|와)(?![가-힣])/);
  expect(walkSteps(SAMPLE, 'st01/st01_demo100_Expand.xml.lz').at(-2)?.text).toContain(
    '이 폴더의 첫 파일이라 37번 파일',
  );
});

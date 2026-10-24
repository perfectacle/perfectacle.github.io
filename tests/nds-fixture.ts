/** Small stand-ins for a Nintendo DS dump and its patched result; tests/fixtures/nds/patch.xdelta turns one into the other. */
export function fakeRoms() {
  const size = 0x10000;
  const used = 0xc000;
  const source = new Uint8Array(size).fill(0xff);
  let x = 2010;
  for (let i = 0; i < used; i++) {
    x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff;
    source[i] = (x >>> 16) & 255;
  }
  source.set(new TextEncoder().encode('GHOSTTRICK-J'), 0);
  source.set(new TextEncoder().encode('BGTJ'), 12);
  new DataView(source.buffer).setUint32(0x80, used, true);
  const target = source.slice(0, 0xd000);
  target.fill(0x41, 0x4000, 0x4800);
  new DataView(target.buffer).setUint32(0x80, target.length, true);
  return { source, target, used };
}

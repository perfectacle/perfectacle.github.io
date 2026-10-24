/**
 * How kr-patches' play.py sends a DS touch to the libretro desmume core: the core's pointer device spans both screens
 * (256×384, the bottom screen from y = 192). libretro defines pointer values from -0x7FFF at one edge to 0x7FFF at the
 * other; play.py simply scales to 0x10000 and subtracts 0x8000, which is off by less than a pixel. The +0.5 aims at
 * the middle of the pixel.
 */

export const SCREEN_W = 256;
export const SCREEN_H = 192;
export const BOTH_H = SCREEN_H * 2;

export const pointer = (x: number, y: number) => ({
  x: Math.floor(((x + 0.5) * 0x10000) / SCREEN_W) - 0x8000,
  y: Math.floor(((SCREEN_H + y + 0.5) * 0x10000) / BOTH_H) - 0x8000,
});

export const inBottom = (x: number, y: number) =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < SCREEN_W && y >= 0 && y < SCREEN_H;

/** A signed 16-bit value as the core receives it. */
export const hex16 = (v: number) => `0x${(v & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;

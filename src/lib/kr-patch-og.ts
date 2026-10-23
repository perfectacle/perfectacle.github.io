import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { KR_PATCHES, type KrPatch } from './kr-patches.ts';

const SCREEN = { width: 256, height: 224 };

/**
 * Link-preview cards crop to about 1.91:1. Each image is sized so its title screens sit at a whole scale, which
 * keeps every dot square: one game at 3× fills a game page's card, four games at 2× fill the list's.
 */
export const OG_SIZE = {
  game: { width: 1280, height: SCREEN.height * 3 },
  catalogue: { width: 1712, height: SCREEN.height * 2 * 2 },
} as const;

const screen = (path: string) => readFile(resolve('public', `.${path}`));

const pixels = (input: Buffer, scale: number) =>
  sharp(input)
    .resize(SCREEN.width * scale, SCREEN.height * scale, { kernel: 'nearest' })
    .png()
    .toBuffer();

/** One game's title screen at 3× over a dark, blurred copy of itself. */
export async function gameOgImage(patch: KrPatch) {
  const title = await screen(patch.titleScreen);
  const { width, height } = OG_SIZE.game;
  const backdrop = await sharp(title)
    .resize(width, height, { fit: 'cover' })
    .blur(24)
    .modulate({ brightness: 0.4 })
    .png()
    .toBuffer();
  return sharp(backdrop)
    .composite([{ input: await pixels(title, 3), gravity: 'center' }])
    .png()
    .toBuffer();
}

/** Every game's title screen at 2× in a two-by-two grid, for the pages that list them. */
export async function catalogueOgImage() {
  if (KR_PATCHES.length > 4) throw new Error('The list preview has room for four title screens');
  const tiles = await Promise.all(KR_PATCHES.map(async p => pixels(await screen(p.titleScreen), 2)));
  const { width, height } = OG_SIZE.catalogue;
  const tile = { width: SCREEN.width * 2, height: SCREEN.height * 2 };
  const left = (width - tile.width * 2) / 2;
  return sharp({ create: { width, height, channels: 3, background: '#0d0f14' } })
    .composite(
      tiles.map((input, i) => ({
        input,
        left: left + (i % 2) * tile.width,
        top: Math.floor(i / 2) * tile.height,
      })),
    )
    .png()
    .toBuffer();
}

export const pngResponse = (body: Buffer) =>
  new Response(new Uint8Array(body), { headers: { 'Content-Type': 'image/png' } });

import type { GetStaticPaths } from 'astro';
import { gameOgImage, pngResponse } from '../../../../../lib/kr-patch-og.ts';
import { KR_PATCHES, type KrPatch } from '../../../../../lib/kr-patches.ts';

export const getStaticPaths = (() =>
  KR_PATCHES.map(patch => ({
    params: { game: patch.path.slice(patch.path.lastIndexOf('/') + 1) },
    props: { patch },
  }))) satisfies GetStaticPaths;

export async function GET({ props }: { props: { patch: KrPatch } }) {
  return pngResponse(await gameOgImage(props.patch));
}

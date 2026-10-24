import { catalogueOgImage, pngResponse } from '../../../../lib/kr-patch-og.ts';
import { NDS_PATCHES } from '../../../../lib/kr-patches.ts';

export async function GET() {
  return pngResponse(await catalogueOgImage(NDS_PATCHES));
}

import { catalogueOgImage, pngResponse } from '../../../../lib/kr-patch-og.ts';

export async function GET() {
  return pngResponse(await catalogueOgImage());
}

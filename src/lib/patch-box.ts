/**
 * What the patch box on a patch page lends to the per-platform flow. The flow modules load only after a file is
 * picked, so the first view ships just the box wiring.
 */
export interface PatchBoxUi {
  /** The box's `data-spec` JSON. */
  spec: string;
  /** URL of the patch file (IPS or xdelta). */
  patch: string;
  /** Saved file name without the extension. */
  output: string;
  show: (message: string, buttons?: { label: string; run: () => void }[]) => void;
  save: (bytes: Uint8Array, name: string) => void;
}

/** The patch file, or undefined after telling the player it could not be fetched. */
export async function fetchPatch(box: PatchBoxUi, retry: () => void): Promise<Uint8Array | undefined> {
  try {
    const response = await fetch(box.patch);
    if (!response.ok) throw new Error(String(response.status));
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    box.show('한글패치 파일을 받지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.', [
      { label: '다시 시도', run: retry },
    ]);
    return undefined;
  }
}

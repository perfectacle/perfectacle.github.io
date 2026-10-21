export interface VersionPair {
  /** File stem under images/patch; frame n of version key `vNN` loads `${id}_vNN_${n}.webp`. */
  id: string;
  /** How many screens the scene spans, shown one after another. */
  frames: number;
  caption: string;
  alt: string;
  /** Screens one version does not have, keyed like `v10:2`, with the note shown in their place. */
  gaps?: Record<string, string>;
  /** Screen height when the capture is a strip rather than the full 224-line screen. */
  height?: number;
}

export interface VersionGroup {
  id: string;
  title: string;
  summary: string;
  pairs: VersionPair[];
}

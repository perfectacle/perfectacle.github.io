export type ScreenshotHighlight = readonly [x: number, y: number, width: number, height: number];
export type ScreenshotCrop = readonly [x: number, y: number, width: number, height: number];

export interface VersionPair {
  /** File stem under images/patch; frame n of version key `vNN` loads `${id}_vNN_${n}.webp`. */
  id: string;
  /** How many screens the scene spans, shown one after another; one when omitted. */
  frames?: number;
  /** Representative frame numbers; file names and highlight keys retain the original numbering. */
  selectedFrames?: number[];
  caption: string;
  alt: string;
  /** Screens one version does not have, keyed like `v10:2`, with the note shown in their place. */
  gaps?: Record<string, string>;
  /** Screen height when the capture is a strip rather than the full 224-line screen. */
  height?: number;
  /** Changed regions in native image coordinates, keyed like `v10:1`. */
  highlights?: Record<string, ScreenshotHighlight[]>;
}

export interface VersionGroup {
  id: string;
  title: string;
  summary: string;
  pairs: VersionPair[];
}

export interface Version {
  key: string;
  label: string;
}

/** For pages that set the Japanese original beside the Korean patch. */
export const JAPANESE_AND_KOREAN: Version[] = [
  { key: 'jp', label: '일본판' },
  { key: 'ko', label: '한글패치' },
];

/** One cell of a patch-note figure: a version (or step) label above its screen. */
export interface ReleasePanel {
  label?: string | undefined;
  alt: string;
  /** Defaults to the figure's image, so several panels can crop one composite capture. */
  src?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  crop?: ScreenshotCrop | undefined;
  /** Changed letters, boxed in an overlay rather than drawn into the image so the preview keeps them. */
  highlights?: ScreenshotHighlight[] | undefined;
  /** Shown instead of a screen when this version has no such screen. */
  note?: string | undefined;
}

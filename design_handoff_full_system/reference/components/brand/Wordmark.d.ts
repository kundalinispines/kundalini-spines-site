import * as React from 'react';

/**
 * The two-line KUNDALINI SPINES lockup: compressed poster gothic, letterpress grain, registration rule.
 * @startingPoint section="Brand" subtitle="Two-line letterpress wordmark lockup" viewport="700x300"
 */
export interface WordmarkProps {
  lines?: string[];
  /** Fraction of the stage the LONG line spans. 0.585 desktop, 0.82 on phones. */
  measure?: number;
  /** The hairline registration rule with tick clusters and centre reticle. */
  rule?: boolean;
  /** assets/hero/wordmark-grain.png — quilted from the owner's own letterpress reference. */
  grainSrc?: string;
  /** 0 = footage shows through every speck; 1 = solid type. Settled at 0.25. */
  grainFloor?: number;
  /** Absolute length, never a percentage — the two lines have different boxes. */
  grainSize?: string;
  style?: React.CSSProperties;
}
export declare function Wordmark(props: WordmarkProps): JSX.Element;

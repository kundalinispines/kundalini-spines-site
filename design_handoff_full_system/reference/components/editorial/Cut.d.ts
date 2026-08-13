import * as React from 'react';

/** A floated figure inside a magazine column. No captions — the images carry real alt text and the prose says the rest. */
export interface CutProps {
  src: string;
  alt?: string;
  /** 'wide' is the 480px variant. All three float; under 880px they drop out entirely. */
  side?: 'left' | 'right' | 'wide';
  width?: string;
  style?: React.CSSProperties;
}
export declare function Cut(props: CutProps): JSX.Element;

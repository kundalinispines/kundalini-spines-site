import * as React from 'react';

/** Numbered section head for the magazine feature: crimson numeral, Anton title, hairline rule under. */
export interface FeatureHeadProps {
  /** Zero-padded section number, e.g. "03". Decorative — it duplicates no information. */
  num?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function FeatureHead(props: FeatureHeadProps): JSX.Element;

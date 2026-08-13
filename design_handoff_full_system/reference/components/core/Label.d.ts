import * as React from 'react';

/** Mono, uppercase, tracked-out eyebrow. Record numbers, timestamps, section eyebrows, nav meta. */
export interface LabelProps {
  tone?: 'muted' | 'bone' | 'signal' | 'accent';
  /** display:block so it sits on its own line above a heading. */
  block?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Label(props: LabelProps): JSX.Element;

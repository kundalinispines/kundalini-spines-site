import * as React from 'react';

/** Anton display line inside prose. 'pull' carries a bone rule; 'shout' stands alone; 'signoff' closes the feature. */
export interface PullQuoteProps {
  variant?: 'pull' | 'shout' | 'signoff';
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function PullQuote(props: PullQuoteProps): JSX.Element;

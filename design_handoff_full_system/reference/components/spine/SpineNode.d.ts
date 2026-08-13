import * as React from 'react';

/** A destination on the spine. Real <button> in a vertical toolbar — keyboard and screen-reader native. */
export interface SpineNodeProps {
  label: string;
  /** 'immersive' (Music, Archive) reads as a hollow double point; 'card' opens a reading card. */
  kind?: 'card' | 'immersive';
  /** Which side the card opens on. The label sits opposite the card. */
  side?: 'left' | 'right';
  /** Position down the column, e.g. '40%'. Matches the chakra y values in js/ks-chakras.js. */
  y: string;
  /** idle -> hover (pre-focus) -> active. Once active the card carries the title, so the label clears. */
  state?: 'idle' | 'hover' | 'active';
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function SpineNode(props: SpineNodeProps): JSX.Element;

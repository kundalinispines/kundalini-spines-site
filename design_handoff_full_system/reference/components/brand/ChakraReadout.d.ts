import * as React from 'react';

/** A key/value instrument block. Defaults to THE SEVEN — crown to root, with their frequencies. */
export interface ChakraReadoutProps {
  head?: string;
  /** [label, value] pairs. Omit for the seven centres. */
  rows?: [string, string][];
  style?: React.CSSProperties;
}
export declare function ChakraReadout(props: ChakraReadoutProps): JSX.Element;
export declare const KS_CHAKRAS: { n: number; name: string; en: string; hz: number; y: number }[];

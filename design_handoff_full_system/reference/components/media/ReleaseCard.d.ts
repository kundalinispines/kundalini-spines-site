import * as React from 'react';

/** Square cover + meta block. Used for releases and for flat track listings. */
export interface ReleaseCardProps {
  artwork: string;
  label?: string;
  title: string;
  description?: string;
  /** Actions row — usually disabled Buttons while streaming links are still null. */
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function ReleaseCard(props: ReleaseCardProps): JSX.Element;

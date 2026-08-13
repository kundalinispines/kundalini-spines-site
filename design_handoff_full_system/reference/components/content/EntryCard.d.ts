import * as React from 'react';

/** Large hairline-outlined doorway into a section. Fills with surface grey on hover. */
export interface EntryCardProps {
  label: string;
  title: string;
  description: string;
  href?: string;
  style?: React.CSSProperties;
}
export declare function EntryCard(props: EntryCardProps): JSX.Element;

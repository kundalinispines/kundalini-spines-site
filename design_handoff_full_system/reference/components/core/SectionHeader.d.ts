import * as React from 'react';

/** Eyebrow + display headline + optional lede. Opens every section on every page. */
export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Stencil cut — showcase moments only (hero, big section titles), never below ~2.5rem. */
  stencil?: boolean;
  align?: 'left' | 'center';
  level?: 1 | 2 | 3;
  style?: React.CSSProperties;
}
export declare function SectionHeader(props: SectionHeaderProps): JSX.Element;

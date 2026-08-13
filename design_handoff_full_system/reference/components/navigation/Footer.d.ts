import * as React from 'react';

/** Site footer. 'full' carries the sitemap; 'simple' carries the mark + tagline (homepage). */
export interface FooterLink { label: string; href?: string; }
export interface FooterProps {
  variant?: 'full' | 'simple';
  links?: FooterLink[];
  /** Social platforms. Omit href for a platform with no account — it renders dimmed rather than as a fake link. */
  social?: FooterLink[];
  tagline?: string;
  copyright?: string;
  markSrc?: string;
  style?: React.CSSProperties;
}
export declare function Footer(props: FooterProps): JSX.Element;

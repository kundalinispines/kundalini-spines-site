import * as React from 'react';

/** Fixed site header. Transparent over the hero, opaque black once scrolled. */
export interface NavItem { label: string; href: string; }
export interface NavProps {
  items: NavItem[];
  /** href of the current page — renders aria-current and Signal White. */
  current?: string;
  /** Opaque black + hairline. MEASURED: opaque, never translucent-with-blur. */
  scrolled?: boolean;
  mark?: string;
  markSrc?: string;
  onNavigate?: (href: string) => void;
  style?: React.CSSProperties;
}
export declare function Nav(props: NavProps): JSX.Element;

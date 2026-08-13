import * as React from 'react';

/**
 * The instrument footer: four link columns with channel states, an instrument band, and the cropped outline wordmark.
 * @startingPoint section="Website" subtitle="Instrument footer with link tiers and outline wordmark" viewport="1280x560"
 */
export interface SiteFooterRow { label: string; href?: string; }
export interface SiteFooterColumn { head: string; rows?: SiteFooterRow[]; }
export interface SiteFooterProps {
  /** First column is the identity column — its head sets in display type, not mono. */
  columns?: SiteFooterColumn[];
  /** Instrument blocks beside the links. Defaults to RECORD / GEOMETRY / the seven centres. */
  instrument?: { head: string; rows: [string, string][] }[];
  blurb?: string;
  wordmark?: string;
  copyright?: string;
  seal?: string;
  style?: React.CSSProperties;
}
export declare function SiteFooter(props: SiteFooterProps): JSX.Element;

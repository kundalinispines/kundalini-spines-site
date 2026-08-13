import * as React from 'react';

/** Two-column image-and-prose block. Powers the homepage bio and any featured release/transmission. */
export interface FeaturedBlockProps {
  media: string;
  label?: string;
  title?: string;
  children?: React.ReactNode;
  alt?: string;
  /** '4 / 5' for portraits and covers, '16 / 9' for stills. */
  ratio?: string;
  /** Media on the right instead of the left. */
  reverse?: boolean;
  style?: React.CSSProperties;
}
export declare function FeaturedBlock(props: FeaturedBlockProps): JSX.Element;

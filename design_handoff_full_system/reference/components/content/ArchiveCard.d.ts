import * as React from 'react';

/** 4:3 media plate + category + title + one line. The only image-zoom hover in the system (1.03, 600ms). */
export interface ArchiveCardProps {
  media: string;
  category: string;
  title: string;
  description: string;
  href?: string;
  alt?: string;
  style?: React.CSSProperties;
}
export declare function ArchiveCard(props: ArchiveCardProps): JSX.Element;

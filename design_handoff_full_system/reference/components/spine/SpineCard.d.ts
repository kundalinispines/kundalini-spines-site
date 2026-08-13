import * as React from 'react';

/**
 * The navigator's reading card: frosted glass, index/flag head, rule, prose, CTA.
 * @startingPoint section="Website" subtitle="Glass reading card lit from the spine" viewport="700x420"
 */
export interface SpineCardProps {
  index: number;
  total: number;
  /** The small bordered chip in the head row. ACTIVE while the node is locked. */
  flag?: string;
  eyebrow?: string;
  title: string;
  cta?: string;
  onCta?: () => void;
  /** Which side of the spine the card sits on. Drives which edge catches the light. */
  side?: 'left' | 'right';
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function SpineCard(props: SpineCardProps): JSX.Element;

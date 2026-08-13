import * as React from 'react';

/**
 * Full-viewport opening unit: media, three-stop scrim, stencil title, statement, actions.
 * @startingPoint section="Website" subtitle="Full-bleed hero with scrim and stencil title" viewport="1280x720"
 */
export interface HeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  statement?: string;
  /** Still image path. On the live site this slot holds a muted looping video. */
  media?: string;
  poster?: string;
  actions?: React.ReactNode;
  /** Shows the Sound Off / Sound On opt-in, bottom-right. */
  soundToggle?: boolean;
  minHeight?: string;
  style?: React.CSSProperties;
}
export declare function Hero(props: HeroProps): JSX.Element;

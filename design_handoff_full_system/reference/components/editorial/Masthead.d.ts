import * as React from 'react';

/**
 * The magazine opener: parallax photograph under a halftone and a five-stop scrim, with the headline set in Anton.
 * @startingPoint section="Website" subtitle="Magazine masthead over a parallax photograph" viewport="1280x720"
 */
export interface MastheadProps {
  eyebrow?: string;
  /** One entry per line — each wipes up out of its own crop on a different scroll segment. */
  words?: string[];
  standfirst?: string;
  media: string;
  alt?: string;
  cue?: string;
  style?: React.CSSProperties;
}
export declare function Masthead(props: MastheadProps): JSX.Element;

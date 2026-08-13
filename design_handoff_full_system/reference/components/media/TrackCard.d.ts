import * as React from 'react';

/** One square cover in the homepage track arch. Title is carried by the artwork itself. */
export interface TrackCardProps {
  artwork: string;
  title: string;
  /** Distance from the centred card, in card steps. Drives scale and brightness falloff. */
  depth?: number;
  /** The centred card — full scale, full brightness, always the hero. */
  active?: boolean;
  /** Layout STEP in px (250 desktop, 190 tablet, min(42vw,190) mobile). The card box is 1.85x this. */
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function TrackCard(props: TrackCardProps): JSX.Element;

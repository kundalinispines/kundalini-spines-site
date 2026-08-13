import * as React from 'react';

/** 4:5 portrait + archetype label + two-sentence bio. Used on About. */
export interface MessengerCardProps {
  portrait: string;
  /** The Seeker / The Alchemist — an archetype, never a real name. */
  archetype: string;
  bio: string;
  alt?: string;
  style?: React.CSSProperties;
}
export declare function MessengerCard(props: MessengerCardProps): JSX.Element;

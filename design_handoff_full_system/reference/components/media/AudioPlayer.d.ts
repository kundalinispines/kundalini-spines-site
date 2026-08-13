import * as React from 'react';

/** Full transport with cover, title/artist, scrub and time. Never autoplays; fully keyboard-operable. */
export interface AudioPlayerProps {
  cover?: string;
  title: string;
  artist?: string;
  time?: string;
  duration?: string;
  playing?: boolean;
  /** Real copy for loading/error, e.g. "Sample not available yet." */
  status?: string;
  disabled?: boolean;
  onToggle?: () => void;
  style?: React.CSSProperties;
}
export declare function AudioPlayer(props: AudioPlayerProps): JSX.Element;

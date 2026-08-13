import * as React from 'react';

/** 20-second sample transport. Hard-stops at sampleDuration regardless of the file's real length. */
export interface SamplePlayerProps {
  playing?: boolean;
  /** 0-100. */
  progress?: number;
  disabled?: boolean;
  /** Overrides --track-accent, which is sampled from the live cover art. */
  accent?: string;
  onToggle?: () => void;
  style?: React.CSSProperties;
}
export declare function SamplePlayer(props: SamplePlayerProps): JSX.Element;

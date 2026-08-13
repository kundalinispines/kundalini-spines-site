import * as React from 'react';

/** The transient instruction line at the foot of the navigator. Deletes itself on first interaction. */
export interface SpineHintProps {
  children?: React.ReactNode;
  hidden?: boolean;
  /** 'left' when the stage carries axis end markers — the axis keeps the centre lane. */
  align?: 'center' | 'left';
  style?: React.CSSProperties;
}
export declare function SpineHint(props: SpineHintProps): JSX.Element;

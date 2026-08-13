import * as React from 'react';

/**
 * The Channel Terminal shell: live dot, station id, status, channel tabs, scanlined screen.
 * @startingPoint section="Website" subtitle="Channel Terminal shell with scanlines and tabs" viewport="1280x700"
 */
export interface TerminalProps {
  id?: string;
  status?: string;
  /** Mono readout line above the list, ending in a blinking caret. */
  readout?: string;
  channels?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Terminal(props: TerminalProps): JSX.Element;

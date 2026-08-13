import * as React from 'react';

/** One filed signal in the terminal readout. Opens in place; the image only costs space when asked for. */
export interface TerminalRowProps {
  /** Formatted timestamp, e.g. "2026-07-28 / 004". */
  time: string;
  channel: string;
  title: string;
  open?: boolean;
  onToggle?: () => void;
  /** Expanded detail: media plate on the left, body + link on the right. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function TerminalRow(props: TerminalRowProps): JSX.Element;

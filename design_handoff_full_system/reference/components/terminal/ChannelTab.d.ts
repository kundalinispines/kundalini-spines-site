import * as React from 'react';

/** A frequency in the Channel Terminal. Selected tab carries the only crimson underline on the page. */
export interface ChannelTabProps {
  selected?: boolean;
  /** 0 dims the tab — an empty frequency is still worth tuning to. */
  count?: number;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function ChannelTab(props: ChannelTabProps): JSX.Element;

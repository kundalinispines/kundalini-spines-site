import * as React from 'react';

/** Square mono chip used for the Archive category filter. Inverts to solid white when pressed. */
export interface FilterChipProps {
  active?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function FilterChip(props: FilterChipProps): JSX.Element;

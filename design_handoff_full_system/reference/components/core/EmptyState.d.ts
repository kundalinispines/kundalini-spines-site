import * as React from 'react';

/** Dashed-hairline box carrying real copy where content does not exist yet. */
export interface EmptyStateProps {
  label?: string;
  message: string;
  style?: React.CSSProperties;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;

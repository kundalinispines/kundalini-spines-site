import * as React from 'react';

/**
 * Primary action control. Square, uppercase, condensed display type.
 * @startingPoint section="Core" subtitle="Primary, ghost and text buttons" viewport="700x160"
 */
export interface ButtonProps {
  /** primary = solid Signal White on black. ghost = hairline outline, inverts on hover. text = underlined inline action. */
  variant?: 'primary' | 'ghost' | 'text';
  size?: 'sm' | 'md' | 'lg';
  /** Renders an <a> instead of a <button>. */
  href?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;

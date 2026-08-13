import * as React from 'react';

/**
 * The central vertical axis: wireframe vertebral column, luminous cord, end markers.
 * @startingPoint section="Website" subtitle="The spine navigator axis with nodes" viewport="1280x760"
 */
export interface SpineRailProps {
  /** The line-art column. Luminance-to-alpha webp — no black, so the sky shows through natively. */
  wireSrc?: string;
  /** Axis end markers. entrance mounts the navigator WITHOUT them. */
  markers?: boolean;
  startLabel?: string;
  startSub?: string;
  endLabel?: string;
  endSub?: string;
  /** Decorative energy-point positions, e.g. ['18%','34%']. Non-interactive ambience. */
  points?: string[];
  /** SpineNode children — they position against the same axis. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function SpineRail(props: SpineRailProps): JSX.Element;

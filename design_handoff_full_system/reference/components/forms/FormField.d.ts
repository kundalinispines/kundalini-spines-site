import * as React from 'react';

/** Text input with an always-visible label. Placeholder is never used as the label. */
export interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** Real inline error copy, shown in lit crimson under the field. */
  error?: string;
  disabled?: boolean;
  /** Visually hides the label (kept for screen readers) — only where context is unmistakable. */
  hideLabel?: boolean;
  style?: React.CSSProperties;
}
export declare function FormField(props: FormFieldProps): JSX.Element;

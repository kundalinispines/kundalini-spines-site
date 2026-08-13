import * as React from 'react';

/** Centred email capture, bordered top and bottom by hairlines when placed in its section. */
export interface NewsletterFormProps {
  /** Buttondown endpoint. The form posts NATIVELY — the endpoint sends no CORS headers. */
  action?: string;
  status?: string;
  statusState?: 'info' | 'error' | 'success';
  privacy?: string;
  onSubmit?: (e: React.FormEvent) => void;
  style?: React.CSSProperties;
}
export declare function NewsletterForm(props: NewsletterFormProps): JSX.Element;

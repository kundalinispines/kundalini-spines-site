import React from 'react';
import { Label } from './Label.jsx';

export function EmptyState({ label = 'No signal', message, style }) {
  return (
    <div style={{ border: '1px dashed var(--border-subtle)', padding: 'var(--space-8)', color: 'var(--text-secondary)', ...style }}>
      <Label block style={{ marginBottom: 'var(--space-2)' }}>{label}</Label>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}

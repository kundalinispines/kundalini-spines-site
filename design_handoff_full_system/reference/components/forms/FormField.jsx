import React from 'react';

export function FormField({ label, type = 'text', id, value, onChange, placeholder, error, disabled = false, hideLabel = false, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...style }}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : undefined} style={hideLabel ? undefined : { fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        style={{
          background: 'var(--bg-surface)', border: '1px solid ' + (error ? 'var(--color-crimson-lit)' : 'var(--border-subtle)'),
          color: 'var(--text-primary)', padding: 'var(--space-3) var(--space-4)',
          fontFamily: 'var(--font-body)', fontSize: 'var(--fs-body)', borderRadius: 'var(--radius-sharp)',
          opacity: disabled ? 0.4 : 1
        }} />
      {error ? <p style={{ margin: 0, fontSize: 'var(--fs-caption)', color: 'var(--color-crimson-lit)' }}>{error}</p> : null}
    </div>
  );
}

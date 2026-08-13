import React from 'react';

// A floated figure the prose wraps around — the move that makes the page read as
// a spread rather than a blog post. Float + shape-outside, never grid.
export function Cut({ src, alt = '', side = 'right', width, style }) {
  const widths = { right:'min(40%, 400px)', left:'min(38%, 380px)', wide:'min(46%, 480px)' };
  const floatSide = side === 'left' ? 'left' : 'right';
  return (
    <figure style={{
      margin: side === 'left' ? '0.4em var(--space-12) 1.8em 0' : '0.4em 0 1.8em var(--space-12)',
      float: floatSide, width: width || widths[side], shapeOutside:'margin-box', ...style
    }}>
      <img src={src} alt={alt} style={{ width:'100%', display:'block', border:'1px solid rgba(214,213,208,0.14)' }} />
    </figure>
  );
}

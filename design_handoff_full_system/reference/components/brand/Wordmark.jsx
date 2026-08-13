import React from 'react';

// The two-line lockup: Archivo 900 at width 62, both lines justified to one
// measure by scaling the ink (not the box), with a letterpress grain masked over
// it and a registration rule between the words.
export function Wordmark({ lines = ['KUNDALINI', 'SPINES'], measure = 0.585, rule = true, grainSrc = 'assets/hero/wordmark-grain.png', grainFloor = 0.25, grainSize = '180px', style }) {
  const face = {
    fontFamily:'var(--font-wordmark)', fontWeight:'var(--wordmark-weight)',
    fontStretch:'var(--wordmark-stretch)', fontVariationSettings:'"wdth" 62',
    letterSpacing:'var(--wordmark-track)'
  };
  const maskLayers = {
    WebkitMaskImage:'url("' + grainSrc + '"), linear-gradient(rgba(0,0,0,' + grainFloor + '), rgba(0,0,0,' + grainFloor + '))',
    maskImage:'url("' + grainSrc + '"), linear-gradient(rgba(0,0,0,' + grainFloor + '), rgba(0,0,0,' + grainFloor + '))',
    WebkitMaskSize: grainSize + ' auto, 100% 100%', maskSize: grainSize + ' auto, 100% 100%',
    WebkitMaskPosition:'center, center', maskPosition:'center, center',
    WebkitMaskRepeat:'repeat, no-repeat', maskRepeat:'repeat, no-repeat',
    WebkitMaskComposite:'source-over', maskComposite:'add'
  };
  // The long line resolves to 1; the short line scales up to the same measure.
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), '');
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:0.82, textTransform:'uppercase', color:'var(--color-bone)', pointerEvents:'none', width: (measure * 100) + '%', ...style }}>
      <div style={{ display:'block', width:'100%', ...face }}>
        <span style={{ display:'block', whiteSpace:'nowrap', textAlign:'center', ...maskLayers }}>
          <span style={{ display:'inline-block', transform:'scaleX(1)', transformOrigin:'50% 50%' }}>{lines[0]}</span>
        </span>
        {rule ? (
          <span style={{ display:'block', position:'relative', width:'100%', height:'14px', filter:'drop-shadow(0 0 6px rgba(0,0,0,0.9))' }}>
            <i style={{ position:'absolute', top:'50%', left:0, right:0, height:'1px', background:'rgba(214,213,208,0.55)' }} />
            <i style={{ position:'absolute', top:'50%', left:'10px', transform:'translateY(-50%)', display:'flex', gap:'3px' }}>
              <b style={{ display:'block', width:'1px', height:'7px', background:'rgba(214,213,208,0.75)' }} />
              <b style={{ display:'block', width:'1px', height:'7px', background:'rgba(214,213,208,0.75)' }} />
            </i>
            <i style={{ position:'absolute', top:'50%', right:'10px', transform:'translateY(-50%)', display:'flex', gap:'3px' }}>
              <b style={{ display:'block', width:'1px', height:'7px', background:'rgba(214,213,208,0.75)' }} />
              <b style={{ display:'block', width:'1px', height:'7px', background:'rgba(214,213,208,0.75)' }} />
            </i>
            <i style={{ position:'absolute', left:'50%', top:'50%', width:'16px', height:'16px', transform:'translate(-50%,-50%)' }}>
              <b style={{ position:'absolute', left:'50%', top:0, bottom:0, width:'1px', transform:'translateX(-50%)', background:'rgba(214,213,208,0.9)' }} />
              <b style={{ position:'absolute', top:'50%', left:0, right:0, height:'1px', transform:'translateY(-50%)', background:'rgba(214,213,208,0.9)' }} />
              <b style={{ position:'absolute', left:'50%', top:'50%', width:'9px', height:'9px', border:'1px solid rgba(214,213,208,0.9)', borderRadius:'50%', transform:'translate(-50%,-50%)' }} />
            </i>
          </span>
        ) : null}
        {lines.slice(1).map(l => (
          <span key={l} style={{ display:'block', whiteSpace:'nowrap', textAlign:'center', ...maskLayers }}>
            <span style={{ display:'inline-block', transform:'scaleX(' + (longest.length / l.length).toFixed(3) + ')', transformOrigin:'50% 50%' }}>{l}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

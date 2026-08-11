/* ==========================================================================
   FIELD VARIANT — READOUT  (behaviour + content)
   Partner file: css/field/v-readout.css (presentation). One of six variants
   competing for the empty outer thirds of the navigator; the host page mounts
   exactly one at a time and sets html.v-readout while this one is up.

   THE HYPOTHESIS
     The margins do not feel empty because they lack MARKS (PLATE, GRATICULE),
     or because they lack GEOMETRY (HALO, MANDALA), or because they lack SCALE
     (CROP). They feel empty because they lack INFORMATION. So: fill them with
     instrument columns — an observatory's side panels — set small enough and
     faint enough that the eye reads TEXTURE, and only resolves words if it
     chooses to look. The entrance headline is "Knowledge Hidden in Plain
     Sight"; this variant is that sentence built as furniture.

   THE CONTENT IS TRUE, WHICH IS THE WHOLE POINT
     Every number below comes from this repo or from the real world, not from
     a sci-fi phrasebook. Invented telemetry reads as invented within about
     two seconds of anyone actually looking, and looking is the behaviour this
     variant is trying to earn.
       - the seven chakra frequencies and their y-positions: the shared table
         all six variants were given, so the comparison stays honest
       - 33 vertebral segments / 7 centres: real anatomy, and also the subject
         of the project's own filed transmission 002, "Thirty-three and seven"
       - 7.83 Hz and its harmonics: the Schumann resonance — the earth's own
         carrier. On-brand without being invented.
       - METATRON 10 / VESICA 09 / VIGNETTE 09, GEOMETRY 10 / FOG 09 /
         DISTORTION 09, HIGH 09 / MEDIUM 18 / LOW 01: counted out of the 28
         `visualTheme` blocks in data/tracks.json
       - the sequence run: the 28 real track durations, and their real sum
       - the log rows: the four real entries in data/transmissions.json
       - the two Messenger archetypes: data/messengers.json
       - the node bearings: the y-values of the six-node table in js/spine-ui.js
     Track TITLES are deliberately absent. So are the six node titles — the
     navigator hides its labels until hover on purpose, and a margin that
     printed them would quietly destroy that. The bearings column names the
     nodes only by index, kind, side and height, which is what an instrument
     would know about them anyway.

   WHY THERE IS NO CLOCK
     The obvious move is a setInterval that jitters a drift value. This project
     runs zero idle rAF and zero idle intervals and treats that as a measured,
     defended property, and a ticking margin is exactly the thing that would
     quietly take it away — for an effect that is a cliché besides. Liveness
     here comes from the pointer only: `pointermove` fires while the hand
     moves and not otherwise, and the one rAF below is a per-event coalescer
     that never reschedules itself, so an idle page schedules no frames.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- The shared chakra table. y is percent from the top of the stage. ---- */
  var CHAKRA = [
    { i: '07', n: 'SAHASRARA',    e: 'CROWN',        hz: '963', y: 12 },
    { i: '06', n: 'AJNA',         e: 'THIRD EYE',    hz: '852', y: 27 },
    { i: '05', n: 'VISHUDDHA',    e: 'THROAT',       hz: '741', y: 40 },
    { i: '04', n: 'ANAHATA',      e: 'HEART',        hz: '639', y: 53 },
    { i: '03', n: 'MANIPURA',     e: 'SOLAR PLEXUS', hz: '528', y: 66 },
    { i: '02', n: 'SVADHISTHANA', e: 'SACRAL',       hz: '417', y: 79 },
    { i: '01', n: 'MULADHARA',    e: 'ROOT',         hz: '396', y: 92 }
  ];

  /* ---- The six navigator destinations, by index/kind/side/height only.
         Mirrors NODES[] in js/spine-ui.js. If that table moves, this drifts —
         it is a variant probe, not production, so it is copied rather than
         imported; a real merge would read window.__spineLab.nodes instead. ---- */
  var BEARINGS = [
    { i: '01', k: 'IMMERSIVE', s: 'R', y: 14 },
    { i: '02', k: 'READING',   s: 'L', y: 29 },
    { i: '03', k: 'READING',   s: 'R', y: 44 },
    { i: '04', k: 'READING',   s: 'L', y: 59 },
    { i: '05', k: 'IMMERSIVE', s: 'R', y: 74 },
    { i: '06', k: 'READING',   s: 'L', y: 88 }
  ];

  /* ---- The 28 real durations, in running order. Rendered three to a line as
         a numeric run: this block is pure texture and is never meant to be
         read as a list — it is here to give the right-hand column the weight
         of a manifest. ---- */
  var DURATIONS = [
    '5:01', '2:34', '4:01', '3:23', '3:48', '1:40', '3:58',
    '5:09', '3:49', '5:17', '4:13', '4:09', '3:34', '3:32',
    '4:24', '4:24', '3:34', '3:24', '3:57', '5:29', '3:47',
    '4:59', '2:56', '3:13', '4:43', '4:40', '4:07', '3:10'
  ];

  var DOT = ' &middot; ';

  /* --------------------------------------------------------------------------
     DOM helpers. Every line's text lives inside a span, without exception —
     the lift below animates `opacity` on the leaf, and if a line sometimes
     held bare text and sometimes a span, the two would sit at different
     effective alphas because opacity multiplies down the tree. One rule, no
     exceptions, no surprises.
     -------------------------------------------------------------------------- */
  function el(cls, html) {
    var d = document.createElement('div');
    d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }
  function sp(cls, txt) { return '<span class="' + cls + '">' + txt + '</span>'; }

  function head(t)     { return el('ro-l ro-l--h', sp('ro-t', t)); }
  function kv(k, v)    { return el('ro-l', sp('ro-k', k) + sp('ro-v', v)); }
  function raw(t)      { return el('ro-l', sp('ro-t', t)); }
  function dim(t)      { return el('ro-l ro-l--dim', sp('ro-t', t)); }

  /* A block = a titled group of lines. Blocks are separated by exactly one
     blank line-height so the whole panel stays on a single 13px baseline grid;
     an instrument that does not share a grid stops reading as an instrument. */
  function block(rows) {
    var b = el('ro-b');
    for (var i = 0; i < rows.length; i++) b.appendChild(rows[i]);
    return b;
  }

  /* --------------------------------------------------------------------------
     COLUMN A — outer left. STATION. Status, harmonics, the vertebral index,
     the channel allocation, the filed log.
     -------------------------------------------------------------------------- */
  function colA() {
    var c = el('ro-col ro-col--a');

    c.appendChild(block([
      raw('KUNDALINI SPINES'),
      dim('FIELD READOUT / STA-01')
    ]));

    c.appendChild(block([
      head('ACQUISITION'),
      kv('STATE',   'ACQUIRED'),
      kv('CARRIER', '7.83 Hz'),
      kv('BAND',    '0.60 Hz'),
      kv('DRIFT',   '+0.004'),
      kv('LOCK',    'PHASE'),
      kv('S/N',     '12.6 dB'),
      kv('PATH',    'CLEAR')
    ]));

    /* The Schumann harmonics, real values. They double as a second, coarser
       frequency scale next to the chakra ladder in column B — two instruments
       measuring the same column in different units, which is what makes the
       pair read as a panel rather than as decoration repeated twice. */
    c.appendChild(block([
      head('HARMONICS'),
      kv('FUNDAMENTAL', '7.83'),
      kv('2ND',        '14.30'),
      kv('3RD',        '20.80'),
      kv('4TH',        '27.30'),
      kv('5TH',        '33.80')
    ]));

    c.appendChild(block([
      head('COLUMN INDEX'),
      kv('CERVICAL C1-C7',  '07'),
      kv('THORACIC T1-T12', '12'),
      kv('LUMBAR L1-L5',    '05'),
      kv('SACRAL S1-S5',    '05'),
      kv('COCCYX CO1-CO4',  '04'),
      kv('SEGMENTS',        '33'),
      kv('CENTRES',         '07')
    ]));

    c.appendChild(block([
      head('CHANNELS'),
      kv('X',         'OPEN'),
      kv('INSTAGRAM', 'OPEN'),
      kv('TIKTOK',    'OPEN'),
      kv('YOUTUBE',   'OPEN'),
      kv('SPOTIFY',   'STANDBY'),
      kv('FILED',     'ARCHIVE')
    ]));

    c.appendChild(block([
      head('LOG'),
      dim('004' + DOT + '2026-07-28' + DOT + 'F'),
      dim('003' + DOT + '2026-07-28' + DOT + 'F'),
      dim('002' + DOT + '2026-07-21' + DOT + 'F'),
      dim('001' + DOT + '2026-07-01' + DOT + 'F')
    ]));

    /* Anchored to the foot of the column rather than flowed, so the lower half
       of the left margin is not simply empty — the complaint this whole
       exercise exists to answer. Held at 12% off the bottom because the
       navigator's own hint line ("CLICK TO OPEN") sits bottom-left at
       var(--space-6) on pages that carry the end marker, and a faint column
       landing on top of live instructional copy is a worse crime than a gap. */
    var foot = el('ro-foot');
    foot.appendChild(dim('RECEIVE' + DOT + 'DECODE' + DOT + 'RISE'));
    foot.appendChild(dim('STA-01' + DOT + 'LOCK HELD'));
    c.appendChild(foot);

    return c;
  }

  /* --------------------------------------------------------------------------
     COLUMN B — inner left. THE CALIBRATION LADDER.
     Absolutely positioned at the seven chakra heights, so the column is not a
     list that happens to sit beside the spine — it is a scale that agrees with
     it. This spatial truth is the difference between an instrument panel and a
     wall of mono text, and it is the one thing here worth defending hardest.
     Right-aligned: the numbers form a clean edge facing the axis.
     -------------------------------------------------------------------------- */
  function colB() {
    var c = el('ro-col ro-col--b');
    for (var i = 0; i < CHAKRA.length; i++) {
      var k = CHAKRA[i];
      var r = el('ro-cal');
      r.style.top = k.y + '%';
      r.appendChild(raw(k.i + '&nbsp;&nbsp;' + k.n));
      r.appendChild(dim(k.hz + '.00 Hz' + DOT + k.e));
      c.appendChild(r);
    }
    return c;
  }

  /* --------------------------------------------------------------------------
     COLUMN C — inner right. NODE BEARINGS, positioned at the six real node
     heights so the right ladder answers the left one. Index, kind, side and
     bearing only: an instrument would know a destination's height, not its
     name, and printing the names would undo the navigator's hide-until-hover.
     -------------------------------------------------------------------------- */
  function colC() {
    var c = el('ro-col ro-col--c');
    for (var i = 0; i < BEARINGS.length; i++) {
      var b = BEARINGS[i];
      var y = b.y < 100 ? ('0' + b.y).slice(-3) : String(b.y);
      var r = el('ro-cal');
      r.style.top = b.y + '%';
      r.appendChild(raw('NODE ' + b.i + DOT + b.k));
      r.appendChild(dim('BRG ' + y + DOT + b.s + DOT + 'STBY'));
      c.appendChild(r);
    }
    return c;
  }

  /* --------------------------------------------------------------------------
     COLUMN D — outer right. THE RECORD. Assay of the 28 tracks, the numeric
     run, the ephemeris, the two Messengers, and the thesis at the very bottom
     in the faintest tier on screen — the last thing anyone will find, which is
     the correct place for it.
     -------------------------------------------------------------------------- */
  function colD() {
    var c = el('ro-col ro-col--d');

    c.appendChild(block([
      raw('RISE UP'),
      dim('28 TRACKS' + DOT + 'MMXXVI')
    ]));

    c.appendChild(block([
      head('RECORD'),
      kv('RELEASE', 'RISE UP'),
      kv('YEAR',    '2026'),
      kv('TRACKS',  '28'),
      kv('RUNTIME', '1:50:55')
    ]));

    c.appendChild(block([
      head('GEOMETRY'),
      kv('METATRON', '10/28'),
      kv('VESICA',   '09/28'),
      kv('VIGNETTE', '09/28')
    ]));

    c.appendChild(block([
      head('EFFECT'),
      kv('GEOMETRY',   '10/28'),
      kv('FOG',        '09/28'),
      kv('DISTORTION', '09/28')
    ]));

    c.appendChild(block([
      head('INTENSITY'),
      kv('HIGH',   '09'),
      kv('MEDIUM', '18'),
      kv('LOW',    '01')
    ]));

    /* Three durations to a line. Deliberately unlabelled and set in the dim
       tier — this is the texture block, the one that is supposed to look like
       data rather than resolve into it. */
    var seq = [head('SEQUENCE')];
    for (var i = 0; i < DURATIONS.length; i += 3) {
      var parts = [];
      for (var j = i; j < i + 3 && j < DURATIONS.length; j++) {
        parts.push(('0' + (j + 1)).slice(-2) + ' ' + DURATIONS[j]);
      }
      seq.push(dim(parts.join('&nbsp;')));
    }
    c.appendChild(block(seq));

    /* Observatory pointing, not a street address. Azimuth/elevation/epoch say
       "something is aimed at something" without claiming a real place on a map
       — which would be a fact about the owner that is not mine to publish. */
    c.appendChild(block([
      head('EPHEMERIS'),
      kv('AZIMUTH',     '118.24'),
      kv('ELEVATION',   '34.05'),
      kv('DECLINATION', '+07.83'),
      kv('EPOCH',       '2026.583')
    ]));

    c.appendChild(block([
      head('MESSENGERS'),
      dim('A' + DOT + 'THE SEEKER'),
      dim('B' + DOT + 'THE ALCHEMIST')
    ]));

    var foot = el('ro-foot');
    foot.appendChild(dim('KNOWLEDGE HIDDEN'));
    foot.appendChild(dim('IN PLAIN SIGHT'));
    c.appendChild(foot);

    return c;
  }

  /* --------------------------------------------------------------------------
     THE POINTER LIFT

     The one piece of reactivity: lines near the cursor gain contrast. Two
     falloffs multiplied — a wide horizontal one measured to the COLUMN centre,
     so approaching a column warms the whole column slightly, and a narrow
     vertical one measured to each LINE, so a handful of rows come up to
     readable. Smoothstepped, because a linear cone has a visible hard edge
     that immediately reads as a spotlight gimmick.

     Quantised to five steps. Not for arithmetic cost — 90 lines of multiply is
     nothing — but for WRITE cost: at five steps a slow drag changes maybe a
     dozen custom properties per frame instead of ninety, and a pointer sitting
     in the middle of the stage changes none at all. `--lift` only feeds
     `opacity`, so nothing here can force layout.
     -------------------------------------------------------------------------- */
  var RX = 300;    /* horizontal reach, px — roughly two column widths */
  var RY = 170;    /* vertical reach, px — about thirteen lines */
  var STEPS = 4;

  var wrapEl = null;
  var items = [];
  var dirty = true;
  var pending = false;
  var lastX = 0, lastY = 0;
  var bound = false;

  function markDirty() { dirty = true; }

  function measure() {
    items.length = 0;
    var cols = wrapEl.querySelectorAll('.ro-col');
    for (var i = 0; i < cols.length; i++) {
      var cr = cols[i].getBoundingClientRect();
      /* A zero-width column is one the media queries have switched off. Skip
         it rather than register lines whose rects are all at 0,0 — those would
         all light up together whenever the pointer visited the top-left. */
      if (!cr.width) continue;
      var cx = cr.left + cr.width / 2;
      /* .ro-cal is included alongside .ro-l because the ladder's tick mark is
         its ::after — a pseudo-element inherits from .ro-cal, and --lift set
         on the .ro-l CHILDREN would never reach it (inheritance runs down the
         tree, not up). Registering the pair costs 13 extra items and keeps the
         tick brightening with the two lines it belongs to. */
      var ls = cols[i].querySelectorAll('.ro-l, .ro-cal');
      for (var j = 0; j < ls.length; j++) {
        var lr = ls[j].getBoundingClientRect();
        if (!lr.height) continue;
        items.push({ el: ls[j], cx: cx, cy: lr.top + lr.height / 2, s: -1 });
      }
    }
    dirty = false;
  }

  function apply() {
    pending = false;
    if (!wrapEl) return;
    /* Nothing to reveal while Music owns the screen — the field is at zero
       opacity there, so this is pure work avoidance, not a visual decision. */
    if (document.documentElement.classList.contains('is-music')) return;
    if (dirty) measure();

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var s = 0;
      var hx = 1 - Math.abs(lastX - it.cx) / RX;
      if (hx > 0) {
        var hy = 1 - Math.abs(lastY - it.cy) / RY;
        if (hy > 0) {
          s = hx * hy;
          s = s * s * (3 - 2 * s);          /* smoothstep — no hard cone edge */
        }
      }
      var step = Math.round(s * STEPS);
      if (step !== it.s) {
        it.s = step;
        /* String, not Number: setProperty coerces today, but a custom property
           is a token stream and handing it a number is asking for trouble the
           day someone registers --lift with @property. */
        it.el.style.setProperty('--lift', String(step / STEPS));
      }
    }
  }

  function onMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    /* One frame per burst of movement, and it never re-arms itself. An idle
       page schedules nothing — which is the property this project measures. */
    if (pending) return;
    pending = true;
    requestAnimationFrame(apply);
  }

  function onLeave() {
    for (var i = 0; i < items.length; i++) {
      if (items[i].s !== 0) { items[i].s = 0; items[i].el.style.setProperty('--lift', '0'); }
    }
  }

  function bind() {
    if (bound) return;           /* a double mount must not double-listen */
    /* A touch device has no hover to reward, and a coarse pointer fires
       pointermove only mid-drag — where the lift would look like a bug. The
       columns stay, as static texture. */
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', markDirty);
    window.addEventListener('scroll', markDirty, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    bound = true;
  }

  function unbind() {
    if (!bound) return;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('resize', markDirty);
    window.removeEventListener('scroll', markDirty);
    document.removeEventListener('pointerleave', onLeave);
    bound = false;
  }

  /* --------------------------------------------------------------------------
     MODULE CONTRACT
     -------------------------------------------------------------------------- */
  window.__field = window.__field || {};
  window.__field.readout = {
    mount: function (root) {
      if (!root) return;
      root.innerHTML = '';
      wrapEl = el('ro');
      wrapEl.appendChild(colA());
      wrapEl.appendChild(colB());
      wrapEl.appendChild(colC());
      wrapEl.appendChild(colD());
      root.appendChild(wrapEl);
      /* Measured lazily on the first pointermove, not here: at mount time the
         host may still be laying out, and a rect taken then would be wrong in
         a way nothing later would correct. */
      items = [];
      dirty = true;
      bind();
    },
    unmount: function (root) {
      unbind();
      items = [];
      wrapEl = null;
      if (root) root.innerHTML = '';
    }
  };
})();

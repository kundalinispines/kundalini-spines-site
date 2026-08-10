/* ==========================================================================
   TEXT SCRAMBLE — the ENTER label decoding out of noise.  Pairs with
   css/text-scramble.css; read the block comment there for the styling half.

   THE DOOR ONLY. This is not a site-wide interaction system: it is mounted on
   one button, the entrance's "Enter the Signal", and nothing else. Node labels
   and card CTAs are deliberately left alone — a decode that happens everywhere
   stops being the moment you cross the threshold and becomes a tic.

   ---------------------------------------------------------------------------
   MEASURED OFF THE REFERENCE (21st.dev/@jatin-yadav05 "Text Scramble", sampled
   from the owner's screen recording; two complete decode runs of the word
   VIEWWORK, frames at 200ms). The component's source was never available and
   nothing here is ported — these are read off the pixels:

     1. STRICTLY LEFT TO RIGHT, ONE CHARACTER AT A TIME. A character that has
        settled never churns again. There is no second pass and no shuffle.
     2. ~100ms PER CHARACTER. Settled-count by timestamp, run 1:
        1 @ 2.60s, 3 @ 2.80, 5 @ 3.00, 7 @ 3.20, 8 @ 3.40.  Run 2 matches.
        Eight characters in ~0.9s.
     3. THE COLOUR SPLIT IS THE EFFECT. Settled characters are in the normal
        text colour; every character still churning is in the ACCENT colour, so
        the whole unresolved tail is one colour and the resolved head is
        another. d03 at 2.80s is literally "VI" in near-black followed by
        "EXN6M1" in orange. This is the single thing that separates decoding
        from flickering, and it is the thing a description of the effect does
        not tell you.
     4. POOL IS CAPS + DIGITS, no symbols at all. Observed churn strings:
        O9CA6J5, EXN6M1, WTXC, 2X8W, EEECID, KEO8254.
     5. THE CHURN IS FAST — every trailing character differs between frames
        200ms apart, so the swap period is well under 100ms.
   ---------------------------------------------------------------------------

   One rAF clock, and render(t) is a PURE FUNCTION OF t. Same discipline as
   js/shutter-text.js and for the same reason: the HUD's freeze slider and the
   screenshot rig both go through seek(), so a capture and the thing the owner
   drags through are the same code path. That is only true if the glyph shown
   in slot i at time t does not depend on which frames happened to fire — hence
   the seeded hash in pick() rather than Math.random().

   PUBLIC SURFACE
     TextScramble.mount(el, opts)  -> instance
     instance.play() / .seek(ms) / .set(opts) / .total() / .reset()
     TextScramble.coverage(...)    -> font audit, see COVERAGE below
     window.__scramble             -> the mounted label, for the screenshot rig
   ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------ glyph pool */

  var CAPS   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var DIGITS = '0123456789';

  /* SIXTEEN SYMBOLS, and the omissions are the point.
     Excluded deliberately: . , ' ` " _ : ; ( ) and the space itself. At 12px
     in IBM Plex Mono every one of those is a hairline or a single mark sitting
     on the baseline, so a slot holding one reads as EMPTY for that cycle — and
     an empty slot inside a word reads as a word break, which is fatal here
     because this string has two real word breaks in it that the reader has to
     be able to trust. Everything kept below carries ink across the x-height.

     The reference uses NO symbols (see point 4 above). The owner asked for a
     small symbol set on top of caps and digits, so that is the default, and
     scramble-lab.html shows the reference pool beside it for comparison. */
  var SYMBOLS = '/\\|<>*#%+=?!$&@^~';

  /* FOUR DENSE SYMBOLS — what survived being looked at, and this IS "a small
     set of ASCII symbols"; it is the owner's ask, trimmed by capture rather
     than by taste.

     Captured at 4x with all sixteen in play, frozen at 250/500/750ms, and
     compared against the reference's caps+digits pool at the same instant.
     The verdict was not subtle. Thin diagonals and single strokes — \ / | ^ ~
     < > + = — do not read as CIPHER next to a run of capitals, they read as
     the text having BROKEN: "ENTER TH# 60R+$G" and "ENT+! F+V 2AHR&W" look
     like a rendering fault, where the reference's "ENTER THX D07DH3" looks
     like something being decrypted. The punctuation marks ? and ! are worse
     again, because they are legible ENGLISH punctuation and the eye tries to
     parse the churn as a sentence. $ reads as currency.
     # % & @ are the four that have a closed, multi-stroke body filling the
     slot about the way a capital does, so they sit in the churn as unfamiliar
     glyphs rather than as damage: "ENTIX OXX WJ%6V&" still reads as cipher.
     The full sixteen are one dial away in the lab if the owner disagrees. */
  var DENSE = '#%&@';

  var POOLS = {
    caps:          CAPS,
    digits:        DIGITS,
    symbols:       SYMBOLS,
    'caps+digits': CAPS + DIGITS,          /* the reference pool, exactly */
    dense:         CAPS + DIGITS + DENSE,  /* the owner's ask, trimmed */
    full:          CAPS + DIGITS + SYMBOLS /* the owner's ask, verbatim */
  };

  function resolvePool(p) {
    if (!p) return POOLS.full;
    if (POOLS[p]) return POOLS[p];
    return String(p);
  }

  /* ---------------------------------------------------------------- maths */

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* xorshift-flavoured integer hash. Deterministic in (slot, cycle, seed), so
     seek(620) shows the same glyphs every time it is called — which is what
     makes a frozen capture worth looking at. The seed is re-rolled on each
     play(), so two consecutive hovers do not churn through the identical
     sequence; freeze the clock and it is stable, run it again and it is new. */
  function pick(pool, i, k, seed, avoid) {
    var h = (Math.imul(i + 1, 73856093) ^ Math.imul(k + 1, 19349663) ^
             Math.imul(seed + 1, 83492791)) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    var n = pool.length;
    var idx = (h >>> 0) % n;
    /* NEVER SHOW THE TARGET LETTER DURING THE CHURN. Without this, a slot
       lands on its own answer roughly once every 43 cycles, the eye reads it
       as that character having locked, and the next cycle reads as the word
       BREAKING — which is exactly the failure mode the two-tone colour split
       exists to prevent. The reference gets this for free because a churning
       character is a different colour from a settled one; belt and braces.
       Stepping to the neighbouring index costs nothing. */
    if (avoid && pool.charAt(idx) === avoid) idx = (idx + 1) % n;
    return pool.charAt(idx);
  }

  function mixRGB(a, b, f) {
    var A = a.split(','), B = b.split(','), out = [], i;
    for (i = 0; i < 3; i++) {
      out.push(Math.round(parseFloat(A[i]) + (parseFloat(B[i]) - parseFloat(A[i])) * f));
    }
    return out.join(',');
  }

  /* -------------------------------------------------------------- COVERAGE */

  /* WHETHER THE FACE ACTUALLY HAS THE GLYPHS, answered rather than assumed.
     A missing glyph is a tofu box, and tofu is invisible on the machine that
     has the font — it only shows up on someone else's. So the pool is audited
     at mount against the face that is really rendering, and anything that
     fails is dropped before it can ever be drawn.

     TWO TESTS, because either alone is wrong for a monospaced face:

       1. ADVANCE WIDTH against 'M'. In a mono face every real glyph shares one
          advance. A char that measures differently was NOT rendered by Plex
          Mono at all — the browser silently fell back to another family for
          that codepoint — and a foreign-width glyph is exactly what makes the
          button jitter. Catches substitution.

       2. PIXEL IDENTITY against U+E000. Width alone cannot catch tofu here,
          and this is the trap: .notdef in a monospaced font carries the SAME
          advance as every real glyph, so the usual measureText-width trick
          reports full coverage on a face that is drawing nothing but boxes.
          U+E000 is Private Use Area and is unmapped in IBM Plex Mono and in
          Courier New, so whatever it rasterises to IS this face's notdef; any
          candidate that rasterises to the same pixels is a box.

     Plus a blank test, for a codepoint that renders no ink at all. */
  function coverage(font48, fontNative, chars) {
    var S = 48;
    var cv = document.createElement('canvas');
    cv.width = S * 2; cv.height = S * 2;
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.font = font48;
    ctx.textBaseline = 'alphabetic';

    function raster(ch) {
      ctx.clearRect(0, 0, S * 2, S * 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(ch, S * 0.4, S * 1.3);
      var d = ctx.getImageData(0, 0, S * 2, S * 2).data;
      var h = 2166136261, n = 0, i;
      for (i = 3; i < d.length; i += 4) {
        if (d[i] > 8) n++;
        h ^= d[i]; h = Math.imul(h, 16777619);
      }
      return { hash: h >>> 0, ink: n };
    }

    var ref = raster('');

    var mc = document.createElement('canvas').getContext('2d');
    mc.font = fontNative;
    var adv = mc.measureText('M').width;

    var ok = '', tofu = [], blank = [], wrong = [], i, ch, r, w;
    for (i = 0; i < chars.length; i++) {
      ch = chars.charAt(i);
      if (ch === ' ' || ok.indexOf(ch) >= 0) continue;
      r = raster(ch);
      w = mc.measureText(ch).width;
      if (r.ink === 0) { blank.push(ch); continue; }
      /* If the face has no visible notdef, ref.ink is 0 and a hash match means
         nothing — the blank test above is then the whole tofu test. */
      if (ref.ink > 0 && r.hash === ref.hash) { tofu.push(ch); continue; }
      if (Math.abs(w - adv) > 0.01) { wrong.push(ch); continue; }
      ok += ch;
    }
    return { ok: ok, tofu: tofu, blank: blank, wrong: wrong,
             advance: adv, notdefInk: ref.ink };
  }

  /* ------------------------------------------------------------- instance */

  function Scramble(el, opts) {
    opts = opts || {};
    this.el = el;
    this.slots = [];
    this.order = [];       /* slot indices that actually churn, left to right */
    this.raf = 0;
    this.t = 0;
    this.paused = false;
    this.built = false;
    this.seed = (Math.random() * 1e9) | 0;
    this.audit = null;

    this.o = {
      /* ----------------------------------------------------------- timing --
         TOTAL IS THE DIAL, not the per-character rate, because the per-
         character rate is a consequence and the total is the thing the owner
         actually has an opinion about — this button is the only door on the
         page and how long its label is unreadable is the whole question.

         "ENTER THE SIGNAL" is 14 non-space characters. At the reference's
         measured ~100ms per character that is 1400ms, and 1.4s of hash on the
         only door is too long: captured at 1400 it is still churning past the
         point where the eye has given up and moved on, and on a re-hover it
         actively gets in the way of clicking.

         1050ms TOTAL, which puts the rate at 66ms per character. Chosen by
         building all three and sampling each at a COMMON 100ms interval — the
         same interval the reference was sampled at — and counting how many
         characters resolve between adjacent frames. That number is the
         perceptual rate; total duration on its own tells you nothing, because
         a 14-character word and an 8-character word at the same duration are
         not the same effect.

           reference   1 char / 100ms   (1,3,5,7,8 settled at 2.60..3.40s)
            700ms      4 char / 100ms   the front outruns the eye. Between two
                                        samples the word goes from "ENTER TYA
                                        #LIW&T" to "ENTER THE M7C#48" — five
                                        settled to nine. You do not see
                                        characters resolving, you see a colour
                                        boundary sweep across the label.
           1400ms      1 char / 100ms   faithful to the reference's rate, and
                                        the contact sheet is the argument
                                        against it: eight consecutive frames
                                        pass with the phrase still unreadable.
                                        The reference's rate was never the
                                        thing to copy — its DURATION was, and
                                        that is ~0.9s.
           1050ms    1.4 char / 100ms   still countable frame to frame, and the
                                        whole thing lands 0.15s over the
                                        reference's own total. This is the one.

         Two-at-a-time (perStep 2) is kept as a dial because it is the obvious
         alternative for shortening the run without raising the rate: at 1050ms
         it halves the events to seven and reads chunkier and more mechanical —
         closer to a slot machine than to a decode. Left at 1, and the dial is
         there so the owner can disagree on their own display. */
      total:   1050,  /* ms, whole run, first churn frame to last cool-down */
      lead:      40,  /* ms of pure churn before the first character locks */
      flash:     90,  /* ms a locked character takes to cool churn -> settled */
      cycle:     45,  /* ms per glyph swap. Reference is "well under 100ms";
                         at 80 the churn reads as legible wrong letters being
                         replaced, at 30 it is mush with no glyph identity.
                         45 is ~22 swaps/sec — noise you can still see letters
                         in, which is what makes it read as cipher. */
      perStep:    1,  /* characters resolved per step. See the note above. */
      churnA:  0.92,  /* opacity of the churning tail */
      pool:  'full'
    };
    if (opts.o) this.set(opts.o);

    this.reduced = global.matchMedia &&
      global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* BOTH TRIGGERS, and focus is an equal partner to hover rather than an
       afterthought. The entrance focuses this button when it arrives, so the
       keyboard path would otherwise be the only one that never sees the
       effect. The arrival decode — the caller's play() — is what keeps the
       word legible on a phone, where hover does not exist at all: the label
       must never sit as hash waiting for a cursor that is not coming. */
    if (opts.retrigger !== false) this.bind();
  }

  Scramble.prototype.set = function (o) {
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) this.o[k] = o[k];
    return this;
  };

  /* Steps, not characters: with perStep 2 a fourteen-character word is seven
     events, and the run has to be divided by the events. */
  Scramble.prototype.steps = function () {
    var n = this.order.length || 1;
    return Math.ceil(n / Math.max(1, this.o.perStep));
  };

  Scramble.prototype.total = function () { return this.o.total; };

  /* ms between one step locking and the next. Derived so the LAST character's
     cool-down finishes exactly on `total` — which is what makes the freeze
     slider's right-hand end the settled word rather than a frame short of it. */
  Scramble.prototype.perStep = function () {
    return (this.o.total - this.o.lead - this.o.flash) / this.steps();
  };

  Scramble.prototype.bind = function () {
    var self = this;
    function fire() {
      /* A hover that lands mid-decode is ignored rather than restarting. The
         entrance focuses the button the instant it appears, so focus and the
         arrival play() arrive within a frame of each other; without this guard
         the word decodes, jumps back to hash, and decodes again. */
      if (self.raf || self.paused) return;
      self.play();
    }
    /* mouseenter only where a real pointer exists. On a touch screen Chrome
       synthesises mouseenter on tap, which would re-scramble the label at the
       exact moment the user is committing to the button. */
    if (!global.matchMedia || global.matchMedia('(hover: hover)').matches) {
      this.el.addEventListener('mouseenter', fire);
    }
    this.el.addEventListener('focus', fire);
    return this;
  };

  /* ------------------------------------------------------------- building */

  Scramble.prototype.build = function () {
    var el = this.el, i;
    var cs = getComputedStyle(el);
    var fontNative = cs.fontStyle + ' ' + cs.fontWeight + ' ' +
                     cs.fontSize + ' ' + cs.fontFamily;
    var font48 = cs.fontStyle + ' ' + cs.fontWeight + ' 48px ' + cs.fontFamily;

    /* THE WORD COMES OUT OF THE MARKUP, not out of a config string, because
       the real button is
         <button class="ent__enter"><span class="dot"></span> Enter the Signal</button>
       and this file is not allowed to edit that page. So: swallow the bare
       text nodes, leave every element child (the dot) exactly where it is.
       data-scramble-text overrides, for a caller that wants to decode
       something other than its own label. */
    var word = el.getAttribute('data-scramble-text');
    if (!word) {
      word = '';
      for (i = el.childNodes.length - 1; i >= 0; i--) {
        var n = el.childNodes[i];
        if (n.nodeType === 3) { word = n.nodeValue.trim() + word; el.removeChild(n); }
      }
      el.setAttribute('data-scramble-text', word);
    }
    /* text-transform: uppercase is doing the casing on the real button, and
       the pool is capitals, so churn and answer are the same case whatever the
       markup says. Uppercased here as well so a caller without that CSS does
       not get lowercase letters resolving out of capital noise. */
    word = word.toUpperCase().replace(/\s+/g, ' ');
    this.word = word;

    /* THE ACCESSIBLE NAME MUST SURVIVE THE SCRAMBLE. Mid-decode the button's
       text content is "ENTER TH7 %1KM4G"; a screen reader hitting it at that
       moment would read the noise out. The slot container is aria-hidden and
       the real string goes on the button as a label, so the button is always
       "Enter the Signal" to assistive tech no matter where the clock is. */
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', word);
    el.classList.add('ts-host');

    /* Audit the pool against the face that is actually rendering, and keep
       only what survives. This is what makes the coverage guarantee a property
       of the running page rather than of the machine it was written on. */
    var want = resolvePool(this.o.pool);
    this.audit = coverage(font48, fontNative, want + word);
    var safe = '', j;
    for (j = 0; j < want.length; j++) {
      if (this.audit.ok.indexOf(want.charAt(j)) >= 0) safe += want.charAt(j);
    }
    /* If the audit rejected almost everything — no webfont, a face with no
       metrics — fall back to capitals rather than animating an empty pool. */
    this.pool = safe.length >= 4 ? safe : CAPS;

    /* -------------------------------------------------- fixed-width slots --
       WHY THE BUTTON CANNOT BE ALLOWED TO BREATHE. letter-spacing: 0.18em sits
       on this label, and CSS puts that space AFTER every character including
       inside an inline-block. Give a slot width == glyph advance and the
       tracking overflows it; give it no width at all and any pool glyph whose
       advance differs by a fraction of a pixel moves every letter to its right
       and the border with them. Both were visible as a shimmer on the right
       edge of the button, and at sixteen slots the error accumulates sixteen
       times.

       So: the tracking comes OFF the slot and goes back on as an explicit
       margin-right, identical on every slot INCLUDING the last (a text node
       gets trailing tracking after its final character too, so this reproduces
       the original box rather than approximating it), and the slot width is
       nailed to one measured advance.

       MEASURED THROUGH THE LAYOUT ENGINE, not through canvas. Canvas
       measureText and the box the browser lays out disagree by fractions of a
       pixel, and sixteen slots of that error is a visible jump at the moment
       the plain text node is replaced. A probe span inside the button inherits
       every relevant property and reports the number that will actually be
       used. Canvas stays for the coverage audit, where only relative widths
       matter. */
    var probe = document.createElement('span');
    probe.className = 'ts__probe';
    probe.textContent = 'M';
    el.appendChild(probe);
    var w = probe.getBoundingClientRect().width;
    el.removeChild(probe);
    this.slotW = w;

    /* The tracking, taken from the button's own computed style rather than
       assumed to be the entrance's 0.18em, and pushed back onto the slots as
       margin. getComputedStyle resolves letter-spacing to px on every engine
       that matters; "normal" only appears when none is set, and is 0. */
    var track = parseFloat(cs.letterSpacing);
    if (!isFinite(track)) track = 0;
    this.track = track;

    var wrap = document.createElement('span');
    wrap.className = 'ts';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.setProperty('--ts-slot', w.toFixed(3) + 'px');
    wrap.style.setProperty('--ts-track', track.toFixed(3) + 'px');

    this.slots = [];
    this.order = [];
    for (i = 0; i < word.length; i++) {
      var ch = word.charAt(i);
      var c = document.createElement('span');
      c.className = 'ts__c';
      /* SPACES ARE HELD AS SPACES FOR THE WHOLE RUN and are never given to the
         pool. The reference renders "VIEW WORK" as VIEWWORK — it EATS the
         space — and that is the one decision from it that cannot be taken:
         "ENTER THE SIGNAL" collapsed is ENTERTHESIGNAL, which is not a phrase
         anyone can read at 12px. The word boundary is the only structure the
         eye has while the letters are still noise, so it is the last thing
         that should be scrambled. A space slot is a full mono advance wide
         like every other slot, so holding it costs nothing in width.
         NBSP rather than an empty box: an empty inline-block aligns on its
         margin edge instead of the baseline and drops the whole label a pixel. */
      if (ch === ' ') {
        c.className += ' ts__c--space';
        c.textContent = ' ';   /* NBSP, written as an escape: a raw byte here makes grep treat the file as suspect and is invisible in a diff */
      } else {
        c.textContent = ch;
        this.order.push(i);
      }
      wrap.appendChild(c);
      /* j is the slot's position in the RESOLVE ORDER, cached here rather than
         searched for per frame: spaces do not take a turn, so slot 5 of
         "ENTER THE SIGNAL" is resolve step 5 and slot 6 is resolve step 5 too. */
      this.slots.push({
        el: c, target: ch, space: ch === ' ',
        j: ch === ' ' ? -1 : this.order.length - 1,
        last: null, lastA: null
      });
    }
    el.appendChild(wrap);
    this.wrap = wrap;

    /* Colours read from CSS rather than hard-coded, so the amber stays the
       navigator's --node-color triplet and nothing here has to be edited if
       that ever moves. */
    this.settledC = (cs.getPropertyValue('--ts-color') || '240,165,92').trim();
    this.churnC   = (cs.getPropertyValue('--ts-churn') || '216,208,190').trim();

    this.built = true;
  };

  Scramble.prototype.ensure = function () { if (!this.built) this.build(); };

  /* --------------------------------------------------------------- render */

  /* Pure function of t. Nothing is carried between frames except the caches
     that avoid touching the DOM when a value has not changed. */
  Scramble.prototype.render = function (t) {
    var o = this.o, i, s, ch, col, a;
    var per = this.perStep();
    var settled = 0;

    for (i = 0; i < this.slots.length; i++) {
      s = this.slots[i];
      if (s.space) continue;

      /* Spaces do not take a turn, so "ENTER THE SIGNAL" resolves in fourteen
         steps, not sixteen, and the front crosses each space for free. */
      var lock = o.lead + (Math.floor(s.j / Math.max(1, o.perStep)) + 1) * per;

      if (t < lock) {
        /* CHURNING. Every unresolved character churns from t=0 — this is not a
           travelling band with quiet slots ahead of it, it is a resolved head
           and a noisy tail, which is what the reference frames show (d03 is
           "VI" settled followed by six churning characters, not two settled
           and one active). The per-slot phase offset stops all fourteen
           swapping on the same frame; in lockstep the tail pulses as one block
           and reads as a single flashing object rather than as fourteen
           independent characters. */
        var k = Math.floor((t + i * 11) / o.cycle);
        ch = pick(this.pool, i, k, this.seed, s.target);
        col = this.churnC;
        a = o.churnA;
      } else {
        /* SETTLED. The cool-down from churn colour to settled colour over
           `flash` ms is the whole two-tone split with a soft edge on it, and
           the edge matters: an instant swap at 66ms spacing makes fourteen
           hard colour flips that read as a strobe. 90ms of cooling means at
           any instant there is roughly one character mid-transition, which is
           the visible "just landed" marker that lets the eye follow the front.
           It is a COLOUR event and never a size or weight one — anything that
           changes a glyph's box moves every letter to its right, and the whole
           slot mechanism exists so that nothing moves. */
        var f = clamp((t - lock) / o.flash, 0, 1);
        var e = 1 - (1 - f) * (1 - f);
        ch = s.target;
        col = mixRGB(this.churnC, this.settledC, e);
        a = o.churnA + (1 - o.churnA) * e;
        /* Fractional over the cool-down so the dot eases down its fourteen
           steps instead of snapping. Still a pure function of t. */
        settled += clamp((t - lock) / 90, 0, 1);
      }

      if (ch !== s.last) { s.el.textContent = ch; s.last = ch; }
      var key = col + '|' + a.toFixed(2);
      if (key !== s.lastA) {
        s.el.style.color = 'rgba(' + col + ',' + a.toFixed(3) + ')';
        s.lastA = key;
      }
    }

    /* THE DOT IS PART OF THE ANIMATION, and it is a readout rather than
       decoration: activity is (characters not yet resolved) / 14, so it comes
       down in fourteen steps and is at rest exactly when the word is. Driven
       through transform and filter ONLY — background and box-shadow on .dot
       belong to the entrance's own stylesheet, which loads after this one, so
       touching them would either lose to it or need !important. */
    var n = this.order.length || 1;
    this.el.style.setProperty('--ts-act', ((n - settled) / n).toFixed(3));
  };

  Scramble.prototype.settle = function () {
    var i;
    for (i = 0; i < this.slots.length; i++) {
      var s = this.slots[i];
      if (s.space) continue;
      if (s.last !== s.target) { s.el.textContent = s.target; s.last = s.target; }
      s.el.style.color = '';   /* back to the stylesheet's own amber */
      s.lastA = null;
    }
    this.el.style.setProperty('--ts-act', '0');
    this.el.classList.remove('is-scrambling');
  };

  /* ----------------------------------------------------------- transport */

  Scramble.prototype.play = function () {
    var self = this;
    cancelAnimationFrame(this.raf);
    this.raf = 0;

    /* REDUCED MOTION: no scramble at all. Not a shortened one, not a fade —
       the word is simply there. Nothing is built, so there is no rAF, no
       colour writes and no slot spans; the button renders its own label
       exactly the way the stylesheet always did. */
    if (this.reduced) { this.el.classList.remove('is-scrambling'); return this; }

    this.ensure();
    this.seed = (Math.random() * 1e9) | 0;
    this.paused = false;
    this.el.classList.add('is-scrambling');
    this.render(0);

    var t0 = null, total = this.total();
    function step(now) {
      if (t0 === null) t0 = now;
      if (self.paused) { self.raf = requestAnimationFrame(step); return; }
      self.t = now - t0;
      if (self.t >= total) {
        self.t = total; self.raf = 0; self.render(total); self.settle(); return;
      }
      self.render(self.t);
      self.raf = requestAnimationFrame(step);
    }
    this.raf = requestAnimationFrame(step);
    return this;
  };

  /* Freeze at an exact millisecond — the verification hook, and the same entry
     point the lab's freeze slider uses. */
  Scramble.prototype.seek = function (ms) {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.reduced) return this;
    this.ensure();
    this.paused = true;
    this.t = clamp(ms, 0, this.total());
    this.el.classList.add('is-scrambling');
    if (this.t >= this.total()) { this.render(this.total()); this.settle(); return this; }
    this.render(this.t);
    return this;
  };

  Scramble.prototype.reset = function () {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.paused = false;
    if (this.built) this.settle();
    return this;
  };

  /* Rebuild against the current options — the lab needs this when the pool
     dial moves. The entrance never calls it. */
  Scramble.prototype.rebuild = function () {
    if (!this.built) return this;
    this.el.removeChild(this.wrap);
    this.built = false;
    this.build();
    return this;
  };

  function mount(el, opts) { return new Scramble(el, opts); }

  global.TextScramble = {
    mount: mount,
    coverage: coverage,
    POOLS: POOLS,
    CAPS: CAPS,
    DIGITS: DIGITS,
    SYMBOLS: SYMBOLS,
    DENSE: DENSE
  };
}(window));

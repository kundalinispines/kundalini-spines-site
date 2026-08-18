/* deep-field-bg.js — scroll drives the deep-field clip behind the home page.

   Slice one: mapping + scrub + luminance scrim.
   Slice two: the Music sky handoff, the park and catch-up, the tail handoff,
              the boot dissolve, the reveal stagger, and the Deep Field tuner tab.

   NOT LOADED BY index.html. Only home-deepfield-lab.html links this.

   ---------------------------------------------------------------------------
   THE MAPPING IS PIECEWISE, ANCHORED TO THE REAL SECTIONS (owner's call).

   Each section's scroll span drives its own frame span. The spans come from
   assets/lab/deep-field-marks.json, which the owner marked by eye in
   deep-field-lab.html; nothing here can regenerate that file.

   Boundaries are section TOPS, with two ends pinned:
     - the first boundary is pinned to scroll 0, so the clip starts at f0.
       A centre-line anchor was considered and is wrong here: at scroll 0 the
       viewport centre sits halfway down the title screen, so frames 0..24
       would never be seen — and the h1 cue the owner marked is at f2.
     - Archive ends at #newsletter's top rather than at the document bottom,
       and the clip HOLDS its last frame from there through Stay Connected and
       the footer. That frame was measured as the second-best structural match
       to the site's own sky plate (r = 0.695 against f134's 0.720), so the page
       bottoms out on something close to the artwork.

   ---------------------------------------------------------------------------
   THE MUSIC HANDOFF

   f134 is not an arbitrary boundary. It is the frame `find closest` elected as
   the best structural match to starfield-deep-4k.webp (r = 0.720) — the owner
   put the Music boundary on it deliberately. So entering Music, the clip PARKS
   on f134 and the real sky crossfades in over it, and the two images being
   alike is what makes that seam nearly invisible.

   Leaving Music the sky swaps out immediately and the clip RACES from f134 to
   f157 on a slackened lerp, so it reads as the background resuming rather than
   as a jump cut. Scrolling back UP out of Music is free: About's range ends at
   134, which is where the clip was parked, so there is nothing to catch up.

   THE CROSSFADE IS A TRUE ONE — the video fades out as the sky fades in. It has
   to be. Every sky layer is mix-blend-mode: screen and can only ADD light, so
   leaving the video at full opacity underneath would make Music brighter than
   either image, and brightest exactly along the diagonal band the two share.

   ---------------------------------------------------------------------------
   THE SCRUB LOOP IS js/spine-doc.js's, WITH ONE FIX.

   The lerp constant, the 1/48 write threshold and the !seeking coalescing guard
   are all carried over — they have owner decisions behind them and
   deep-field-lab.html reused them verbatim rather than improving them.

   The difference is the settle threshold; see the comment on tick(). */

/* ---------------------------------------------------------------------------
   PIPE PRIORITY. Runs on its own, ABOVE the mobile and reduced-motion gate
   below, because the film rows must be released on every device — a phone
   never reaches the main module and would otherwise be left holding
   preload="none" forever, which is a real regression rather than a saving.

   MEASURED on the lab, Aug 17 2026:
       black-tide.webm        start  430ms   dur 2469ms   2160 KB
       spine-render.webm      start  430ms   dur 2477ms   4629 KB
       spine-frequency.webm   start  430ms   dur 2468ms   2474 KB
       deep-field.webm        start 2007ms   dur 1195ms   2729 KB
   9.3MB of below-the-fold video takes the connection at 430ms and holds it to
   about 2900ms, so whatever is on the FIRST screen queues behind it. The clip
   the visitor is actually looking at did not begin downloading for two full
   seconds and then needed only 1.2s of that wait.

   There is no priority attribute to reach for: fetchpriority is defined for
   img, link, script and iframe, and video/source do not honour it. The only
   real lever is deciding what is allowed to start, so the film rows ship as
   preload="none" and are released here.

   Released on whichever comes first: the hero reporting canplaythrough, the
   first meaningful scroll, or a 4s backstop. The backstop is not decoration —
   without it a page where the hero fails to load would never release them. */
(function () {
  'use strict';

  var rows = document.querySelectorAll('.ksd-filmrow__media video, .ksd-merch__video video');
  if (!rows.length) return;

  var released = false;
  function release() {
    if (released) return;
    released = true;
    for (var i = 0; i < rows.length; i++) {
      rows[i].preload = 'auto';
      rows[i].load();
    }
  }

  var hero = document.getElementById('hero-video');
  if (hero && hero.readyState >= 4) release();
  else if (hero) hero.addEventListener('canplaythrough', release, { once: true });

  window.addEventListener('scroll', function () {
    if (window.scrollY > window.innerHeight * 0.4) release();
  }, { passive: true });

  setTimeout(release, 4000);
})();

(function () {
  'use strict';

  var root = document.documentElement;
  var wrap = document.querySelector('.df-bg');
  var vid = wrap && wrap.querySelector('.df-bg__video');
  if (!wrap || !vid) return;

  /* Same two gates as the media query in css/deep-field-bg.css. Bailing here
     is what actually keeps the 2.8MB off a phone: the <video> carries no src
     attributes in the markup and they are attached below, so returning early
     means the clip is never fetched. */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || window.matchMedia('(max-width: 767px)').matches) return;

  var FPS = 24;
  var FRAMES = 265;
  var DUR = FRAMES / FPS;

  var SEL = {
    home: '.ksd-hero',
    about: '[data-ksd-section="about"]',
    music: '[data-ksd-section="music"]',
    merch: '[data-ksd-section="merch"]',
    transmissions: '[data-ksd-section="transmissions"]',
    archive: '[data-ksd-section="archive"]'
  };
  var TAIL = '[data-ksd-section="connect"]';

  var segs = [];        // {y0, y1, f0, f1, name}
  var music = null;     // the Music segment, or null
  var musicRest = 0;    // the scroll position Music is meant to be READ from
  var tailY = Infinity; // where the clip starts holding its last frame
  var tailFrom = Infinity; // where the sky STARTS coming back up (Archive top)
  var lum = null;

  var target = 0, shown = 0, raf = 0, ready = false, settleTries = 0;
  var skyT = 1, skySh = 1;          // starts UP: the sky is the boot state
  var catching = false, wasParked = false, booting = true;

  /* Tunables live in CSS so the tuner tab and devtools turn the same knobs.
     Re-read at most 5x/sec, the same throttle js/spine-bg.js uses for its
     detector params — reading computed style every frame is the expensive way
     to do this. */
  var T = { tail: 1, catch: 0.1, stagger: 90, snap: 1, release: 700 };
  var lastRead = 0;
  function syncTunables(now) {
    if (now - lastRead < 200) return;
    lastRead = now;
    var cs = getComputedStyle(root);
    var f = parseFloat(cs.getPropertyValue('--df-tail'));
    var c = parseFloat(cs.getPropertyValue('--df-catch'));
    var s = parseFloat(cs.getPropertyValue('--df-stagger'));
    if (isFinite(f) && f > 0) T.tail = f;
    if (isFinite(c)) T.catch = c;
    if (isFinite(s)) T.stagger = s;
    var sn = parseFloat(cs.getPropertyValue('--df-snap'));
    var rl = parseFloat(cs.getPropertyValue('--df-release'));
    if (isFinite(sn)) T.snap = sn;
    if (isFinite(rl)) T.release = rl;
  }

  /* ---------------------------------------------------------------- sources

     webm FIRST. That is the opposite of hero-scrub-lab.html and it is measured
     on THIS pair, not inherited: deep-field.webm seeks at a 10.1ms median
     against the mp4's 25.0ms, where the hero's webm was the slow one at 154ms.
     There is no site-wide rule about source order. Measure per clip. */
  function attachSources() {
    [['assets/video/deep-field.webm', 'video/webm'],
     ['assets/video/deep-field.mp4', 'video/mp4']].forEach(function (s) {
      var el = document.createElement('source');
      el.src = s[0];
      el.type = s[1];
      vid.appendChild(el);
    });
    vid.load();
  }

  /* --------------------------------------------------------------- geometry */

  function docY(el) {
    return Math.round(el.getBoundingClientRect().top + window.scrollY);
  }

  function measure(marks) {
    segs = [];
    music = null;
    var maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var tail = document.querySelector(TAIL);

    var rows = marks.sections.map(function (s) {
      var el = document.querySelector(SEL[s.name.toLowerCase()]);
      return el ? { el: el, name: s.name, f0: s.startFrame, f1: s.endFrame } : null;
    }).filter(Boolean);
    if (!rows.length) return;

    /* THE HOME REMAP (owner's call, Aug 17 2026).

       The hero video is back and it covers the whole first screen, so the
       clip's Home frames — f0-48 as marked — are behind it and nobody ever
       sees them. Rather than spend the clip's strongest opening movement on a
       stretch that is covered, ABOUT TAKES THE WHOLE 0..134 RANGE and Home
       simply holds f0 behind the hero.

       The marks file is deliberately NOT edited to match. It is the record of
       what the owner marked by eye in deep-field-lab.html and nothing can
       regenerate it; this is a layout decision about where those frames are
       spent, and it belongs in the code that spends them.

       WHAT IT COSTS, so it is not discovered later as a surprise: About now
       carries 134 frames over its 828px instead of 86, which is 162 frames per
       1000px against 104 before — the fastest section on the page gets 56%
       faster again, taking the spread across the document from 5.3x to 8.2x.
       The two cheap levers if that reads as frantic are making About taller or
       moving the About/Music boundary earlier in the clip. Neither is a
       rebuild. f134 stays the Music boundary and the sky match frame either
       way, so the handoff is untouched. */
    var hRow = null, aRow = null;
    for (var k = 0; k < rows.length; k++) {
      var nm = rows[k].name.toLowerCase();
      if (nm === 'home') hRow = rows[k];
      if (nm === 'about') aRow = rows[k];
    }
    if (hRow && aRow) { aRow.f0 = hRow.f0; hRow.f1 = hRow.f0; }

    /* THE TRANSMISSIONS REMAP (owner's call, Aug 17 2026).

       Transmissions was marked f178, and f178 is inside the star zoom — the
       busiest, least readable stretch of the whole clip. Scanned f174-234 at
       160x90, frame-to-frame mean delta as the motion figure:

           f176-184   motion 10-14   h218-235 blue      pink 0-1%    the zoom
           f186       motion  8.2    h255               pink 8%      settling
           f192-200   motion 4.2-5.4 h303-311 magenta   pink 32-39%  CALM
           f210-226   motion 10-30   brightening to l58              the flash
           f228       motion 80                                      the cut

       f196 is the pinkest calm frame: motion 4.6, 38.9% magenta pixels, and
       lightness 11 — dark, which is what actually makes body copy readable over
       it. The section now STARTS there.

       WHY THE RANGE MOVED RATHER THAN THE LANDING. Landing on f196 by scroll
       position instead would need scroll 4225, which is 281px into the section
       — the film row would sit 138px above the top of the viewport and the
       headline 30px above it. Framing the content and landing on the frame are
       not satisfiable at once here, and the content wins.

       The 18 frames this takes off the front go to Merch, which keeps its own
       f157 landing untouched and spends the zoom in its tail, where it reads as
       a transition out rather than as noise under a headline. Merch goes 20 to
       37 frames per 1000px and Transmissions 64 down to 42 — both still well
       inside the range the page already spans. */
    var TX_START = 196;
    var mRow = null, tRow = null;
    for (var k2 = 0; k2 < rows.length; k2++) {
      var nm2 = rows[k2].name.toLowerCase();
      if (nm2 === 'merch') mRow = rows[k2];
      if (nm2 === 'transmissions') tRow = rows[k2];
    }
    if (mRow && tRow && TX_START > mRow.f0 && TX_START < tRow.f1) {
      mRow.f1 = TX_START;
      tRow.f0 = TX_START;
    }

    /* THE ARCHIVE REMAP (owner's call, Aug 17 2026).

       Archive was marked f231 and landed on it: a dark, murky frame just past
       the cut. Stay Connected lands on f264 — the frame V2HANDOFF 37 measured
       as the SECOND-BEST structural match to starfield-deep-4k.webp
       (r = 0.695, against f134's 0.720) — and it reads as the site's own
       nebula. The owner wants Archive to arrive on that image too, with Stay
       Connected then brightening into the real reactive sky exactly as it
       already does.

       So the clip finishes BEFORE Archive rather than during it: Transmissions
       carries f196 to the end, and Archive holds the final frame from its top
       all the way through Stay Connected and the footer.

       WHAT THIS MOVES, and it is worth knowing rather than discovering: the
       flash sequence measured at f210-226 (motion 10-30, rising to lightness
       58) now plays in the last third of TRANSMISSIONS instead of at the head
       of Archive. The luminance scrim tracks it, so the copy stays readable —
       and it lands as the transition OUT of Transmissions, which is a better
       place for a whiteout than under a headline that has just arrived.
       Transmissions goes 42 to 83 frames per 1000px; About is still nearly
       twice that, so it is not the fastest stretch on the page. */
    var arRow = null;
    for (var k3 = 0; k3 < rows.length; k3++) {
      if (rows[k3].name.toLowerCase() === 'archive') arRow = rows[k3];
    }
    if (tRow && arRow) {
      tRow.f1 = arRow.f1;
      arRow.f0 = arRow.f1;
    }

    /* BOUNDARIES SIT ONE MASTHEAD ABOVE THE SECTION TOP, and that is a fix,
       not an offset for taste.

       js/spine-doc.js jump() lands a rail click at sectionTop - --nav-h, and
       browser anchor navigation does the same through scroll-margin-top,
       because a section whose top edge is at the very top of the viewport has
       its first line under the bar. Boundaries measured at the raw section top
       therefore sat one masthead BELOW every landing.

       MEASURED before this: clicking Merch landed on f134 - the Music park
       frame, an entire section behind - and Transmissions on f193 instead of
       f196. Every rail landing except Music showed the previous section's
       closing frame, and Music was immune only because it declares its own
       scroll-margin-top for the card rest point.

       Shifting the boundary up by --nav-h-max makes the frame change where the
       section visually begins, which is also what a reader sees: the section
       starts when its content clears the bar, not when its box does. */
    var navMax = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h-max')) || 92;

    for (var i = 0; i < rows.length; i++) {
      var y0 = i === 0 ? 0 : docY(rows[i].el) - navMax;
      var y1 = (i < rows.length - 1) ? docY(rows[i + 1].el) - navMax
                                     : (tail ? docY(tail) - navMax : maxY);
      if (y1 <= y0) y1 = y0 + 1;
      var seg = { y0: y0, y1: y1, f0: rows[i].f0, f1: rows[i].f1, name: rows[i].name };
      segs.push(seg);
      if (rows[i].name.toLowerCase() === 'music') music = seg;
    }
    tailY = segs[segs.length - 1].y1;
    tailFrom = segs[segs.length - 1].y0;
    if (music) restPoint();
  }

  /* THE MUSIC REST POINT — where the section is meant to be READ from, which is
     NOT its top edge.

     MEASURED at 1440x900: #tracks starts at y1820, but .track-arc-wrap — the
     arc, the focus panel, the sample player and the Stream/Spotify/Apple row —
     starts 449px further down and is 651px tall. Landing on the section top put
     the viewport at 1820..2720 against a block running 2269..2920, so the
     bottom 200px, which is all of the controls, sat off the bottom of the
     screen. The owner reported the card as "halfway clipped" and that is the
     arithmetic behind it.

     The block fits under the nav at every size checked (157px of slack at
     1440x900, 337px at 1920x1080, 17px at 1440x760), so a position exists where
     the whole thing is framed. This computes it and centres the block in the
     space below the masthead.

     THREE THINGS ARE ANCHORED TO IT, and that is the point of having it:
       - the sky ramp finishes here, so full brightness and a fully framed card
         are the same moment rather than two moments a few hundred px apart;
       - #tracks gets a scroll-margin-top derived from it, so the nav link and
         the spine rail land here instead of on the section top;
       - it is where Music comes to rest.
     Recomputed on every measure(), because it depends on viewport height and on
     the carousel having built itself. */
  function restPoint() {
    var sec = document.querySelector(SEL.music);
    if (!sec) { musicRest = music.y0; return; }
    var cards = sec.querySelectorAll('.track-arc li');
    var panel = sec.querySelector('.track-focus-panel');
    if (!cards.length || !panel) { musicRest = music.y0; return; }

    /* MEASURE THE PAINTED UNION, NOT THE CONTAINER.

       .track-arc-wrap looks like the right box and is not. The focused card is
       transformed — measured at 1440x900:
           matrix(1.05882, 0, 0, 1.05882, 0, -148.074)
       — scaled up AND lifted 148px, so it paints from y24 while its container
       reports a top of y146. Framing the container therefore parked the card's
       top 122px above the frame, under the masthead, which is exactly the
       clipping the owner reported after the first attempt at this.

       getBoundingClientRect() includes transforms, so taking the union across
       every card plus the focus panel gives the real painted extent: 24..781,
       757px tall against the 651px the container claims. */
    var top = Infinity, bottom = -Infinity, i, r;
    for (i = 0; i < cards.length; i++) {
      r = cards[i].getBoundingClientRect();
      if (!r.height) continue;
      if (r.top < top) top = r.top;
      if (r.bottom > bottom) bottom = r.bottom;
    }
    r = panel.getBoundingClientRect();
    if (r.top < top) top = r.top;
    if (r.bottom > bottom) bottom = r.bottom;
    if (!isFinite(top) || !isFinite(bottom)) { musicRest = music.y0; return; }

    /* Clear --nav-h-max, not the live --nav-h. The bar is compact at 47px once
       scrolled but expands to 92px at rest at the top, and a card tucked under
       the compact height reappears clipped the moment the bar grows. Clearing
       the maximum costs 45px of headroom and cannot go wrong. */
    /* --df-card-gap is EXTRA clearance under the masthead, on top of the bar's
       own maximum height. It exists because the owner reported the card still
       clipped on their machine in a state that could not be reproduced here:
       card 13 with the sample playing, at their measured viewport, framed at
       cardTop 126 against a 92px bar in this harness. Rather than guess a
       fourth time, this is a dial they can turn while looking at it.
       Read window.__deepField() in the console for the live numbers. */
    var navMax = (parseFloat(getComputedStyle(root).getPropertyValue('--nav-h-max')) || 92)
               + (parseFloat(getComputedStyle(root).getPropertyValue('--df-card-gap')) || 0);

    /* SUBTRACT THE ENTRANCE THAT HAS NOT PLAYED YET.

       css/track-experience.css:90 parks .track-arc-wrap at translateY(24px) and
       releases it to 0 when .is-visible lands. This function usually runs while
       the section is still below the fold — the whole point is to know where to
       land BEFORE anything scrolls — so the geometry it reads is 24px lower
       than what the visitor will actually see once the entrance plays.

       MEASURED: topDoc read 2147 before the entrance and 2123 after it, at both
       1440x900 and 1440x760, height unchanged at 757. At 900 the 51px of
       centring slack swallowed the error and it passed; at 760 there is no
       slack, the error landed undiluted, and the card top came to rest at 68
       against a 92px bar. Same bug at both sizes — one viewport just hid it.

       Reading the live transform rather than hardcoding 24 means retuning that
       stylesheet cannot silently break this. Once .is-visible is present the
       transform is already 0 and this subtracts nothing. */
    var pending = 0;
    var wrapEl = sec.querySelector('.track-arc-wrap');
    if (wrapEl && !sec.classList.contains('is-visible')) {
      var tr = getComputedStyle(wrapEl).transform;
      if (tr && tr !== 'none') {
        try { pending = new DOMMatrixReadOnly(tr).m42; } catch (e) { pending = 0; }
      }
    }
    var topDoc = top + window.scrollY - pending;
    var slack = Math.max(0, window.innerHeight - navMax - (bottom - top));

    /* Centre in the space under the bar when it fits. When it does not — a
       short window, where the union is 757px against ~668px of room — slack is
       0 and the TOP wins: the card is the thing being looked at, and losing the
       last line of fine print off the bottom is the better failure than
       beheading the artwork. */
    musicRest = Math.round(topDoc - navMax - slack / 2);
    musicRest = Math.max(music.y0, Math.min(musicRest, music.y1 - 1));

    /* PUBLISH THE FOCUSED CARD'S CENTRE AS THE RAIL NODE POSITION.

       The node is normally measured off the section headline, and for Music
       that headline is scrolled off the top by the time the section is landed
       on — so the node sat above the viewport and the rail appeared to have no
       Music node at all, exactly when you were looking at Music. The front card
       is the tallest and sits lowest-topped of the arc, so its centre is on
       screen for the whole time you are in the section.

       js/spine-doc.js reads this attribute in preference to the headline.
       The dispatch is guarded on the value actually changing: spine-doc
       re-measures on resize, this function runs from that re-measure, and an
       unguarded dispatch here would loop the two forever. */
    var frontTop = Infinity, frontBottom = 0;
    for (i = 0; i < cards.length; i++) {
      r = cards[i].getBoundingClientRect();
      if (r.height && r.top < frontTop) { frontTop = r.top; frontBottom = r.bottom; }
    }
    if (isFinite(frontTop)) {
      var mid = Math.round(frontTop + (frontBottom - frontTop) / 2 + window.scrollY - pending);
      if (String(mid) !== sec.getAttribute('data-ksd-node-y')) {
        sec.setAttribute('data-ksd-node-y', mid);
        window.dispatchEvent(new Event('resize'));
      }
    }

    /* Negative scroll-margin-top is doing real work here: it makes the browser
       scroll PAST the element's top edge on an anchor jump. css/track-experience
       .css sets a positive one to clear the masthead; this replaces it with the
       offset that lands on the rest point, so /#tracks, the nav link and the
       rail node all arrive at the same framed position with no click handler to
       intercept and nothing to keep in sync. */
    sec.style.scrollMarginTop = (music.y0 - musicRest) + 'px';
  }

  function frameAt(y) {
    if (!segs.length) return 0;
    if (y <= segs[0].y0) return segs[0].f0;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (y < s.y1) return s.f0 + ((y - s.y0) / (s.y1 - s.y0)) * (s.f1 - s.f0);
    }
    return segs[segs.length - 1].f1;
  }

  /* Seek to the MIDDLE of a frame, not its leading edge. Asking for exactly
     f/FPS lands on a boundary where the decoder is free to hand back either
     neighbour. Carried over from deep-field-lab.html, where it was the fix
     that made the marks land on the frames ffmpeg measured. */
  function frameToTime(f) {
    return Math.max(0, Math.min(DUR - 0.001, (f + 0.5) / FPS));
  }

  function parkedAt(y) {
    return !!(music && y >= music.y0 && y < music.y1);
  }

  /* ------------------------------------------------------------------- sky */

  /* Rises from the top of Music to the rest point, holds while you are there,
     and drops the instant you leave. Rises again across the whole of Archive so
     that Stay Connected is landed on with the sky already full. */
  /* BOTH RAMPS ARE GEOMETRY-DERIVED. NEITHER IS A DISTANCE IN VIEWPORT
     HEIGHTS — an earlier build used --df-fade for that and it is gone.

     It runs from the top of Music to the rest point and is full from there on.
     That distance came out at 279px on a 1440x900 window — about 31vh, close
     enough to the 40vh the owner picked by eye that nothing is lost by deriving
     it, and it buys the thing 40vh could not: the sky reaches full at exactly
     the scroll position where the card and its controls are framed, at every
     viewport height, without a magic number that only happens to be right at
     one of them.

     THE TAIL RAMP IS GEOMETRY-DERIVED TOO, and for the same reason. It runs
     across the WHOLE of Archive and reaches full exactly at Stay Connected, so
     the sign-up lands on the bright nebula rather than on the start of a fade
     (owner's call, Aug 17 2026 — it breathes better and it is where the page
     wants attention). Archive is the natural place to spend it: the clip is
     already holding its final frame there, so nothing is lost to the crossfade
     except the brightening itself, and 828px of it is a slow swell rather than
     a transition.

     Archive keeps its own landing on the unlit frame, because the ramp STARTS
     at Archive top. --df-tail shortens the ramp within that span if the swell
     wants to arrive sooner. */
  function skyAt(y) {
    if (music && y >= music.y0 && y < music.y1) {
      var span = Math.max(1, musicRest - music.y0);
      return Math.min(1, Math.max(0, (y - music.y0) / span));
    }
    if (y >= tailFrom) {
      var span = Math.max(1, (tailY - tailFrom) * T.tail);
      return Math.min(1, (y - tailFrom) / span);
    }
    return 0;
  }

  /* ------------------------------------------------------------------ snap */

  /* MUSIC IS A STOP (owner's call). Scrolling into it settles on the rest
     point — the position where the card and its controls are framed and the
     sky is at full — and one wheel gesture then releases to Merch while the
     clip races f134 to f157.

     WHY THIS INTERCEPTS THE WHEEL RATHER THAN USING CSS scroll-snap:
     js/scroll-weight.js already takes every wheel event, calls preventDefault
     and animates window.scrollTo itself. A CSS snap target would be a second
     authority over the same scroll position, and the two would argue every
     frame. Instead this file's listener registers FIRST — deep-field-bg.js is
     script 6 on the page and scroll-weight.js is script 8, and listeners on the
     same target fire in registration order — so a stopImmediatePropagation()
     here means scroll-weight never sees the gesture that releases the stop.
     Everything else still reaches it untouched.

     THE SNAP ONLY EVER FIRES FROM A SETTLE, never mid-scroll. Waiting for
     140ms of quiet is also what keeps it off scroll-weight's toes: that module
     emits scroll events continuously while it animates, so the timer cannot
     elapse until it has finished and re-anchored its own target. */
  var snap = { state: 'idle', raf: 0, timer: 0, frame: -1 };

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function glide(to, dur, done, onProg) {
    if (snap.raf) cancelAnimationFrame(snap.raf);
    var from = window.scrollY, t0 = performance.now();
    var step = function (now) {
      var t = dur > 0 ? Math.min(1, (now - t0) / dur) : 1;
      /* Progress BEFORE the scroll, so the frame the scroll event goes on to
         read is already the one this instant of the glide asks for. */
      if (onProg) onProg(t);
      window.scrollTo({ top: Math.round(from + (to - from) * easeInOut(t)),
                        behavior: 'instant' });
      if (t < 1) snap.raf = requestAnimationFrame(step);
      else { snap.raf = 0; if (done) done(); }
    };
    snap.raf = requestAnimationFrame(step);
  }

  function settled() {
    if (!music || !T.snap || snap.state === 'releasing') return;
    var y = window.scrollY;
    if (y < music.y0 || y >= music.y1) { snap.state = 'idle'; return; }
    if (Math.abs(y - musicRest) <= 2) { snap.state = 'held'; return; }
    /* A band, not the whole section: someone who has deliberately scrolled to
       the far end of Music should be left there rather than yanked back. */
    var band = Math.max(160, (music.y1 - music.y0) * 0.45);
    if (Math.abs(y - musicRest) <= band) {
      glide(musicRest, 520, function () { snap.state = 'held'; });
    }
  }

  /* Registered immediately, not inside the marks fetch, so ordering against
     scroll-weight.js does not depend on how fast a JSON file lands. */
  window.addEventListener('wheel', function (e) {
    if (snap.state !== 'held' || !T.snap || !music) return;
    /* Upward hands control straight back — leaving Music the way you came is
       ordinary scrolling, and About ends on the parked frame so there is
       nothing to catch up. */
    if (e.deltaY <= 0) { snap.state = 'idle'; return; }
    e.preventDefault();
    e.stopImmediatePropagation();
    snap.state = 'releasing';

    /* THE SKY LEAVES AT ONCE and the clip plays UNDER the movement, rather
       than the movement finishing and the clip then catching up. Measured on
       the first build of this: the glide ran its full 700ms with the clip still
       parked on f134 and the sky still up, because the viewport top had not yet
       crossed into Merch — so the race happened after the page had already
       stopped, which is the opposite of what was asked for.

       The release therefore drives the frame off its OWN progress instead of
       off scroll position, so f134 to f157 is spent across exactly the glide.
       Nothing else in the file maps scroll this way, and nothing should: this
       is the one moment the page is moving itself rather than being moved. */
    skyT = 0;
    glide(music.y1, T.release,
      function () { snap.state = 'idle'; snap.frame = -1; },
      function (t) { snap.frame = music.f0 + t * (music.f1 - music.f0); });
  }, { passive: false });

  /* Taking hold of anything cancels the glide, the same rule scroll-weight.js
     applies to its own momentum: a page still moving under a pointer that has
     grabbed the carousel feels broken. */
  window.addEventListener('pointerdown', function () {
    if (snap.raf) { cancelAnimationFrame(snap.raf); snap.raf = 0; snap.state = 'idle'; }
  }, { passive: true });

  /* --------------------------------------------------------------- reveals */

  /* Q5/Q18: the cue frames in the marks file are an ORDERING KEY, not a scroll
     position. The owner's clusters sit one frame apart — f157, f158, f159 —
     which is a few dozen pixels of scroll under any mapping, so firing them at
     those positions would make a fast scroller see all three snap at once and
     a slow scroller watch them drift apart.

     So they fire together on the section's existing IntersectionObserver and
     stagger in CSS instead. Document order inside a section already reproduces
     the owner's cue order (heading, body, media), which is why no name-matching
     against the marks file is needed — and name-matching would be fragile
     anyway, since the cue names are prose. */
  function stageReveals() {
    var secs = document.querySelectorAll('.ksd-section, .ksd-title');
    for (var s = 0; s < secs.length; s++) {
      var items = secs[s].querySelectorAll('.ksd-reveal');
      for (var i = 0; i < items.length; i++) {
        items[i].style.transitionDelay = (i * T.stagger) + 'ms';
      }
    }
  }

  /* ------------------------------------------------------------------- loop */

  function paintScrim(t) {
    if (!lum) return;
    var i = Math.max(0, Math.min(FRAMES - 1, Math.round(t * FPS - 0.5)));
    root.style.setProperty('--df-lum', lum[i]);
  }

  /* TWO THRESHOLDS, AND THE SECOND ONE IS THE WHOLE POINT OF THIS BUILD.

     MEASURED Aug 17 2026 with a single 1/48 threshold: five of the six section
     boundaries landed exactly and Transmissions landed on f177 where the marks
     say f178. Not a mapping error — frameAt() returns 178.000 at that scroll
     position. It is residue. The lerp stops within 0.005s of target and the
     write only fires when the picture is more than half a source frame out, so
     currentTime can come to rest ~0.6 frames short, which is enough to cross
     the rounding boundary.

     While the scroll is MOVING, half a frame is the right floor — anything
     tighter queues seeks faster than the decoder retires them, which is the
     mistake that makes naive scrubbers feel like glue.

     Once it SETTLES, the resting frame is the one the reader actually looks at,
     and on this page the resting frames at the boundaries are the frames the
     owner marked by eye. So the threshold drops and one exact write lands it.
     Bounded at six extra frames: if a decoder ever refuses to report the time
     it was handed, this gives up rather than spinning rAF forever. */
  function tick(now) {
    raf = 0;
    syncTunables(now || performance.now());

    /* --- the clip ------------------------------------------------------- */
    var lerp = catching ? T.catch : 0.3;
    var settled = Math.abs(target - shown) <= 0.005;
    if (settled) { shown = target; catching = false; }
    else { shown += (target - shown) * lerp; settleTries = 0; }

    var thresh = settled ? 1 / 200 : 1 / 48;
    var off = vid.duration ? Math.abs(vid.currentTime - shown) : 0;
    if (!vid.seeking && vid.duration && off > thresh) vid.currentTime = shown;
    paintScrim(shown);

    /* --- the sky -------------------------------------------------------- */
    /* Rising follows the scroll exactly, so the handover happens under your
       hand rather than trailing it. Falling eases, because the only two ways
       it falls are leaving Music — where the owner asked for an immediate swap
       that still must not be a one-frame cut — and the boot dissolve. */
    var skyDone;
    /* DO NOT CLEAR `booting` IN THE RISING BRANCH. It was written that way and
       the slow boot rate below became dead code: ticks start as soon as the
       marks fetch resolves, which is well before the video has a frame, and at
       that point skyT and skySh are both still 1 — so the very first tick took
       the rising branch and cleared the flag before the dissolve ever began.
       MEASURED: the opening faded at 0.18 per frame (ratio 0.82 between
       consecutive samples), not the 0.06 intended, giving a ~230ms snap where a
       dissolve was specified. boot() owns clearing the flag now. */
    if (skyT >= skySh) {
      skySh = skyT;
      skyDone = true;
    } else {
      /* 0.06 on the opening (~800ms) against 0.18 for the Music exit (~200ms).
         They are different events: the opening is a dissolve the visitor is
         meant to notice, the exit is the owner's "immediate swap" and only
         eases at all so it is not a one-frame cut. */
      skySh += (skyT - skySh) * (booting ? 0.06 : 0.18);
      if (Math.abs(skyT - skySh) < 0.002) { skySh = skyT; booting = false; }
      skyDone = (skySh === skyT);
    }
    root.style.setProperty('--df-sky', skySh.toFixed(4));

    var landing = settled && vid.duration &&
      Math.abs(vid.currentTime - shown) > thresh && settleTries < 6;
    if (landing) settleTries++;

    if (!settled || landing || !skyDone) raf = requestAnimationFrame(tick);
  }

  function onScroll() {
    if (!ready) return;
    var y = window.scrollY;

    var parked = parkedAt(y);
    /* Leaving the park downward is the only case that needs the slack lerp:
       the clip has 23 frames to cover and the owner wants to watch it happen.
       Leaving upward costs nothing — About ends on the parked frame. */
    if (wasParked && !parked && y >= (music ? music.y1 : 0)) catching = true;
    wasParked = parked;

    target = frameToTime(
      snap.state === 'releasing' && snap.frame >= 0 ? snap.frame
        : parked ? music.f0
        : frameAt(y));
    /* The release owns the sky for its duration; skyAt() would put it back up,
       because the viewport top is still inside Music for most of the glide. */
    if (!booting && snap.state !== 'releasing') skyT = skyAt(y);

    if (snap.timer) clearTimeout(snap.timer);
    snap.timer = setTimeout(settled, 140);

    if (!raf) raf = requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ tuner */

  function tuner() {
    /* Fails soft if the shell is missing: a page that forgot the script tag
       loses its controls, not its background. */
    if (!window.KSTunePanel) return;
    var P = window.KSTunePanel;
    var body = P.tab('deepfield', 'Deep Field', 'the scroll-driven clip behind the home page');
    if (!body) return;

    /* No apostrophes in any tip. They are single-quoted literals and one stray
       apostrophe is a syntax error that takes the whole panel down. */
    var FIELDS = [
      { k: '--df-on', g: 'clip', label: 'on', min: 0, max: 1, step: 1,
        tip: 'Master switch. 0 hides the clip and its scrim, leaving whatever the sky is doing' },
      { k: '--df-scrim-base', g: 'clip', label: 'scrim', min: 0, max: 1, step: 0.01,
        tip: 'Scrim opacity where the clip is darkest. This is the floor under all body copy' },
      { k: '--df-scrim-gain', g: 'clip', label: 'flare', min: 0, max: 1, step: 0.01,
        tip: 'How hard a flash pulls the scrim up. The clip swings 5.6x in mean luminance, so this is what keeps text readable through a whiteout' },

      { k: '--df-tail', g: 'handoff', label: 'tail', min: 0.1, max: 1, step: 0.05,
        tip: 'How much of Archive the sky takes to come back up, as a fraction. 1 spends the whole section on the swell and reaches full exactly at Stay Connected. The Music arrival is not this - it is derived from where the card frames' },
      { k: '--df-catch', g: 'handoff', label: 'catch', min: 0.02, max: 0.5, step: 0.01,
        tip: 'Lerp for the race from f134 to f157 when you leave Music. Lower is slower; 0.3 is the normal scrub rate and reads as a jump cut' },

      { k: '--df-stagger', g: 'handoff', label: 'stagger', min: 0, max: 400, step: 5,
        tip: 'Milliseconds between reveals inside one section. The cue order comes from the marks file; this is only the spacing' },

      { k: '--df-snap', g: 'stop', label: 'snap', min: 0, max: 1, step: 1,
        tip: 'Whether Music holds as a stop. 0 makes it an ordinary section you scroll through, with the sky and the park unchanged' },
      { k: '--df-release', g: 'stop', label: 'release', min: 200, max: 1600, step: 50,
        tip: 'Milliseconds for the glide from the Music stop to Merch. The clip races f134 to f157 underneath it, so this and catch are heard together' }
    ];
    var GROUPS = [['clip', 'The clip', true], ['handoff', 'Handoff and reveals', true],
                  ['stop', 'The Music stop', true]];

    var shipped = {};
    FIELDS.forEach(function (f) {
      shipped[f.k] = parseFloat(getComputedStyle(root).getPropertyValue(f.k));
    });
    var state = {};
    for (var n in shipped) state[n] = shipped[n];

    var paints = [];
    GROUPS.forEach(function (g) {
      var sec = P.section(body, 'df-' + g[0], g[1], g[2]);
      FIELDS.forEach(function (f) {
        if (f.g !== g[0]) return;
        paints.push(P.slider(sec, f,
          function () { return state[f.k]; },
          function (v) { state[f.k] = v; apply(); }));
      });
    });

    var row = P.row(body);
    P.button(row, 'Reset', function () {
      for (var n2 in shipped) state[n2] = shipped[n2];
      apply();
    });
    var copyBtn = P.button(row, 'Copy CSS', function () {
      P.copy(copyBtn, note, copyText(), 'Copy CSS');
    });
    var note = P.note(body);

    function copyText() {
      var lines = FIELDS.map(function (f) { return '  ' + f.k + ': ' + state[f.k] + ';'; });
      return 'css/deep-field-bg.css  ->  :root {\n' + lines.join('\n') + '\n}';
    }

    function apply() {
      FIELDS.forEach(function (f) { root.style.setProperty(f.k, state[f.k]); });
      paints.forEach(function (p) { p(); });
      stageReveals();
      onScroll();
      var offs = [];
      for (var n3 in shipped) if (state[n3] !== shipped[n3]) offs.push(n3);
      note.textContent = offs.length
        ? offs.length + ' value(s) off the committed set: ' + offs.join(', ')
        : 'matching the committed values';
    }
    apply();
  }

  /* ------------------------------------------------------------------ start */

  attachSources();

  Promise.all([
    fetch('assets/lab/deep-field-marks.json').then(function (r) { return r.json(); }),
    fetch('assets/lab/deep-field-lum.json').then(function (r) { return r.json(); })
  ]).then(function (res) {
    lum = res[1].lum;
    measure(res[0]);
    stageReveals();
    ready = true;

    var remeasure = function () { measure(res[0]); onScroll(); };
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    setTimeout(remeasure, 400);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);

    window.addEventListener('scroll', onScroll, { passive: true });

    /* THE BOOT DISSOLVE. --df-sky starts at 1, so the first thing painted is
       the sky the visitor already knows rather than a bare page floor or a
       poster popping into a scrub. It only hands over once the decoder has a
       frame to show. */
    var boot = function () {
      booting = true;
      skyT = skyAt(window.scrollY);
      /* The deep-link case: arriving at /#tracks lands already inside Music,
         where the sky target is 1 and there is no dissolve to wait for. Clear
         the flag here rather than in tick(), or onScroll never touches skyT
         again and the sky stays pinned up for the session. */
      if (skyT >= skySh) booting = false;
      onScroll();
    };
    if (vid.readyState >= 2) boot();
    else vid.addEventListener('loadeddata', boot, { once: true });

    tuner();
  });

  /* Read-only telemetry for the verification pass and for the console. Mirrors
     the shape of spine-bg.js's kickMeter: it reports, it never drives. */
  window.__deepField = function () {
    var cs = getComputedStyle(root);
    return {
      ready: ready,
      segments: segs.map(function (s) {
        return { name: s.name, y0: s.y0, y1: s.y1, f0: s.f0, f1: s.f1 };
      }),
      tailY: tailY,
      musicRest: musicRest,
      snap: snap.state,
      /* Everything needed to diagnose the Music framing from a console paste,
         because the geometry that matters depends on the visitor's real
         viewport, their display scaling and the carousel's live state -- none
         of which a headless run can be trusted to reproduce. */
      card: (function () {
        var sec = document.querySelector(SEL.music);
        if (!sec) return null;
        var cards = sec.querySelectorAll('.track-arc li');
        var panel = sec.querySelector('.track-focus-panel');
        if (!cards.length || !panel) return null;
        var t = Infinity, bo = -Infinity, i, r;
        for (i = 0; i < cards.length; i++) {
          r = cards[i].getBoundingClientRect();
          if (!r.height) continue;
          if (r.top < t) t = r.top;
          if (r.bottom > bo) bo = r.bottom;
        }
        r = panel.getBoundingClientRect();
        if (r.top < t) t = r.top;
        if (r.bottom > bo) bo = r.bottom;
        var cs = getComputedStyle(root);
        return {
          top: Math.round(t), bottom: Math.round(bo), height: Math.round(bo - t),
          viewportH: window.innerHeight, viewportW: window.innerWidth,
          dpr: window.devicePixelRatio,
          navMax: parseFloat(cs.getPropertyValue('--nav-h-max')),
          navLive: Math.round(parseFloat(cs.getPropertyValue('--nav-h'))),
          gap: parseFloat(cs.getPropertyValue('--df-card-gap')) || 0,
          clipped: Math.round(t) < (parseFloat(cs.getPropertyValue('--nav-h-max')) || 92)
        };
      })(),
      frame: Math.round(vid.currentTime * FPS - 0.5),
      time: vid.currentTime,
      target: target,
      parked: parkedAt(window.scrollY),
      catching: catching,
      booting: booting,
      sky: +cs.getPropertyValue('--df-sky'),
      lum: +cs.getPropertyValue('--df-lum'),
      videoOpacity: +getComputedStyle(vid).opacity,
      tunables: { tail: T.tail, catch: T.catch, stagger: T.stagger },
      tailFrom: tailFrom,
      src: (vid.currentSrc || '').split('/').pop()
    };
  };
})();

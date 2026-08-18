/* deep-field-bg.js — the deep-field clip behind the home page.

   NOT LOADED BY index.html. Only home-deepfield-lab.html links this.

   ---------------------------------------------------------------------------
   PLAY-AND-PARK (owner's call, Aug 18 2026). THE CLIP IS NOT SCRUBBED.

   Landing on a section plays the clip forward at 1.0x to that section's CUE
   FRAME, stops it there, and releases that section's reveal. It plays cue to
   cue. The boundaries in the marks file are scroll landings and say nothing
   about the frame. Nothing here ever changes playbackRate: one speed, the
   whole way, which is the brief.

   THE CLIP IS deep-field-2 — 289 frames, 12.042s, from the owner's marks in
   assets/lab/deep-field-2-marks.json. Three of the twelve marks were moved,
   each for a measured reason, and the marks file records which and why.

   THE LEGS, at 24fps:
       Home  -> About            21f  0.875s     (behind the hero)
       About -> Music            62f  2.583s
       Music -> Merch            70f  2.917s     the cut at f126, parks ON the flash
       Merch -> Transmissions    63f  2.625s     opens through f154-156, the light dying
       Tx    -> Archive          36f  1.500s
       Arch  -> Stay Connected   20f  0.833s
       Stay  -> Foot             16f  0.667s     then holds f288

   ---------------------------------------------------------------------------
   THE MUSIC HANDOFF, which survives the rewrite and gets better.

   Music parks on f83 — the frame `find closest` elected as the best structural
   match to starfield-deep-4k.webp, at r = 0.907. The old clip's best was f134
   at r = 0.720, so this seam is now substantially tighter than the one it
   replaces. The real sky crossfades in over the parked frame, and the two
   images being alike is what makes the handover nearly invisible.

   THE CROSSFADE IS A TRUE ONE — the video fades out as the sky fades in. It has
   to be. Every sky layer is mix-blend-mode: screen and can only ADD light, so
   leaving the video at full opacity underneath would make Music brighter than
   either image, and brightest exactly along the diagonal band the two share.

   THE RACE OUT OF MUSIC IS GONE; see the note above stepTo().

   ---------------------------------------------------------------------------
   WHAT DRIVES WHAT, because the split is the whole design:

     the STEPPER  decides which section you land on. Untouched — the gesture
                  detection, the tail-versus-new-push signals and the
                  KSScrollWeight.cancel() call are all V2HANDOFF 39's work.
     the CUE      decides which frame the clip stops on, and when the reveal
                  for that section is allowed to run.
     SCROLL POSITION decides neither. It has not chosen a frame since the
                  rewrite, and tying the two together is what forced every
                  section's footage to be cut to fit its scroll height. */

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
  var FRAMES = 289;
  var DUR = FRAMES / FPS;

  /* PLAY-AND-PARK (owner's call, Aug 18 2026). THE CLIP IS NO LONGER SCRUBBED.

     Landing on a section starts playback at 1.0x; the clip runs to that
     section's cue frame and PAUSES there, and the reveal fires on arrival. It
     plays CUE TO CUE — the boundaries in the marks file are scroll landings
     only and have nothing to say about the frame. Every leg is the same speed;
     nothing in this file changes playbackRate.

     WHAT THIS DELETED, and it is most of what used to be here: the piecewise
     scroll-to-frame map, the target/shown lerp, the catch-up rate, and the
     three frame remaps measure() used to perform (Home, Transmissions and
     Archive). None of them mean anything once scroll position stops choosing
     the frame. The scroll STEPPER is untouched — it still decides which
     section you land on, and that machinery is the part V2HANDOFF 39 spent a
     session tuning.

     THE PACING PROBLEM WENT WITH IT. V2HANDOFF 39 open item 3 was a 5.7x
     spread in frames-per-1000px between About and Music. Frames are no longer
     tied to scroll distance at all, so that number no longer exists. */

  var SEL = {
    home: '.ksd-hero',
    about: '[data-ksd-section="about"]',
    music: '[data-ksd-section="music"]',
    merch: '[data-ksd-section="merch"]',
    transmissions: '[data-ksd-section="transmissions"]',
    archive: '[data-ksd-section="archive"]'
  };
  var TAIL = '[data-ksd-section="connect"]';

  /* ---------------------------------------------------------- cue staging

     HOLD EVERY CUED SECTION DOWN NOW, at parse, because js/spine-doc.js has
     ALREADY registered its IntersectionObserver by the time this file runs and
     that observer will add .is-in to everything on the first landing. Adding
     .df-cued synchronously here beats the observer's first callback, which is
     asynchronous. See the note in css/deep-field-bg.css for why the reveal is
     held down rather than the observer suppressed.

     THE HERO IS NOT CUED, and that is not an oversight: .ksd-hero carries no
     data-ksd-section (V2HANDOFF 39 — giving it one puts a Home node on the
     rail and runs the cord the full document). Its <h1> reveals on the
     observer exactly as it does today, which is right, because Home HOLDS f0
     and there is no leg to wait for. */
  var staged = document.querySelectorAll('[data-ksd-section]');
  for (var ci = 0; ci < staged.length; ci++) staged[ci].classList.add('df-cued');

  /* THE CONTENT MUST NEVER BE STRANDED BY THE VIDEO. Everything below is a
     backstop, and they are the reason holding reveals down is safe at all:
     without them a decode failure, a 404 or a route this file does not know
     about would leave a section permanently invisible. */
  function stripAllCues() {
    var els = document.querySelectorAll('[data-ksd-section].df-cued');
    for (var i = 0; i < els.length; i++) els[i].classList.remove('df-cued');
  }
  vid.addEventListener('error', stripAllCues);
  /* If the clip has not produced a frame in 8s it is not going to drive
     anything, so hand every reveal back to the observer. */
  setTimeout(function () { if (vid.readyState < 2) stripAllCues(); }, 8000);

  /* Scrolled clean past a section that never got its cue — reveal it. Covers
     any route this file does not model, and costs one rect per cued section
     per scroll, which drops to zero once they have all fired. */
  function cueBackstop() {
    var els = document.querySelectorAll('[data-ksd-section].df-cued');
    for (var i = 0; i < els.length; i++) {
      if (els[i].getBoundingClientRect().bottom < 0) els[i].classList.remove('df-cued');
    }
  }

  var segs = [];        // {y0, y1, cue, name, el} - cue is the frame this section parks on
  var music = null;     // the Music segment, or null
  var musicRest = 0;    // the scroll position Music is meant to be READ from
  var tailY = Infinity; // where the clip starts holding its last frame
  var tailFrom = Infinity; // where the sky STARTS coming back up (Archive top)
  var lum = null;
  var TAIL_CUE = FRAMES - 1;   // Stay Connected's cue, from the marks file
  var FOOT_CUE = FRAMES - 1;   // the held last frame

  var raf = 0, ready = false;
  var skyT = 1, skySh = 1;          // starts UP: the sky is the boot state
  var wasParked = false, booting = true;

  /* LEAVING MUSIC, THE SKY MUST COME DOWN IMMEDIATELY AND STAY DOWN.

     skyAt() answers "where is the viewport", and the viewport top is still
     inside Music for most of the glide out of it — so without this lock the
     scroll handler puts the sky straight back up on the very next event, and
     it only falls once the page has ALREADY arrived at Merch.

     MEASURED with the lock missing, sampling every 60ms: the clip played from
     f84 at t=68ms exactly on time, but --df-sky held 1.000 until t=762ms, the
     precise moment scrollY reached the Merch landing. Seventeen frames of the
     leg played underneath a fully opaque sky, so the background appeared to
     change only on arrival — reported as "it fires when it lands on Merch".

     The old build had this guard as snap.racing, which went out with the Music
     race. The race is gone for good; the guard is not optional. */
  var skyLock = false;
  /* The rate tick() eases --df-sky at, set per transition. Two speeds, because
     they are not the same event: coming OUT from under the sky is a handover
     the reader should barely notice, and coming IN over a settled frame is a
     deliberate transition they are meant to watch. */
  var skyRate = 0.18;

  /* Tunables live in CSS so the tuner tab and devtools turn the same knobs.
     Re-read at most 5x/sec, the same throttle js/spine-bg.js uses for its
     detector params — reading computed style every frame is the expensive way
     to do this. */
  /* --df-catch and --df-release went with the scrub and the Music race
     (Aug 18 2026). Both were removed from the tuner rather than left as dials
     that turn nothing, which this project has been bitten by before. */
  var T = { tail: 1, stagger: 90, snap: 1,
            step: 1, stepMs: 620, gap: 180,
            skyIn: 0.055, skyOut: 0.10 };
  var lastRead = 0;
  function syncTunables(now) {
    if (now - lastRead < 200) return;
    lastRead = now;
    var cs = getComputedStyle(root);
    var f = parseFloat(cs.getPropertyValue('--df-tail'));
    var s = parseFloat(cs.getPropertyValue('--df-stagger'));
    if (isFinite(f) && f > 0) T.tail = f;
    if (isFinite(s)) T.stagger = s;
    var sn = parseFloat(cs.getPropertyValue('--df-snap'));
    if (isFinite(sn)) T.snap = sn;
    var si = parseFloat(cs.getPropertyValue('--df-sky-in'));
    var so = parseFloat(cs.getPropertyValue('--df-sky-out'));
    if (isFinite(si) && si > 0) T.skyIn = si;
    if (isFinite(so) && so > 0) T.skyOut = so;
    var st = parseFloat(cs.getPropertyValue('--df-step'));
    var sm = parseFloat(cs.getPropertyValue('--df-step-ms'));
    var gp = parseFloat(cs.getPropertyValue('--df-gap'));
    if (isFinite(st)) T.step = st;
    if (isFinite(sm) && sm > 0) T.stepMs = sm;
    if (isFinite(gp) && gp >= 0) T.gap = gp;
  }

  /* ---------------------------------------------------------------- sources

     webm FIRST. That is the opposite of hero-scrub-lab.html and it is measured
     on THIS pair, not inherited: deep-field.webm seeks at a 10.1ms median
     against the mp4's 25.0ms, where the hero's webm was the slow one at 154ms.
     There is no site-wide rule about source order. Measure per clip.
     CARRIED TO deep-field-2 UNMEASURED, and that is a deliberately small bet:
     under play-and-park the clip PLAYS rather than seeks, so seek latency is
     no longer on the hot path at all. It matters only for the reverse leg and
     for the skip-ahead, both of which seek once, not per frame. */
  function attachSources() {
    [['assets/video/deep-field-2.webm', 'video/webm'],
     ['assets/video/deep-field-2.mp4', 'video/mp4']].forEach(function (s) {
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
    if (marks.tailCue) TAIL_CUE = marks.tailCue.cueFrame;
    if (marks.footCue) FOOT_CUE = marks.footCue.cueFrame;
    var maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var tail = document.querySelector(TAIL);

    var rows = marks.sections.map(function (s) {
      var el = document.querySelector(SEL[s.name.toLowerCase()]);
      return el ? { el: el, name: s.name, cue: s.cueFrame } : null;
    }).filter(Boolean);
    if (!rows.length) return;

    /* THE THREE FRAME REMAPS THAT LIVED HERE ARE GONE, and they had to go.

       Home, Transmissions and Archive each used to have their frame RANGE
       rewritten after the marks were read — Home collapsed to a held frame,
       Transmissions extended to the clip's end, Archive reduced to holding it.
       All three existed to fix where a SCROLL POSITION landed in the footage.
       Under play-and-park scroll position does not choose a frame, so all
       three answered a question nobody asks any more. Their reasoning is in
       git history at 4d3fda0 if a scrubbed build is ever revived.

       What replaces them is one number per section, cueFrame, read straight
       from the marks file. */

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

    /* READ THE SECTION'S OWN scroll-margin-top, so a boundary cannot drift away
       from where the section is actually landed. css/spine-doc.css declares it
       once for every [data-ksd-section] and the note there explains why that
       property is the single source: it is the only one the BROWSER consults
       for anchor navigation, which no script controls.

       POSITIVE ONLY, and that is not tidiness. Music's scroll-margin-top is
       written back onto the element by restPoint() below, as a NEGATIVE value
       derived from this very boundary — reading it here would feed the previous
       run's output into this run's input and let the Music boundary walk on
       every re-measure. Music's landing is musicRest and is computed from the
       geometry, not from this. Falling back to --nav-h-max keeps that path
       exactly as it was. */
    function landOffset(el) {
      var smt = parseFloat(getComputedStyle(el).scrollMarginTop);
      return (isFinite(smt) && smt > 0) ? smt : navMax;
    }

    for (var i = 0; i < rows.length; i++) {
      var y0 = i === 0 ? 0 : docY(rows[i].el) - landOffset(rows[i].el);
      var y1 = (i < rows.length - 1) ? docY(rows[i + 1].el) - landOffset(rows[i + 1].el)
                                     : (tail ? docY(tail) - landOffset(tail) : maxY);
      if (y1 <= y0) y1 = y0 + 1;
      var seg = { y0: y0, y1: y1, cue: rows[i].cue, name: rows[i].name, el: rows[i].el };
      segs.push(seg);
      if (rows[i].name.toLowerCase() === 'music') music = seg;
    }
    tailY = segs[segs.length - 1].y1;
    tailFrom = segs[segs.length - 1].y0;
    if (music) restPoint();
    buildStops(maxY);
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

  /* ------------------------------------------------------------- playback

     THE ENGINE. play(to) runs the clip forward at 1.0x and stops it ON a frame;
     everything else here exists because "stop on an exact frame" is harder than
     it sounds.

     WHY A rAF WATCHER AND NOT `timeupdate`. timeupdate fires about four times a
     second, so it can overshoot the target by 250ms — six frames. The merch
     spine loop in js/spine-doc.js hit exactly this and went to rAF for exactly
     this reason; the note there is the precedent. We poll currentTime every
     frame and pause the moment it reaches the cue.

     WHY IT THEN SEEKS ANYWAY. pause() takes effect between frames, so the clip
     comes to rest a fraction past the cue. One exact seek after pausing puts it
     on the frame the owner marked. Without it, landings drift a frame or two
     and the whole point of marking by eye is lost. */
  var play = {
    to: -1,            /* target frame, -1 when idle          */
    stop: -1,          /* the stop index this leg belongs to   */
    from: 0,           /* frame the leg started on            */
    skyFrom: 0,        /* sky level it started at             */
    skyTo: 0,          /* sky level it must reach on arrival  */
    skyIn: false,      /* bring the nebula up once parked     */
    raf: 0,
    timer: 0,          /* the reverse pacer; see reverseTo     */
    done: null,        /* fires once, on arrival              */
    reversing: false
  };

  /* THE CROSSFADE HAPPENS AT THE PARK, NOT ACROSS THE LEG (owner's call,
     Aug 18 2026, revising the same day's first answer).

     The first version ramped the sky on the clip's progress, so the nebula
     faded in across the whole About-to-Music leg and faded out across the whole
     Music-to-Merch leg. Both were wrong for the same reason: the reader watches
     the two images mixed for three seconds instead of watching either of them.
     The owner reported it from both sides — "I can see the reactive nebula
     already preloaded behind the video transition with opacity" going in, and
     "when I land on Merch I can still see the reactive background through the
     video roll" coming out.

     So the leg is now ALWAYS clean footage, and the sky moves at the ends:

       arriving under the sky   the clip plays with the sky fully off, parks on
                                its cue, and only then does the nebula come up
                                over the settled frame. That is the Music
                                handoff working the way it was described in the
                                first place — park on the frame that matches the
                                artwork, THEN change over.
       leaving the sky          the nebula drops as the leg begins, so the clip
                                is in the clear for almost all of it.

     Neither is a progress ramp any more, so there is nothing to drive per
     frame — which also took the per-frame custom property write out of the
     reverse seek loop, where it was costing three times the frame budget. */

  function stopWatch() {
    if (play.raf) { cancelAnimationFrame(play.raf); play.raf = 0; }
    if (play.timer) { clearTimeout(play.timer); play.timer = 0; }
  }

  /* Land exactly, then tell whoever asked. */
  function arrive(f, cb) {
    stopWatch();
    play.to = -1;
    play.stop = -1;
    play.reversing = false;
    vid.pause();
    var t = frameToTime(f);
    if (Math.abs(vid.currentTime - t) > 1 / (FPS * 4)) vid.currentTime = t;
    paintScrim(t);
    if (play.skyIn) {
      /* The clip has settled. NOW the nebula comes up over it. */
      play.skyIn = false;
      skyT = 1;
      skyRate = T.skyIn;
      if (!raf) raf = requestAnimationFrame(tick);
    }
    skyLock = false;
    if (cb) cb();
  }

  /* Forward, at 1.0x, to `f`. Never used to go backwards — see reverseTo. */
  function playTo(f, cb) {
    stopWatch();
    play.to = f;
    play.done = cb || null;
    var end = frameToTime(f);
    if (!vid.duration || vid.currentTime >= end - 1 / (FPS * 2)) {
      arrive(f, cb);
      return;
    }
    vid.playbackRate = 1;          /* the brief: one speed, the whole way */
    var p = vid.play();
    if (p && p.catch) p.catch(function () { arrive(f, cb); });
    (function watch() {
      if (play.to !== f) return;                       /* superseded */
      if (vid.currentTime >= end - 1 / (FPS * 4)) { arrive(f, play.done); return; }
      paintScrim(vid.currentTime);
      play.raf = requestAnimationFrame(watch);
    })();
  }

  /* Straight there, no playback. Used by the skip-ahead and by every reverse
     leg that the reverse-play attempt hands back. */
  function jumpTo(f, cb) {
    arrive(f, cb);
  }

  /* REVERSE, THE OWNER'S CALL (Aug 18 2026): try it for real, fall back if the
     page cannot hold the frame rate.

     Chrome refuses a negative playbackRate outright — setting one throws
     NotSupportedError — so backwards can only ever be a hand-rolled seek loop.
     MEASURED on an idle page over deep-field-2.webm, 48 frames around f144:
     27.7ms mean, 33.2ms median, 49.5ms worst, about 36fps achievable — and that
     range turned out to be the friendly one. THE f83-f157 RANGE IS MUCH WORSE:
     30.1ms median but 13 of 40 frames over budget and a 449.9ms worst case,
     because it crosses the hard cut at f126 and the bright plateau, where the
     residuals a backward step has to rebuild are far larger. So reverse
     playback is NOT uniformly achievable across this clip, and the honest
     summary is that it holds on calm footage and gives up on busy footage.
     That is what the fallback is for, and it is why the owner's answer was
     "try it, keep the fallback" rather than "do it".

     THE BUDGET IS ENFORCED AT RUNTIME, not assumed from that measurement,
     because the real page also has the compositor, the star layers and the
     stepper on the same thread. If frames arrive late STRIKES times in a row,
     the leg gives up and seeks the rest of the way. Falling back mid-leg is
     deliberate: a reverse that starts smooth and degrades is still better than
     one that judders the whole way, and the reader is travelling backwards,
     which is navigation rather than cinema. */
  var REV_BUDGET = 1000 / FPS * 1.35;   /* 56.3ms — late, not merely over 41.7 */
  var REV_STRIKES = 3;

  function reverseTo(f, cb) {
    stopWatch();
    vid.pause();
    play.to = f;
    play.done = cb || null;
    play.reversing = true;
    var cur = Math.round(vid.currentTime * FPS - 0.5);
    if (cur <= f) { arrive(f, cb); return; }

    /* PACED TO 24fps, NOT RUN FLAT OUT. This loop steps by seeking, and a seek
       on this encode completes in about 22ms — comfortably less than a frame.
       MEASURED before the pacer existed: reverse legs ran at 26 to 47 effective
       fps, so travelling back up was between 1.1x and 2x the speed of coming
       down. The brief is one speed in both directions, so each frame is held
       until its due time. `due` advances by exactly one frame period rather
       than being re-based on the clock, so a single slow seek is absorbed by
       the next fast one instead of stretching the whole leg. */
    var SPF = 1000 / FPS;
    var due = performance.now();
    var strikes = 0;

    (function step() {
      if (play.to !== f) return;                        /* superseded */
      if (cur <= f) { arrive(f, play.done); return; }
      if (strikes >= REV_STRIKES) { arrive(f, play.done); return; }
      cur--;
      due += SPF;
      var t0 = performance.now();
      vid.currentTime = frameToTime(cur);
      vid.addEventListener('seeked', function once() {
        vid.removeEventListener('seeked', once);
        if (play.to !== f) return;
        var now = performance.now();
        if (now - t0 > REV_BUDGET) strikes++; else strikes = 0;
        /* THROTTLED, AND THIS IS NOT A MICRO-OPTIMISATION. Each of these
           writes a custom property on <html>, which invalidates style for every
           sky layer that reads it. MEASURED over f157->f83 with the page
           otherwise idle: raw backward seeks ran a 30.1ms median, and the same
           seeks with two custom properties written per frame ran 103.8ms — over
           three times the cost, and past the frame budget that decides whether
           this loop survives. Every third frame is 8 updates a second, which is
           under the eye's threshold for a slow crossfade and a luminance scrim,
           and it keeps the seek loop inside its budget. */
        if ((cur % 3) === 0) paintScrim(vid.currentTime);
        var wait = due - now;
        if (wait > 1) play.timer = setTimeout(step, wait);
        else play.raf = requestAnimationFrame(step);    /* already behind */
      });
    })();
  }

  /* THE SKY FOLLOWS THE CLIP, NOT THE SCROLL (Aug 18 2026).

     skyAt() answers a SCROLL question — "how far into Music is the viewport" —
     and that was the right question when the clip was scrubbed, because frames
     and pixels advanced together. Under play-and-park they are independent: the
     glide into Music takes --df-step-ms (620ms) and the leg takes 2.583s of
     footage.

     MEASURED with the sky still on scroll, About to Music sampled every 60ms:
     the sky reached full at t=682ms, the moment the glide landed, while the
     clip did not park on f83 until t=2585ms. Forty-six frames — f37 to f83,
     nearly two seconds — played underneath a fully opaque nebula. Reported as
     "it never plays the video forward, it just lands on the nebula", and it is
     the exact mirror of the Music-to-Merch fault: the same decoupling, the
     other way round. Coming back UP already looked right, and only because the
     lock below happened to hold the sky down for that whole leg.

     So a leg owns the sky for its duration and ramps it on the CLIP's progress,
     which lands the crossfade exactly on the frame it is matched to. That is
     the whole premise of the Music handoff: park on the frame that looks like
     the artwork, and change over there rather than somewhere near there.

     skyAt() is kept for everything that is not a leg — the boot, a scrollbar
     drag, an anchor jump — where scroll position is still the only thing that
     has an opinion. */
  function skyRest(i) {
    var st = stops[i];
    if (!st) return 0;
    if (st.seg) return (st.seg === music) ? 1 : 0;
    return 1;                 /* Stay Connected and the Foot sit under the sky */
  }

  /* The cue a stop parks on. Stops built from segs carry their own; the two
     synthesised ones (Stay Connected, Foot) carry theirs from the marks file. */
  function cueOf(i) {
    var s = stops[i];
    if (!s) return 0;
    if (s.seg) return s.seg.cue;
    return s.cue;
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

  /* THE PAGE STEPS BETWEEN SECTIONS (owner's call, Aug 17 2026). One wheel
     gesture moves exactly one section and lands it framed: About to Music,
     Music to Merch, Merch to Transmissions, and back the same way.

     THIS IS THE MUSIC STOP GENERALISED. Handoff 38 shipped this same mechanism
     wired to one section — settle, hold, release on the next gesture — and the
     owner asked for it everywhere, so the hold is now every landing and the
     release is every gesture. What was special about Music is now only two
     things: it lands on its rest point rather than its boundary, and the leg
     OUT of it still races the parked clip (see stepTo).

     WHY THIS INTERCEPTS THE WHEEL RATHER THAN USING CSS scroll-snap:
     js/scroll-weight.js already takes every wheel event, calls preventDefault
     and animates window.scrollTo itself. A CSS snap target would be a second
     authority over the same scroll position, and the two would argue every
     frame. Instead this file's listener registers FIRST — deep-field-bg.js is
     script 6 on the page and scroll-weight.js is script 8, and listeners on the
     same target fire in registration order — so a stopImmediatePropagation()
     here means scroll-weight never sees a gesture the stepper has taken.
     Everything it does NOT take still reaches scroll-weight untouched, and
     that is what keeps the foot of the page scrolling normally.

     THE LANDINGS ARE THE SECTION BOUNDARIES, which already sit one masthead
     above each section top (see the boundary comment in measure()). So a
     stepped landing, a rail click and an anchor jump all come to rest on the
     same pixel — and therefore on the same frame — for free. Nothing here
     needs its own idea of where a section starts.

     WHAT IS DELIBERATELY NOT STEPPED: everything past the last section. Stay
     Connected and the footer live below Archive, and a stepper that owned the
     whole document would make them unreachable. Once the page is at or past
     the final landing a downward gesture is handed straight back; scrolling
     up from down there snaps onto Archive again. */
  var snap = { raf: 0, timer: 0, frame: -1, lock: 0, busy: false, racing: false,
               dir: 0, minMag: Infinity, lastT: 0 };

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function glide(to, dur, done, onProg) {
    if (snap.raf) cancelAnimationFrame(snap.raf);
    /* STAND SCROLL-WEIGHT DOWN BEFORE TAKING THE PAGE. Swallowing the wheel
       stops it receiving NEW input, but an animation it started earlier keeps
       running toward a target of its own and wins the moment this glide ends.
       See the note on KSScrollWeight.cancel in js/scroll-weight.js for the
       measurement. Guarded because this file is script 6 and that one is
       script 8 — at parse time the hook does not exist yet, only by the time a
       wheel event can happen. */
    if (window.KSScrollWeight) window.KSScrollWeight.cancel();
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

  /* THE STOPS ARE THE WHOLE DOCUMENT, not just the sections.

     The first build of this stepped the six sections and handed everything
     below Archive back to scroll-weight, on the reasoning that Stay Connected
     and the footer must stay reachable. That was the wrong shape and it caused
     both bugs the owner reported on Aug 17 2026:

       - Landing on Archive was not stable. The instant the glide finished, the
         REMAINDER of the same flick was handed to scroll-weight, which carried
         the page straight past — measured at 4933 and 5371 against a 4680
         landing. A step that cannot come to rest is not a step.
       - Escaping Archive downward was eaten. The handback sat behind the
         gesture lock, so a follow-up flick 50ms after landing moved 0px and
         the owner had to flick repeatedly to reach the foot of the page.

     Both are the same defect: a boundary in the middle of the page where two
     scroll authorities meet. So there is no boundary now. Stay Connected is a
     stop in its own right — the code already knew its position as tailY, which
     is where the sky finishes coming back up — and the document bottom is the
     last stop, which frames the footer. --df-step 0 still hands the entire
     page back, and that is the only way to get scroll-weight driving here.

     MEASURED at 1440x900: Archive 4680, Stay Connected 5508 (its top less one
     masthead; the block is 828 tall in a 900 viewport, so it frames), bottom
     6191. The footer's own top-less-masthead would be 6336, past the end of
     the document — hence the bottom rather than the footer box. */
  var stops = [];

  function buildStops(maxY) {
    stops = [];
    for (var i = 0; i < segs.length; i++) {
      /* Music is READ from its rest point, not from its top edge — where the
         card and its controls are framed and the sky is at full. --df-snap 0
         gives Music its boundary back, like every other section. */
      var y = (music && segs[i] === music && T.snap) ? musicRest : segs[i].y0;
      stops.push({ y: y, name: segs[i].name, seg: segs[i] });
    }
    if (isFinite(tailY) && tailY > stops[stops.length - 1].y + 8 && tailY < maxY - 8) {
      stops.push({ y: tailY, name: 'Stay Connected', seg: null, cue: TAIL_CUE });
    }
    if (maxY > stops[stops.length - 1].y + 8) {
      /* The foot holds the clip's last frame. It is the only stop whose cue is
         the end of the file rather than a frame the owner marked — there was
         nothing left to mark by the time the journey got here, which is the
         same "ran out of clip" the tail rebalance answered. */
      stops.push({ y: maxY, name: 'Foot', seg: null, cue: FOOT_CUE });
    }
  }

  function landingAt(i) { return stops[i].y; }

  /* The next landing in the direction of travel, or -1 for "nothing that way,
     let the page scroll". The tolerance is not cosmetic: glide() rounds to
     whole pixels and the browser quantises again, so the page comes to rest a
     pixel or two off the integer it was sent to. Without it that residue reads
     as "already past this landing" and the next gesture would skip a section. */
  function nextLanding(dir) {
    var y = window.scrollY, TOL = 4, i;
    if (dir > 0) {
      for (i = 0; i < stops.length; i++) if (stops[i].y > y + TOL) return i;
      return -1;                    /* already at the foot */
    }
    for (i = stops.length - 1; i >= 0; i--) if (stops[i].y < y - TOL) return i;
    return -1;                      /* already at the top */
  }

  /* A GESTURE IS OVER when the wheel has been quiet for --df-gap AND the glide
     has finished. Both halves are load-bearing. A trackpad emits synthetic
     inertia for up to a second after the fingers lift — dozens of events — and
     without the quiet window that tail alone would step three sections from one
     flick. Without the glide check, a fast mouse wheel could start a second
     step into the middle of the first and land between two sections. */
  function armGestureEnd() {
    if (snap.lock) clearTimeout(snap.lock);
    snap.lock = setTimeout(function () {
      snap.lock = 0;
      if (snap.raf) { armGestureEnd(); return; }
      snap.busy = false;
    }, T.gap);
  }

  /* Let a scrollable inner element keep its own wheel — the same guard
     js/scroll-weight.js carries, for the same reason it gives: swallowing every
     wheel unconditionally is how this kind of module breaks a modal or a long
     code block six months later. */
  function innerScroller(el, dy) {
    while (el && el.nodeType === 1 && el !== document.body) {
      var o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        if (dy < 0 ? el.scrollTop > 0
                   : el.scrollTop < el.scrollHeight - el.clientHeight - 1) return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  /* THE MUSIC RACE IS GONE (owner's call, Aug 18 2026). It used to spend
     f134..f157 across exactly the glide on a slackened lerp, so that leaving
     the park read as the background resuming rather than as a jump cut. It
     only ever existed to paper over a SCRUB artifact — the clip was parked, so
     scroll position had nothing to say about the frame until the glide had
     almost finished, and the race faked the motion that scrolling could not
     produce. Under play-and-park the clip genuinely resumes from the frame it
     parked on, at 1.0x, which is what the race was imitating. It is also a
     speed change, and the brief is one speed the whole way. */

  function stepTo(i, down) {
    var at = window.scrollY;
    glide(landingAt(i), T.stepMs);

    /* THE CLIP FOLLOWS THE LANDING, NOT THE GLIDE. The page and the footage are
       deliberately not tied together any more: the glide takes --df-step-ms and
       the leg takes as long as the footage takes, and neither waits for the
       other. Tying them was the old build's whole design and it is what forced
       every section's footage to be cut to its scroll height. */
    var cue = cueOf(i);
    if (!vid.duration) return;

    /* THE SAME GESTURE RE-FIRING MUST NOT RESTART THE LEG. See the skip-ahead
       note on the wheel handler: one flick can reach here several times.
       playTo() would stopWatch() and re-arm on every one of them, and each
       re-arm re-reads currentTime — which is fine — but it also re-issues
       play() and rebuilds the callback, and the first version of this stuttered
       visibly at the head of a leg. If the clip is already on its way to this
       stop's cue, leave it alone. */
    if (play.stop === i && play.to === cue) return;
    play.stop = i;

    var cur = vid.currentTime * FPS - 0.5;

    /* THE LEG TAKES THE SKY WITH IT. skyFrom is the level actually on screen
       rather than the level the stop we are leaving is supposed to rest at,
       so a leg interrupted half way through a crossfade carries on from where
       the last one got to instead of snapping back. */
    play.from = cur;
    play.skyFrom = skySh;
    play.skyTo = skyRest(i);
    play.skyIn = false;

    if (play.skyTo < 0.5 && skySh > 0.01) {
      /* Leaving the sky: drop it now so the footage is clear for the leg. */
      skyT = 0; skyRate = T.skyOut; skyLock = true;
    } else if (play.skyTo > 0.5 && skySh < 0.99) {
      /* Arriving under it: hold it OFF the whole way, raise it on arrival. */
      skyT = 0; skyRate = T.skyOut; skyLock = true; play.skyIn = true;
    }
    if (!raf) raf = requestAnimationFrame(tick);

    if (cue >= cur) {
      playTo(cue, function () { fireCue(i); });
    } else {
      /* Going back. reverseTo tries true reverse playback and falls back to a
         seek on its own budget; either way the reveal is already showing on a
         section the reader has seen, so nothing waits on it. */
      reverseTo(cue, function () { fireCue(i); });
    }
  }

  /* Arriving at a cue: let that section's reveal go. Idempotent — a stop can be
     landed on repeatedly and .remove() on an absent class is a no-op. */
  function fireCue(i) {
    var s = stops[i];
    if (!s) return;
    var el = s.seg ? s.seg.el : (s.name === 'Stay Connected' ? document.querySelector(TAIL) : null);
    if (el) el.classList.remove('df-cued');
  }

  /* --df-step IS READ LIVE, not off the throttled T. syncTunables() only runs
     from tick(), and tick() only runs while the page is moving — so a page
     sitting still on a landing never picks up a change to this one. That makes
     the off switch SELF-LOCKING: the stepper is the reason the page is not
     scrolling, so turning it to 0 could never take effect and the dial would
     look broken. MEASURED: with the value read off T, --df-step 0 still
     stepped a full section on the next wheel.
     js/scroll-weight.js reads --scroll-weight live on every wheel for exactly
     this reason and gives the justification — one getComputedStyle per wheel
     event is nothing next to what the browser does to handle the scroll. */
  function stepOn() {
    var v = parseFloat(getComputedStyle(root).getPropertyValue('--df-step'));
    return isFinite(v) ? v : T.step;
  }

  /* Registered immediately, not inside the marks fetch, so ordering against
     scroll-weight.js does not depend on how fast a JSON file lands. */
  window.addEventListener('wheel', function (e) {
    if (!stepOn() || !stops.length) return;
    if (e.ctrlKey || e.metaKey) return;                    /* pinch / zoom */
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   /* sideways */
    if (!e.deltaY) return;
    if (innerScroller(e.target, e.deltaY)) return;

    var mag = Math.abs(e.deltaY);
    var dir = e.deltaY > 0 ? 1 : -1;
    var since = e.timeStamp - snap.lastT;   /* telemetry only, see below */
    snap.lastT = e.timeStamp;

    /* IS THIS STILL THE GESTURE THAT IS ALREADY BEING SERVED, OR A NEW ONE?
       Everything hard about this module is in that question. A trackpad throws
       a long decaying tail after the fingers lift, and absorbing it is what
       stops one flick walking three stops. But absorbing too much is what the
       owner reported on Aug 17 2026, twice over, so the tail is now told apart
       from a new push by three signals rather than by time alone:

       REVERSED — a tail decays but never turns round, so an event pointing
       against the glide can only be the reader changing their mind. Ignoring
       it is what made an up-flick out of Stay Connected read as the page
       carrying on downward.

       PUSHED — a tail is monotonically decreasing, so nothing in it can be
       much larger than the smallest event seen so far. A fresh flick starts
       hard. Without this the tail re-armed the lock on every event and a
       follow-up flick 50ms after landing on Archive moved 0px, which is the
       "I have to flick several times" report.

       A THIRD SIGNAL, TIME SINCE THE LAST EVENT, WAS TRIED AND REMOVED. The
       idea was to catch a mouse wheel, whose ticks are all the SAME magnitude
       so PUSHED can never fire for one. At a 60ms threshold it wrecked the
       thing it was meant to help: setTimeout jitter alone pushed mid-tail
       events over the line, each one cancelling the glide and starting
       another, and steps that had been landing exactly came to rest BETWEEN
       stops — Music to Merch finished at 2766 against a 2802 landing, and the
       Archive pair landed at 4158 and 4927. Do not reintroduce it without a
       much larger threshold and a re-measure.

       WHAT THAT LEAVES FOR A MOUSE: a steady spin faster than --df-gap reads
       as one continuous gesture and advances one stop per glide. That is the
       intended feel, and --df-gap is the dial if it is not. `since` is kept
       below only because it is worth having in the telemetry. */
    if (snap.busy) {
      var isNew = (dir !== snap.dir) ||
                  (mag > snap.minMag * 1.8 + 1);
      if (!isNew) {
        if (mag < snap.minMag) snap.minMag = mag;
        e.preventDefault();
        e.stopImmediatePropagation();
        armGestureEnd();
        return;
      }
      /* A new gesture takes the page off the old one, mid-glide if need be. */
      if (snap.lock) { clearTimeout(snap.lock); snap.lock = 0; }
      if (snap.raf) {
        cancelAnimationFrame(snap.raf);
        snap.raf = 0;
      }
      snap.busy = false;
    }

    var i = nextLanding(dir);

    /* THE SKIP-AHEAD (owner's call, Aug 18 2026), AND IT MUST ASK WHERE THE
       NEW GESTURE IS ACTUALLY GOING.

       A second flick while a leg is still playing means the reader is opting
       out of that leg, so the clip SEEKS to the pending cue rather than
       fast-forwarding — a speed-up is the one thing the brief rules out, and
       seeking lands frame-exact.

       BUT `isNew` ABOVE IS NOT THE SAME QUESTION. A real trackpad flick
       ACCELERATES before it decays, so the rising edge trips the PUSHED test
       part-way through a single gesture. That is harmless for the stepper —
       nextLanding() returns the stop it is already gliding to, so it simply
       re-glides to the same pixel — but the first version of this skip fired
       on `isNew` alone and cut the leg dead.

       MEASURED with a ramp-then-decay burst, which is what a flick really
       looks like: About to Music finished in 56ms against its 2.583s of
       footage, playing exactly one frame before seeking to f83. With a
       decay-only burst — which never trips PUSHED — the same leg measured
       2.586s, which is why the first round of testing missed it entirely.

       So the skip only fires when the new gesture resolves to a DIFFERENT stop
       than the leg in flight. */
    if (play.to >= 0 && i >= 0 && i !== play.stop) arrive(play.to, play.done);

    /* OFF EITHER END OF THE DOCUMENT — the very top going up, the foot going
       down. Nothing to step to, so hand it back and let the page do whatever
       it normally does at its own edge. */
    if (i < 0) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    snap.busy = true;
    snap.dir = dir;
    snap.minMag = mag;
    armGestureEnd();
    stepTo(i, dir > 0);
  }, { passive: false });

  /* ARRIVING BY ANY OTHER ROUTE still settles onto Music's rest point. A
     scrollbar drag, a keyboard key or an anchor can leave the page inside Music
     but off the frame the card needs, and the stepper never sees any of those.
     A band rather than the whole section: someone who has deliberately scrolled
     to the far end of Music should be left there rather than yanked back.

     Waiting for 140ms of quiet is also what keeps this off scroll-weight's
     toes — that module emits scroll events continuously while it animates, so
     the timer cannot elapse until it has finished and re-anchored its target. */
  function settled() {
    if (snap.busy || snap.raf) return;

    /* ARRIVING BY A ROUTE THE STEPPER NEVER SAW still has to fire the cue, or
       that section stays held down and its headline never appears. A nav link
       and a spine-rail node are plain anchor navigation — no handler here runs
       for either — and the scrollbar and the keyboard are the same story.
       So once the page is still, ask where it came to rest: if that is a
       landing, make sure the clip is on its cue.

       PLAY IF WE ARE BEHIND IT, SEEK IF WE ARE PAST IT. An anchor jump is not
       a journey and playing forty frames to catch up would read as the page
       lagging, but a short forward leg is exactly the cinema this is for. The
       cut-off is one leg's worth. */
    var y = window.scrollY, i, best = -1, bd = Infinity;
    for (i = 0; i < stops.length; i++) {
      var d = Math.abs(stops[i].y - y);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0 && bd <= 8 && vid.duration && play.to < 0) {
      var cue = cueOf(best), cur = vid.currentTime * FPS - 0.5;
      if (Math.abs(cue - cur) > 0.75) {
        if (cue > cur && cue - cur <= 80) playTo(cue, function () { fireCue(best); });
        else jumpTo(cue, function () { fireCue(best); });
      } else {
        fireCue(best);
      }
    }

    if (!music || !T.snap) return;
    if (y < music.y0 || y >= music.y1) return;
    if (Math.abs(y - musicRest) <= 2) return;
    var band = Math.max(160, (music.y1 - music.y0) * 0.45);
    if (Math.abs(y - musicRest) <= band) glide(musicRest, 520);
  }

  /* Taking hold of anything cancels the glide, the same rule scroll-weight.js
     applies to its own momentum: a page still moving under a pointer that has
     grabbed the carousel feels broken. The lock goes with it, or the next wheel
     event would be swallowed by a gesture that is no longer happening. */
  window.addEventListener('pointerdown', function () {
    if (snap.raf) { cancelAnimationFrame(snap.raf); snap.raf = 0; }
    if (snap.lock) { clearTimeout(snap.lock); snap.lock = 0; }
    snap.busy = false;
    skyLock = false;
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

    /* THE CLIP IS NOT DRIVEN FROM HERE ANY MORE. The lerp, the two write
       thresholds and the settle retry that used to live in this function were
       all about chasing a scroll-derived target with seeks. Playback chases
       nothing — it plays — so the whole block went, and with it the reason
       tick() had to keep running while the page moved. The scrim still reads
       the clip, and the playback engine paints it per frame. */
    paintScrim(vid.currentTime);

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
    /* BOTH DIRECTIONS EASE NOW. Rising used to snap — `skySh = skyT` — and that
       was right while rising meant "follow the scroll", where easing would have
       made the sky trail the reader's hand. Rising is no longer a scroll
       response: it is a single event at the park, so snapping showed the nebula
       arriving in one frame. MEASURED: --df-sky went 0.000 to 1.000 between two
       80ms samples, which is the "should be a smooth transition" the owner
       asked for arriving as a cut.

       The equality branch still must NOT clear `booting` — see the note below,
       which cost a build when the rising branch cleared it before the opening
       dissolve had started. */
    if (Math.abs(skyT - skySh) < 0.002) {
      skySh = skyT;
      skyDone = true;
    } else {
      /* 0.06 on the opening (~800ms) against 0.18 for the Music exit (~200ms).
         They are different events: the opening is a dissolve the visitor is
         meant to notice, the exit is the owner's "immediate swap" and only
         eases at all so it is not a one-frame cut. */
      skySh += (skyT - skySh) * (booting ? 0.06 : skyRate);
      if (Math.abs(skyT - skySh) < 0.002) { skySh = skyT; booting = false; }
      skyDone = (skySh === skyT);
    }
    root.style.setProperty('--df-sky', skySh.toFixed(4));

    if (!skyDone) raf = requestAnimationFrame(tick);
  }

  function onScroll() {
    if (!ready) return;
    var y = window.scrollY;

    /* SCROLL POSITION NO LONGER CHOOSES A FRAME. It chooses a landing, and the
       landing chooses a cue; the clip gets there by playing. All this handler
       still owns is the sky and the reveal backstop. */
    wasParked = parkedAt(y);
    /* THE LOCK IS RELEASED BY arrive(), NOT BY A SCROLL POSITION.

       It was `y >= music.y1` at first, which reads as "released once the
       viewport has left Music" and is right for the leg it was written for and
       wrong for every other one: on any leg BELOW Music that test is already
       true at the first scroll event, so the lock lifted immediately and
       skyAt() took the sky back.

       MEASURED on Archive to Stay Connected, which is the leg where it shows:
       the nebula climbed all the way through the footage — 0.171 at t=400ms,
       0.612 at t=713ms, 0.842 by the time the clip parked — instead of staying
       off and coming up over the settled frame. Music to Merch hid the fault
       because there both the lock and skyAt() wanted 0. */
    if (!booting && !skyLock) skyT = skyAt(y);
    cueBackstop();

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
      { k: '--df-sky-in', g: 'handoff', label: 'sky in', min: 0.02, max: 0.3, step: 0.005,
        tip: 'How fast the nebula comes up over the settled frame at Music. Lower is slower and more deliberate; this is the transition the reader is meant to watch, so it runs slower than sky out' },
      { k: '--df-sky-out', g: 'handoff', label: 'sky out', min: 0.02, max: 0.4, step: 0.01,
        tip: 'How fast the nebula clears when a leg begins, handing the screen back to the clip. Faster than sky in on purpose - this one should barely be noticed' },

      { k: '--df-stagger', g: 'handoff', label: 'stagger', min: 0, max: 400, step: 5,
        tip: 'Milliseconds between reveals inside one section. The cue order comes from the marks file; this is only the spacing' },

      { k: '--df-step', g: 'step', label: 'step', min: 0, max: 1, step: 1,
        tip: 'One wheel gesture moves one section. 0 hands the page back to scroll weight entirely, which is how everything before build 4 scrolled' },
      { k: '--df-step-ms', g: 'step', label: 'glide', min: 200, max: 1600, step: 20,
        tip: 'Milliseconds to cross from one section to the next. The clip is not tied to this - a leg takes as long as its footage takes, at 1.0x' },
      { k: '--df-gap', g: 'step', label: 'gap', min: 0, max: 600, step: 10,
        tip: 'Wheel silence that ends a gesture. A trackpad throws inertia for about a second after your fingers lift; raise this if one flick still walks two sections, lower it if a deliberate second scroll feels ignored' },

      { k: '--df-snap', g: 'stop', label: 'snap', min: 0, max: 1, step: 1,
        tip: 'Whether Music lands on its rest point where the card is framed. 0 lands it on its boundary like every other section, with the sky and the park unchanged' }
    ];
    var GROUPS = [['clip', 'The clip', true], ['handoff', 'Handoff and reveals', true],
                  ['step', 'The section stepper', true], ['stop', 'The Music stop', true]];

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
    fetch('assets/lab/deep-field-2-marks.json').then(function (r) { return r.json(); }),
    fetch('assets/lab/deep-field-2-lum.json').then(function (r) { return r.json(); })
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
        return { name: s.name, y0: s.y0, y1: s.y1, cue: s.cue };
      }),
      tailY: tailY,
      musicRest: musicRest,
      snap: { busy: snap.busy, gliding: !!snap.raf },
      landings: stops.map(function (s) {
        return { name: s.name, y: s.y };
      }),
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
      playingTo: play.to,
      reversing: play.reversing,
      paused: vid.paused,
      rate: vid.playbackRate,
      cues: stops.map(function (st, i) { return { name: st.name, cue: cueOf(i) }; }),
      held: Array.prototype.map.call(
        document.querySelectorAll('[data-ksd-section].df-cued'),
        function (el) { return el.getAttribute('data-ksd-section'); }),
      parked: parkedAt(window.scrollY),
      booting: booting,
      sky: +cs.getPropertyValue('--df-sky'),
      lum: +cs.getPropertyValue('--df-lum'),
      videoOpacity: +getComputedStyle(vid).opacity,
      tunables: { tail: T.tail, stagger: T.stagger },
      tailFrom: tailFrom,
      src: (vid.currentSrc || '').split('/').pop()
    };
  };
})();

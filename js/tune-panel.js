/* THE SHARED TUNING SHELL — one panel, many tabs, only ever at /?tune.

   WHY THIS EXISTS
   ---------------
   /?tune had grown a panel per subsystem, each inventing its own box and each
   carrying a comment about landing on top of one of the others: js/spine-bg.js
   down the right edge (47 sliders), js/site-footer.js at bottom-left (the
   torch), js/clouds-sky.js at top-left (the sky). At 1440x900 that used up
   every corner -- the right edge was 876px of spine tuner and the left column
   was 500px of sky above 335px of torch -- so the film-row atmosphere had
   nowhere to go, and every panel that grew a row meant re-measuring six
   pairwise collisions.

   Now there is ONE shell with a tab bar. Adding a tuner is a call to
   KSTunePanel.tab(): no new corner, no new collision, and one hide button
   instead of four. Sections inside a tab collapse independently, so a 47-row
   tab is navigable without scrolling past everything.

   Nothing here runs on a normal page load: no shell, no stylesheet, no
   listeners. The gate is the same URLSearchParams read the panels used before,
   read as DATA and never as a regex -- a word-boundary escape in a guard like
   this once got rewritten by a generator into a literal backspace (0x08),
   giving a pattern that could never match and was invisible in every diff and
   every grep.

   LOAD ORDER: this file must come before any script that calls it. It defines
   window.KSTunePanel synchronously and touches nothing else.

   USAGE
   -----
     var body = window.KSTunePanel.tab('sky', 'Sky', 'the cloud field');
     if (!body) return;                       // off /?tune, costs a visitor nothing
     var grp = KSTunePanel.section(body, 'sky-shape', 'Shape');
     KSTunePanel.slider(grp, {label:'opacity', min:0, max:1, step:0.01,
                             tip:'...'}, getFn, setFn);

   Every helper returns a paint() where repainting makes sense, so a Reset
   button re-syncs the controls by calling the paints it collected rather than
   rebuilding the tab.
*/
(function () {
  'use strict';

  var ON = new URLSearchParams(location.search).has('tune');
  var PANEL_KEY = 'ks.tunePanel';
  var TAB_KEY = 'ks.tunePanelTab';
  var SEC_KEY = 'ks.tunePanelSec.';
  var shell = null, tabBar = null, tabs = [];

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function styles() {
    var css = document.createElement('style');
    css.textContent =
      /* RIGHT EDGE, FULL HEIGHT. The right edge is where the 47-slider spine
         tuner lived for the whole project, so it is where the owner's hand
         already goes. Full height is now safe precisely BECAUSE everything
         merged: the old left column had to reserve 400px for the footer
         torch's own box, and the torch is a tab in here now. */
      '.ks-tune{position:fixed;right:12px;top:12px;z-index:9999;' +
        'background:rgba(3,4,15,.95);border:1px solid rgba(157,178,192,.35);' +
        'padding:10px 12px;width:330px;max-height:calc(100vh - 24px);' +
        'display:flex;flex-direction:column;gap:7px;backdrop-filter:blur(6px);' +
        'font:10px/1.5 "IBM Plex Mono",monospace;letter-spacing:.1em;color:#78888F}' +
      '.ks-tune b{font-weight:500;font-size:9px;letter-spacing:.22em;' +
        'text-transform:uppercase;color:#D6D5D0;padding-right:30px;flex:0 0 auto}' +
      /* The tab bar wraps: four tabs do not fit on one 330px row, and a
         horizontally scrolling tab strip hides tabs behind a gesture nobody
         discovers. Wrapping costs one line of height and shows all of them. */
      '.ks-tune__tabs{display:flex;flex-wrap:wrap;gap:4px;flex:0 0 auto}' +
      '.ks-tune button.ks-tune__tab{flex:1 1 auto;min-width:66px;padding:4px 6px;' +
        'font-size:9px;letter-spacing:.14em;color:#57676F;' +
        'border-color:rgba(214,213,208,.18)}' +
      '.ks-tune button.ks-tune__tab[aria-selected="true"]{color:#D6D5D0;' +
        'border-color:rgba(157,178,192,.7);background:rgba(157,178,192,.08)}' +
      /* min-height:0 is what lets the body scroll instead of pushing the shell
         past its max-height. Do not remove it as redundant -- a flex child's
         default min-height:auto refuses to shrink below its content. */
      '.ks-tune__body{flex:1 1 auto;min-height:0;overflow-y:auto;' +
        'overscroll-behavior:contain;display:none;flex-direction:column;gap:6px;' +
        'margin:0 -2px;padding:0 2px}' +
      '.ks-tune__body[data-on="1"]{display:flex}' +
      '.ks-tune__body::-webkit-scrollbar{width:8px}' +
      '.ks-tune__body::-webkit-scrollbar-thumb{background:#2E2E2E}' +
      '.ks-tune__body::-webkit-scrollbar-track{background:transparent}' +
      /* Sections: <details>/<summary>, so open/closed is the browser's own
         state and keyboard support comes free. */
      '.ks-tune details{border-top:1px solid #1C1C1C;flex:0 0 auto}' +
      '.ks-tune summary{cursor:pointer;list-style:none;padding:6px 0 4px;' +
        'font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:#9DB2C0;' +
        'display:flex;justify-content:space-between;gap:8px}' +
      '.ks-tune summary::-webkit-details-marker{display:none}' +
      '.ks-tune summary::after{content:"–";color:#57676F}' +
      '.ks-tune details:not([open]) summary::after{content:"+"}' +
      '.ks-tune details:not([open]) summary{color:#57676F}' +
      '.ks-tune__sec{display:flex;flex-direction:column;gap:6px;padding:2px 0 8px}' +
      '.ks-tune label{display:flex;flex-direction:column;gap:3px;text-transform:uppercase}' +
      '.ks-tune label>span{display:flex;justify-content:space-between;gap:8px}' +
      '.ks-tune i{font-style:normal;color:#9DB2C0;letter-spacing:.06em}' +
      '.ks-tune input[type="range"]{width:100%;accent-color:#9DB2C0}' +
      '.ks-tune select,.ks-tune textarea{width:100%;background:#0A0D14;color:#D6D5D0;' +
        'border:1px solid #2E2E2E;font:10px/1.4 "IBM Plex Mono",monospace;padding:4px}' +
      '.ks-tune__row{display:flex;gap:6px;flex:0 0 auto}' +
      '.ks-tune button{flex:1;font:9px/1 "IBM Plex Mono",monospace;letter-spacing:.16em;' +
        'text-transform:uppercase;padding:6px 8px;cursor:pointer;background:transparent;' +
        'color:#D6D5D0;border:1px solid rgba(214,213,208,.28)}' +
      '.ks-tune button:hover{border-color:rgba(157,178,192,.8)}' +
      /* `label.ks-tune__toggle`, not the bare class -- and this file documents
         that trap twice above and STILL shipped it here. `.ks-tune__toggle` is
         (0,1,0) and loses to `.ks-tune label` (0,1,1) two rules up, so
         flex-direction computed back to `column` and every toggle in every tab
         rendered as a stacked, centred label with an orphaned checkbox under
         it. Naming the element makes it (0,1,1) and later in source order,
         which wins. Caught by an agent building the Film tab, not by reading. */
      '.ks-tune label.ks-tune__toggle{display:flex;justify-content:space-between;' +
        'align-items:center;gap:8px;text-transform:uppercase;cursor:pointer;' +
        'flex-direction:row}' +
      '.ks-tune label.ks-tune__toggle input{accent-color:#9DB2C0;cursor:pointer;width:auto}' +
      '.ks-tune__note{font-size:8px;letter-spacing:.14em;color:#57676F;flex:0 0 auto;margin:0}' +
      '.ks-tune__note em{font-style:normal;color:#9DB2C0}' +
      /* Doubled class, never the single `.ks-tune--min>*`. One class is (0,1,0)
         and LOSES to `.ks-tune label` at (0,1,1), so the sliders stay visible
         and the panel collapses to a strip of labels rather than a chip. The
         footer torch shipped exactly that for one test run: 151px instead of
         86px. (0,2,0) beats one class plus one element. */
      '.ks-tune button.ks-tune__min{position:absolute;top:8px;right:10px;flex:0 0 auto;' +
        'padding:1px 7px 2px;line-height:15px;color:#57676F;border-color:rgba(214,213,208,.2)}' +
      '.ks-tune button.ks-tune__min:hover{color:#D6D5D0}' +
      '.ks-tune--min{width:auto;min-width:0;padding:6px 8px}' +
      '.ks-tune.ks-tune--min>*{display:none}' +
      '.ks-tune.ks-tune--min>button.ks-tune__min{display:block;position:static;padding:2px 9px}';
    document.head.appendChild(css);
  }

  function select(id) {
    tabs.forEach(function (t) {
      var on = t.id === id;
      t.btn.setAttribute('aria-selected', on ? 'true' : 'false');
      t.body.setAttribute('data-on', on ? '1' : '0');
    });
    store(TAB_KEY, id);
  }

  function build() {
    styles();

    shell = document.createElement('div');
    shell.className = 'ks-tune';

    var title = document.createElement('b');
    title.textContent = 'Tuning';
    shell.appendChild(title);

    tabBar = document.createElement('div');
    tabBar.className = 'ks-tune__tabs';
    tabBar.setAttribute('role', 'tablist');
    shell.appendChild(tabBar);

    var minBtn = document.createElement('button');
    minBtn.type = 'button';
    minBtn.className = 'ks-tune__min';
    var setMin = function (min) {
      shell.classList.toggle('ks-tune--min', min);
      minBtn.textContent = min ? '+ tune' : '−';
      minBtn.title = min ? 'restore the tuning panel' : 'hide the panel to a corner chip';
      minBtn.setAttribute('aria-label', minBtn.title);
      store(PANEL_KEY, min ? '0' : '1');
    };
    minBtn.addEventListener('click', function () {
      setMin(!shell.classList.contains('ks-tune--min'));
    });
    shell.appendChild(minBtn);
    /* Stored as an OPEN flag so "nothing stored" reads as open -- what a
       first-time /?tune visitor should get. */
    setMin(read(PANEL_KEY) === '0');

    document.body.appendChild(shell);
  }

  window.KSTunePanel = {
    /* True at /?tune. Cheaper than building a tab just to discover the gate. */
    on: ON,

    /* Returns the tab's body element, or null off /?tune, so every caller's
       tuning code sits behind one truthiness check. Tabs appear in call order,
       which is script order in the page. */
    tab: function (id, label, tip) {
      if (!ON) return null;
      if (!shell) build();

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ks-tune__tab';
      btn.textContent = label;
      if (tip) btn.title = tip;
      btn.setAttribute('role', 'tab');

      var body = document.createElement('div');
      body.className = 'ks-tune__body';
      body.setAttribute('data-on', '0');
      body.setAttribute('role', 'tabpanel');

      btn.addEventListener('click', function () { select(id); });
      tabBar.appendChild(btn);
      shell.appendChild(body);
      tabs.push({ id: id, btn: btn, body: body });

      /* Re-resolve the remembered tab on every registration: tabs arrive at
         different times depending on script order, and the remembered one may
         not exist yet when the first tab registers. Falls back to the first. */
      var want = read(TAB_KEY);
      select(tabs.some(function (t) { return t.id === want; }) ? want : tabs[0].id);
      return body;
    },

    /* A collapsible group inside a tab. `id` must be unique across the whole
       page -- open/closed is remembered against it. */
    section: function (parent, id, label, openByDefault) {
      var d = document.createElement('details');
      var s = document.createElement('summary');
      s.textContent = label;
      d.appendChild(s);
      var inner = document.createElement('div');
      inner.className = 'ks-tune__sec';
      d.appendChild(inner);
      var saved = read(SEC_KEY + id);
      d.open = saved === null ? openByDefault !== false : saved === '1';
      d.addEventListener('toggle', function () {
        store(SEC_KEY + id, d.open ? '1' : '0');
      });
      parent.appendChild(d);
      return inner;
    },

    /* def: {label, min, max, step, fmt, tip}. Returns paint() so a Reset can
       re-sync every control without rebuilding the tab. */
    slider: function (parent, def, get, set) {
      var label = document.createElement('label');
      if (def.tip) label.title = def.tip;
      var head = document.createElement('span');
      var name = document.createElement('span');
      name.textContent = def.label || def.k;
      var out = document.createElement('i');
      head.appendChild(name); head.appendChild(out);
      var input = document.createElement('input');
      input.type = 'range';
      input.min = def.min; input.max = def.max; input.step = def.step;
      var paint = function () {
        var v = get();
        input.value = v;
        out.textContent = def.fmt ? def.fmt(v) : (def.step >= 1 ? v : Number(v).toFixed(2));
      };
      input.addEventListener('input', function () { set(parseFloat(input.value)); paint(); });
      label.appendChild(head); label.appendChild(input);
      parent.appendChild(label);
      paint();
      return paint;
    },

    toggle: function (parent, text, get, set) {
      var label = document.createElement('label');
      label.className = 'ks-tune__toggle';
      var name = document.createElement('span');
      name.textContent = text;
      var input = document.createElement('input');
      input.type = 'checkbox';
      var paint = function () { input.checked = !!get(); };
      input.addEventListener('change', function () { set(input.checked); paint(); });
      label.appendChild(name); label.appendChild(input);
      parent.appendChild(label);
      paint();
      return paint;
    },

    row: function (parent) {
      var d = document.createElement('div');
      d.className = 'ks-tune__row';
      parent.appendChild(d);
      return d;
    },

    button: function (parent, text, onClick) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', onClick);
      parent.appendChild(b);
      return b;
    },

    note: function (parent, text) {
      var p = document.createElement('p');
      p.className = 'ks-tune__note';
      if (text) p.textContent = text;
      parent.appendChild(p);
      return p;
    },

    /* Copy that degrades honestly: clipboard where it is allowed, the raw text
       into the note where it is not, so a dialled value is never just lost. */
    copy: function (btn, note, text, restore) {
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
        .then(function () { btn.textContent = 'Copied'; },
              function () { note.textContent = text; })
        .then(function () {
          setTimeout(function () { btn.textContent = restore; }, 1600);
        });
    }
  };
})();

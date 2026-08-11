/* ==========================================================================
   FUSION — PLATE's callouts over MANDALA's geometry
   Partner file: css/field/v-fusion.css. Built Aug 11 2026.

   WHY THIS EXISTS
   Judged against each other, PLATE and MANDALA each turned out to be strong in
   exactly the place the other was weak:

     PLATE   the better TYPE      — leader lines out to named callouts, which is
                                    the only thing in the whole set that tells a
                                    visitor what the glowing column actually is
             the weaker GEOMETRY  — a faint Metatron web that mostly reads as
                                    texture and could be almost anything

     MANDALA the better GEOMETRY  — a real 13-circle construction centred on the
                                    HEART rather than on the stage, which is the
                                    one row where the diagram and the body
                                    genuinely coincide
             the weaker TYPE      — a thin register of numerals and Hz on the
                                    rim, carrying far less than PLATE's callouts

   So this is not a seventh idea. It is the two halves that won.

   COMPOSED, NOT COPIED — and that is the whole design of this file.
   Nothing here re-implements a callout or a circle. mount() adds `v-plate` and
   `v-mandala` to <html> alongside `v-fusion` and calls both modules' own
   mount(), so both stylesheets light up and both build their own DOM. This
   file then does exactly one thing: it SUBTRACTS, in CSS, the half of each
   parent that the other one does better.

   The payoff is that the parents stay the source of truth. Retune --m-frame in
   v-mandala.css or --pl-name-a in v-plate.css and this inherits it, because
   there is no second copy to drift. The cost is that FUSION cannot be judged
   in isolation from its parents — if one of them breaks, this breaks with it.
   That trade is right for a lab whose entire purpose is comparison.

   ORDER MATTERS, ONCE. mandala.mount() runs first so its SVG lands in the DOM
   before PLATE's callouts: both are position:absolute in the same container
   with no z-index of their own, so DOM order is the stacking order, and the
   type must sit over the construction rather than under it.
   ========================================================================== */
(function () {
  'use strict';

  var PARENTS = ['mandala', 'plate'];   /* geometry first, then the type on top */

  /* EACH PARENT GETS ITS OWN SLOT, and this is not tidiness — it is the whole
     reason the composition works at all.

     Both parents own their container outright: v-plate.js:170 and
     v-mandala.js:183 both assign `root.innerHTML = …`. Handed the same node,
     whichever mounts SECOND wipes the first. Measured Aug 11 2026: FUSION came
     up with seven callouts and no geometry whatsoever, because PLATE runs last
     and had erased MANDALA's entire SVG a frame earlier. Nothing errored and
     the page looked plausible — it just silently was not the reading it
     claimed to be.

     So each parent is handed a private div and can clear it as often as it
     likes. The slots carry `display: contents` (see v-fusion.css), so they
     generate no box of their own and every absolutely-positioned child still
     resolves against .field exactly as it did when the parent ran alone.

     THE ALTERNATIVE WAS EDITING BOTH PARENTS to append instead of assign, and
     it is the wrong trade: those two files are readings under comparison, and
     changing how they build in order to make a third reading possible would
     mean the things being compared are no longer the things that were built. */
  var slots = {};

  function slotFor(root, name) {
    if (!slots[name] || slots[name].parentNode !== root) {
      var d = document.createElement('div');
      d.className = 'fu-slot fu-slot--' + name;
      root.appendChild(d);
      slots[name] = d;
    }
    return slots[name];
  }

  function each(root, fn) {
    for (var i = 0; i < PARENTS.length; i++) {
      var name = PARENTS[i];
      var m = window.__field && window.__field[name];
      if (m) { fn(m, slotFor(root, name), name); }
      else { console.warn('v-fusion: parent module missing —', name); }
    }
  }

  window.__field = window.__field || {};
  window.__field.fusion = {

    mount: function (root) {
      /* THE PARENT CLASSES ARE THE MECHANISM, not a side effect. Every rule in
         v-plate.css and v-mandala.css is scoped under html.v-plate / .v-mandala
         -- that scoping is what lets six readings share one page -- so without
         these two lines both parents would build their DOM into the field and
         then render completely unstyled. */
      var r = document.documentElement;
      r.classList.add('v-plate', 'v-mandala');
      /* Classes BEFORE mount: both parents measure real geometry on the way in
         (PLATE derives its leader length from --spine-anat-w, MANDALA sizes its
         construction off the stage), and an unstyled first read would bake the
         wrong numbers in. */
      each(root, function (m, slot) { m.mount(slot); });
    },

    unmount: function (root) {
      /* Parents first, while their styles still apply: PLATE measures callout
         rects on the way out and MANDALA tears down a pointer listener, and
         both deserve to see the layout they were built in. Then the classes,
         then the DOM.

         The host also strips every v-<name> on switch, so these removals are
         belt-and-braces -- but this module must be safe to unmount on its own,
         and leaving v-plate on <html> after FUSION exits would silently style
         the NEXT reading with a stylesheet it never asked for. */
      each(root, function (m, slot) { m.unmount(slot); });
      document.documentElement.classList.remove('v-plate', 'v-mandala');
      slots = {};
      root.innerHTML = '';
    }
  };
})();

/* ==========================================================================
   THE SEVEN — one definition, read by everything that draws them.

   WHY THIS FILE EXISTS. The six field readings in spine-field-lab.html each
   carry their own copy of this table, because they were built in parallel by
   five workers who could not see each other's files. That was the right call
   for a comparison -- six independent readings of one dataset -- and it is the
   wrong call the moment two SHIPPING surfaces need the same numbers. The site
   footer and the navigator's field are the same system stated twice; if the
   throat is 741 Hz in one and 714 in the other, the system is a lie.

   ORDER IS CROWN TO ROOT, top of the screen downward, so an index into this
   array is also a position on the spine. y is percent from the top of the
   stage and matches where each centre sits on the column.

   TRANSLITERATED LATIN ONLY. Devanagari is not load-bearing anywhere and no
   font is loaded for it -- a page that renders these in a fallback face is
   worse than one that does not render them at all.
   ========================================================================== */
(function () {
  'use strict';

  window.KS = window.KS || {};

  window.KS.CHAKRAS = [
    { n: 7, name: 'SAHASRARA',    en: 'Crown',        hz: 963, y: 12 },
    { n: 6, name: 'AJNA',         en: 'Third Eye',    hz: 852, y: 27 },
    { n: 5, name: 'VISHUDDHA',    en: 'Throat',       hz: 741, y: 40 },
    { n: 4, name: 'ANAHATA',      en: 'Heart',        hz: 639, y: 53 },
    { n: 3, name: 'MANIPURA',     en: 'Solar Plexus', hz: 528, y: 66 },
    { n: 2, name: 'SVADHISTHANA', en: 'Sacral',       hz: 417, y: 79 },
    { n: 1, name: 'MULADHARA',    en: 'Root',         hz: 396, y: 92 }
  ];

  /* THE RECORD, computed from data/tracks.json and checked rather than copied.
     Aug 11 2026: 28 tracks, all 28 carrying a duration, summing to 1:50:55;
     visualTheme.geometry is metatron 10 / vignette 9 / vesica 9. Hardcoded
     because a footer that fetches a 28KB catalogue to print one runtime has
     spent the reader's bandwidth on the least important line on the page. If
     the record changes, re-run the sum -- do not estimate it. */
  window.KS.RECORD = {
    title:   'RISE UP',
    year:    2026,
    tracks:  28,
    runtime: '1:50:55',
    geometry: [['METATRON', 10], ['VIGNETTE', 9], ['VESICA', 9]]
  };
})();

/* ==========================================================================
   PURCHASE — THE CHECKOUT INTERFACE, AND NOTHING BEHIND IT.

   Aug 20 2026. This file is a ROUGH-IN. It is the seam a payment provider gets
   dropped into later; today it takes no money, calls no API, and loads no
   third-party script. That is the whole design, and it is deliberate — the
   owner's words for this pass were "nothing has to be linked up yet or really
   wired ... the site is not live". Read STRIPE-SETUP.md before you change a
   line of this; it carries the reasoning about the host that the code below can
   only gesture at.

   THE ARCHITECTURAL FACT THIS FILE IS SHAPED AROUND. Kundalini Spines is a
   static site served by GitHub Pages from `main`. There is no server, no
   serverless runtime, and no environment-variable mechanism anywhere in the
   repo. A real Stripe Checkout Session is created with the SECRET key, which
   means it is created server-side — so it cannot be created from this file,
   ever, on this host as configured. Anyone who "fixes" that by putting a key in
   here has published it to the world: this file is fetched verbatim by every
   visitor, and GitHub Pages serves the whole repo.

     >> NO SECRET KEY, NO WEBHOOK SIGNING SECRET, NO PRIVATE CREDENTIAL, EVER,
        IN THIS FILE OR ANY OTHER FILE IN THIS REPO. <<

   Only a Payment Link URL or a publishable key may live client-side. See
   STRIPE-SETUP.md for the two honest routes forward.

   NO DEPENDENCIES, ON PURPOSE. No Stripe.js, no analytics vendor, no bundler,
   no npm. `track()` below is a shim over nothing — see its banner. The project
   has never carried an analytics dependency and this rough-in is not the place
   to introduce one.

   PARTNER FILES:
     purchase.html            renders the three edition cards (owned elsewhere)
     css/purchase.css         their styling (owned elsewhere)
     purchase-success.html    the return page a provider would redirect to
     purchase-cancelled.html  the abandon page
     STRIPE-SETUP.md          what the owner has to do by hand, and why
   ========================================================================== */
(function () {
  'use strict';

  /* ---- 1. THE CONFIG -----------------------------------------------------

     THE SINGLE SOURCE OF TRUTH FOR THE THREE EDITIONS. Everything else in this
     file resolves through it, and a future provider gets wired in by filling in
     `checkoutUrl` here and nowhere else.

     ALL THREE `checkoutUrl` ARE null AND MUST STAY null UNTIL A REAL URL
     EXISTS. null is not a placeholder to be tidied away — it is the flag
     `start()` reads to decide between "redirect" and "say honestly that this is
     not open yet". A '#' or an '' in that slot would send a paying visitor to a
     dead page, which is the exact failure this shape exists to prevent.

     THE PRICES BELOW WERE SET BY THE OWNER ON AUG 27 2026 AND ARE REAL. They
     were placeholders until that day: 12 / 25 / 45, taken from purchase.html
     rather than chosen here so the two agreed on arrival, existing only so the
     interface had something to draw and the analytics payload had a shape. The
     owner set the Digital Edition to 20 as the base and asked for the other two
     to hold the ladder's existing shape, so 25 and 45 were scaled by the same
     20/12 and rounded to 42 and 75. The felt distance between the tiers is
     unchanged — 1 / 2.08 / 3.75 became 1 / 2.10 / 3.75.

     So these are a pricing decision now, and the old licence to treat them as
     scratch numbers is withdrawn. Do not round them toward tidier ones.

     THE PRICE LIVES IN FOUR PLACES AND THAT IS A KNOWN COST. purchase.html and
     merch.html both print their prices as static markup — deliberately, so both
     pages are correct with JS off — this array holds them as config, and
     STRIPE-SETUP.md quotes them in prose. They can drift silently. The drift
     guard in bindButtons() below reads the page's own [data-ks-price] and warns
     when they disagree; it never rewrites the page, because a price written by
     JS is a different number for a visitor with JS disabled, which is worse
     than the drift.

     THE GUARD ONLY EVER SEES purchase.html, AND THAT IS THE TRAP. merch.html
     prints the same three numbers with no data-ks-price on them and never loads
     this module at all, so nothing checks that page — its prices sat at the
     old 12 / 25 / 45 and were caught on Aug 27 2026 only because someone grepped
     for the digits before editing. STRIPE-SETUP.md was unguarded the same way
     and had been wrong for a week, still quoting a 12 / 35 / 150 set that no
     file had carried since Aug 20. Four files, one edit, every time.

     THE ARTIFACT IS PRICED "From $75" ON THE PAGE. `price` here is the floor,
     not a fixed amount — it is a configured bundle. Whatever the analytics
     payload says about it is the entry price and nothing more.

     `code` is the archive numbering the rest of the site uses for filed things
     (01/02/03), not a SKU. The SKU-shaped identifier is built by productId()
     below and is what analytics and Stripe metadata should carry. */
  var EDITIONS = [
    {
      id: 'digital',
      code: '01',
      name: 'Digital Edition',
      price: 20,
      currency: 'USD',
      cta: 'Get the Digital Edition',
      recommended: false,
      status: 'available',
      /* THE LIVE PAYMENT LINK. Sept 1 2026 — this line is the one that opens
         real sales, and until today it read
         `https://buy.stripe.com/test_5kQbIT7b6gYhfc8aQBaIM00`, a TEST link
         that took no money. Everything else was built and released ahead of
         it deliberately, so that the whole path could be stood up and probed
         with nothing at stake.

         THIS LINE IS USELESS WITHOUT THE REDIRECT SET ON THE LINK ITSELF.
         In the Stripe Dashboard, this Payment Link's "After the payment →
         Confirmation page" must be the redirect option pointed at
         `https://kundalinispines.com/purchase-success?session_id={CHECKOUT_SESSION_ID}`
         — with Stripe's literal token, which Stripe substitutes for the real
         Session ID. Without it a buyer pays, lands on the success page with
         no query string, and is told the page was opened without an order
         reference. They would have been charged and shown nothing. The money
         is safe and the order is real either way — the webhook, not this
         page, is the record — but there is no self-serve download.

         REVERTING IS THE SAFE DIRECTION. Putting the test link back closes
         sales instantly and breaks nothing: outstanding orders keep working,
         because /api/verify asks Stripe about the session rather than
         anything stored here. */
      checkoutUrl: 'https://buy.stripe.com/3cI28te6d2XsgTh3FSbsc01'
    },
    {
      id: 'deluxe',
      code: '02',
      name: 'Deluxe Edition',
      price: 42,
      currency: 'USD',
      cta: 'Get the Deluxe Edition',
      recommended: true,
      status: 'available',
      checkoutUrl: null
    },
    {
      id: 'artifact',
      code: '03',
      name: 'Artifact Edition',
      price: 75,
      currency: 'USD',
      cta: 'Join the Artifact List',
      recommended: false,
      /* COMING-SOON IS A REAL STATE, NOT A DISABLED BUTTON. The Artifact is a
         physical, numbered object and the production run does not exist —
         merch.html says the same thing about the whole objects line in the
         site's own word, STANDBY. `start()` refuses this edition before it
         even looks at checkoutUrl, so filling in a URL here would still not
         open it; flip `status` to 'available' in the same edit. */
      status: 'coming-soon',
      checkoutUrl: null
    }
  ];

  var ALBUM = 'rise-up';

  /* ---- 2. THE METADATA CONTRACT ------------------------------------------

     PUBLISHED AS DATA, NOT PROSE, so the future backend and this file cannot
     disagree about spelling. Every key here has to survive the round trip:
     browser -> Stripe -> `checkout.session.completed` webhook -> fulfilment.
     Stripe metadata is a flat string map, so everything is a string.

         product_type   'album'          always, for this page
         album          'rise-up'        the release
         edition        'digital' | 'deluxe' | 'artifact'
         variant        physical only — colourway / pressing
         size           physical only — apparel size
         bundle         physical only — what is in the box

     APPAREL SIZE AND VARIANT MUST BE CHOSEN BEFORE CHECKOUT, IN OUR OWN UI,
     and passed through as metadata. Do NOT push that selection into Stripe
     Checkout. Two reasons, and the second is the one that bites:
       - Stripe's hosted page has no real variant picker. Modelling S/M/L/XL as
         separate Prices multiplies the Dashboard objects by the size count and
         every new colourway multiplies it again.
       - Payment Links (route (a) in STRIPE-SETUP.md) cannot receive arbitrary
         metadata from the client at all. A size chosen on OUR page is the only
         place the size can be captured on this host, which means the physical
         editions are the ones that actually force the backend decision. Said
         plainly there so the owner sees the cost before choosing. */
  var METADATA_KEYS = {
    productType: 'product_type',
    album: 'album',
    edition: 'edition',
    variant: 'variant',
    size: 'size',
    bundle: 'bundle'
  };

  /* The identifier analytics and metadata both carry. One function so a rename
     is one edit — `album:edition` reads in a funnel report without a lookup. */
  function productId(edition) {
    return ALBUM + ':' + edition.id;
  }

  function find(editionId) {
    for (var i = 0; i < EDITIONS.length; i++) {
      if (EDITIONS[i].id === editionId) return EDITIONS[i];
    }
    return null;
  }

  /* ---- 3. ANALYTICS SHIM -------------------------------------------------

     THERE IS NO ANALYTICS DEPENDENCY ON THIS SITE AND THIS FILE DOES NOT ADD
     ONE. No GA snippet, no Segment, no pixel, no <script> injected from here.
     What this is: the four event names the owner asked for, defined in one
     place with a settled payload shape, so that whenever a provider IS chosen
     the call sites do not have to be found and rewritten.

     It pushes to window.dataLayer ONLY IF THAT ARRAY ALREADY EXISTS — i.e. only
     if a tag manager has been installed by some other means. It never creates
     the array. Creating it is how a shim quietly becomes a dependency: GTM
     treats an existing dataLayer as its queue, and a page with a stub array and
     no container silently accumulates events forever.

     THE FOUR EVENTS:
       album_package_view      the editions section became visible
       album_package_selected  a visitor pressed an edition's button
       checkout_started        we are about to hand off to a payment provider
                               (NOT fired when checkoutUrl is null — nothing
                               started, and a funnel that counts a start with no
                               possible completion is worse than no funnel)
       purchase_completed      fired by purchase-success.html on return

     purchase_completed IS NOT PROOF OF PAYMENT and must never be treated as
     such. It is a page view on a URL anyone can type. The authority is the
     `checkout.session.completed` webhook — see §5. */
  /* Declared before track() uses it. `var` would hoist either way, but the
     reading order is the point — a reader should not have to trust hoisting to
     know this is defined. */
  var DEBUG = (function () {
    try { return window.location.search.indexOf('ks-debug') !== -1; }
    catch (e) { return false; }
  })();

  function track(eventName, payload) {
    try {
      var data = payload || {};
      var event = {
        event: eventName,
        product_type: 'album',
        album: ALBUM
      };
      for (var k in data) {
        if (Object.prototype.hasOwnProperty.call(data, k)) event[k] = data[k];
      }

      if (window.dataLayer && typeof window.dataLayer.push === 'function') {
        window.dataLayer.push(event);
      }

      /* Visible on demand without shipping a vendor: append ?ks-debug to the
         URL and the events print. Off by default — a console.log per event on a
         live page is noise, and this is the same opt-in shape /?tune uses. */
      if (DEBUG && window.console && console.log) {
        console.log('[KSPurchase]', eventName, event);
      }
      return event;
    } catch (err) {
      /* Analytics must never be able to break a purchase. Swallow and continue. */
      return null;
    }
  }

  /* Payload every event carries: which edition, what the visitor was shown, and
     the SKU-shaped id. `price` is the DISPLAYED price and is deliberately not
     called `revenue` — no money has moved at any of these four moments. */
  function payloadFor(edition, extra) {
    var p = {
      edition: edition.id,
      edition_code: edition.code,
      edition_name: edition.name,
      price: edition.price,
      currency: edition.currency,
      product_id: productId(edition)
    };
    if (extra) {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) p[k] = extra[k];
      }
    }
    return p;
  }

  /* ---- 4. start() --------------------------------------------------------

     THE ONE ENTRY POINT. Resolves the edition, fires analytics, and then does
     exactly one of three things — redirect, refuse politely, or refuse
     politely. It returns a result object in every branch and THROWS IN NONE:
     it is wired to a click handler, and an exception in a click handler leaves
     a pressed button looking like it did something.

     Result shape, so a caller can branch without string-matching a message:
         { ok: true,  reason: 'redirect',        edition: <obj>, url: <string> }
         { ok: false, reason: 'not-configured',  edition: <obj> }
         { ok: false, reason: 'coming-soon',     edition: <obj> }
         { ok: false, reason: 'unknown-edition', edition: null  }  */
  function start(editionId, sourceEl) {
    var edition = find(editionId);

    if (!edition) {
      /* An id that is not in EDITIONS is a markup bug, not a visitor problem —
         say so in the console where a developer will see it, and show the
         visitor nothing at all rather than a message about an edition that does
         not exist. */
      if (window.console && console.warn) {
        console.warn('[KSPurchase] no edition with id "' + editionId + '". ' +
                     'Check the data-ks-purchase attribute against KSPurchase.EDITIONS.');
      }
      return { ok: false, reason: 'unknown-edition', edition: null };
    }

    track('album_package_selected', payloadFor(edition));

    if (edition.status === 'coming-soon') {
      message(sourceEl, edition,
        edition.name + ' is not open yet. It is a numbered physical object and the run does not exist — ' +
        'the site will state a date when there is one, and nothing before then.');
      return { ok: false, reason: 'coming-soon', edition: edition };
    }

    if (!edition.checkoutUrl) {
      /* THE HONEST BRANCH, AND THE ONE THAT RUNS TODAY FOR ALL THREE EDITIONS.
         No fake spinner, no "redirecting...", no mailto fallback pretending to
         be a checkout. checkout_started is NOT fired here; see §3. */
      message(sourceEl, edition,
        'Purchasing is not open yet. ' + edition.name + ' is filed and priced, and the checkout behind this ' +
        'button has not been connected. Nothing has been charged and nothing has been sent.');
      return { ok: false, reason: 'not-configured', edition: edition };
    }

    /* THE FUTURE PATH. Reached only once a human puts a URL in the config.
       Two shapes are legitimate here and the code does not care which:
         (a) a Stripe Payment Link — https://buy.stripe.com/... — works on this
             host today, with the metadata limits documented in §2.
         (b) an endpoint on a serverless backend that creates a Checkout Session
             and 302s to it. Requires a host this project does not have yet.
       Either way it is a NAVIGATION, not a fetch: no key, no CORS, no SDK. */
    track('checkout_started', payloadFor(edition, { checkout_url_host: hostOf(edition.checkoutUrl) }));
    try {
      window.location.assign(edition.checkoutUrl);
      return { ok: true, reason: 'redirect', edition: edition, url: edition.checkoutUrl };
    } catch (err) {
      message(sourceEl, edition, 'The checkout could not be opened. Please try again, or write to kundalinispines@gmail.com.');
      return { ok: false, reason: 'redirect-failed', edition: edition };
    }
  }

  function hostOf(url) {
    try { return new URL(url, window.location.href).host; }
    catch (e) { return ''; }
  }

  /* ---- The in-page message ----------------------------------------------

     RESTRAINED AND BRANDED, NOT AN alert(). alert() is a browser chrome dialog
     with an OK button and it would be the single most off-brand thing on the
     site. This writes into a container the page can own, and only builds one if
     the page did not provide it.

     PREFERRED MARKUP, which purchase.html may supply per edition:
         <p data-ks-purchase-message="digital" role="status"></p>
     If that is absent, one is inserted after the button's nearest container.
     The inserted node carries .empty-state from css/components.css — the site's
     existing dashed-border "nothing filed here yet" treatment — so it reads as
     part of the page with no new CSS at all.

     role="status" not role="alert": this is not an error, and an alert role
     interrupts a screen reader mid-sentence. */
  function message(sourceEl, edition, text) {
    /* Exact edition first, then a single page-wide container with an empty
       value. Deliberately NOT a loose `[data-ks-purchase-message]` match: on a
       three-card page that would find the Digital card's node and print the
       Artifact's refusal into it, beside the wrong price. */
    var el = document.querySelector('[data-ks-purchase-message="' + edition.id + '"]') ||
             document.querySelector('[data-ks-purchase-message=""]');

    if (!el && sourceEl && sourceEl.parentNode) {
      el = document.createElement('p');
      el.className = 'empty-state ks-purchase-message';
      el.setAttribute('data-ks-purchase-message', edition.id);
      el.setAttribute('role', 'status');
      el.style.marginTop = 'var(--space-4)';
      el.style.fontSize = 'var(--fs-caption)';
      sourceEl.parentNode.insertBefore(el, sourceEl.nextSibling);
    }

    if (!el) {
      /* No button, no container — start() was called from the console or from a
         page with no purchase UI. Nothing to write to, and that is not an error. */
      return null;
    }

    el.textContent = text;
    el.hidden = false;

    /* THE BUTTON IS NEVER LEFT LOOKING BUSY. Nothing above sets a pending
       state, so there is nothing to unwind — but the aria-describedby link is
       set so a screen reader user who pressed the button hears the reason,
       which a sighted user gets from the text appearing beside it. */
    if (sourceEl) {
      var id = el.id || ('ks-purchase-msg-' + edition.id);
      el.id = id;
      sourceEl.setAttribute('aria-describedby', id);
      sourceEl.removeAttribute('aria-busy');
    }
    return el;
  }

  /* ---- 5. FULFILMENT — DOCUMENTED PLACEHOLDER INTERFACE ONLY -------------

     NONE OF THIS IS IMPLEMENTED HERE AND NONE OF IT CAN BE. Every step below
     runs on a server, because every step below either holds a secret or makes a
     decision that a visitor must not be able to make for themselves. This
     section exists so the shape is settled before anyone builds it, and so the
     next session does not have to re-derive it from the Stripe docs.

     THE AUTHORITY IS THE WEBHOOK, NOT THE RETURN URL.
     `checkout.session.completed`, delivered by Stripe to a server endpoint,
     with the signature verified against STRIPE_WEBHOOK_SECRET, is the only
     event that proves money moved. purchase-success.html is a page any visitor
     can navigate to by typing the URL; it can thank someone and it can fire an
     analytics event, and it must never be the thing that unlocks a file.

     THE STEPS THE WEBHOOK HANDLER WOULD DRIVE, in order:

       1. VERIFY the Stripe signature. Reject unsigned or mis-signed bodies
          before parsing them. A webhook endpoint without this is an open door
          that anyone who guesses the URL can post a fake purchase through.
       2. IDENTIFY THE EDITION from session.metadata.edition — which is why §2
          exists. Do not infer it from the amount paid; a discount code makes
          the amount ambiguous.
       3. RECORD THE CHECKOUT SESSION ID (session.id, `cs_...`) as the order's
          primary key, and treat it as the idempotency key. Stripe retries
          webhook deliveries; the second delivery must not issue a second
          download link or send a second email.
       4. RECORD THE CUSTOMER EMAIL (session.customer_details.email).
       5. DETERMINE THE ENTITLED CONTENT for that edition — which files, which
          formats, and for the physical editions, what has to be picked and
          shipped.
       6. ISSUE A SECURE, EXPIRING DOWNLOAD LINK. Signed URL with a short TTL
          (a pre-signed S3/R2/Cloudflare URL is the usual shape), bound to the
          Session ID, with a download-count cap.

          >> THE ALBUM ZIP URL MUST NEVER APPEAR IN PUBLIC HTML OR JS. <<

          Not in this file, not in purchase.html, not in a data-attribute, not
          in purchase-success.html, not committed anywhere in this repo. This
          repo is served in its entirety by GitHub Pages: anything committed
          here is public, and anything printed into a page is public the moment
          the page is fetched. A "secret" path under assets/ is not protection —
          it is a URL, and URLs get shared. If the files ever live in this repo
          at all, the purchase is decorative.
       7. TRIGGER THE CONFIRMATION EMAIL carrying that link (digital), or the
          order confirmation (physical). Sent from the server, after step 1
          verified the payment — never from the browser.

     NONE OF STEPS 1-7 EXIST. See "What is still outstanding" in
     STRIPE-SETUP.md, which is the list the owner actually has to work through.
     ---------------------------------------------------------------------- */

  /* ---- 6. BINDING --------------------------------------------------------

     THE MARKUP CONTRACT, AGREED WITH THE AGENT WHO WROTE purchase.html AND
     css/purchase.css AND RESTATED IN BOTH OF THOSE FILES. Read all three before
     renaming anything here; the CSS keys off two of these attributes directly.

       data-ks-edition="<id>"          on each <article> — the card
       data-ks-purchase="<id>"         on each real <button> — the CTA
       data-ks-price="<number>"        on the <span> holding the printed price
       data-ks-edition-state="..."     on the <article> — 'coming-soon' hides
                                       the CTA, via css/purchase.css
       data-ks-edition-status          on the card's status slot; hidden by
                                       css/purchase.css when :empty

     Plus two this file adds, both optional and both absent from purchase.html
     today:

       data-ks-purchase-message="<id>"  where start()'s explanation is written.
                                        Built on demand after the button if the
                                        page did not supply one.
       data-ks-purchase-section         the element whose visibility fires
                                        album_package_view. Falls back to the
                                        buttons' nearest <section>.

     THE STATUS ATTRIBUTES ARE VALUELESS IN purchase.html — it writes a bare
     `data-ks-edition-status`, not `data-ks-edition-status="artifact"`. That is
     the right call on its side (the slot is already inside the card that names
     the edition) and it is why syncStatus() below resolves the id by walking UP
     to the enclosing [data-ks-edition] rather than reading the attribute's
     value. It still accepts a value if one is ever written, so neither file has
     to change if the other does.

     WIRED ON DOMContentLoaded, and idempotently — bind() marks each element so
     that calling it twice (a future partial re-render) does not double-fire. */

  /* The card an element belongs to. closest() is guarded because this file runs
     on purchase-success.html too, where there are no cards at all. */
  function cardFor(el) {
    if (!el) return null;
    if (el.hasAttribute && el.hasAttribute('data-ks-edition')) return el;
    return (el.closest ? el.closest('[data-ks-edition]') : null);
  }

  function bindButtons(root) {
    var nodes = (root || document).querySelectorAll('[data-ks-purchase]');
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.getAttribute('data-ks-purchase-bound') === '1') return;
      el.setAttribute('data-ks-purchase-bound', '1');

      var id = el.getAttribute('data-ks-purchase');
      var edition = find(id);

      /* PRICE DRIFT GUARD. purchase.html renders its prices as static markup —
         deliberately, so the page is honest with JS off — and this file holds
         them as config. The two can disagree with nothing in the console to say
         so, and the analytics payload would then report a price the visitor
         never saw. THE PRICE ATTRIBUTE IS NOT ON THE BUTTON: it is on a <span>
         inside the card's price paragraph, so this looks inside the card rather
         than at the element it is binding. It only ever warns — rewriting the
         page's price from JS would show a different number to a visitor with JS
         disabled, which is worse than the drift. */
      var card = cardFor(el);
      var priceEl = card ? card.querySelector('[data-ks-price]') : null;
      if (edition && priceEl) {
        var shown = parseFloat(priceEl.getAttribute('data-ks-price'));
        if (!isNaN(shown) && shown !== edition.price && window.console && console.warn) {
          console.warn('[KSPurchase] price drift on "' + id + '": purchase.html shows ' + shown +
                       ', js/purchase-checkout.js EDITIONS says ' + edition.price +
                       '. Fix both in the same edit.');
        }
      }

      el.addEventListener('click', function (ev) {
        /* An <a href> that is also a purchase button would navigate AND call
           start(). Stop the navigation; start() decides where anyone goes. */
        if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
        start(id, el);
      });
    });
    return nodes.length;
  }

  /* THE STATIC HTML ALREADY RENDERS THE COMING-SOON STATE AS ITS DEFAULT, and
     that is the correct way round: purchase.html is honest with JavaScript
     switched off, so this function's job is to NOT BREAK IT, and to correct it
     only when the config disagrees with what is on the page.

     It therefore writes two things and invents neither:
       - data-ks-edition-state on the card. css/purchase.css hides the CTA while
         that reads 'coming-soon', so this is the lever that opens or closes a
         card's button.
       - `hidden` on the status slot, so the waiting copy disappears when the
         edition opens.

     IT DOES NOT EMPTY THE STATUS SLOT, even though css/purchase.css hides it
     when :empty and that is the route that file suggests. Emptying is one-way:
     the slot holds a real focusable "Join the Release List" link, and once its
     innerHTML is gone nothing can put it back if the config flips again in the
     same session. `hidden` is reversible and reaches the same rendered result.

     IT NEVER WRITES THE WAITING TEXT. If a config change ever closes an edition
     whose card shipped open, this hides the button and unhides an empty slot —
     which css/purchase.css then hides again for being :empty. The card goes
     quiet rather than announcing something nobody wrote. Writing copy from JS
     is the line this file does not cross; put the sentence in purchase.html. */
  function syncStatus(root) {
    var scope = root || document;
    var count = 0;

    Array.prototype.forEach.call(scope.querySelectorAll('[data-ks-edition]'), function (card) {
      var edition = find(card.getAttribute('data-ks-edition'));
      if (!edition) return;
      count++;

      var soon = (edition.status === 'coming-soon');

      if (soon) {
        card.setAttribute('data-ks-edition-state', 'coming-soon');
      } else {
        /* 'available', not attribute removal: css/purchase.css only tests for
           the 'coming-soon' value, but the attribute being present and explicit
           is what makes the card's state readable in devtools without knowing
           the CSS. */
        card.setAttribute('data-ks-edition-state', 'available');
      }

      var slot = card.querySelector('[data-ks-edition-status]');
      if (slot) slot.hidden = !soon;
    });

    /* A status slot outside any card — nothing writes this today, but the
       attribute is public API and a page may put one anywhere. Only the valued
       form can be resolved out here. */
    Array.prototype.forEach.call(scope.querySelectorAll('[data-ks-edition-status]'), function (slot) {
      if (cardFor(slot)) return;
      var edition = find(slot.getAttribute('data-ks-edition-status'));
      if (!edition) return;
      slot.hidden = (edition.status !== 'coming-soon');
    });

    return count;
  }

  /* THE GUARDED OBSERVER, same shape as the reveal observer in
     js/about-feature.js: if IntersectionObserver is missing, do the thing
     immediately rather than skipping it. A funnel that silently under-counts on
     old browsers is worse than one that counts a view on page load. */
  function watchSection() {
    var section = document.querySelector('[data-ks-purchase-section]');
    if (!section) {
      var first = document.querySelector('[data-ks-purchase]');
      section = first ? (first.closest ? first.closest('section') : null) : null;
    }
    if (!section) return false;

    var fire = function () {
      track('album_package_view', {
        editions: EDITIONS.map(function (e) { return e.id; }).join(','),
        product_id: ALBUM
      });
    };

    if (!('IntersectionObserver' in window)) { fire(); return true; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        /* ONCE PER PAGE LOAD. unobserve before firing, not after — a scroll
           that crosses the threshold twice in one frame would otherwise queue
           two entries and report two views of one section. */
        io.unobserve(entry.target);
        fire();
      });
    }, { threshold: 0.25 });

    io.observe(section);
    return true;
  }

  function init() {
    bindButtons(document);
    syncStatus(document);
    watchSection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    /* Already parsed — this file was loaded late or async. Run now, or nothing
       on the page is ever wired and there is no error to say why. */
    init();
  }

  /* ---- 7. PUBLIC API ----------------------------------------------------- */
  window.KSPurchase = {
    EDITIONS: EDITIONS,
    ALBUM: ALBUM,
    METADATA_KEYS: METADATA_KEYS,
    find: find,
    productId: productId,
    start: start,
    track: track,
    /* Exposed so purchase.html (or a future partial re-render) can re-run the
       binding without reloading the file. Both are idempotent. */
    bind: bindButtons,
    syncStatus: syncStatus,
    /* Whether ANY edition can currently be bought. Today: false, for all three.
       A page can ask this rather than reaching into EDITIONS itself. */
    isConfigured: function () {
      for (var i = 0; i < EDITIONS.length; i++) {
        if (EDITIONS[i].status === 'available' && EDITIONS[i].checkoutUrl) return true;
      }
      return false;
    }
  };
})();

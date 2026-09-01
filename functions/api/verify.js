/* ==========================================================================
   /api/verify — SERVER-SIDE STRIPE SESSION VERIFICATION. Aug 31 2026.

   The first server-side code in this repo. Everything else here is static
   HTML/CSS/JS served by Cloudflare Pages; this is a Pages Function, which
   Cloudflare compiles into a Worker at deploy time and routes at /api/verify.

   WHY THIS FILE HAS TO EXIST AT ALL. purchase-success.html is reached by a
   redirect from Stripe carrying `?session_id=cs_live_...`. That parameter is
   typed-in-able: anyone can put any string there, and the old page believed
   it (it revealed an order reference on any non-empty value — deliberately,
   and documented as such, because nothing was being delivered). The moment a
   download hangs off that page, believing the query string means giving the
   album away to anyone who guesses a URL shape. The ONLY authority on whether
   money changed hands is Stripe's API; reaching it needs a secret key; and a
   secret key cannot live in client JavaScript. Hence: a server.

   WHY NOT A STANDALONE WORKER ON api.kundalinispines.com. A Pages Function
   deploys with the site that already deploys, shares its custom domain (so no
   CORS, no preflight, no second origin to get wrong), and needs no second
   workflow, no second wrangler config and no second set of deploy secrets.
   The tradeoff is that it rides the same release as the site — a Function bug
   and a CSS bug are now the same rollback. Given this project releases by
   hand on the owner's word, that is acceptable and arguably desirable.

   WHY functions/ IS AT THE REPO ROOT AND NOT IN _site. Cloudflare's own
   words: "Make sure that the /functions directory is at the root of your
   Pages project (and not in the static root, such as /dist)." _site is this
   project's static root. Putting it there would publish this file's SOURCE at
   https://kundalinispines.com/functions/api/verify.js — readable by anyone —
   and the deploy workflow's leak guard would not catch it, because the guard
   blocks .md/.py/.sh and internal page patterns, not .js (js/ is public).
   Root placement means the allowlist never copies it and the guard never sees
   it, which is why neither of those needed changing. Do not "tidy" this into
   _site.

   THIS FILE IS DELIBERATELY SELF-CONTAINED, duplicating ~30 lines of Stripe
   and HMAC helpers with download.js. Shared code would have to live in a
   module, and EVERY .js under functions/ becomes a public route — a
   functions/lib/stripe.js would be served at /lib/stripe. Putting the shared
   module outside functions/ works but depends on the bundler resolving a path
   that leaves the Functions tree. Two self-contained files depend on nothing.
   The duplication is the cheaper mistake — the same call the two return pages
   make about their shared CSS block.
   ========================================================================== */

/* Checked at the top of every request rather than at module scope: a Pages
   Function module is evaluated once per isolate, so a throw up there produces
   a cold-start failure with no useful response body. */
const REQUIRED_ENV = ['STRIPE_SECRET_KEY', 'PRICE_ID_DIGITAL', 'DOWNLOAD_SIGNING_KEY'];

/* How long after the purchase the download stays reachable. The session id is
   a bearer token in this design — there are no accounts, so whoever holds the
   success URL holds the entitlement — and a window is the only thing bounding
   how long a shared URL keeps working without introducing storage. 72h is
   long enough for a buyer who bought on their phone and downloads on a laptop
   at the weekend, and short enough that a link posted publicly goes dead.
   Override with DOWNLOAD_WINDOW_HOURS. */
const DEFAULT_WINDOW_HOURS = 72;

/* The signed token's life. Short on purpose: it only has to survive the gap
   between this response rendering and the buyer pressing Download. The page
   re-verifies for free on reload, so there is no reason to mint a long one. */
const TOKEN_TTL_SECONDS = 900;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      /* A verification result is per-buyer and must never be held by
         Cloudflare's edge cache, a corporate proxy, or a shared browser in a
         way that could surface one buyer's email to the next visitor. */
      'cache-control': 'no-store, private',
      'referrer-policy': 'no-referrer'
    }
  });
}

/* base64url without padding — the token travels in a query string. */
function b64url(buf) {
  const arr = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64url(sig);
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const missing = REQUIRED_ENV.filter(function (k) { return !env[k]; });
  if (missing.length) {
    /* The names are safe to log — they are variable names, not values — but
       they are NOT returned to the browser: a public endpoint naming the
       secrets it wants is a map for whoever is probing it. The buyer gets a
       generic failure; the owner gets the detail in
       `wrangler pages deployment tail`. */
    console.error('Misconfigured: missing env ' + missing.join(', '));
    return json({ ok: false, error: 'server_misconfigured' }, 500);
  }

  const sessionId = new URL(request.url).searchParams.get('session_id');

  /* Shape check before spending a Stripe API call. Real Checkout Session ids
     are `cs_test_…` / `cs_live_…`. This is a cheap filter against junk, not a
     security control — the security control is Stripe's answer below. */
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return json({ ok: false, error: 'missing_session' }, 400);
  }

  let session;
  try {
    const res = await fetch(
      'https://api.stripe.com/v1/checkout/sessions/' +
        encodeURIComponent(sessionId) + '?expand[]=line_items',
      { headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY } }
    );

    /* 404 is the ordinary case for a fabricated id, and it is not a fault on
       our side — it is the system working. Anything else from Stripe (429,
       5xx) is transient and the page should offer a retry, so the two are
       reported differently and the page renders different copy for each. */
    if (res.status === 404) return json({ ok: false, error: 'not_found' }, 404);
    if (!res.ok) {
      console.error('Stripe returned ' + res.status + ' for ' + sessionId);
      return json({ ok: false, error: 'upstream' }, 502);
    }
    session = await res.json();
  } catch (err) {
    console.error('Stripe fetch threw: ' + (err && err.message));
    return json({ ok: false, error: 'upstream' }, 502);
  }

  /* BOTH CHECKS, NOT EITHER. `status` is the session's lifecycle (open /
     complete / expired); `payment_status` is whether money actually settled.
     A session can read `complete` while `payment_status` is still `unpaid`
     when the payment method settles asynchronously. Only paid-and-complete
     unlocks a file. */
  if (session.status !== 'complete' || session.payment_status !== 'paid') {
    return json(
      { ok: false, error: session.status === 'expired' ? 'expired' : 'unpaid' },
      402
    );
  }

  /* IS THIS SESSION FOR THE DIGITAL ALBUM? Without this check any paid
     session on the account unlocks the album — a $42 Deluxe order, a future
     $5 sticker, anything. "The session is paid" and "the session is paid FOR
     THIS" are different questions and only the second one matters here. */
  const items = (session.line_items && session.line_items.data) || [];
  const isAlbum = items.some(function (li) {
    return li.price && li.price.id === env.PRICE_ID_DIGITAL;
  });
  if (!isAlbum) return json({ ok: false, error: 'wrong_product' }, 403);

  /* The window, measured from Stripe's own `created` (unix seconds) and never
     from the client's clock. */
  const windowHours = Number(env.DOWNLOAD_WINDOW_HOURS) || DEFAULT_WINDOW_HOURS;
  const expiresAt = (session.created + windowHours * 3600) * 1000;
  if (Date.now() > expiresAt) return json({ ok: false, error: 'window_closed' }, 410);

  /* The download token binds the session id and an expiry under an HMAC, so
     /api/download does not have to trust anything the browser hands it.
     THIS DOES NOT STOP A DETERMINED SHARER — whoever holds the session id can
     come back here and mint a fresh token. What it stops is the DOWNLOAD URL
     being a durable, postable link. The window above is what bounds the
     session id itself. Both are partial, and STRIPE-SETUP.md says so plainly
     rather than letting the next reader assume otherwise. */
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = sessionId + '.' + exp;
  const token = payload + '.' + (await sign(payload, env.DOWNLOAD_SIGNING_KEY));

  /* WHAT LEAVES THIS FUNCTION IS WHAT THE PAGE RENDERS, AND NOTHING MORE.
     Stripe's session object carries the whole customer_details block — name,
     address, phone, tax ids — plus payment intent ids and amounts. The page
     shows an email and an order reference, so an email and an order reference
     are what leave. Do not widen this because the data "is already there": it
     is already there on the server, which is the entire point of the server. */
  return json({
    ok: true,
    email: (session.customer_details && session.customer_details.email) || null,
    reference: session.id,
    token: token,
    expiresAt: expiresAt
  });
}

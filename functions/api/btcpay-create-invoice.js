/* ==========================================================================
   /api/btcpay-create-invoice — THE BITCOIN CHECKOUT'S ONLY ENTRY POINT.
   Sept 8 2026.

   WHAT THIS IS. The Stripe path hands a buyer to a Payment Link, a URL that
   already knows the price. BTCPay Server has no such thing for a plain invoice:
   somebody has to POST to the Greenfield API with an API key and an amount,
   and that somebody cannot be the browser. So this function is the one place
   the Bitcoin price is decided, the one place the API key is used to create
   an invoice, and the one thing the purchase page talks to before it
   navigates to https://pay.kundalinispines.com.

   THE BROWSER SENDS TWO THINGS AND NEITHER IS TRUSTED. A product id, which is
   looked up in CATALOG below and rejected if absent, and an email address,
   which is where the download link will be sent by /api/btcpay-webhook when
   the invoice settles. The amount, the currency, the redirect URL, the store
   id and the order reference are all decided here. A request that carries an
   `amount` or a `price` field is not honoured and not even read — the body is
   parsed for exactly two keys and everything else is ignored, so there is no
   field a tampered client could put a discount in.

   THE ORDER RECORD IS WRITTEN HERE, BEFORE THE INVOICE EXISTS, and it is the
   expectation every later stage checks the invoice against: the webhook, the
   verify endpoint and the download gate all compare BTCPay's answer to what
   THIS function wrote. That is why the catalog lives in one file rather than
   four — the other three read the record, not a second copy of the price.
   The record goes in first so a KV failure costs nothing (no invoice was
   created) and an invoice-creation failure leaves a record with no invoice,
   which every reader treats as "no order" rather than as a paid one.

   THE KEY IS DELIBERATELY WEAK. `btcpay.store.cancreateinvoice` and
   `btcpay.store.canviewinvoices`, nothing else — it can raise an invoice and
   read one back. It cannot touch the wallet, cannot pay out, cannot mark an
   invoice settled, cannot modify the store and cannot manage the server. If
   this key leaked, the worst outcome is spam invoices in the owner's store.
   Do not widen it for convenience.

   WHAT NEVER LEAVES THIS FUNCTION: the Authorization header, any environment
   value, BTCPay's error bodies, the buyer's email. The browser gets a checkout
   link and an order reference. The log gets status codes and the reference.

   SELF-CONTAINED, LIKE verify.js AND download.js, for the reason their
   banners give: every .js under functions/ is a public route, so a shared
   module would be served to the world. Helpers are duplicated on purpose.

   SAME-ORIGIN BY CONSTRUCTION, NOT BY CORS. There is no Access-Control-*
   header here because nothing cross-origin is ever meant to call this. A
   request whose Origin is not this deployment's own origin is refused before
   its body is read.
   ========================================================================== */

const REQUIRED_ENV = ['BTCPAY_BASE_URL', 'BTCPAY_STORE_ID', 'BTCPAY_API_KEY'];

/* THE SERVER-SIDE PRODUCT ALLOWLIST. One entry until the owner opens more.
   `amount` is a STRING because that is what the Greenfield API takes and
   returns — a decimal string, never a float — and comparing "20.00" to
   "20.00" avoids ever asking whether 20 === 20.0 in someone's runtime.

   THE PRICE IS $20 AND THAT IS THE OWNER'S NUMBER, set Aug 27 2026 (see the
   EDITIONS note in js/purchase-checkout.js, which also lists the files the
   price lives in: purchase.html, merch.html, STRIPE-SETUP.md and that config).
   This file is now a fifth. There is deliberately NO environment override for
   it: an override would be a sixth place for the number to drift, and the
   "271 MB" lesson in V2HANDOFF 59 is that every unguarded copy of a number
   eventually goes stale. A test purchase does not need a lower price either —
   a Bitcoin payment to the owner's own wallet costs only the network fee.

   `itemCode` is the metadata SKU the rest of the site already uses
   (productId() in js/purchase-checkout.js builds `rise-up:digital`); it rides
   on the invoice so the BTCPay dashboard shows what was bought, and the
   webhook checks it came back unchanged. */
const CATALOG = {
  digital: {
    itemCode: 'rise-up:digital',
    itemDesc: 'Rise Up — Digital Album (Kundalini Spines)',
    amount: '20.00',
    currency: 'USD'
  }
};

/* Same constant as stripe-webhook.js and for the same reason: the site
   answers on two hosts and the redirect BTCPay performs must land on the
   canonical one. Override with SITE_ORIGIN. */
const DEFAULT_SITE_ORIGIN = 'https://kundalinispines.com';

/* Bodies are `{"product":"digital","email":"…"}`. 2 KB is forty times that.
   Anything larger is not this form. */
const MAX_BODY_BYTES = 2048;

/* Abuse ceiling: invoice creations per client per window. Each create spends
   a Greenfield call and leaves an invoice in the owner's store, so a script
   hammering this endpoint is a nuisance even with a weak key. The counter
   lives in KV, which is eventually consistent — this is a soft ceiling that
   catches a loop, not a hard one that survives a distributed attempt. It is
   what Pages Functions can do without a paid rate-limiting product, and it is
   documented as such in BTCPAY-SETUP.md. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 600;

/* Greenfield is on a home connection through a tunnel. Fifteen seconds is
   long enough for a cold invoice on a Pi and short enough that a dead tunnel
   fails the buyer with a message instead of a hang. */
const UPSTREAM_TIMEOUT_MS = 15000;

/* RFC 5322 is not the test. This admits what a mail server would deliver to
   and refuses what would break a JSON body or an email header: no whitespace,
   no control characters, one @, a dot after it. Resend does its own
   validation when the mail is sent. */
const EMAIL_RE = /^[^\s@\x00-\x1f\x7f]{1,64}@[^\s@\x00-\x1f\x7f]{1,189}\.[A-Za-z0-9-]{2,63}$/;
const MAX_EMAIL_LENGTH = 254;

const ORDER_PREFIX = 'ksbtc_';

function json(body, status, extraHeaders) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    /* Never cacheable: every answer is one buyer's invoice. */
    'cache-control': 'no-store, private',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff'
  };
  if (extraHeaders) {
    for (const k in extraHeaders) headers[k] = extraHeaders[k];
  }
  return new Response(JSON.stringify(body), { status: status || 200, headers: headers });
}

function hex(buf) {
  const arr = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < arr.length; i++) s += arr[i].toString(16).padStart(2, '0');
  return s;
}

/* 128 random bits, hex. The reference is the buyer's route back to their
   files (it rides in the redirect URL and the email), so it has to be
   unguessable in the way a Stripe session id is. The prefix keeps it from
   ever matching the `cs_` pattern download.js uses for Stripe references, so
   the two order spaces cannot be confused by any regex in this repo. */
function newOrderId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return ORDER_PREFIX + hex(bytes);
}

/* The rate-limit key is a hash of the client IP, not the IP — a KV namespace
   full of visitor addresses is a record nobody asked this site to keep. */
async function clientKey(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return 'btcpay:rl:' + hex(digest).slice(0, 32);
}

/* The base URL is configuration, and configuration can carry a trailing
   slash or a path. Normalise once so every URL below is built the same way. */
function baseOrigin(raw) {
  try {
    const u = new URL(String(raw));
    if (u.protocol !== 'https:') return null;
    return u.origin;
  } catch (err) {
    return null;
  }
}

async function handleCreate(context) {
  const { request, env } = context;

  const missing = REQUIRED_ENV.filter(function (k) { return !env[k]; });
  if (missing.length) {
    /* Names only, and only to the log — a public endpoint that names the
       secrets it is missing is a map for whoever is probing it. */
    console.error('Misconfigured: missing env ' + missing.join(', '));
    return json({ ok: false, error: 'server_misconfigured' }, 500);
  }
  if (!env.ORDERS) {
    console.error('Misconfigured: KV binding ORDERS is not bound');
    return json({ ok: false, error: 'server_misconfigured' }, 500);
  }
  const btcpayOrigin = baseOrigin(env.BTCPAY_BASE_URL);
  if (!btcpayOrigin) {
    console.error('Misconfigured: BTCPAY_BASE_URL is not an https URL');
    return json({ ok: false, error: 'server_misconfigured' }, 500);
  }

  /* ---- 1. Is this our own page talking? ---------------------------------
     Browsers send Origin on every cross-site and same-site POST made by
     fetch(), and a missing Origin on a POST means a non-browser client. Both
     are refused. The comparison is against the origin THIS request arrived
     on, so the check is correct on kundalinispines.com, on the pages.dev
     host and on a local serve.py without a list of hosts to maintain. */
  const selfOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (!origin || origin !== selfOrigin) {
    return json({ ok: false, error: 'bad_origin' }, 403);
  }
  /* Belt and braces where the browser supplies it (every current engine
     does): a same-origin fetch reports `same-origin`. `none` is a typed URL
     or bookmark, which cannot be a POST from our form. */
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin') {
    return json({ ok: false, error: 'bad_origin' }, 403);
  }

  /* ---- 2. Is it the shape of a request from our form? ------------------- */
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  if (contentType.indexOf('application/json') !== 0) {
    return json({ ok: false, error: 'unsupported_media' }, 415);
  }
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'too_large' }, 413);
  }

  let raw;
  try {
    raw = await request.text();
  } catch (err) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }
  /* Checked again after reading: content-length is a claim, the body is a
     fact. A chunked body carries no length at all. */
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, error: 'too_large' }, 413);
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch (err) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  /* ---- 3. The two fields, and only the two fields. ----------------------- */
  const productId = typeof body.product === 'string' ? body.product : '';
  const product = Object.prototype.hasOwnProperty.call(CATALOG, productId) ? CATALOG[productId] : null;
  if (!product) {
    return json({ ok: false, error: 'bad_product' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'bad_email' }, 400);
  }

  /* ---- 4. The abuse ceiling. -------------------------------------------- */
  try {
    const rlKey = await clientKey(request);
    const count = Number(await env.ORDERS.get(rlKey)) || 0;
    if (count >= RATE_LIMIT_MAX) {
      return json({ ok: false, error: 'rate_limited' }, 429);
    }
    await env.ORDERS.put(rlKey, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
  } catch (err) {
    /* A KV hiccup must not stop a sale; the ceiling is a nuisance filter,
       not a security boundary. Logged so a persistent failure is visible. */
    console.error('Rate-limit KV error: ' + (err && err.message));
  }

  /* ---- 5. The order record, before the invoice. ------------------------- */
  const orderId = newOrderId();
  const now = new Date().toISOString();
  const siteOrigin = env.SITE_ORIGIN || DEFAULT_SITE_ORIGIN;
  const record = {
    reference: orderId,
    provider: 'btcpay',
    product: productId,
    itemCode: product.itemCode,
    amount: product.amount,
    currency: product.currency,
    email: email,
    storeId: env.BTCPAY_STORE_ID,
    invoiceId: null,
    invoiceCreatedTime: null,
    checkoutLink: null,
    status: 'creating',
    settledAt: null,
    expiresAt: null,
    emailedAt: null,
    recordedAt: now
  };
  try {
    await env.ORDERS.put('btcpay:order:' + orderId, JSON.stringify(record));
  } catch (err) {
    console.error('KV write threw for ' + orderId + ': ' + (err && err.message));
    return json({ ok: false, error: 'storage_error' }, 500);
  }

  /* ---- 6. Ask BTCPay for the invoice. ----------------------------------
     THE REDIRECT CARRIES OUR OWN REFERENCE, LITERALLY. The Greenfield schema
     offers `{InvoiceId}` and `{OrderId}` placeholders for redirectURL and
     they were read before this was written; neither is used, because the
     order id is already known here and a literal URL cannot be mis-expanded
     by a version that spells the placeholder differently. `redirectAutomatically`
     is set explicitly rather than inherited from the store, so a dashboard
     setting cannot silently strand a buyer on the BTCPay page after paying.

     `metadata` is where BTCPay lets a merchant stash anything. Four keys go
     on it and the webhook demands all four come back unchanged. `buyerEmail`
     is a well-known key BTCPay shows in its own invoice view, which is the
     owner's route to a buyer if every automated step fails. */
  const invoiceUrl = btcpayOrigin + '/api/v1/stores/' + encodeURIComponent(env.BTCPAY_STORE_ID) + '/invoices';
  const payload = {
    amount: product.amount,
    currency: product.currency,
    metadata: {
      orderId: orderId,
      itemCode: product.itemCode,
      itemDesc: product.itemDesc,
      buyerEmail: email,
      product: productId
    },
    checkout: {
      redirectURL: siteOrigin + '/purchase-success?order=' + encodeURIComponent(orderId),
      redirectAutomatically: true
    },
    additionalSearchTerms: [orderId]
  };

  let invoice;
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(invoiceUrl, {
      method: 'POST',
      headers: {
        Authorization: 'token ' + env.BTCPAY_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!res.ok) {
      /* Status only. BTCPay's error body can echo the request, and the
         request carried the buyer's email. */
      console.error('BTCPay create returned ' + res.status + ' for ' + orderId);
      return json({ ok: false, error: 'upstream' }, 502);
    }
    invoice = await res.json();
  } catch (err) {
    console.error('BTCPay create threw for ' + orderId + ': ' + (err && err.name === 'AbortError' ? 'timeout' : (err && err.message)));
    return json({ ok: false, error: 'upstream' }, 502);
  } finally {
    clearTimeout(timer);
  }

  /* ---- 7. Believe the answer only if it is the invoice we asked for. ----
     A checkout link that does not point at OUR BTCPay host is not followed —
     the browser is about to navigate a paying customer to whatever this
     returns, and the one thing a compromised upstream must not be able to do
     is send them somewhere else. The same applies to the store and amount:
     an invoice for the wrong store or the wrong price is refused here rather
     than caught later by the webhook, because "later" is after the buyer has
     paid it. */
  const invoiceId = invoice && typeof invoice.id === 'string' ? invoice.id : '';
  const checkoutLink = invoice && typeof invoice.checkoutLink === 'string' ? invoice.checkoutLink : '';
  let linkOk = false;
  try {
    const u = new URL(checkoutLink);
    linkOk = u.origin === btcpayOrigin;
  } catch (err) {
    linkOk = false;
  }
  if (
    !/^[A-Za-z0-9_-]{6,64}$/.test(invoiceId) ||
    !linkOk ||
    invoice.storeId !== env.BTCPAY_STORE_ID ||
    Number(invoice.amount) !== Number(product.amount) ||
    String(invoice.currency).toUpperCase() !== product.currency
  ) {
    console.error('BTCPay returned an invoice that does not match the request for ' + orderId);
    return json({ ok: false, error: 'upstream' }, 502);
  }

  /* ---- 8. Attach the invoice to the record. -----------------------------
     If this write fails the invoice exists and the record does not know its
     id. The webhook repairs that case: it looks the record up by the orderId
     BTCPay echoes back in metadata and fills the id in. The buyer gets a
     working checkout either way, which is the right direction to fail in. */
  record.invoiceId = invoiceId;
  record.invoiceCreatedTime = typeof invoice.createdTime === 'number' ? invoice.createdTime : null;
  record.checkoutLink = checkoutLink;
  record.status = 'created';
  try {
    await env.ORDERS.put('btcpay:order:' + orderId, JSON.stringify(record));
  } catch (err) {
    console.error('KV invoice-id write failed for ' + orderId + ': ' + (err && err.message));
  }

  /* The minimum the page needs: where to go, and what to quote if it goes
     wrong. Nothing about the invoice's payment methods, addresses or amounts
     in BTC — the BTCPay checkout page shows the buyer all of that itself. */
  return json({ ok: true, checkoutLink: checkoutLink, reference: orderId });
}

/* ONE EXPORT, DISPATCHING ON METHOD ITSELF. Pages lets a file export both
   `onRequest` and `onRequestPost`, and which one wins for a POST is a detail
   of the router this repo has no way to test without wrangler. Exporting only
   `onRequest` removes the question: every method arrives here, POST goes to
   the handler, everything else gets one refusal, so a probe learns nothing
   from the difference between "wrong method" and "not found". */
export async function onRequest(context) {
  if (context.request.method === 'POST') return handleCreate(context);
  return json({ ok: false, error: 'method_not_allowed' }, 405, { allow: 'POST' });
}

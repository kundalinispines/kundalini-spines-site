/* ==========================================================================
   /api/btcpay-verify — WHAT THE SUCCESS PAGE ASKS ABOUT A BITCOIN ORDER.
   Sept 8 2026.

   The Bitcoin twin of /api/verify. purchase-success.html is reached from
   BTCPay carrying `?order=ksbtc_…`, which is a typed-in-able string like the
   Stripe session id, so the page asks this function rather than believing
   it. The difference from Stripe is that a Bitcoin invoice has MORE states
   worth telling a buyer about: an unpaid invoice they closed, a payment seen
   on the network but not yet confirmed, an invoice that expired at the
   fifteen-minute mark, one BTCPay marked invalid. The page shows each of
   those honestly and polls while one can still change.

   WHAT IT RETURNS, BY STATE:
     settled     ok:true  — reference, the email the link went to, a signed
                            download token, the deadline, and whether the
                            confirmation email is known to have gone out.
     pending     ok:false, error:'pending', state:'new'|'processing'. For a
                            `new` invoice that has not expired, the checkout
                            link too, so the buyer who closed BTCPay can go
                            back to the same invoice instead of raising a
                            second one.
     expired / invalid / not_found / mismatch / window_closed — ok:false with
                            that error, and nothing else.

   THE TOKEN IS THE SAME TOKEN /api/verify MINTS, signed with the same key,
   with the order reference where the session id would be. download.js
   accepts both shapes and re-verifies each against its own authority — for
   this one, BTCPay's API through the store-scoped read, checked against the
   order record. Nothing here is a bearer for the file on its own.

   NEVER RETURNED: the API key, the store id, the invoice's payment methods
   or addresses, amounts in BTC, anything about the buyer beyond the email
   the page prints to say where the receipt went.
   ========================================================================== */

const REQUIRED_ENV = ['BTCPAY_BASE_URL', 'BTCPAY_STORE_ID', 'BTCPAY_API_KEY', 'DOWNLOAD_SIGNING_KEY'];

/* MUST MATCH download.js and btcpay-webhook.js. */
const DEFAULT_WINDOW_HOURS = 72;

/* Same lifetime as /api/verify's token, for the same reason. */
const TOKEN_TTL_SECONDS = 900;

const UPSTREAM_TIMEOUT_MS = 15000;

const ORDER_RE = /^ksbtc_[0-9a-f]{32}$/;

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, private',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff'
    }
  });
}

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

function baseOrigin(raw) {
  try {
    const u = new URL(String(raw));
    if (u.protocol !== 'https:') return null;
    return u.origin;
  } catch (err) {
    return null;
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const missing = REQUIRED_ENV.filter(function (k) { return !env[k]; });
  if (missing.length) {
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

  const orderId = new URL(request.url).searchParams.get('order');
  if (!orderId || !ORDER_RE.test(orderId)) {
    return json({ ok: false, error: 'missing_session' }, 400);
  }

  /* ---- 1. The record our own create endpoint wrote. --------------------- */
  let record = null;
  try {
    record = await env.ORDERS.get('btcpay:order:' + orderId, { type: 'json' });
  } catch (err) {
    console.error('KV read threw for ' + orderId + ': ' + (err && err.message));
    return json({ ok: false, error: 'upstream' }, 502);
  }
  if (!record) {
    return json({ ok: false, error: 'not_found' }, 404);
  }
  if (!record.invoiceId) {
    /* The record exists and no invoice was ever attached: creation failed
       after the record went in, or the attach-write failed and the webhook
       has not yet repaired it. Told as pending rather than as a failure,
       because if the buyer paid, the webhook will fill this in within
       minutes, and if they did not there is nothing to see anyway. */
    return json({ ok: false, error: 'pending', state: 'new' }, 402);
  }

  /* ---- 2. Ask BTCPay. --------------------------------------------------- */
  let invoice;
  const url = btcpayOrigin + '/api/v1/stores/' + encodeURIComponent(env.BTCPAY_STORE_ID) +
    '/invoices/' + encodeURIComponent(record.invoiceId);
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Authorization: 'token ' + env.BTCPAY_API_KEY, accept: 'application/json' },
      signal: controller.signal
    });
    if (res.status === 404) return json({ ok: false, error: 'not_found' }, 404);
    if (!res.ok) {
      console.error('BTCPay returned ' + res.status + ' for ' + orderId);
      return json({ ok: false, error: 'upstream' }, 502);
    }
    invoice = await res.json();
  } catch (err) {
    console.error('BTCPay fetch threw: ' + (err && err.name === 'AbortError' ? 'timeout' : (err && err.message)));
    return json({ ok: false, error: 'upstream' }, 502);
  } finally {
    clearTimeout(timer);
  }

  /* ---- 3. The states a buyer can be told about. -------------------------
     Greenfield's InvoiceStatus is exactly New, Processing, Expired, Invalid,
     Settled (schema read Sept 8 2026). Anything else is a version this code
     has not met and is reported as pending, which is the state that keeps
     the page polling rather than the one that closes a door. */
  const status = invoice && typeof invoice.status === 'string' ? invoice.status : '';
  if (status === 'Expired') return json({ ok: false, error: 'expired' }, 410);
  if (status === 'Invalid') return json({ ok: false, error: 'invalid' }, 403);
  if (status !== 'Settled') {
    const out = { ok: false, error: 'pending', state: status === 'Processing' ? 'processing' : 'new' };
    /* Only for an invoice that can still be paid, and only the link we
       ourselves stored at creation — never a URL read back from the API. */
    if (status === 'New' && record.checkoutLink) out.checkoutLink = record.checkoutLink;
    return json(out, 402);
  }

  /* ---- 4. Settled — but for what we sold? ------------------------------- */
  const meta = invoice.metadata || {};
  const matches =
    invoice.id === record.invoiceId &&
    invoice.storeId === env.BTCPAY_STORE_ID &&
    invoice.type !== 'TopUp' &&
    Number(invoice.amount) === Number(record.amount) &&
    String(invoice.currency).toUpperCase() === String(record.currency).toUpperCase() &&
    meta.orderId === orderId &&
    meta.itemCode === record.itemCode &&
    meta.buyerEmail === record.email;
  if (!matches) {
    console.error('Settled invoice does not match its order record: ' + orderId);
    return json({ ok: false, error: 'wrong_product' }, 403);
  }

  /* The window, from BTCPay's own createdTime — the same field the webhook
     used for the deadline in the email, so the two agree. */
  const windowHours = Number(env.DOWNLOAD_WINDOW_HOURS) || DEFAULT_WINDOW_HOURS;
  const createdTime = typeof invoice.createdTime === 'number' ? invoice.createdTime : record.invoiceCreatedTime;
  if (typeof createdTime !== 'number') {
    console.error('No createdTime on settled invoice for ' + orderId);
    return json({ ok: false, error: 'upstream' }, 502);
  }
  const expiresAt = (createdTime + windowHours * 3600) * 1000;
  if (Date.now() > expiresAt) return json({ ok: false, error: 'window_closed' }, 410);

  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = orderId + '.' + exp;
  const token = payload + '.' + (await sign(payload, env.DOWNLOAD_SIGNING_KEY));

  return json({
    ok: true,
    state: 'settled',
    email: record.email,
    reference: orderId,
    token: token,
    expiresAt: expiresAt,
    emailed: !!record.emailedAt
  });
}

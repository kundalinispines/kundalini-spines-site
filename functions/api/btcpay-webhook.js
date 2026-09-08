/* ==========================================================================
   /api/btcpay-webhook — THE AUTHORITY ON WHETHER BITCOIN ARRIVED.
   Sept 8 2026.

   Sibling of /api/stripe-webhook, and it makes the same three decisions in
   the same order: verify the signature on the raw bytes before parsing,
   refuse to act twice on one order, and re-ask the payment system what the
   invoice actually is rather than believing the body of a POST to a public
   URL. Read that file's banner first; what follows is only what is different
   about BTCPay.

   THE EVENT THAT MATTERS IS `InvoiceSettled`. The Greenfield webhook schema
   (read Sept 8 2026 from the official template) lists InvoiceCreated,
   InvoiceReceivedPayment, InvoiceProcessing, InvoiceExpired, InvoiceSettled,
   InvoiceInvalid and InvoicePaymentSettled. Only Settled means the store's
   own confirmation policy is satisfied. `Processing` is money seen but not
   confirmed; `ReceivedPayment` can be a partial payment; `PaymentSettled` is
   ONE payment confirming, which for a partially-paid invoice is not the
   invoice settling. Fulfilling on any of those would hand out an album for
   an amount that may never complete. Expired and Invalid are noted on the
   order record for the owner's benefit and nothing is sent.

   THE SIGNATURE. BTCPay sends `BTCPay-Sig: sha256=<hex>` where the hex is
   HMAC-SHA256(secret, raw body) — the GitHub pattern, no timestamp in the
   signed payload. Because there is no timestamp there is no tolerance window,
   so replay protection is entirely the idempotency record: a captured
   delivery re-posted later verifies correctly and then finds the order
   already fulfilled. That is the documented shape and it is sufficient — a
   replay can only cause the thing that already happened.

   SETTLED-BY-HAND IS HONOURED, AND RECORDED. An invoice the owner marks
   settled in the BTCPay dashboard arrives here as InvoiceSettled with
   `manuallyMarked: true` and the API reports additionalStatus `Marked`. That
   is a deliberate act by the one person allowed to make it — the late-payment
   and paid-in-person cases — so it fulfils like any other, with the flag
   written to the record so the audit trail says a human did it.

   THE EMAIL IS THE SAME EMAIL stripe-webhook.js SENDS, with one clause
   changed: it says the BTCPay receipt does not carry the link, because that
   is the receipt this buyer has. The two builders are kept in step by hand;
   the file sizes and the window are the same numbers and must stay so. This
   duplication is the project's documented choice (see stripe-webhook.js) over
   a shared module the router would publish.

   THIS ENDPOINT IS PUBLIC AND UNAUTHENTICATED BY DESIGN — the Pi has to reach
   it without credentials. The signature check is the only gate. Nothing
   above it may be moved below it.
   ========================================================================== */

const REQUIRED_ENV = [
  'BTCPAY_WEBHOOK_SECRET',
  'BTCPAY_BASE_URL',
  'BTCPAY_STORE_ID',
  'BTCPAY_API_KEY',
  'RESEND_API_KEY'
];

/* MUST MATCH download.js, verify.js, stripe-webhook.js and btcpay-verify.js.
   The email promises a deadline; the download gate enforces one; they are
   the same formula from the same field or the promise is false. */
const DEFAULT_WINDOW_HOURS = 72;

const DEFAULT_SITE_ORIGIN = 'https://kundalinispines.com';
const DEFAULT_FROM = 'Kundalini Spines <orders@kundalinispines.com>';
const DEFAULT_REPLY_TO = 'kundalinispines@gmail.com';

/* A settled-invoice delivery is a few hundred bytes. 64 KB is generous and
   still refuses to HMAC a multi-megabyte body someone posts for sport. */
const MAX_BODY_BYTES = 65536;

const UPSTREAM_TIMEOUT_MS = 15000;

const ORDER_RE = /^ksbtc_[0-9a-f]{32}$/;
const INVOICE_RE = /^[A-Za-z0-9_-]{6,64}$/;

function hex(buf) {
  const arr = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < arr.length; i++) s += arr[i].toString(16).padStart(2, '0');
  return s;
}

async function hmacHex(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return hex(sig);
}

/* Same shape as the other three. Fixed-length hex on both sides, no early
   exit. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* `sha256=abcdef…`. Lower-cased before comparison because the digest is hex
   and BTCPay's casing is not something to depend on. */
function parseSignatureHeader(header) {
  if (typeof header !== 'string') return null;
  const m = /^\s*sha256=([0-9a-fA-F]{64})\s*$/.exec(header);
  return m ? m[1].toLowerCase() : null;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatUtc(ms) {
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear() +
    ', ' + hh + ':' + mm + ' UTC';
}

function buildEmail(opts) {
  const url = opts.siteOrigin + '/purchase-success?order=' + encodeURIComponent(opts.reference);
  const deadline = formatUtc(opts.expiresAt);

  const text = [
    'Your copy of Rise Up is ready.',
    '',
    'Download it here:',
    url,
    '',
    'This link is the only route back to your files. The BTCPay receipt does',
    'not contain it, so keep this email until you have the album saved.',
    '',
    'The link stays open until ' + deadline + '.',
    '',
    'Order reference: ' + opts.reference,
    '',
    'Two files are waiting: MP3 (about 373 MB) for listening, and WAV masters',
    '(about 1.4 GB). Both are yours — they are the same album, and the deluxe',
    'digital booklet is packed inside each one.',
    '',
    'If the link stops working before you have the files, reply to this email',
    'quoting the order reference above and it will be reissued.',
    '',
    'Kundalini Spines',
    opts.siteOrigin
  ].join('\n');

  const html = [
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:520px;margin:0 auto;padding:24px;">',
    '<p style="margin:0 0 20px;font-size:18px;font-weight:bold;">Your copy of Rise Up is ready.</p>',
    '<p style="margin:0 0 20px;"><a href="' + escapeHtml(url) + '" style="background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 22px;display:inline-block;border-radius:2px;font-weight:bold;">Download the album</a></p>',
    '<p style="margin:0 0 20px;"><strong>This link is the only route back to your files.</strong> The BTCPay receipt does not contain it, so keep this email until you have the album saved.</p>',
    '<p style="margin:0 0 20px;">The link stays open until <strong>' + escapeHtml(deadline) + '</strong>.</p>',
    '<p style="margin:0 0 20px;">Two files are waiting: <strong>MP3</strong> (about 373&nbsp;MB) for listening, and <strong>WAV masters</strong> (about 1.4&nbsp;GB). Both are yours &mdash; they are the same album, and the <strong>deluxe digital booklet</strong> is packed inside each one.</p>',
    '<p style="margin:0 0 20px;color:#555;font-size:13px;">Order reference: <span style="font-family:monospace;">' + escapeHtml(opts.reference) + '</span></p>',
    '<p style="margin:0 0 20px;color:#555;font-size:13px;">If the link stops working before you have the files, reply to this email quoting the order reference and it will be reissued.</p>',
    '<p style="margin:0;color:#555;font-size:13px;">Kundalini Spines<br><a href="' + escapeHtml(opts.siteOrigin) + '" style="color:#555;">' + escapeHtml(opts.siteOrigin) + '</a></p>',
    '</div>'
  ].join('');

  return { text: text, html: html, url: url };
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

/* Store-scoped path, deliberately. Both `/api/v1/invoices/{id}` and
   `/api/v1/stores/{storeId}/invoices/{id}` answered on the live instance when
   probed (Sept 8 2026); the store-scoped one cannot return another store's
   invoice even before the storeId field is compared below. */
async function fetchInvoice(env, origin, invoiceId) {
  const url = origin + '/api/v1/stores/' + encodeURIComponent(env.BTCPAY_STORE_ID) +
    '/invoices/' + encodeURIComponent(invoiceId);
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Authorization: 'token ' + env.BTCPAY_API_KEY, accept: 'application/json' },
      signal: controller.signal
    });
    if (res.status === 404) return { status: 404, invoice: null };
    if (!res.ok) return { status: res.status, invoice: null };
    return { status: 200, invoice: await res.json() };
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const missing = REQUIRED_ENV.filter(function (k) { return !env[k]; });
  if (missing.length) {
    console.error('Misconfigured: missing env ' + missing.join(', '));
    /* 500, not 200: BTCPay redelivers failed webhooks (10 s, 1 min, then six
       more attempts ten minutes apart with automatic redelivery on), so a
       webhook that went live before its secrets did catches up rather than
       dropping an order on the floor. */
    return new Response('server_misconfigured', { status: 500 });
  }
  if (!env.ORDERS) {
    console.error('Misconfigured: KV binding ORDERS is not bound');
    return new Response('server_misconfigured', { status: 500 });
  }
  const btcpayOrigin = baseOrigin(env.BTCPAY_BASE_URL);
  if (!btcpayOrigin) {
    console.error('Misconfigured: BTCPAY_BASE_URL is not an https URL');
    return new Response('server_misconfigured', { status: 500 });
  }

  /* ---- 1. The signature, on the raw bytes, before anything else. -------- */
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return new Response('too_large', { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new Response('too_large', { status: 413 });
  }

  const given = parseSignatureHeader(request.headers.get('btcpay-sig'));
  if (!given) {
    return new Response('bad_signature', { status: 400 });
  }
  const expected = await hmacHex(raw, env.BTCPAY_WEBHOOK_SECRET);
  if (!safeEqual(given, expected)) {
    /* Logged without the body, for the reason stripe-webhook.js gives: the
       log must not become an injection surface for whoever is probing. */
    console.error('Rejected BTCPay webhook with invalid signature');
    return new Response('bad_signature', { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch (err) {
    return new Response('bad_payload', { status: 400 });
  }
  if (!event || typeof event !== 'object') {
    return new Response('bad_payload', { status: 400 });
  }

  /* ---- 2. Is it ours, and is it the event that means money? ------------- */
  if (event.storeId !== env.BTCPAY_STORE_ID) {
    /* Signed, so BTCPay sent it — but for a store this deployment does not
       serve. 200 so it is not redelivered; logged so a mis-pointed webhook is
       visible. */
    console.error('BTCPay webhook for a different store; ignored');
    return new Response('ignored', { status: 200 });
  }

  const invoiceId = typeof event.invoiceId === 'string' ? event.invoiceId : '';
  const orderId = event.metadata && typeof event.metadata.orderId === 'string' ? event.metadata.orderId : '';

  if (!INVOICE_RE.test(invoiceId) || !ORDER_RE.test(orderId)) {
    /* An invoice raised from the dashboard, or by anything other than
       /api/btcpay-create-invoice, has no ksbtc_ order id. Not ours to fulfil.
       200 so BTCPay stops asking. */
    return new Response('ignored', { status: 200 });
  }

  const key = 'btcpay:order:' + orderId;

  /* Expired and Invalid are recorded so the owner can see, in the same place
     the sale would have been, that it did not happen. Best-effort: a KV
     error here loses nothing but a note. */
  if (event.type === 'InvoiceExpired' || event.type === 'InvoiceInvalid') {
    try {
      const rec = await env.ORDERS.get(key, { type: 'json' });
      if (rec && !rec.settledAt) {
        rec.status = event.type === 'InvoiceExpired' ? 'expired' : 'invalid';
        rec.invoiceId = rec.invoiceId || invoiceId;
        await env.ORDERS.put(key, JSON.stringify(rec));
      }
    } catch (err) {
      console.error('KV note failed for ' + orderId + ': ' + (err && err.message));
    }
    return new Response('noted', { status: 200 });
  }

  if (event.type !== 'InvoiceSettled') {
    return new Response('ignored', { status: 200 });
  }

  /* ---- 3. Have we already fulfilled this order? ------------------------- */
  let record = null;
  try {
    record = await env.ORDERS.get(key, { type: 'json' });
  } catch (err) {
    console.error('KV read threw for ' + orderId + ': ' + (err && err.message));
    return new Response('storage_error', { status: 500 });
  }
  if (!record) {
    /* KV is eventually consistent and a Lightning payment can settle within
       seconds of the invoice being created. 500 so BTCPay redelivers in ten
       seconds, by which time the record written by the create endpoint will
       have propagated. A record that never appears means an invoice that
       carries our order-id shape but was not created by us; six failed
       redeliveries and it stops, and the log says which one. */
    console.error('BTCPay settled webhook for an order with no record: ' + orderId);
    return new Response('no_record', { status: 500 });
  }
  if (record.emailedAt) {
    return new Response('already_sent', { status: 200 });
  }
  if (record.invoiceId && record.invoiceId !== invoiceId) {
    /* Two invoices claiming one order. The record's invoice is the one we
       created; the other is not honoured. */
    console.error('BTCPay webhook invoice does not match the order record for ' + orderId);
    return new Response('mismatch', { status: 200 });
  }

  /* ---- 4. Ask BTCPay what this invoice actually is. --------------------- */
  let invoice;
  try {
    const got = await fetchInvoice(env, btcpayOrigin, invoiceId);
    if (got.status === 404) {
      console.error('Signed event names an invoice this store cannot read: ' + invoiceId);
      return new Response('not_found', { status: 200 });
    }
    if (got.status !== 200) {
      console.error('BTCPay returned ' + got.status + ' for ' + invoiceId);
      return new Response('upstream', { status: 500 });
    }
    invoice = got.invoice;
  } catch (err) {
    console.error('BTCPay fetch threw: ' + (err && err.name === 'AbortError' ? 'timeout' : (err && err.message)));
    return new Response('upstream', { status: 500 });
  }

  /* The five facts the create endpoint wrote, checked against the invoice
     BTCPay holds. Every one has to agree. `Settled` is BTCPay's terminal
     paid state; nothing short of it releases anything. */
  if (invoice.status !== 'Settled') {
    /* The event said settled and the API does not. A later InvoiceSettled
       will bring us back; a redelivery of THIS one will not change the
       answer. 200. */
    console.error('InvoiceSettled event but API status is ' + invoice.status + ' for ' + orderId);
    return new Response('not_settled', { status: 200 });
  }
  const meta = invoice.metadata || {};
  const matches =
    invoice.id === invoiceId &&
    invoice.storeId === env.BTCPAY_STORE_ID &&
    invoice.type !== 'TopUp' &&
    Number(invoice.amount) === Number(record.amount) &&
    String(invoice.currency).toUpperCase() === String(record.currency).toUpperCase() &&
    meta.orderId === orderId &&
    meta.itemCode === record.itemCode &&
    meta.buyerEmail === record.email;
  if (!matches) {
    /* Paid, apparently, and not what we sold. The owner has to look at this
       one by hand, so the log carries the reference; nothing goes out. */
    console.error('MANUAL REVIEW — settled invoice does not match its order record: ' + orderId + ' / ' + invoiceId);
    return new Response('mismatch', { status: 200 });
  }

  /* ---- 5. Write the record BEFORE sending, same as stripe-webhook.js. ---
     No emailedAt yet — that is what step 3 keys idempotency off, so a retry
     after a failed send tries again rather than concluding the buyer has
     been served. No TTL: business record. */
  const windowHours = Number(env.DOWNLOAD_WINDOW_HOURS) || DEFAULT_WINDOW_HOURS;
  const createdTime = typeof invoice.createdTime === 'number' ? invoice.createdTime : Math.floor(Date.now() / 1000);
  const expiresAt = (createdTime + windowHours * 3600) * 1000;
  const siteOrigin = env.SITE_ORIGIN || DEFAULT_SITE_ORIGIN;

  record.invoiceId = invoiceId;
  record.invoiceCreatedTime = createdTime;
  record.status = 'settled';
  record.settledAt = record.settledAt || new Date().toISOString();
  record.expiresAt = expiresAt;
  record.manuallyMarked = event.manuallyMarked === true;
  record.overPaid = event.overPaid === true;
  record.additionalStatus = typeof invoice.additionalStatus === 'string' ? invoice.additionalStatus : null;
  record.emailedAt = null;
  try {
    await env.ORDERS.put(key, JSON.stringify(record));
  } catch (err) {
    console.error('KV write threw for ' + orderId + ': ' + (err && err.message));
    return new Response('storage_error', { status: 500 });
  }

  /* ---- 6. Send it. ------------------------------------------------------ */
  const mail = buildEmail({ siteOrigin: siteOrigin, reference: orderId, expiresAt: expiresAt });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || DEFAULT_FROM,
        to: [record.email],
        reply_to: env.REPLY_TO_EMAIL || DEFAULT_REPLY_TO,
        subject: 'Your download — Kundalini Spines, Rise Up',
        text: mail.text,
        html: mail.html
      })
    });
    if (!res.ok) {
      /* The rescue link goes in the log deliberately, as it does in
         stripe-webhook.js: a paying customer is waiting and this line is the
         fastest way to put the link in their hands by hand. Server log only. */
      const detail = await res.text().catch(function () { return '(no body)'; });
      console.error('RESEND FAILED ' + res.status + ' for order ' + orderId + ' — ' + detail + ' — rescue link: ' + mail.url);
      return new Response('email_failed', { status: 500 });
    }
  } catch (err) {
    console.error('RESEND THREW for order ' + orderId + ': ' + (err && err.message) + ' — rescue link: ' + mail.url);
    return new Response('email_failed', { status: 500 });
  }

  /* ---- 7. Mark it sent. The same race stripe-webhook.js states: two
     deliveries in the same second both send, and a duplicate email is the
     right way to fail. ---------------------------------------------------- */
  record.emailedAt = new Date().toISOString();
  try {
    await env.ORDERS.put(key, JSON.stringify(record));
  } catch (err) {
    console.error('KV emailedAt write failed for ' + orderId + ': ' + (err && err.message));
  }

  return new Response('ok', { status: 200 });
}

/* ==========================================================================
   /api/download — THE ONLY ROUTE TO THE ALBUM FILE. Aug 31 2026.

   Sibling of verify.js; read that file's banner first, it carries the four
   decisions both files share (why a server exists at all, why a Pages
   Function rather than a standalone Worker, why functions/ sits at the repo
   root and not in _site, and why neither file imports a shared module).

   WHAT THIS REPLACES. §5 of js/purchase-checkout.js has said since Aug 20
   that the album ZIP's address must never appear in public HTML, JS, a data
   attribute, a Stripe field or this repo — because "a hard-to-guess path is
   not protection, it is a URL, and URLs get shared, and an unsigned one
   cannot be revoked." That rule stands and this file is how it is kept: the
   bytes live in a private R2 bucket with no public URL of any kind, and the
   only way out of that bucket is through this function, which re-asks Stripe
   whether the buyer paid before it opens the object.

   THE FILE IS STREAMED, NOT REDIRECTED TO. The obvious alternative is to mint
   an R2 presigned URL and 302 to it. That would need R2 access-key ID and
   secret in the environment and a SigV4 signer in this file — two more
   secrets and thirty more lines — to arrive at a short-lived URL that is
   still a shareable URL for its lifetime. Streaming through the binding needs
   no keys at all (the binding IS the credential) and the buyer never holds an
   address that points at the bucket. The cost is that the bytes transit the
   Worker; for a single album ZIP on a hand-released site that is nothing.

   IT RE-VERIFIES WITH STRIPE RATHER THAN TRUSTING THE TOKEN. The token from
   /api/verify is signed and short-lived, so trusting it would be defensible
   and one API call cheaper. It is not trusted because a refund, a dispute or
   a fraud cancellation can land between minting and download, and the whole
   argument for this file is that Stripe is the authority. The consequence,
   stated plainly so nobody is surprised by it: a Stripe outage blocks
   downloads. That is the correct failure direction here.
   ========================================================================== */

const REQUIRED_ENV = ['STRIPE_SECRET_KEY', 'PRICE_ID_DIGITAL', 'DOWNLOAD_SIGNING_KEY'];

const DEFAULT_WINDOW_HOURS = 72;

/* The object key inside the bucket, and the name the buyer's browser saves.
   Both are overridable so the file can be re-cut without a code change. */
const DEFAULT_OBJECT_KEY = 'rise-up-digital.zip';
const DEFAULT_FILENAME = 'Kundalini Spines - Rise Up (Digital Edition).zip';

function fail(error, status) {
  return new Response(JSON.stringify({ ok: false, error: error }), {
    status: status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, private',
      'referrer-policy': 'no-referrer'
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

/* Constant-time-ish comparison. Both operands here are base64url HMACs of
   fixed length, so the length check leaks nothing an attacker does not
   already know, and the loop does not exit early on the first mismatch. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const missing = REQUIRED_ENV.filter(function (k) { return !env[k]; });
  if (missing.length) {
    console.error('Misconfigured: missing env ' + missing.join(', '));
    return fail('server_misconfigured', 500);
  }
  /* The binding is checked separately from the string vars: it is configured
     in a different place in the dashboard (Settings -> Functions -> R2
     bindings, not Environment variables) and is the one most likely to be
     forgotten. Naming it in the log saves the next person the hunt. */
  if (!env.ALBUM_BUCKET) {
    console.error('Misconfigured: R2 binding ALBUM_BUCKET is not bound');
    return fail('server_misconfigured', 500);
  }

  /* ---- 1. The token: shape, signature, expiry. --------------------------
     Checked before Stripe is called, because all three are free and a request
     that fails them is not worth an API call. */
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return fail('missing_token', 400);

  const parts = token.split('.');
  if (parts.length !== 3) return fail('bad_token', 400);

  const sessionId = parts[0];
  const exp = Number(parts[1]);
  const givenSig = parts[2];

  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return fail('bad_token', 400);
  if (!Number.isFinite(exp)) return fail('bad_token', 400);

  const expectedSig = await sign(sessionId + '.' + exp, env.DOWNLOAD_SIGNING_KEY);
  if (!safeEqual(givenSig, expectedSig)) return fail('bad_token', 403);

  /* Expiry AFTER signature: an unsigned token's expiry claim is not worth
     reading, and answering "expired" to a forged token would confirm the
     forgery got that far. */
  if (Math.floor(Date.now() / 1000) > exp) return fail('token_expired', 401);

  /* ---- 2. Stripe, again. See the banner. -------------------------------- */
  let session;
  try {
    const res = await fetch(
      'https://api.stripe.com/v1/checkout/sessions/' +
        encodeURIComponent(sessionId) + '?expand[]=line_items',
      { headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY } }
    );
    if (res.status === 404) return fail('not_found', 404);
    if (!res.ok) {
      console.error('Stripe returned ' + res.status + ' for ' + sessionId);
      return fail('upstream', 502);
    }
    session = await res.json();
  } catch (err) {
    console.error('Stripe fetch threw: ' + (err && err.message));
    return fail('upstream', 502);
  }

  if (session.status !== 'complete' || session.payment_status !== 'paid') {
    return fail('unpaid', 402);
  }

  const items = (session.line_items && session.line_items.data) || [];
  const isAlbum = items.some(function (li) {
    return li.price && li.price.id === env.PRICE_ID_DIGITAL;
  });
  if (!isAlbum) return fail('wrong_product', 403);

  const windowHours = Number(env.DOWNLOAD_WINDOW_HOURS) || DEFAULT_WINDOW_HOURS;
  if (Date.now() > (session.created + windowHours * 3600) * 1000) {
    return fail('window_closed', 410);
  }

  /* ---- 3. The bytes. ---------------------------------------------------
     Range is passed through to R2 so a dropped connection on a large ZIP
     resumes instead of restarting. R2's .get() returns a `range` on the
     object when it honoured one, which is what distinguishes the 206 reply
     from the 200 — do not infer it from the request header alone, because an
     unsatisfiable range comes back as a full object. */
  const objectKey = env.ALBUM_OBJECT_KEY || DEFAULT_OBJECT_KEY;
  const rangeHeader = request.headers.get('range');

  let object;
  try {
    object = rangeHeader
      ? await env.ALBUM_BUCKET.get(objectKey, { range: request.headers })
      : await env.ALBUM_BUCKET.get(objectKey);
  } catch (err) {
    console.error('R2 get threw for key ' + objectKey + ': ' + (err && err.message));
    return fail('storage_error', 502);
  }

  if (!object) {
    /* The buyer paid and there is nothing to give them. This is the one
       failure here that costs money, so it is logged loudly and answered
       honestly rather than as a 404 the page would render as "invalid link". */
    console.error('PAID BUYER, MISSING OBJECT: ' + objectKey + ' not in ALBUM_BUCKET');
    return fail('file_missing', 503);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('content-type', 'application/zip');
  headers.set('cache-control', 'no-store, private');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('accept-ranges', 'bytes');
  /* RFC 5987 filename* alongside a plain ASCII filename: the delivered name
     has spaces and parentheses in it and older clients mangle the bare form. */
  const filename = env.ALBUM_FILENAME || DEFAULT_FILENAME;
  headers.set(
    'content-disposition',
    'attachment; filename="rise-up.zip"; filename*=UTF-8\'\'' + encodeURIComponent(filename)
  );

  /* `object.size` IS THE FULL OBJECT, NOT THE SLICE — that is the trap in this
     block, and it was written wrong the first time. R2's docs define size as
     "Size of the object in bytes"; the slice's length lives on `object.range`,
     which is an R2Range and may arrive as {offset,length}, {offset}, {length}
     or {suffix} depending on what the client asked for. Getting this wrong
     produces a content-range whose end exceeds the total, and browsers respond
     by silently discarding the response mid-download. */
  if (object.range) {
    const total = object.size;
    let start;
    let length;

    if (typeof object.range.suffix === 'number') {
      /* `Range: bytes=-500` — the last N bytes. */
      length = object.range.suffix;
      start = total - length;
    } else {
      start = typeof object.range.offset === 'number' ? object.range.offset : 0;
      length = typeof object.range.length === 'number' ? object.range.length : total - start;
    }

    const end = start + length - 1;
    headers.set('content-range', 'bytes ' + start + '-' + end + '/' + total);
    headers.set('content-length', String(length));
    return new Response(object.body, { status: 206, headers: headers });
  }

  headers.set('content-length', String(object.size));

  return new Response(object.body, { status: 200, headers: headers });
}

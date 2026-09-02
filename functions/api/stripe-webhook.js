/* ==========================================================================
   /api/stripe-webhook — THE CONFIRMATION EMAIL, AND THE ORDER RECORD.
   Sept 1 2026.

   WHY THIS FILE EXISTS. V2HANDOFF 55 item 1, called there "the most exposed
   thing on the site and it will cost a real customer." Until this file, the
   success page URL was the buyer's ONLY route back to their files, and
   Stripe's receipt does not contain it — a Stripe receipt shows the purchase,
   not your redirect URL. So a buyer who paid on a phone meaning to download
   on a laptop later, and closed the tab, had no way back at all while the
   72-hour window sat open. Their only recourse was writing to the owner, who
   had no automated way to reissue and no order record to look them up in.
   This endpoint sends them the link, and writes the record.

   WHY THE WEBHOOK AND NOT /api/verify. Sending from verify.js was the shorter
   path and it was the wrong one: verify runs when the success page loads,
   which is precisely the case that already works. What is unprotected is
   every case where the redirect never happens — a connection dropped between
   Stripe's confirmation and our page, a tab closed on the payment screen, an
   asynchronous payment method that settles hours after the buyer has gone.
   Stripe delivers this event directly to the server, so it fires in all of
   them. STRIPE-SETUP.md §5 has called `checkout.session.completed` "the only
   authority on whether a purchase happened" since before there was a server
   to put it on; this is that section becoming code.

   WHY IT RE-ASKS STRIPE INSTEAD OF READING THE EVENT BODY. The Session inside
   the event carries no `line_items`, so "is this order for the Digital
   Edition" cannot be answered from the payload at all — it needs an expanded
   fetch. Having to make the call anyway, this file makes it the way the other
   two do and reads the product off Stripe's answer rather than off a body
   posted to a public URL. The signature proves who sent the message; the API
   call proves what is in it.

   DELIBERATELY SELF-CONTAINED, duplicating helpers with verify.js and
   download.js for the reason their banners give: every .js under functions/
   becomes a public route, so a shared functions/lib/ module would be served
   at /lib/…. Three files that depend on nothing beat three files that depend
   on a fourth one the router will publish.

   THE ONE THING TO KNOW BEFORE EDITING: this endpoint is public and
   unauthenticated by design — Stripe has to be able to reach it without
   credentials. The signature check below is the ONLY thing standing between a
   stranger's POST and an email going out over the owner's domain. Nothing
   above it may be moved below it.
   ========================================================================== */

/* RESEND_API_KEY is in here rather than in an optional tier because a webhook
   that verifies, records, and then silently cannot send is the failure this
   whole file exists to prevent. Better a loud 500 that Stripe retries. */
const REQUIRED_ENV = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PRICE_ID_DIGITAL',
  'RESEND_API_KEY'
];

/* MUST MATCH verify.js AND download.js. The three read the same optional
   DOWNLOAD_WINDOW_HOURS override, so they only diverge if someone edits one
   default and not the others — at which point the email would promise a
   deadline the download gate does not honour. */
const DEFAULT_WINDOW_HOURS = 72;

/* Stripe's own recommended tolerance. It exists to stop a captured POST being
   replayed later; five minutes is generous enough to survive clock skew
   between Cloudflare's edge and Stripe. */
const SIGNATURE_TOLERANCE_SECONDS = 300;

/* NOT derived from the request URL, deliberately. Stripe posts to whatever
   endpoint URL is configured, and the site answers on both
   kundalinispines.com and kundalini-spines.pages.dev — deriving the origin
   would mean a webhook registered against the pages.dev host emails buyers a
   pages.dev link forever, silently and correctly-looking. A constant can only
   be wrong loudly. Override with SITE_ORIGIN. */
const DEFAULT_SITE_ORIGIN = 'https://kundalinispines.com';

/* Must be a domain verified in Resend. gmail.com cannot be verified by us, so
   the owner's public gmail address is the reply-to and not the from. */
const DEFAULT_FROM = 'Kundalini Spines <orders@kundalinispines.com>';
const DEFAULT_REPLY_TO = 'kundalinispines@gmail.com';

/* BOTH events, not just the first. `checkout.session.completed` fires for a
   card the instant it settles, but for an asynchronous method (bank debits,
   some wallets) it fires with payment_status still `unpaid` and the money
   lands later under `checkout.session.async_payment_succeeded`. Handling only
   the first would email nothing to exactly the buyers who wait longest. */
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded'
];

/* Stripe signs with a hex digest; the download token in verify.js uses
   base64url. Different encodings, different jobs — do not unify them. */
function hex(buf) {
  const arr = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < arr.length; i++) {
    s += arr[i].toString(16).padStart(2, '0');
  }
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

/* Same shape as download.js's. Both operands are fixed-length hex digests, so
   the length check leaks nothing, and the loop does not exit early. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* `t=1614030000,v1=abc…,v1=def…` — more than one v1 appears while a signing
   secret is being rotated, and BOTH are valid during the overlap. Matching
   only the first would break every delivery mid-rotation. */
function parseSignatureHeader(header) {
  const out = { timestamp: null, signatures: [] };
  if (typeof header !== 'string') return out;
  const parts = header.split(',');
  for (let i = 0; i < parts.length; i++) {
    const eq = parts[i].indexOf('=');
    if (eq === -1) continue;
    const k = parts[i].slice(0, eq).trim();
    const v = parts[i].slice(eq + 1).trim();
    if (k === 't') out.timestamp = Number(v);
    else if (k === 'v1') out.signatures.push(v);
  }
  return out;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* UTC, spelled out, and labelled as UTC. The success page renders this same
   moment with toLocaleString() because it runs in the buyer's browser and can
   know their zone; an email is composed on a server that cannot, and a
   deadline printed in a zone the reader does not know they are reading is
   worse than one printed in a zone they can see named. */
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
  const url = opts.siteOrigin + '/purchase-success?session_id=' +
    encodeURIComponent(opts.reference);
  const deadline = formatUtc(opts.expiresAt);

  /* Plain text is not a courtesy here. Some clients strip HTML, some readers
     prefer it, and a transactional mail that exists solely to carry ONE link
     must survive being rendered as text. Both parts carry the same URL. */
  const text = [
    'Your copy of Rise Up is ready.',
    '',
    'Download it here:',
    url,
    '',
    'This link is the only route back to your files. Stripe’s receipt does',
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

  /* Restrained on purpose. Dark backgrounds and webfonts are where
     transactional email breaks — Outlook drops the background and leaves dark
     text on dark, and the one job of this message is that a link is readable.
     The site's voice lives on the site. */
  const html = [
    '<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:520px;margin:0 auto;padding:24px;">',
    '<p style="margin:0 0 20px;font-size:18px;font-weight:bold;">Your copy of Rise Up is ready.</p>',
    '<p style="margin:0 0 20px;"><a href="' + escapeHtml(url) + '" style="background:#1a1a1a;color:#ffffff;text-decoration:none;padding:12px 22px;display:inline-block;border-radius:2px;font-weight:bold;">Download the album</a></p>',
    '<p style="margin:0 0 20px;"><strong>This link is the only route back to your files.</strong> Stripe&rsquo;s receipt does not contain it, so keep this email until you have the album saved.</p>',
    '<p style="margin:0 0 20px;">The link stays open until <strong>' + escapeHtml(deadline) + '</strong>.</p>',
    '<p style="margin:0 0 20px;">Two files are waiting: <strong>MP3</strong> (about 373&nbsp;MB) for listening, and <strong>WAV masters</strong> (about 1.4&nbsp;GB). Both are yours &mdash; they are the same album, and the <strong>deluxe digital booklet</strong> is packed inside each one.</p>',
    '<p style="margin:0 0 20px;color:#555;font-size:13px;">Order reference: <span style="font-family:monospace;">' + escapeHtml(opts.reference) + '</span></p>',
    '<p style="margin:0 0 20px;color:#555;font-size:13px;">If the link stops working before you have the files, reply to this email quoting the order reference and it will be reissued.</p>',
    '<p style="margin:0;color:#555;font-size:13px;">Kundalini Spines<br><a href="' + escapeHtml(opts.siteOrigin) + '" style="color:#555;">' + escapeHtml(opts.siteOrigin) + '</a></p>',
    '</div>'
  ].join('');

  /* The URL is returned so the caller can log it on a send failure. It is the
     one thing the owner needs in order to rescue the order by hand. */
  return { text: text, html: html, url: url };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const missing = REQUIRED_ENV.filter(function (k) { return !env[k]; });
  if (missing.length) {
    console.error('Misconfigured: missing env ' + missing.join(', '));
    /* 500 rather than 200: Stripe retries a 500 for up to three days, so a
       webhook that went live before its secrets did will deliver everything
       it missed once they are set, instead of silently dropping real orders. */
    return new Response('server_misconfigured', { status: 500 });
  }
  /* Checked separately for the reason download.js checks ALBUM_BUCKET
     separately: a binding is configured on a different dashboard screen from
     the variables (Settings -> Bindings, not Variables and Secrets) and is
     the step most likely to be missed. */
  if (!env.ORDERS) {
    console.error('Misconfigured: KV binding ORDERS is not bound');
    return new Response('server_misconfigured', { status: 500 });
  }

  /* ---- 1. The signature. Nothing else happens first. -------------------
     THE RAW TEXT, NOT A RE-SERIALISED OBJECT. Stripe signs the exact bytes it
     sent; JSON.parse followed by JSON.stringify reorders nothing but respaces
     everything, and the digest of the respaced body never matches. Read the
     body once, verify it, and only then parse it. */
  const raw = await request.text();
  const parsed = parseSignatureHeader(request.headers.get('stripe-signature'));

  if (!parsed.timestamp || !Number.isFinite(parsed.timestamp) || !parsed.signatures.length) {
    return new Response('bad_signature', { status: 400 });
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - parsed.timestamp);
  if (age > SIGNATURE_TOLERANCE_SECONDS) {
    console.error('Rejected webhook outside tolerance: ' + age + 's old');
    return new Response('stale_signature', { status: 400 });
  }

  const expected = await hmacHex(parsed.timestamp + '.' + raw, env.STRIPE_WEBHOOK_SECRET);
  const signatureOk = parsed.signatures.some(function (candidate) {
    return safeEqual(candidate, expected);
  });
  if (!signatureOk) {
    /* Logged without the body. An unsigned POST to a public endpoint is
       either a probe or a misconfiguration, and echoing what it contained
       into the log makes the log an injection surface. */
    console.error('Rejected webhook with invalid signature');
    return new Response('bad_signature', { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch (err) {
    return new Response('bad_payload', { status: 400 });
  }

  /* 200 for anything not handled. Stripe treats a non-2xx as a failure and
     retries it for days, so answering an event we intend to ignore with an
     error manufactures an alert storm out of a subscription that is merely
     wider than it needs to be. */
  if (HANDLED_EVENTS.indexOf(event.type) === -1) {
    return new Response('ignored', { status: 200 });
  }

  const sessionId = event.data && event.data.object && event.data.object.id;
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return new Response('ignored', { status: 200 });
  }

  /* ---- 2. Have we already handled this one? ---------------------------
     Stripe retries on any non-2xx AND can deliver the same event more than
     once by design, so this endpoint has to assume it will be called twice
     for the same order. */
  let record = null;
  try {
    record = await env.ORDERS.get('order:' + sessionId, { type: 'json' });
  } catch (err) {
    console.error('KV read threw for ' + sessionId + ': ' + (err && err.message));
    return new Response('storage_error', { status: 500 });
  }
  if (record && record.emailedAt) {
    return new Response('already_sent', { status: 200 });
  }

  /* ---- 3. Ask Stripe what this session actually is. -------------------- */
  let session;
  try {
    const res = await fetch(
      'https://api.stripe.com/v1/checkout/sessions/' +
        encodeURIComponent(sessionId) + '?expand[]=line_items',
      { headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY } }
    );
    /* A 404 here is NOT the ordinary case it is in verify.js. There, the id
       came from a query string a stranger can type. Here it came from a
       message Stripe signed, so a missing session means the key is pointed at
       the wrong mode — a live key cannot read a test session, which cost this
       project an hour on Aug 31. Loud, and not retried. */
    if (res.status === 404) {
      console.error('Signed event names a session this key cannot read — mode mismatch? ' + sessionId);
      return new Response('not_found', { status: 200 });
    }
    if (!res.ok) {
      console.error('Stripe returned ' + res.status + ' for ' + sessionId);
      return new Response('upstream', { status: 500 });
    }
    session = await res.json();
  } catch (err) {
    console.error('Stripe fetch threw: ' + (err && err.message));
    return new Response('upstream', { status: 500 });
  }

  /* An async method that has not settled: the money is not in yet, so there
     is nothing to confirm. Answered 200 because a later
     async_payment_succeeded will bring us back here, and a retry of THIS
     delivery never will. */
  if (session.payment_status !== 'paid') {
    return new Response('not_paid_yet', { status: 200 });
  }

  const items = (session.line_items && session.line_items.data) || [];
  const isAlbum = items.some(function (li) {
    return li.price && li.price.id === env.PRICE_ID_DIGITAL;
  });
  /* Not an error — it is a Deluxe order, or a future sticker, and those are
     fulfilled by hand. 200 so Stripe stops asking. */
  if (!isAlbum) {
    return new Response('not_digital', { status: 200 });
  }

  const email = (session.customer_details && session.customer_details.email) || null;
  if (!email) {
    /* Paid, ours, and unreachable. The owner has to rescue this one by hand,
       so the log carries everything needed to do it. */
    console.error('PAID DIGITAL ORDER WITH NO EMAIL ADDRESS: ' + sessionId);
    return new Response('no_email', { status: 200 });
  }

  const windowHours = Number(env.DOWNLOAD_WINDOW_HOURS) || DEFAULT_WINDOW_HOURS;
  const expiresAt = (session.created + windowHours * 3600) * 1000;
  const siteOrigin = env.SITE_ORIGIN || DEFAULT_SITE_ORIGIN;

  /* ---- 4. Write the order record BEFORE sending. ----------------------
     If Resend is down, the sale still leaves a trace the owner can act on.
     The record is written without `emailedAt`, which is what step 2 keys
     idempotency off — so a retry after a failed send tries again rather than
     concluding the buyer has already been served.

     NO expirationTtl. These are business records: the download window closes
     in 72 hours but the question "did this person buy the album" outlives it
     by years, and it is the only place outside Stripe that can answer.

     WHAT IS STORED IS WHAT A REISSUE NEEDS, AND NOTHING MORE. Stripe's
     session carries the full customer_details block — name, address, phone,
     tax ids. Same rule as verify.js: it is already there on the server, which
     is the point of the server. */
  const now = new Date().toISOString();
  record = {
    reference: sessionId,
    email: email,
    amountTotal: session.amount_total,
    currency: session.currency,
    createdAt: session.created,
    expiresAt: expiresAt,
    livemode: event.livemode === true,
    recordedAt: (record && record.recordedAt) || now,
    emailedAt: null
  };
  try {
    await env.ORDERS.put('order:' + sessionId, JSON.stringify(record));
  } catch (err) {
    console.error('KV write threw for ' + sessionId + ': ' + (err && err.message));
    return new Response('storage_error', { status: 500 });
  }

  /* ---- 5. Send it. ---------------------------------------------------- */
  const mail = buildEmail({
    siteOrigin: siteOrigin,
    reference: sessionId,
    expiresAt: expiresAt
  });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || DEFAULT_FROM,
        to: [email],
        reply_to: env.REPLY_TO_EMAIL || DEFAULT_REPLY_TO,
        subject: 'Your download — Kundalini Spines, Rise Up',
        text: mail.text,
        html: mail.html
      })
    });

    if (!res.ok) {
      /* The URL goes in the log deliberately. A send failure means a paying
         customer is sitting on the success page with no copy of their link,
         and this line is the fastest path to putting it in their hands by
         hand. It is a server log, not a public response. */
      const detail = await res.text().catch(function () { return '(no body)'; });
      console.error(
        'RESEND FAILED ' + res.status + ' for ' + email + ' — ' + detail +
        ' — rescue link: ' + mail.url
      );
      /* 500 so Stripe retries: the record has no emailedAt, so the retry will
         genuinely try again rather than short-circuit. */
      return new Response('email_failed', { status: 500 });
    }
  } catch (err) {
    console.error(
      'RESEND THREW for ' + email + ': ' + (err && err.message) +
      ' — rescue link: ' + mail.url
    );
    return new Response('email_failed', { status: 500 });
  }

  /* ---- 6. Mark it sent. ----------------------------------------------
     THE RACE, STATED RATHER THAN PAPERED OVER: two deliveries of the same
     event arriving within the same second both read a record with no
     emailedAt and both send. Stripe's retries are minutes apart so this needs
     a genuine coincidence, and the alternative — claiming the send before
     making it — turns a duplicate email into NO email whenever a send fails.
     A buyer receiving their download link twice is the correct direction to
     fail in, the same call download.js makes about re-asking Stripe. */
  record.emailedAt = new Date().toISOString();
  try {
    await env.ORDERS.put('order:' + sessionId, JSON.stringify(record));
  } catch (err) {
    /* The mail is already gone. Answering 500 here would make Stripe retry a
       delivery whose only remaining effect is a duplicate email, so this is
       logged and swallowed. */
    console.error('KV emailedAt write failed for ' + sessionId + ': ' + (err && err.message));
  }

  return new Response('ok', { status: 200 });
}

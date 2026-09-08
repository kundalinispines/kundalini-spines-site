"""Tests for the BTCPay Pages Functions, run inside a real Chromium.

WHY A BROWSER AND NOT NODE. This machine has no Node, npm or wrangler
(kundalini-session-start SKILL.md, verified again Sept 8 2026), and the
Functions under functions/api/ use nothing but Web APIs: fetch, Request,
Response, Headers, crypto.subtle, TextEncoder. A page served from the repo
root can `import()` them as ES modules, hand them fake `env` bindings, and
call their handlers directly. Playwright (Python) is installed and is the
project's verification tool anyway.

WHAT IS FAKED: the Greenfield API, Resend, Stripe (one regression call), the
ORDERS KV namespace and the ALBUM_BUCKET R2 binding. What is real: the
Functions' own code, the WebCrypto HMACs, the JSON handling, the Response
objects.

WHY REQUESTS ARE PLAIN OBJECTS. A browser refuses to set `Origin`,
`Sec-Fetch-Site` and `Content-Length` on a real Request (forbidden header
names), and the origin check is one of the things under test. The Functions
read only `request.url`, `.method`, `.headers.get()` and `.text()`, so a
minimal object with those four is what they receive.

Run:  python scripts/test-btcpay-functions.py [--no-visual]
Exit code 1 on any failed assertion.
"""
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(os.environ.get('TEMP', ROOT), 'btcpay-tests')
os.makedirs(OUT_DIR, exist_ok=True)
VISUAL = '--no-visual' not in sys.argv

HARNESS = r"""
async ({ base }) => {
  const results = [];
  const ok = (name, cond, detail) => results.push({ name, pass: !!cond, detail: detail == null ? '' : String(detail) });

  /* ---- capture everything that could leak ---- */
  const logLines = [];
  const realError = console.error;
  console.error = (...a) => { logLines.push(a.map(String).join(' ')); };
  const bodies = [];
  async function read(res) {
    const text = await res.clone().text();
    bodies.push(text);
    let js = null; try { js = JSON.parse(text); } catch (e) {}
    return { status: res.status, text, json: js, headers: res.headers };
  }

  /* ---- fakes ---- */
  const fetchLog = [];
  const realFetch = window.fetch;
  let script = null;
  window.fetch = async (url, init) => {
    const u = String(url);
    fetchLog.push({ url: u, init: init || {} });
    if (!script) throw new Error('no upstream script for ' + u);
    return script(u, init || {});
  };
  const jsonRes = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

  class FakeKV {
    constructor() { this.m = new Map(); this.fail = false; }
    async get(k, o) { if (this.fail) throw new Error('kv down'); const v = this.m.get(k); if (v === undefined) return null; return (o && o.type === 'json') ? JSON.parse(v) : v; }
    async put(k, v) { if (this.fail) throw new Error('kv down'); this.m.set(k, String(v)); }
  }
  const bucket = {
    async get(key) {
      if (key.indexOf('MP3') === -1 && key.indexOf('WAV') === -1) return null;
      return { body: 'ZIPBYTES', size: 8, httpEtag: '"etag"', writeHttpMetadata() {}, range: undefined };
    }
  };
  const SECRETS = {
    BTCPAY_API_KEY: 'TESTKEY-apikey-9f3c1a7d',
    BTCPAY_WEBHOOK_SECRET: 'TESTSECRET-whsec-77aa20ef',
    RESEND_API_KEY: 'TESTKEY-resend-31bb44',
    STRIPE_SECRET_KEY: 'TESTKEY-stripe-sk-55cc',
    STRIPE_WEBHOOK_SECRET: 'TESTSECRET-stripe-wh-88dd',
    DOWNLOAD_SIGNING_KEY: 'TESTKEY-signing-42ee99'
  };
  const SITE = 'https://site.example.test';
  const BTC = 'https://pay.example.test';
  const mkEnv = (over) => Object.assign({}, SECRETS, {
    BTCPAY_BASE_URL: BTC + '/', BTCPAY_STORE_ID: 'STORE123', PRICE_ID_DIGITAL: 'price_digital',
    SITE_ORIGIN: SITE, ORDERS: new FakeKV(), ALBUM_BUCKET: bucket
  }, over || {});

  const req = (path, opts) => {
    opts = opts || {};
    const h = {}; for (const k in (opts.headers || {})) h[k.toLowerCase()] = opts.headers[k];
    return { url: SITE + path, method: opts.method || 'GET', headers: { get: (k) => (h[k.toLowerCase()] === undefined ? null : h[k.toLowerCase()]) }, text: async () => (opts.body == null ? '' : String(opts.body)) };
  };
  function mkPost(body, headerOver, method) {
    const headers = Object.assign({ origin: SITE, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', 'cf-connecting-ip': '203.0.113.9' }, headerOver || {});
    for (const k in headers) if (headers[k] === null) delete headers[k];
    return req('/api/btcpay-create-invoice', { method: method || 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers });
  }

  async function hmacHex(secret, body) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function b64url(buf) { let s = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  async function signToken(ref, exp, secret) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ref + '.' + exp));
    return ref + '.' + exp + '.' + b64url(sig);
  }

  /* ---- modules ---- */
  const mods = {};
  for (const n of ['btcpay-create-invoice', 'btcpay-webhook', 'btcpay-verify', 'download', 'verify', 'stripe-webhook']) {
    mods[n] = await import(base + '/functions/api/' + n + '.js?cb=' + Date.now());
  }
  ok('modules import (syntax valid)', mods['btcpay-create-invoice'].onRequest && mods['btcpay-webhook'].onRequestPost && mods['btcpay-verify'].onRequestGet && mods['download'].onRequestGet && mods['verify'].onRequestGet && mods['stripe-webhook'].onRequestPost);
  ok('create-invoice exports only onRequest', Object.keys(mods['btcpay-create-invoice']).join(',') === 'onRequest', Object.keys(mods['btcpay-create-invoice']).join(','));

  const create = (r, env) => mods['btcpay-create-invoice'].onRequest({ request: r, env });
  const webhook = (r, env) => mods['btcpay-webhook'].onRequestPost({ request: r, env });
  const verify = (r, env) => mods['btcpay-verify'].onRequestGet({ request: r, env });
  const download = (r, env) => mods['download'].onRequestGet({ request: r, env });

  const now = Math.floor(Date.now() / 1000);
  const mkInvoice = (orderId, over) => Object.assign({
    id: 'INVabc123XYZ', storeId: 'STORE123', amount: '20.00', paidAmount: '20.00', currency: 'USD', type: 'Standard',
    checkoutLink: BTC + '/i/INVabc123XYZ', createdTime: now - 60, expirationTime: now + 840,
    status: 'Settled', additionalStatus: 'None',
    metadata: { orderId, itemCode: 'rise-up:digital', itemDesc: 'Rise Up', buyerEmail: 'buyer@example.test', product: 'digital' }
  }, over || {});

  /* =====================================================================
     CREATE INVOICE
     ===================================================================== */
  {
    const env = mkEnv();
    let captured = null;
    script = async (u, init) => {
      if (u.startsWith(BTC + '/api/v1/stores/STORE123/invoices') && init.method === 'POST') {
        captured = JSON.parse(init.body);
        return jsonRes(200, mkInvoice(captured.metadata.orderId, { status: 'New' }));
      }
      return jsonRes(500, {});
    };
    // price tampering: extra fields are ignored, the catalog decides
    const r = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test', amount: '0.01', currency: 'EUR', price: 1 }), env));
    ok('create: 200 with checkoutLink + reference only', r.status === 200 && r.json.ok === true && Object.keys(r.json).sort().join(',') === 'checkoutLink,ok,reference', r.text);
    ok('create: tampered amount/currency ignored, catalog price sent', captured && captured.amount === '20.00' && captured.currency === 'USD', JSON.stringify(captured && { amount: captured.amount, currency: captured.currency }));
    ok('create: redirect URL literal, on SITE_ORIGIN, carries order ref', captured && captured.checkout && captured.checkout.redirectURL === SITE + '/purchase-success?order=' + r.json.reference && captured.checkout.redirectAutomatically === true, captured && captured.checkout && captured.checkout.redirectURL);
    ok('create: metadata carries orderId/itemCode/buyerEmail', captured && captured.metadata.orderId === r.json.reference && captured.metadata.itemCode === 'rise-up:digital' && captured.metadata.buyerEmail === 'buyer@example.test');
    ok('create: reference shape ksbtc_ + 32 hex', /^ksbtc_[0-9a-f]{32}$/.test(r.json.reference), r.json.reference);
    ok('create: no-store header', r.headers.get('cache-control') === 'no-store, private');
    const auth = fetchLog[fetchLog.length - 1].init.headers.Authorization;
    ok('create: Authorization: token <key> sent to BTCPay only', auth === 'token ' + SECRETS.BTCPAY_API_KEY && fetchLog[fetchLog.length - 1].url.startsWith(BTC));
    const rec = await env.ORDERS.get('btcpay:order:' + r.json.reference, { type: 'json' });
    ok('create: KV record written with invoiceId + expectations', rec && rec.invoiceId === 'INVabc123XYZ' && rec.amount === '20.00' && rec.currency === 'USD' && rec.email === 'buyer@example.test' && rec.status === 'created' && rec.emailedAt === null, JSON.stringify(rec));

    // invalid emails
    const before = fetchLog.length;
    for (const bad of ['', 'nope', 'a@b', 'a b@c.com', 'x@y.z\n', 'a'.repeat(260) + '@x.com', 42]) {
      const rr = await read(await create(mkPost({ product: 'digital', email: bad }), env));
      ok('create: rejects email ' + JSON.stringify(String(bad).slice(0, 20)), rr.status === 400 && rr.json.error === 'bad_email', rr.text);
    }
    ok('create: no upstream call for bad emails', fetchLog.length === before);

    // bad product
    let rr = await read(await create(mkPost({ product: 'deluxe', email: 'buyer@example.test' }), env));
    ok('create: unknown product refused', rr.status === 400 && rr.json.error === 'bad_product');
    rr = await read(await create(mkPost({ product: '__proto__', email: 'buyer@example.test' }), env));
    ok('create: prototype key refused', rr.status === 400 && rr.json.error === 'bad_product');

    // origin
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }, { origin: 'https://evil.example' }), env));
    ok('create: foreign Origin refused 403', rr.status === 403 && rr.json.error === 'bad_origin');
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }, { origin: null }), env));
    ok('create: missing Origin refused 403', rr.status === 403);
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }, { 'sec-fetch-site': 'cross-site' }), env));
    ok('create: cross-site Sec-Fetch-Site refused 403', rr.status === 403);
    ok('create: no upstream call for bad origins', fetchLog.length === before);

    // content type, size, method
    rr = await read(await create(mkPost('product=digital', { 'content-type': 'application/x-www-form-urlencoded' }), env));
    ok('create: form encoding refused 415', rr.status === 415);
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test', pad: 'x'.repeat(3000) }), env));
    ok('create: oversize body refused 413', rr.status === 413);
    rr = await read(await create(mkPost('{not json', {}), env));
    ok('create: malformed JSON refused 400', rr.status === 400 && rr.json.error === 'bad_request');
    rr = await read(await create(mkPost('', {}, 'GET'), env));
    ok('create: GET refused 405 with Allow', rr.status === 405 && rr.headers.get('allow') === 'POST');
    ok('create: still no upstream call', fetchLog.length === before);

    // missing env
    for (const k of ['BTCPAY_BASE_URL', 'BTCPAY_STORE_ID', 'BTCPAY_API_KEY']) {
      const e2 = mkEnv(); delete e2[k];
      rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), e2));
      ok('create: missing ' + k + ' -> 500 server_misconfigured', rr.status === 500 && rr.json.error === 'server_misconfigured' && !rr.text.includes(k), rr.text);
    }
    const e3 = mkEnv(); delete e3.ORDERS;
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), e3));
    ok('create: unbound ORDERS -> 500', rr.status === 500);
    const e4 = mkEnv({ BTCPAY_BASE_URL: 'http://pay.example.test' });
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), e4));
    ok('create: http base URL -> 500', rr.status === 500);
    ok('create: no upstream call when misconfigured', fetchLog.length === before);

    // upstream failure
    script = async () => jsonRes(500, { message: 'boom ' + SECRETS.BTCPAY_API_KEY });
    const env5 = mkEnv();
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), env5));
    ok('create: BTCPay 500 -> 502 upstream, body not echoed', rr.status === 502 && rr.json.error === 'upstream' && !rr.text.includes('boom'), rr.text);
    const recs = [...env5.ORDERS.m.keys()].filter(k => k.startsWith('btcpay:order:'));
    const stale = recs.length ? JSON.parse(env5.ORDERS.m.get(recs[0])) : null;
    ok('create: failed create leaves record with no invoiceId', stale && stale.invoiceId === null && stale.status === 'creating', JSON.stringify(stale));
    script = async () => { throw new Error('ECONNREFUSED'); };
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), mkEnv()));
    ok('create: BTCPay unreachable -> 502', rr.status === 502);

    // hostile upstream answers
    script = async (u, init) => jsonRes(200, mkInvoice(JSON.parse(init.body).metadata.orderId, { checkoutLink: 'https://evil.example/i/x' }));
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), mkEnv()));
    ok('create: checkoutLink on foreign host refused', rr.status === 502);
    script = async (u, init) => jsonRes(200, mkInvoice(JSON.parse(init.body).metadata.orderId, { amount: '5.00' }));
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), mkEnv()));
    ok('create: invoice echoing wrong amount refused', rr.status === 502);
    script = async (u, init) => jsonRes(200, mkInvoice(JSON.parse(init.body).metadata.orderId, { storeId: 'OTHER' }));
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), mkEnv()));
    ok('create: invoice for wrong store refused', rr.status === 502);

    // rate limit
    script = async (u, init) => jsonRes(200, mkInvoice(JSON.parse(init.body).metadata.orderId, { status: 'New' }));
    const env6 = mkEnv();
    const codes = [];
    for (let i = 0; i < 7; i++) codes.push((await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), env6)).status);
    ok('create: 6th+ request in window -> 429', codes.slice(0, 5).every(c => c === 200) && codes[5] === 429 && codes[6] === 429, codes.join(','));
    ok('create: rate-limit key is hashed, not the IP', [...env6.ORDERS.m.keys()].some(k => /^btcpay:rl:[0-9a-f]{32}$/.test(k)) && ![...env6.ORDERS.m.keys()].some(k => k.includes('203.0.113.9')));
    const kvDown = mkEnv(); kvDown.ORDERS.fail = true;
    rr = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), kvDown));
    ok('create: KV down -> 500 storage_error, no invoice created', rr.status === 500 && rr.json.error === 'storage_error');
  }

  /* =====================================================================
     WEBHOOK + VERIFY + DOWNLOAD, end to end on one order
     ===================================================================== */
  {
    const env = mkEnv();
    let invoiceState = null;
    let resendCalls = 0;
    let lastMail = null;
    script = async (u, init) => {
      if (u.startsWith(BTC + '/api/v1/stores/STORE123/invoices') && init.method === 'POST') {
        const b = JSON.parse(init.body);
        invoiceState = mkInvoice(b.metadata.orderId, { status: 'New', metadata: b.metadata });
        return jsonRes(200, invoiceState);
      }
      if (u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ') return invoiceState ? jsonRes(200, invoiceState) : jsonRes(404, {});
      if (u.startsWith('https://api.resend.com/')) { resendCalls++; lastMail = JSON.parse(init.body); return jsonRes(200, { id: 'mail1' }); }
      return jsonRes(500, {});
    };
    const created = await read(await create(mkPost({ product: 'digital', email: 'buyer@example.test' }), env));
    const orderId = created.json.reference;
    const key = 'btcpay:order:' + orderId;

    // verify while New
    let v = await read(await verify(req('/api/btcpay-verify?order=' + orderId), env));
    ok('verify: New -> 402 pending/new with checkoutLink', v.status === 402 && v.json.error === 'pending' && v.json.state === 'new' && v.json.checkoutLink === BTC + '/i/INVabc123XYZ' && !('token' in v.json), v.text);
    invoiceState.status = 'Processing';
    v = await read(await verify(req('/api/btcpay-verify?order=' + orderId), env));
    ok('verify: Processing -> pending/processing, no link, no token', v.status === 402 && v.json.state === 'processing' && !v.json.checkoutLink && !v.json.token, v.text);

    // webhook event helpers
    const evt = (over) => JSON.stringify(Object.assign({ deliveryId: 'D1', webhookId: 'W1', originalDeliveryId: 'D1', isRedelivery: false, type: 'InvoiceSettled', timestamp: now, storeId: 'STORE123', invoiceId: 'INVabc123XYZ', metadata: invoiceState.metadata, manuallyMarked: false, overPaid: false }, over || {}));
    const hook = async (body, sigOverride, envOverride) => {
      const sig = sigOverride !== undefined ? sigOverride : 'sha256=' + (await hmacHex(SECRETS.BTCPAY_WEBHOOK_SECRET, body));
      const h = { 'content-type': 'application/json' }; if (sig !== null) h['BTCPay-Sig'] = sig;
      return read(await webhook(req('/api/btcpay-webhook', { method: 'POST', body, headers: h }), envOverride || env));
    };

    // forged / missing signatures
    let w = await hook(evt(), 'sha256=' + '0'.repeat(64));
    ok('webhook: forged signature -> 400, no email', w.status === 400 && w.text === 'bad_signature' && resendCalls === 0);
    w = await hook(evt(), null);
    ok('webhook: missing signature -> 400', w.status === 400);
    w = await hook(evt(), 'sha256=' + (await hmacHex('wrong-secret', evt())));
    ok('webhook: wrong secret -> 400', w.status === 400);
    w = await hook(evt() + ' ', 'sha256=' + (await hmacHex(SECRETS.BTCPAY_WEBHOOK_SECRET, evt())));
    ok('webhook: signature is over the exact raw body (altered body fails)', w.status === 400);
    ok('webhook: still no upstream reads after forgeries', fetchLog.filter(f => f.url.includes('/invoices/INV')).length === 2 /* the two verifies above */);

    // non-settled events do nothing
    invoiceState.status = 'Processing';
    for (const t of ['InvoiceCreated', 'InvoiceReceivedPayment', 'InvoiceProcessing', 'InvoicePaymentSettled']) {
      w = await hook(evt({ type: t }));
      ok('webhook: ' + t + ' -> 200 ignored, no email', w.status === 200 && w.text === 'ignored' && resendCalls === 0, w.text);
    }
    // settled event but API says not settled
    w = await hook(evt());
    ok('webhook: InvoiceSettled while API says Processing -> not_settled, no email', w.status === 200 && w.text === 'not_settled' && resendCalls === 0, w.text);

    // wrong store in the event
    w = await hook(evt({ storeId: 'OTHER' }));
    ok('webhook: event for another store -> ignored', w.status === 200 && w.text === 'ignored');
    // no order-id metadata (an invoice raised in the dashboard)
    w = await hook(evt({ metadata: {} }));
    ok('webhook: invoice without our order id -> ignored', w.status === 200 && w.text === 'ignored');
    // no record
    w = await hook(evt({ metadata: Object.assign({}, invoiceState.metadata, { orderId: 'ksbtc_' + 'f'.repeat(32) }) }));
    ok('webhook: settled event with no record -> 500 for redelivery', w.status === 500 && w.text === 'no_record');

    // settled, but wrong amount / store / metadata according to the API
    invoiceState.status = 'Settled';
    const saved = JSON.stringify(invoiceState);
    invoiceState.amount = '5.00';
    w = await hook(evt());
    ok('webhook: settled invoice with wrong amount -> mismatch, no email', w.status === 200 && w.text === 'mismatch' && resendCalls === 0);
    invoiceState = JSON.parse(saved); invoiceState.storeId = 'OTHER';
    w = await hook(evt());
    ok('webhook: settled invoice for wrong store -> mismatch', w.text === 'mismatch' && resendCalls === 0);
    invoiceState = JSON.parse(saved); invoiceState.currency = 'EUR';
    w = await hook(evt());
    ok('webhook: settled invoice in wrong currency -> mismatch', w.text === 'mismatch' && resendCalls === 0);
    invoiceState = JSON.parse(saved); invoiceState.metadata.buyerEmail = 'other@example.test';
    w = await hook(evt());
    ok('webhook: settled invoice with altered buyer email -> mismatch', w.text === 'mismatch' && resendCalls === 0);
    invoiceState = JSON.parse(saved); invoiceState.metadata.itemCode = 'rise-up:deluxe';
    w = await hook(evt());
    ok('webhook: settled invoice with altered item -> mismatch', w.text === 'mismatch' && resendCalls === 0);
    invoiceState = JSON.parse(saved); invoiceState.type = 'TopUp';
    w = await hook(evt());
    ok('webhook: top-up invoice refused', w.text === 'mismatch' && resendCalls === 0);
    invoiceState = JSON.parse(saved);
    const recBefore = await env.ORDERS.get(key, { type: 'json' });
    ok('webhook: record untouched by mismatches (no settledAt)', recBefore && !recBefore.settledAt && recBefore.emailedAt === null);

    // Resend down: record written, 500 for redelivery, no emailedAt
    script = (function (inner) { return async (u, init) => u.startsWith('https://api.resend.com/') ? (resendCalls++, jsonRes(500, { error: 'down' })) : inner(u, init); })(script);
    w = await hook(evt());
    let rec = await env.ORDERS.get(key, { type: 'json' });
    ok('webhook: Resend failure -> 500 email_failed, record settled, emailedAt null', w.status === 500 && w.text === 'email_failed' && rec.status === 'settled' && rec.emailedAt === null && resendCalls === 1, w.text + ' ' + JSON.stringify({ s: rec.status, e: rec.emailedAt }));
    ok('webhook: rescue link logged on send failure, no key in log', logLines.some(l => l.includes('rescue link') && l.includes(orderId)) && !logLines.some(l => l.includes(SECRETS.RESEND_API_KEY)));

    // Resend up: fulfil
    script = async (u, init) => {
      if (u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ') return jsonRes(200, invoiceState);
      if (u.startsWith('https://api.resend.com/')) { resendCalls++; lastMail = JSON.parse(init.body); return jsonRes(200, { id: 'mail1' }); }
      return jsonRes(500, {});
    };
    resendCalls = 0;
    w = await hook(evt());
    rec = await env.ORDERS.get(key, { type: 'json' });
    ok('webhook: settled + matching -> 200 ok, one email, emailedAt set', w.status === 200 && w.text === 'ok' && resendCalls === 1 && !!rec.emailedAt, w.text);
    ok('webhook: email to the recorded buyer with the order link', lastMail && lastMail.to[0] === 'buyer@example.test' && lastMail.text.includes(SITE + '/purchase-success?order=' + orderId) && lastMail.text.includes('373 MB'), lastMail && lastMail.to);
    ok('webhook: Resend called with Bearer key, BTCPay with token key', fetchLog.some(f => f.url.startsWith('https://api.resend.com/') && f.init.headers.Authorization === 'Bearer ' + SECRETS.RESEND_API_KEY));
    ok('webhook: record expiresAt = createdTime + 72h', rec.expiresAt === (invoiceState.createdTime + 72 * 3600) * 1000);

    // replay
    w = await hook(evt({ isRedelivery: true, deliveryId: 'D2', originalDeliveryId: 'D1' }));
    ok('webhook: replayed delivery -> already_sent, still one email', w.status === 200 && w.text === 'already_sent' && resendCalls === 1);
    w = await hook(evt());
    ok('webhook: exact duplicate body -> already_sent', w.text === 'already_sent' && resendCalls === 1);
    // manually marked settled is honoured and recorded
    const env2 = mkEnv(); env2.ORDERS.m = new Map(env.ORDERS.m); const r2 = JSON.parse(env2.ORDERS.m.get(key)); r2.emailedAt = null; r2.settledAt = null; env2.ORDERS.m.set(key, JSON.stringify(r2));
    const markedState = JSON.parse(JSON.stringify(invoiceState)); markedState.additionalStatus = 'Marked';
    script = async (u, init) => u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ' ? jsonRes(200, markedState) : (u.startsWith('https://api.resend.com/') ? jsonRes(200, {}) : jsonRes(500, {}));
    w = await hook(evt({ manuallyMarked: true }), undefined, env2);
    const r2b = await env2.ORDERS.get(key, { type: 'json' });
    ok('webhook: manually-marked settled fulfils and records the flag', w.text === 'ok' && r2b.manuallyMarked === true && r2b.additionalStatus === 'Marked');
    // expired / invalid notes
    const env3 = mkEnv(); env3.ORDERS.m = new Map(env.ORDERS.m); const r3 = JSON.parse(env3.ORDERS.m.get(key)); r3.settledAt = null; r3.status = 'created'; env3.ORDERS.m.set(key, JSON.stringify(r3));
    w = await hook(evt({ type: 'InvoiceExpired' }), undefined, env3);
    ok('webhook: InvoiceExpired noted on record', w.text === 'noted' && (await env3.ORDERS.get(key, { type: 'json' })).status === 'expired');
    // oversize body, missing secret
    w = await hook('x'.repeat(70000));
    ok('webhook: oversize body -> 413', w.status === 413);
    const noSecret = mkEnv(); delete noSecret.BTCPAY_WEBHOOK_SECRET;
    w = await hook(evt(), undefined, noSecret);
    ok('webhook: missing BTCPAY_WEBHOOK_SECRET -> 500 (redelivered later)', w.status === 500 && w.text === 'server_misconfigured');

    // verify: settled
    script = async (u) => u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ' ? jsonRes(200, invoiceState) : jsonRes(500, {});
    v = await read(await verify(req('/api/btcpay-verify?order=' + orderId), env));
    ok('verify: settled -> ok with token, email, expiresAt, emailed:true', v.status === 200 && v.json.ok === true && v.json.state === 'settled' && v.json.email === 'buyer@example.test' && v.json.reference === orderId && v.json.emailed === true && typeof v.json.token === 'string', v.text);
    ok('verify: response carries nothing but the six fields', Object.keys(v.json).sort().join(',') === 'email,emailed,expiresAt,ok,reference,state,token');
    const token = v.json.token;
    ok('verify: token = ref.exp.sig', token.split('.').length === 3 && token.startsWith(orderId + '.'));
    let vv = await read(await verify(req('/api/btcpay-verify?order=cs_test_abc'), env));
    ok('verify: Stripe-shaped id refused 400', vv.status === 400);
    vv = await read(await verify(req('/api/btcpay-verify?order=ksbtc_' + 'a'.repeat(32)), env));
    ok('verify: unknown order -> 404', vv.status === 404 && vv.json.error === 'not_found');
    const s2 = JSON.parse(JSON.stringify(invoiceState)); s2.status = 'Expired';
    script = async () => jsonRes(200, s2);
    vv = await read(await verify(req('/api/btcpay-verify?order=' + orderId), env));
    ok('verify: Expired -> 410 expired', vv.status === 410 && vv.json.error === 'expired');
    s2.status = 'Invalid';
    vv = await read(await verify(req('/api/btcpay-verify?order=' + orderId), env));
    ok('verify: Invalid -> 403 invalid', vv.status === 403 && vv.json.error === 'invalid');
    s2.status = 'Settled'; s2.amount = '1.00';
    vv = await read(await verify(req('/api/btcpay-verify?order=' + orderId), env));
    ok('verify: settled but wrong amount -> 403 wrong_product, no token', vv.status === 403 && !vv.json.token);
    s2.amount = '20.00'; s2.createdTime = now - 73 * 3600;
    vv = await read(await verify(req('/api/btcpay-verify?order=' + orderId), env));
    ok('verify: window closed -> 410', vv.status === 410 && vv.json.error === 'window_closed');

    // download with the BTCPay token
    script = async (u) => u === BTC + '/api/v1/stores/STORE123/invoices/INVabc123XYZ' ? jsonRes(200, invoiceState) : jsonRes(500, {});
    let d = await read(await download(req('/api/download?token=' + encodeURIComponent(token) + '&format=mp3'), env));
    ok('download: BTCPay token -> 200 zip stream', d.status === 200 && d.text === 'ZIPBYTES' && d.headers.get('content-type') === 'application/zip' && (d.headers.get('content-disposition') || '').includes('rise-up-mp3.zip'), d.text);
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(token) + '&format=wav'), env));
    ok('download: same token, WAV format', d.status === 200 && (d.headers.get('content-disposition') || '').includes('rise-up-wav.zip'));
    const forged = token.slice(0, -4) + 'AAAA';
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(forged)), env));
    ok('download: forged BTCPay token -> 403', d.status === 403 && d.json.error === 'bad_token');
    const otherKey = await signToken(orderId, now + 900, 'not-the-key');
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(otherKey)), env));
    ok('download: token signed with another key -> 403', d.status === 403);
    const expiredTok = await signToken(orderId, now - 10, SECRETS.DOWNLOAD_SIGNING_KEY);
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(expiredTok)), env));
    ok('download: expired token -> 401', d.status === 401);
    const junkTok = await signToken('order_abc', now + 900, SECRETS.DOWNLOAD_SIGNING_KEY);
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(junkTok)), env));
    ok('download: reference matching neither shape -> 400', d.status === 400);
    const unpaidState = JSON.parse(JSON.stringify(invoiceState)); unpaidState.status = 'Processing';
    script = async () => jsonRes(200, unpaidState);
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(token)), env));
    ok('download: valid token but invoice no longer Settled -> 402', d.status === 402 && d.json.error === 'unpaid');
    const wrongAmt = JSON.parse(JSON.stringify(invoiceState)); wrongAmt.amount = '2.00';
    script = async () => jsonRes(200, wrongAmt);
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(token)), env));
    ok('download: valid token but amount mismatch -> 403', d.status === 403 && d.json.error === 'wrong_product');
    const noBtc = mkEnv(); delete noBtc.BTCPAY_API_KEY;
    script = async () => jsonRes(200, invoiceState);
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(token)), noBtc));
    ok('download: BTCPay token with BTCPay unconfigured -> 500, key name not in body', d.status === 500 && !d.text.includes('BTCPAY_API_KEY'));

    // Stripe branch regression: unchanged behaviour with a cs_ token
    const stripeFrom = fetchLog.length;
    const stripeSession = { id: 'cs_test_abc123', status: 'complete', payment_status: 'paid', created: now - 60, currency: 'usd', amount_total: 2000, customer_details: { email: 'card@example.test' }, line_items: { data: [{ price: { id: 'price_digital' } }] }, payment_intent: { latest_charge: { refunded: false, amount_refunded: 0, disputed: false } } };
    let stripeCalls = 0;
    script = async (u, init) => { if (u.startsWith('https://api.stripe.com/v1/checkout/sessions/cs_test_abc123')) { stripeCalls++; ok('stripe: Bearer key sent to Stripe', init.headers.Authorization === 'Bearer ' + SECRETS.STRIPE_SECRET_KEY); return jsonRes(200, stripeSession); } return jsonRes(500, {}); };
    const sv = await read(await mods['verify'].onRequestGet({ request: req('/api/verify?session_id=cs_test_abc123'), env: mkEnv() }));
    ok('stripe verify: still ok with token', sv.status === 200 && sv.json.ok === true && typeof sv.json.token === 'string', sv.text);
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(sv.json.token) + '&format=mp3'), mkEnv()));
    ok('stripe download: cs_ token still streams via the Stripe branch', d.status === 200 && d.text === 'ZIPBYTES' && stripeCalls === 2, d.text);
    ok('stripe download: no BTCPay call was made for a Stripe token', !fetchLog.slice(stripeFrom).some(f => f.url.startsWith(BTC)), fetchLog.slice(stripeFrom).map(f => f.url).join(' '));
    const refunded = JSON.parse(JSON.stringify(stripeSession)); refunded.payment_intent.latest_charge.refunded = true;
    script = async () => jsonRes(200, refunded);
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(sv.json.token)), mkEnv()));
    ok('stripe download: refund gate still closes the door', d.status === 403 && d.json.error === 'refunded');
    const noStripe = mkEnv(); delete noStripe.STRIPE_SECRET_KEY;
    d = await read(await download(req('/api/download?token=' + encodeURIComponent(sv.json.token)), noStripe));
    ok('stripe download: missing STRIPE_SECRET_KEY still 500 (REQUIRED_ENV intact)', d.status === 500);
  }

  /* =====================================================================
     SECRET HYGIENE across everything captured
     ===================================================================== */
  {
    const leakBodies = bodies.filter(b => Object.values(SECRETS).some(s => b.includes(s)));
    ok('hygiene: no secret value in any response body (' + bodies.length + ' checked)', leakBodies.length === 0, leakBodies.slice(0, 2).join(' | '));
    const leakLogs = logLines.filter(l => Object.values(SECRETS).some(s => l.includes(s)));
    ok('hygiene: no secret value in any log line (' + logLines.length + ' checked)', leakLogs.length === 0, leakLogs.slice(0, 2).join(' | '));
    const emailInBodies = bodies.filter(b => b.includes('buyer@example.test') && !b.includes('"email":"buyer@example.test"') && !b.includes('ZIPBYTES'));
    ok('hygiene: buyer email appears only in the verify answer (' + emailInBodies.length + ' others)', emailInBodies.length === 0, emailInBodies.slice(0, 1).join(''));
    const authTargets = fetchLog.filter(f => f.init.headers && f.init.headers.Authorization).map(f => new URL(f.url).host);
    ok('hygiene: Authorization only ever sent to pay.example.test / api.resend.com / api.stripe.com', authTargets.every(h => ['pay.example.test', 'api.resend.com', 'api.stripe.com'].includes(h)), [...new Set(authTargets)].join(','));
  }

  console.error = realError;
  window.fetch = realFetch;
  return { results, logCount: logLines.length };
}
"""


def free_port():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port


def wait_for(url, seconds=10):
    for _ in range(int(seconds * 10)):
        try:
            urllib.request.urlopen(url, timeout=1)
            return True
        except Exception:
            time.sleep(0.1)
    return False


def main():
    port = free_port()
    base = 'http://127.0.0.1:%d' % port
    srv = subprocess.Popen([sys.executable, os.path.join(ROOT, 'scripts', 'serve.py'), str(port)], cwd=ROOT,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    failed = 0
    try:
        if not wait_for(base + '/purchase.html?cb=1'):
            print('serve.py did not come up on port', port)
            return 2
        with sync_playwright() as p:
            b = p.chromium.launch(channel='chromium')
            page = b.new_page(viewport={'width': 1440, 'height': 900})
            page_errors = []
            page.on('pageerror', lambda e: page_errors.append(str(e)))
            page.goto(base + '/purchase.html?cb=%d' % int(time.time()), wait_until='load')

            out = page.evaluate(HARNESS, {'base': base})
            for r in out['results']:
                mark = 'PASS' if r['pass'] else 'FAIL'
                if not r['pass']:
                    failed += 1
                line = '  %s  %s' % (mark, r['name'])
                if not r['pass'] and r['detail']:
                    line += '\n        -> ' + r['detail'][:300]
                print(line)
            total = len(out['results'])
            print('\n%d checks, %d failed, %d function log lines captured' % (total, failed, out['logCount']))

            if VISUAL:
                print('\n--- visual pass ---')
                # 1. purchase card with the Bitcoin form opened, desktop + phone
                page.goto(base + '/purchase.html?cb=%d' % int(time.time()), wait_until='load')
                page.wait_for_timeout(800)
                page.click('[data-ks-purchase-btc="digital"]')
                page.wait_for_timeout(300)
                state = page.evaluate("""() => {
                  const t = document.querySelector('[data-ks-purchase-btc="digital"]');
                  const f = document.querySelector('[data-ks-btcpay-form="digital"]');
                  const i = document.querySelector('#ks-btcpay-email-digital');
                  const cs = getComputedStyle(i);
                  return { expanded: t.getAttribute('aria-expanded'), formHidden: f.hidden, focused: document.activeElement === i,
                           fieldH: i.getBoundingClientRect().height, submitH: f.querySelector('button[type=submit]').getBoundingClientRect().height,
                           toggleH: t.getBoundingClientRect().height, bg: cs.backgroundColor, border: cs.borderColor,
                           cardCTAs: document.querySelectorAll('[data-ks-purchase]').length };
                }""")
                print('  card state:', json.dumps(state))
                okv = state['expanded'] == 'true' and not state['formHidden'] and state['focused'] and state['fieldH'] >= 44 and state['submitH'] >= 44 and state['toggleH'] >= 44 and state['cardCTAs'] == 3
                print('  %s  form opens, focuses the field, 44px targets, three Stripe CTAs intact' % ('PASS' if okv else 'FAIL'))
                if not okv:
                    failed += 1
                # client-side refusal without a round trip
                page.fill('#ks-btcpay-email-digital', 'not-an-address')
                page.click('.ks-btcpay__submit')
                page.wait_for_timeout(200)
                status = page.evaluate("() => { const s = document.querySelector('[data-ks-btcpay-status]'); return { hidden: s.hidden, text: s.textContent }; }")
                print('  bad email status:', json.dumps(status))
                if status['hidden'] or 'deliverable' not in status['text']:
                    failed += 1
                    print('  FAIL  client-side email refusal')
                else:
                    print('  PASS  client-side email refusal, no network')
                # a server refusal: intercept the endpoint
                page.route('**/api/btcpay-create-invoice', lambda route: route.fulfill(status=502, content_type='application/json', body='{"ok":false,"error":"upstream"}'))
                page.fill('#ks-btcpay-email-digital', 'buyer@example.test')
                page.click('.ks-btcpay__submit')
                page.wait_for_timeout(500)
                status = page.evaluate("() => { const s = document.querySelector('[data-ks-btcpay-status]'); const b = document.querySelector('.ks-btcpay__submit'); return { text: s.textContent, disabled: b.disabled, label: b.textContent }; }")
                print('  upstream refusal:', json.dumps(status))
                if 'could not be reached' not in status['text'] or status['disabled']:
                    failed += 1
                    print('  FAIL  server refusal copy / button re-enabled')
                else:
                    print('  PASS  server refusal shown, button re-enabled')
                page.unroute('**/api/btcpay-create-invoice')
                # duplicate-submission guard: a slow endpoint, two clicks, one request
                # The route is HELD, not fulfilled, so the request is genuinely
                # in flight while the second press lands.
                held = []
                page.route('**/api/btcpay-create-invoice', lambda route: held.append(route))
                page.click('.ks-btcpay__submit')
                page.wait_for_timeout(150)
                busy = page.evaluate("() => { const b = document.querySelector('.ks-btcpay__submit'); return { disabled: b.disabled, busy: b.getAttribute('aria-busy'), label: b.textContent }; }")
                page.click('.ks-btcpay__submit', force=True)
                page.keyboard.press('Enter')
                page.wait_for_timeout(300)
                requests_made = len(held)
                for route in held:
                    route.fulfill(status=502, content_type='application/json', body='{"ok":false,"error":"upstream"}')
                page.wait_for_timeout(300)
                print('  in-flight state:', json.dumps(busy), 'requests:', requests_made)
                if requests_made != 1 or not busy['disabled'] or busy['busy'] != 'true':
                    failed += 1
                    print('  FAIL  duplicate submission guard')
                else:
                    print('  PASS  duplicate submission guard (1 request for 2 presses)')
                page.unroute('**/api/btcpay-create-invoice')
                shot = os.path.join(OUT_DIR, 'purchase-btc-open-1440.png')
                page.locator('[data-ks-edition="digital"]').screenshot(path=shot)
                print('  wrote', shot)
                page.set_viewport_size({'width': 390, 'height': 844})
                page.wait_for_timeout(300)
                shot = os.path.join(OUT_DIR, 'purchase-btc-open-390.png')
                page.locator('[data-ks-edition="digital"]').screenshot(path=shot)
                print('  wrote', shot)
                overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
                print('  %s  no horizontal overflow at 390 (delta %d)' % ('PASS' if overflow <= 0 else 'FAIL', overflow))
                if overflow > 0:
                    failed += 1
                page.set_viewport_size({'width': 1440, 'height': 900})

                # 2. success page, Bitcoin states via interception
                order = 'ksbtc_' + 'ab12' * 8
                for name, status, body in [
                    ('pending-new', 402, {'ok': False, 'error': 'pending', 'state': 'new', 'checkoutLink': 'https://pay.kundalinispines.com/i/EXAMPLE'}),
                    ('pending-processing', 402, {'ok': False, 'error': 'pending', 'state': 'processing'}),
                    ('settled', 200, {'ok': True, 'state': 'settled', 'email': 'buyer@example.test', 'reference': order, 'token': order + '.1.sig', 'expiresAt': int(time.time() * 1000) + 3600000, 'emailed': True}),
                    ('expired', 410, {'ok': False, 'error': 'expired'}),
                    ('invalid', 403, {'ok': False, 'error': 'invalid'}),
                ]:
                    page.route('**/api/btcpay-verify*', (lambda st, bd: (lambda route: route.fulfill(status=st, content_type='application/json', body=json.dumps(bd))))(status, body))
                    page.goto(base + '/purchase-success.html?order=%s&cb=%d' % (order, int(time.time())), wait_until='load')
                    page.wait_for_timeout(700)
                    seen = page.evaluate("""() => {
                      const vis = [...document.querySelectorAll('[data-ks-state]')].filter(e => !e.hidden).map(e => e.getAttribute('data-ks-state'));
                      const txt = (sel) => { const e = document.querySelector(sel); return e && !e.hidden ? e.textContent.trim() : null; };
                      return { visible: vis, provider: [...document.querySelectorAll('[data-ks-provider-name]')].map(e => e.textContent), ref: txt('[data-ks-session-ref]'),
                               pending: txt('[data-ks-pending-copy]'), resume: (function(){ const a = document.querySelector('[data-ks-resume]'); return a && !a.hidden ? a.getAttribute('href') : null; })(),
                               mp3: (function(){ const a = document.querySelector('[data-ks-download="mp3"]'); return a ? a.getAttribute('href') : null; })(),
                               mail: txt('[data-ks-mail-note]'), err: txt('[data-ks-error-copy]') };
                    }""")
                    page.unroute('**/api/btcpay-verify*')
                    shot = os.path.join(OUT_DIR, 'success-btc-%s.png' % name)
                    page.locator('[data-ks-verify]').screenshot(path=shot)
                    exp = {'pending-new': 'pending', 'pending-processing': 'pending', 'settled': 'ok', 'expired': 'error', 'invalid': 'error'}[name]
                    good = seen['visible'] == [exp] and all(p == 'BTCPay Server' for p in seen['provider'])
                    if name == 'pending-new':
                        good = good and seen['resume'] == 'https://pay.kundalinispines.com/i/EXAMPLE' and 'No payment' in (seen['pending'] or '')
                    if name == 'pending-processing':
                        good = good and seen['resume'] is None and 'confirmation' in (seen['pending'] or '')
                    if name == 'settled':
                        good = good and (seen['mp3'] or '').startswith('/api/download?token=' + order) and 'BTCPay receipt' in (seen['mail'] or '') and order in (seen['ref'] or '')
                    if name == 'invalid':
                        good = good and 'invalid' in (seen['err'] or '')
                    print('  %s  success page state %s -> %s' % ('PASS' if good else 'FAIL', name, json.dumps(seen)[:220]))
                    if not good:
                        failed += 1
                    print('  wrote', shot)

                # 3. the Stripe success page still renders from /api/verify
                page.route('**/api/verify*', lambda route: route.fulfill(status=200, content_type='application/json', body=json.dumps({'ok': True, 'email': 'card@example.test', 'reference': 'cs_test_abc', 'token': 'cs_test_abc.1.sig', 'expiresAt': int(time.time() * 1000) + 3600000, 'emailed': False})))
                page.goto(base + '/purchase-success.html?session_id=cs_test_abc&cb=%d' % int(time.time()), wait_until='load')
                page.wait_for_timeout(700)
                seen = page.evaluate("""() => ({ visible: [...document.querySelectorAll('[data-ks-state]')].filter(e => !e.hidden).map(e => e.getAttribute('data-ks-state')), provider: [...document.querySelectorAll('[data-ks-provider-name]')].map(e => e.textContent), mail: document.querySelector('[data-ks-mail-note]').textContent, mp3: document.querySelector('[data-ks-download="mp3"]').getAttribute('href') })""")
                page.unroute('**/api/verify*')
                good = seen['visible'] == ['ok'] and all(p == 'Stripe' for p in seen['provider']) and 'Stripe' in seen['mail'] and seen['mp3'].startswith('/api/download?token=cs_test_abc')
                print('  %s  Stripe success page unchanged -> %s' % ('PASS' if good else 'FAIL', json.dumps(seen)[:200]))
                if not good:
                    failed += 1

            if page_errors:
                print('\nPAGE ERRORS:', page_errors)
                failed += len(page_errors)
            b.close()
    finally:
        srv.terminate()
    print('\nRESULT:', 'FAILED (%d)' % failed if failed else 'ALL PASSED')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())

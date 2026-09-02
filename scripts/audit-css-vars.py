#!/usr/bin/env python3
r"""Find every var(--token) with no fallback whose token is UNDEFINED on the
elements that actually use it, page by page, in a real browser.

    python scripts/audit-css-vars.py                 # the ten public pages
    python scripts/audit-css-vars.py merch.html      # one page
    python scripts/audit-css-vars.py --port 8051 ... # if 8050 is taken

Exit code is the number of undefined-token uses found (0 = clean).

WHY THIS EXISTS. V2HANDOFF 57 item 9: `rgba(var(--node-color), 0.75)` in
css/site-footer.css was invalid at computed-value time on five of six pages,
because only index.html links css/spine-doc.css where --node-color lives. An
invalid custom-property value does NOT fall back to an earlier declaration of
the same property — it computes to `unset` — so seven frequency labels printed
in pure black on a night sky, silently, since the footer shipped. Three bugs
in one file had the same cause. Nothing tested a stylesheet against the page
that loads it. This does.

WHY A BROWSER AND NOT grep. The question is not "does any file define the
token" but "is the token defined on THIS element on THIS page", which depends
on the <link> tags the page really has (comments mention stylesheets that are
not linked — handoff 57's `grep -c` trap), on JS-injected <style> blocks, and
on the cascade. getComputedStyle(el).getPropertyValue(token) answers exactly
that question and nothing else does.

WHAT IT WALKS. Every same-origin stylesheet in document.styleSheets, including
the <style> elements scripts inject (site-footer.js, spine-bg.js, the tuner),
recursing into @media / @supports. For each declaration containing
`var(--x)` with no comma after the name, it finds the elements the selector
matches and reads the token off each one. It also checks inline style=""
and SVG fill=/stroke= attributes that carry var().

TWO FALSE POSITIVES IT HAD TO LEARN (Sept 1 2026):
  1. `:root` rules. Stripping pseudo-classes turned `:root` into `*`, so every
     `--bg-primary: var(--color-black)` in tokens.css was tested against 1033
     elements — twelve of which sit inside `all: initial`-style resets where no
     token exists. The rule applies to <html> alone. Now the selector is tried
     verbatim first and only stripped of :hover/::before-style pseudos when it
     matches nothing, with :root rewritten to html.
  2. State selectors (:hover, ::before) match nothing at rest, so their
     declarations would never be checked. Stripping the pseudos tests the
     resting element instead, which is the same element that will hover.

WHAT IT CANNOT SEE. CSS a script builds only in a state that is not active at
load (a class added on scroll, a hover-only injected rule). Complement it with
    grep -noE "var\(\s*--[A-Za-z0-9_-]+\s*\)" js/*.js js/field/*.js
and check each token by hand against the pages that load the script. The
Sept 1 2026 sweep found twelve such strings, all defined on every loading
page, two of them inside comments.

It spawns its own scripts/serve.py (never python -m http.server — see that
file) on --port and tears it down, and it launches ONE Chrome and visits the
pages in sequence. Runs headless; the footer sky here is CSS, not a canvas,
so headless reads the same computed values headed does (handoff 57).
"""
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ["index.html", "about.html", "archive.html", "connect.html", "merch.html",
          "music.html", "transmissions.html", "purchase.html",
          "purchase-success.html", "purchase-cancelled.html"]

JS = r"""
() => {
  const out = [];
  const re = /var\(\s*(--[A-Za-z0-9_-]+)\s*\)/g;   // var(--x) with NO fallback
  const seen = new Set();
  function elementsFor(selectorText) {
    let els = [];
    try { els = [...document.querySelectorAll(selectorText)]; } catch (e) {}
    if (els.length === 0) {
      // :hover / ::before match nothing at rest: test the resting element. Keep :root as html.
      const sel = selectorText.replace(/:root/g, 'html').replace(/::?[a-zA-Z-]+(\([^)]*\))?/g, '');
      try { els = [...document.querySelectorAll(sel || 'html')]; } catch (e) { els = []; }
    }
    return els;
  }
  function walk(rules, src) {
    for (const r of rules) {
      if (r.cssRules && !(r instanceof CSSStyleRule)) { walk(r.cssRules, src); continue; }
      if (!(r instanceof CSSStyleRule)) continue;
      const st = r.style;
      for (let i = 0; i < st.length; i++) {
        const prop = st[i];
        const val = st.getPropertyValue(prop);
        if (!val.includes('var(')) continue;
        let m; re.lastIndex = 0;
        while ((m = re.exec(val))) {
          const tok = m[1];
          const key = src + '|' + r.selectorText + '|' + prop + '|' + tok;
          if (seen.has(key)) continue; seen.add(key);
          const before = val.slice(0, m.index);
          const nested = /var\(\s*--[A-Za-z0-9_-]+\s*,[^)]*$/.test(before);  // sits inside another var()'s fallback
          const els = elementsFor(r.selectorText);
          let undefinedOn = 0;
          for (const el of els) if (getComputedStyle(el).getPropertyValue(tok).trim() === '') undefinedOn++;
          out.push({ src, selector: r.selectorText, prop, tok, nested, matched: els.length, undefinedOn });
        }
      }
    }
  }
  for (const s of document.styleSheets) {
    let rules; try { rules = s.cssRules; } catch (e) { continue; }   // cross-origin (fonts) — skip
    const node = s.ownerNode;
    const src = s.href ? s.href.replace(location.origin + '/', '').split('?')[0]
                       : '<style' + (node && node.id ? '#' + node.id : '') + '>';
    walk(rules, src);
  }
  for (const el of document.querySelectorAll('[style*="var("],[fill*="var("],[stroke*="var("]')) {
    for (const a of ['style', 'fill', 'stroke']) {
      const v = el.getAttribute(a); if (!v || !v.includes('var(')) continue;
      let m; re.lastIndex = 0;
      while ((m = re.exec(v))) {
        const tok = m[1];
        const und = getComputedStyle(el).getPropertyValue(tok).trim() === '';
        const name = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
          (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '');
        out.push({ src: 'attr:' + a, selector: name, prop: a, tok, nested: false, matched: 1, undefinedOn: und ? 1 : 0 });
      }
    }
  }
  return out;
}
"""


def main(argv):
    port = 8050
    pages = []
    it = iter(argv)
    for a in it:
        if a == "--port":
            port = int(next(it))
        else:
            pages.append(a)
    pages = pages or PUBLIC

    from playwright.sync_api import sync_playwright  # pip package; see kundalini-session-start

    srv = subprocess.Popen([sys.executable, str(ROOT / "scripts" / "serve.py"), str(port)],
                           cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    total_bad = 0
    try:
        for _ in range(50):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/index.html?cb=1", timeout=1)
                break
            except Exception:
                time.sleep(0.2)
        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chromium")
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            for pg in pages:
                page.goto(f"http://127.0.0.1:{port}/{pg}?cb={int(time.time())}", wait_until="load")
                page.wait_for_timeout(1200)
                # scroll to the foot so lazily-mounted sections and the footer exist
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(600)
                rows = page.evaluate(JS)
                bad = [r for r in rows if r["undefinedOn"] > 0]
                total_bad += len(bad)
                print(f"== {pg}: {len(rows)} no-fallback var() uses, {len(bad)} with the token undefined on a matched element")
                for r in bad:
                    flag = "  (inside another var() fallback)" if r["nested"] else ""
                    print(f"   {r['src']:28s} {r['selector'][:48]:48s} {r['prop']:22s} {r['tok']:26s} "
                          f"undefined on {r['undefinedOn']}/{r['matched']}{flag}")
            browser.close()
    finally:
        srv.terminate()
    print(f"TOTAL undefined-token uses: {total_bad}")
    return min(total_bad, 125)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

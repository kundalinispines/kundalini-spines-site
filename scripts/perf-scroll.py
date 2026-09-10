"""Scroll-performance loop for the home page (or any page) in the INSTALLED Firefox and in Playwright's Chromium.

WHY THIS EXISTS (Sept 8 2026). Visitors on Firefox said the home page did not feel snappy; Chromium felt
fine. Nothing in the repo could measure that, and Playwright's Firefox build is not installed here (only
Chromium is). This script drives the stock Firefox on the box instead — no driver, no download: a
throwaway profile, the Gecko profiler armed through environment variables, and a small probe script
injected into a temporary copy of the page. The probe measures requestAnimationFrame intervals at rest
and during a six-second scripted scroll, then POSTs the numbers back to a local receiver. The same probe
runs in Chromium as the control. `analyze` reads the profile the Firefox run leaves behind.

WHAT IT FOUND, so the next reader does not have to rediscover it: Firefox ran the scroll at a ~10 ms
frame mean against Chromium's 4.2 (both on a 240 Hz display, so 4.2 is the floor). 75% of the main
thread was style computation. Two causes, both invisible in Chromium because Blink only restyles the
elements that reference a changed custom property while Gecko restyles every element when an inherited
custom property changes on <html>: (1) js/spine-bg.js wrote --charge on <html> every scroll frame —
~500 whole-document restyles of 600–1,700 elements in six seconds; (2) the rail ticks in
css/spine-doc.css carried CSS transitions on values that retarget every frame — 43,000 transition
restarts in six seconds. Fixed by writing --charge on the layer, moving the rail's low-pass filter into
js/spine-doc.js, scoping --df-lum to its wrapper and rounding --df-sky. Firefox went 10.1 → 5.1 ms;
Chromium unchanged; rendering pixel-identical at rest.

WHAT IT DOES NOT MEASURE: real wheel input. The scroll is window.scrollTo() per frame. In Firefox real
scrolling runs on the compositor (APZ), so the *scroll* itself stays smooth even when the main thread is
busy; what the busy main thread costs is scroll-linked effects lagging and input feeling late. The
per-frame cost this measures is that cost.

USAGE (repo root; nothing else may be using the ports it picks, and close your own Firefox first —
it kills only the instances it started, by pid):
    python scripts/perf-scroll.py run firefox            # writes perf-out/result-firefox.json + profile-firefox.json
    python scripts/perf-scroll.py run chromium           # the control
    python scripts/perf-scroll.py run firefox mylabel about.html
    python scripts/perf-scroll.py analyze perf-out/profile-firefox.json scroll   # window on a probe phase
Environment knobs for the Firefox run: FFPROFILE=0 (no profiler), FFHEADLESS=1, STRIP=a.js,b.css
(drop matching <script src>/<link> lines from the temporary copy — the bisection that found the two
scripts), SHIM=path.js (inject a script at the top of <head>, before any site script — how each fix was
tested before it was written into the repo), WINPOS=x,y (both browsers: put the window's top-left at
that point of the Windows virtual screen, which is how a run lands on a secondary display — the
frame floor for CHROMIUM is the refresh rate of whichever display the window sits on — Firefox on
Windows paces from the primary display wherever its window is, so for a 60 Hz Firefox run use
FFRATE=60 as well, or set the primary display to 60 Hz. The box's own display is 240 Hz. Read the
positions off EnumDisplayDevices/EnumDisplaySettings; a negative x is a display left of the primary).
FFRATE=60 (Firefox only: cap the refresh driver at that rate; see the comment where it is applied).

Output goes to perf-out/ (gitignored is NOT set up — do not commit it; the profiles are ~90 MB each).
The temporary page copy is _perf-probe.html in the repo root and is deleted on exit, even on failure.
Requires: the installed Firefox at the path below, Playwright (Python) with Chromium for the control.
"""
import collections
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "perf-out")
FIREFOX = r"C:\Program Files\Mozilla Firefox\firefox.exe"
NL = chr(10)

# The probe. Injected before </body> of a temporary copy of the page; never shipped. It marks each
# phase with performance.mark so the Gecko profile can be windowed on it (see analyze).
PROBE = r"""
/* [PERF-PROBE] injected only into the throwaway copy of the page; never shipped. */
(function () {
  var R = { ua: navigator.userAgent, phases: {}, longTasks: [] };
  function frames(dur, tick, label) {
    return new Promise(function (res) {
      if (label) performance.mark('PERF-PROBE:' + label + ':start');
      var d = [], last = performance.now(), end = last + dur;
      function f(t) { d.push(t - last); last = t; if (tick) tick(t); if (t < end) requestAnimationFrame(f); else { if (label) performance.mark('PERF-PROBE:' + label + ':end'); res(d); } }
      requestAnimationFrame(f);
    });
  }
  function stats(d) {
    d = d.slice(1).sort(function (a, b) { return a - b; }); var n = d.length;
    function p(q) { return d[Math.min(n - 1, Math.floor(q * n))]; }
    var sum = 0; for (var i = 0; i < n; i++) sum += d[i];
    return { frames: n, mean: +(sum / n).toFixed(1), p50: +p(.5).toFixed(1), p95: +p(.95).toFixed(1), max: +Math.max.apply(null, d).toFixed(1),
             over33: d.filter(function (x) { return x > 33; }).length, over100: d.filter(function (x) { return x > 100; }).length };
  }
  try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { R.longTasks.push(Math.round(e.duration)); }); }).observe({ type: 'longtask', buffered: true }); R.longTaskSupport = true; } catch (e) { R.longTaskSupport = false; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  window.addEventListener('load', async function () {
    var nav = performance.getEntriesByType('navigation')[0];
    R.load = nav ? { dcl: Math.round(nav.domContentLoadedEventEnd) } : null;
    await sleep(1500);
    R.phases.idleTop = stats(await frames(4000, null, 'idleTop'));
    var H = document.documentElement.scrollHeight - innerHeight, start = performance.now();
    R.phases.scroll = stats(await frames(6000, function (t) { window.scrollTo(0, Math.min(H, (t - start) / 6000 * H)); }, 'scroll'));
    R.phases.idleBottom = stats(await frames(3000, null, 'idleBottom'));
    window.scrollTo(0, Math.round(H * 0.45)); await sleep(400);
    R.phases.idleMid = stats(await frames(3000, null, 'idleMid'));
    var music = document.querySelector('.df-bg') || document.getElementById('tracks');
    if (music) {
      var mt = music.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.round(mt + 40)); await sleep(2500);
      R.phases.idleMusic = stats(await frames(4000, null, 'idleMusic'));
    }
    window.scrollTo(0, 0); await sleep(400);
    R.phases.idleTopAgain = stats(await frames(3000, null, 'idleTopAgain'));
    var res = performance.getEntriesByType('resource');
    R.resources = res.length; R.transferKB = Math.round(res.reduce(function (a, e) { return a + (e.transferSize || 0); }, 0) / 1024);
    R.canvases = document.querySelectorAll('canvas').length;
    fetch('http://127.0.0.1:__RESPORT__/report', { method: 'POST', mode: 'no-cors', body: JSON.stringify(R) });
  });
})();
"""


def free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


def firefox_pids():
    out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq firefox.exe", "/FO", "CSV", "/NH"], capture_output=True, text=True).stdout
    return {line.split(",")[1].strip('"') for line in out.splitlines() if line.startswith('"firefox.exe"')}


def run(browser, label, page):
    os.makedirs(OUT, exist_ok=True)
    winpos = [int(v) for v in os.environ["WINPOS"].split(",")] if os.environ.get("WINPOS") else None
    site_port, res_port = free_port(), free_port()
    result = {}

    class H(BaseHTTPRequestHandler):
        def do_POST(self):
            n = int(self.headers.get("Content-Length", 0))
            result["r"] = json.loads(self.rfile.read(n))
            self.send_response(204); self.end_headers()

        def log_message(self, *a):
            pass

    srv_res = HTTPServer(("127.0.0.1", res_port), H)
    threading.Thread(target=srv_res.serve_forever, daemon=True).start()

    src = open(os.path.join(REPO, page), "rb").read().decode("utf-8")
    assert src.count("</body>") == 1, "the page needs exactly one </body>"
    strip = [s for s in os.environ.get("STRIP", "").split(",") if s]
    if strip:
        kept, dropped = [], []
        for line in src.split(NL):
            l = line.strip()
            if (l.startswith("<script src=") or l.startswith('<link rel="stylesheet"')) and any(s in l for s in strip):
                dropped.append(l)
            else:
                kept.append(line)
        src = NL.join(kept)
        print("stripped:", dropped)
    shim_path = os.environ.get("SHIM")
    if shim_path:
        assert src.count("<head>") == 1
        src = src.replace("<head>", "<head><script>" + open(shim_path, encoding="utf-8").read() + "</script>", 1)
        print("shim:", os.path.basename(shim_path))
    probe = PROBE.replace("__RESPORT__", str(res_port))
    probe_name = "_perf-probe.html"
    open(os.path.join(REPO, probe_name), "wb").write(src.replace("</body>", "<script>" + probe + "</script></body>").encode("utf-8"))
    # scripts/serve.py, never python -m http.server: the stock server answers media without Accept-Ranges
    # and every video seek clamps to 0 (see the header of scripts/serve.py).
    site = subprocess.Popen([sys.executable, "scripts/serve.py", str(site_port)], cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    url = f"http://127.0.0.1:{site_port}/{probe_name}?cb={int(time.time())}"
    prof_out = os.path.join(OUT, f"profile-{label}.json")
    try:
        time.sleep(1.2)
        if browser == "firefox":
            before = firefox_pids()
            prof = tempfile.mkdtemp(prefix="ffperf-profile-")
            prefs = [
                'user_pref("browser.shell.checkDefaultBrowser", false);',
                'user_pref("browser.startup.homepage_override.mstone", "ignore");',
                'user_pref("browser.aboutwelcome.enabled", false);',
                'user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);',
                'user_pref("browser.sessionstore.resume_from_crash", false);',
                'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);',
                'user_pref("browser.newtabpage.enabled", false);',
            ]
            if os.environ.get("FFRATE"):
                # Firefox on Windows paces every window from the PRIMARY display's vsync (measured Sept 10
                # 2026: a window placed on the 59 Hz display still ran rAF at 4.2 ms on the 240 Hz box), so
                # WINPOS alone cannot give Firefox a 60 Hz floor. This pref caps Gecko's refresh driver at
                # the given rate — a software clock, not a display's vsync, but the per-frame main-thread
                # work it schedules is the same work a 60 Hz user's Firefox does. The true-vsync route is
                # to set the primary display to 60 Hz for the run.
                prefs.append('user_pref("layout.frame_rate", %d);' % int(os.environ["FFRATE"]))
            open(os.path.join(prof, "user.js"), "w").write(NL.join(prefs))
            if winpos:
                # Firefox has no command-line position flag; the main window reads its last position from
                # the profile's xulstore.json, so a fresh profile with this file opens where we say.
                # Only the position: the size still comes from -width/-height so the run stays comparable.
                json.dump({"chrome://browser/content/browser.xhtml": {"main-window": {
                    "screenX": str(winpos[0]), "screenY": str(winpos[1]), "sizemode": "normal"}}},
                          open(os.path.join(prof, "xulstore.json"), "w"))
            env = dict(os.environ)
            if os.environ.get("FFPROFILE", "1") == "1":
                # MOZ_PROFILER_SHUTDOWN writes the profile when Firefox closes CLEANLY, which is why the
                # instance is closed with a plain taskkill (WM_CLOSE) below and /F only as a last resort.
                env.update({"MOZ_PROFILER_STARTUP": "1", "MOZ_PROFILER_SHUTDOWN": prof_out,
                            "MOZ_PROFILER_STARTUP_FEATURES": "js,stackwalk,cpu,markers",
                            "MOZ_PROFILER_STARTUP_INTERVAL": "1"})
            args = [FIREFOX, "-no-remote", "-new-instance", "-profile", prof, "-width", "1440", "-height", "900"]
            if os.environ.get("FFHEADLESS") == "1":
                args.append("-headless")
            subprocess.Popen(args + [url], env=env)
            t0 = time.time()
            while "r" not in result and time.time() - t0 < 90:
                time.sleep(0.5)
            pids = firefox_pids() - before
            for pid in pids:
                subprocess.run(["taskkill", "/PID", pid], capture_output=True)
            for _ in range(60):
                if not (firefox_pids() - before):
                    break
                time.sleep(0.5)
            else:
                for pid in pids:
                    subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True)
            shutil.rmtree(prof, ignore_errors=True)
        else:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                # Headless has no window, so it cannot sit on a display: a WINPOS run is headed, and its
                # frame floor is that display's refresh rate. The default headless run keeps the UA
                # "HeadlessChrome" and paced at the primary display (measured: 4.2 ms on the 240 Hz box).
                b = p.chromium.launch(channel="chromium",   # full Chrome for Testing, not the headless shell
                                      headless=not winpos,
                                      args=([f"--window-position={winpos[0]},{winpos[1]}", "--window-size=1456,1000"] if winpos else []))
                pg = b.new_page(viewport={"width": 1440, "height": 900})
                pg.goto(url, wait_until="load")
                t0 = time.time()
                while "r" not in result and time.time() - t0 < 90:
                    time.sleep(0.5)
                b.close()
    finally:
        site.terminate(); srv_res.shutdown()
        try:
            os.remove(os.path.join(REPO, probe_name))
        except OSError:
            pass
    r = result.get("r")
    if not r:
        print("NO REPORT"); sys.exit(2)
    json.dump(r, open(os.path.join(OUT, f"result-{label}.json"), "w"), indent=1)
    lt = sorted(r["longTasks"], reverse=True)
    print(f"[{label}] {r['ua'].split(') ')[-1]}  dcl {r['load']}  resources {r['resources']} ({r['transferKB']} KB)  canvases {r['canvases']}  longTasks {len(lt)} {lt[:6]}")
    for k, v in r["phases"].items():
        print(f"  {k:13s} frames {v['frames']:4d}  mean {v['mean']:6.1f}  p50 {v['p50']:6.1f}  p95 {v['p95']:6.1f}  max {v['max']:7.1f}  >33ms {v['over33']:3d}  >100ms {v['over100']:3d}")
    if browser == "firefox" and os.path.exists(prof_out):
        print("  profile:", prof_out, os.path.getsize(prof_out) // 1024, "KB")


# ---------------------------------------------------------------------------------------------------
# analyze: the raw Gecko profile MOZ_PROFILER_SHUTDOWN writes (tables are {schema, data} pairs; rows may
# be shorter than the schema, hence col()). Windows on a probe phase through its UserTiming markers.
# ---------------------------------------------------------------------------------------------------
def col(row, i):
    return row[i] if (i is not None and len(row) > i) else None


def analyze(path, phase):
    P = json.load(open(path, encoding="utf-8"))

    def walk(p):
        for t in p.get("threads", []):
            yield p, t
        for c in p.get("processes", []):
            yield from walk(c)

    def strings(t):
        return t.get("stringTable") or []

    win = None
    if phase:
        for proc, t in walk(P):
            m = t.get("markers")
            if not m or "schema" not in m:
                continue
            sch = m["schema"]; st = strings(t); S = []; E = []
            for row in m["data"]:
                nm0 = col(row, sch["name"]); nm = st[nm0] if isinstance(nm0, int) else nm0
                d = col(row, sch.get("data"))
                if nm == "UserTiming" and isinstance(d, dict):
                    lab = d.get("name") or d.get("entryName") or ""
                    if lab == f"PERF-PROBE:{phase}:start": S.append(col(row, sch["startTime"]))
                    if lab == f"PERF-PROBE:{phase}:end": E.append(col(row, sch["startTime"]))
            if S and E:
                win = (min(S), max(E)); break
        print("window for", phase, ":", win and [round(x) for x in win])
        if not win:
            print("no such phase in this profile"); return

    rows = []
    for proc, t in walk(P):
        s = t.get("samples")
        if not s or "schema" not in s or not s["data"]:
            continue
        sch = s["schema"]; ti = sch["time"]; ci = sch.get("threadCPUDelta")
        sel = [r for r in s["data"] if len(r) > ti and r[ti] is not None and (win is None or win[0] <= r[ti] <= win[1])]
        if not sel:
            continue
        cpu = sum(((col(r, ci) or 0)) for r in sel) / 1e6 if ci is not None else None
        dur = (win[1] - win[0]) if win else (sel[-1][ti] - sel[0][ti])
        pname = proc.get("meta", {}).get("processName") or proc.get("meta", {}).get("processType")
        rows.append((t.get("name"), pname, len(sel), cpu, dur, t, sel))
    rows.sort(key=lambda r: -(r[3] or 0))
    print(f"{'thread':22s} {'process':16s} {'samples':>8s} {'cpu ms':>8s} {'cpu %':>6s}")
    for name, pname, n, cpu, dur, t, sel in rows[:6]:
        pct = (cpu / dur * 100) if (cpu is not None and dur) else 0
        print(f"{str(name)[:22]:22s} {str(pname)[:16]:16s} {n:8d} {round(cpu) if cpu is not None else '-':>8} {pct:6.1f}")

    # the content main thread with the most CPU is the page
    cats = [c["name"] for c in P["meta"]["categories"]]
    for name, pname, n, cpu, dur, t, sel in rows:
        if name != "GeckoMain" or "parent" in str(pname).lower():
            continue
        ssch = t["stackTable"]["schema"]; sdata = t["stackTable"]["data"]
        fsch = t["frameTable"]["schema"]; fdata = t["frameTable"]["data"]; st = strings(t)
        sch = t["samples"]["schema"]; si = sch["stack"]; ci = sch.get("threadCPUDelta")
        by_cat = collections.Counter(); by_fn = collections.Counter(); by_pair = collections.Counter()
        for r in sel:
            w = ((col(r, ci) or 0) / 1e6) if ci is not None else 1
            cur = col(r, si); seen = set(); cat = None; jsfn = None; label = None
            while cur is not None and cur not in seen:
                seen.add(cur); fr = fdata[col(sdata[cur], ssch["frame"])]
                lc = col(fr, fsch["location"]); lcs = str(st[lc] if isinstance(lc, int) else lc)
                if cat is None: cat = col(fr, fsch.get("category"))
                if label is None and not lcs.startswith("0x") and "/js/" not in lcs: label = lcs.split(" http")[0][:34]
                if "/js/" in lcs: jsfn = lcs.split(" (http")[0][:30] + " @" + lcs.split("/js/")[1].split(")")[0][:36]
                cur = col(sdata[cur], ssch["prefix"])
            by_cat[cats[cat] if cat is not None else "?"] += w
            by_fn[jsfn or "(no site js on stack)"] += w
            by_pair[(jsfn or "-", label or "-")] += w
        print(f"\ncontent main thread: {cpu:.0f} ms CPU in {dur:.0f} ms")
        print("by Gecko category:"); [print(f"   {v:7.0f}  {k}") for k, v in by_cat.most_common(8)]
        print("by deepest site JS function on the stack:"); [print(f"   {v:7.0f}  {k}") for k, v in by_fn.most_common(10)]
        print("by function x Gecko label:"); [print(f"   {v:7.0f}  {k}") for k, v in by_pair.most_common(12)]

        # style flushes, attributed to the code that forced them; elementsStyled > 300 is a whole-document restyle here
        m = t["markers"]; msch = m["schema"]
        agg = collections.defaultdict(lambda: [0, 0.0, 0, 0]); trans = collections.Counter()

        def frames_of(sidx):
            out = []; cur = sidx; seen = set()
            while cur is not None and cur not in seen and len(out) < 80:
                seen.add(cur); fr = fdata[col(sdata[cur], ssch["frame"])]; lc = col(fr, fsch["location"])
                out.append(str(st[lc] if isinstance(lc, int) else lc)); cur = col(sdata[cur], ssch["prefix"])
            return out

        for row in m["data"]:
            nm0 = col(row, msch["name"]); nm = st[nm0] if isinstance(nm0, int) else nm0
            s0 = col(row, msch["startTime"]); e0 = col(row, msch["endTime"])
            if s0 is None or (win and not (win[0] <= s0 <= win[1])):
                continue
            d = col(row, msch.get("data")) or {}
            if nm == "CSS transition" and isinstance(d, dict):
                trans[(d.get("property"), str(d.get("Target", ""))[:40])] += 1
            if nm != "Styles" or e0 is None:
                continue
            es = d.get("elementsStyled") or 0
            stk = d.get("stack"); key = "(no stack)"
            if isinstance(stk, dict) and stk.get("samples", {}).get("data"):
                sd = stk["samples"]["data"][0]; fr = frames_of(sd[stk["samples"]["schema"]["stack"]])
                js = [f for f in fr if "/js/" in f]
                key = (js[0].split(" (http")[0][:30] + " @" + js[0].split("/js/")[1].split(")")[0][:40]) if js else ("gecko: " + " < ".join(x[:26] for x in [f for f in fr if not f.startswith("0x")][:2]))
            a = agg[key]; a[0] += 1; a[1] += e0 - s0; a[2] += es; a[3] += (1 if es > 300 else 0)
        print("\nstyle flushes by the code that forced them (count, ms, mean elements styled, whole-document count):")
        for k, (c, ms, es, bg) in sorted(agg.items(), key=lambda kv: -kv[1][1])[:12]:
            print(f"   {c:5d} {ms:8.1f} ms  els {es / max(c, 1):6.0f}  whole-doc {bg:4d}   {k}")
        if trans:
            print("\nCSS transition restarts by property and target:")
            for k, v in trans.most_common(6):
                print(f"   {v:6d}  {k}")
        break


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in ("run", "analyze"):
        print(__doc__); sys.exit(1)
    if sys.argv[1] == "run":
        browser = sys.argv[2] if len(sys.argv) > 2 else "firefox"
        run(browser, sys.argv[3] if len(sys.argv) > 3 else browser, sys.argv[4] if len(sys.argv) > 4 else "index.html")
    else:
        analyze(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)

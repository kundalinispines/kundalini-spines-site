#!/usr/bin/env python3
"""Static file server for this repo that actually honours HTTP Range requests.

DO NOT DELETE THIS AS "redundant with python -m http.server". It is not.

WHY THIS EXISTS
---------------
Every handoff up to V2HANDOFF 22, and the kundalini-session-start skill, told
sessions to run `python -m http.server 8000`. That server answers media requests
with `200` and the entire body and NO `Accept-Ranges` header. Chrome takes the
missing header as "this resource is not seekable" and the consequences are silent
and extremely misleading:

    served by python -m http.server 8000     served by this file
    -------------------------------------    -----------------------------
    video.buffered  -> [[0, 8.768]]          video.buffered  -> [[0, 8.768]]
    video.seekable  -> [[0, 0]]              video.seekable  -> [[0, 8.768]]
    video.currentTime = 5.469  -> 0          video.currentTime = 5.469 -> 5.469

Every `currentTime` assignment clamps to 0. There is no console error and no
failed request. `seeking` and `seeked` both fire exactly as they would on a good
seek; `seeked` simply reports `currentTime === 0`. Nothing in devtools says the
word "range" unless you go looking at response headers.

The visible symptom, on hero-scrub-lab.html: the intro free-plays 0 -> 5.469s
correctly (free playback needs no seek), then `endIntro()` seeks to the 5.469s
mark to hand off to the scrub, lands on frame 0, and the entrance settles on the
two hooded messengers instead of the intended lattice frame. It looks like a
scrub-mapping bug in the page. It is not; it is the server.

Measured Aug 10 2026 on the identical tree. Under this server the scrub maps
exactly as designed:

    scrub 0.00 -> 5.469s     scrub 0.50 -> 7.112s
    scrub 0.25 -> 6.287s     scrub 1.00 -> 8.768s

Three sessions of video measurements taken against `python -m http.server` are
suspect for this reason. Serve with this file before measuring anything that
touches <video>.

USAGE
-----
    python scripts/serve.py              # repo root on http://127.0.0.1:8000
    python scripts/serve.py 8001         # different port
    python scripts/serve.py 8001 D:\some\other\tree

Port defaults to 8000 so this is a drop-in replacement for the command everyone
already has in muscle memory. The served root defaults to the repo root resolved
from THIS FILE's location (scripts/ -> parent), never a hardcoded absolute path,
so the file survives being cloned to a different machine or worktree.
"""

import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# scripts/serve.py -> repo root is this file's parent directory's parent.
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)$")


class RangeHandler(SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler + byte ranges + aggressive no-caching."""

    # Set by main() so the handler can be constructed by the server machinery
    # without a partial/closure dance.
    serve_root = REPO_ROOT

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=self.serve_root, **kwargs)

    def end_headers(self):
        # Accept-Ranges goes on EVERY response, not just 206s. Chrome decides
        # whether a media resource is seekable from the headers of the first
        # (rangeless) response; if it is absent there, seekable stays [[0, 0]]
        # no matter how correctly we answer later Range requests.
        self.send_header("Accept-Ranges", "bytes")
        # no-store, not no-cache. python's server happily answers 304 Not
        # Modified off If-Modified-Since, and in this project that has
        # repeatedly presented as "the CSS change did not work" / "the page is
        # ignoring my edit" — an entire session was once lost to it. Correctness
        # of what you are looking at beats a few ms of load time on localhost.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            # Directories, missing files, redirects: let the parent produce the
            # 404/301. Ranges are meaningless for those anyway.
            return super().send_head()

        m = _RANGE_RE.match(rng.strip())
        if not m:
            # Multi-range ("bytes=0-99,200-299") and any non-bytes unit. RFC 9110
            # permits ignoring a Range we do not understand and returning the
            # whole 200 body; browsers handle that fine. Not worth a multipart
            # implementation for a localhost dev server.
            return super().send_head()

        size = os.path.getsize(path)
        raw_start, raw_end = m.group(1), m.group(2)

        if raw_start == "":
            # Suffix form "bytes=-N": the LAST N bytes. Chrome uses this to grab
            # the moov atom of an MP4 whose metadata sits at the end of the file.
            if raw_end == "":
                self.send_error(400, "Malformed Range header")
                return None
            suffix_len = int(raw_end)
            if suffix_len == 0:
                # "bytes=-0" is unsatisfiable by definition; fall through to the
                # shared 416 below rather than sending a zero-length 206.
                start, end = size, size - 1
            else:
                start = max(0, size - suffix_len)
                end = size - 1
        else:
            # Open-ended form "bytes=N-" means N through EOF. This is the one
            # Chrome sends most often while scrubbing.
            start = int(raw_start)
            end = int(raw_end) if raw_end != "" else size - 1
            end = min(end, size - 1)

        if start >= size or start > end:
            # Unsatisfiable. 416 must carry Content-Range: bytes */<size> so the
            # client can learn the real length and retry sanely.
            self.send_response(416, "Requested Range Not Satisfiable")
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        length = end - start + 1
        f = open(path, "rb")
        try:
            f.seek(start)
            self.send_response(206, "Partial Content")
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Content-Length", str(length))
            self.send_header("Last-Modified", self.date_time_string(os.stat(path).st_mtime))
            self.end_headers()
        except Exception:
            f.close()
            raise
        # copyfile() would stream to EOF and overrun the slice, so hand back a
        # reader capped at exactly `length` bytes.
        return _CappedReader(f, length)

    def log_message(self, fmt, *args):
        # Silent by default: this server is usually driven by Playwright, and a
        # scrub run emits hundreds of range requests that bury real output.
        # Set SERVE_VERBOSE=1 to get the standard access log back.
        if os.environ.get("SERVE_VERBOSE"):
            super().log_message(fmt, *args)


class _CappedReader:
    """File wrapper that yields at most `remaining` bytes, then EOF.

    SimpleHTTPRequestHandler passes whatever send_head() returns to
    shutil.copyfileobj, which reads until EOF — on a 206 that would send the
    rest of the file after the requested slice and desync the connection.
    """

    def __init__(self, fh, remaining):
        self._fh = fh
        self._remaining = remaining

    def read(self, size=-1):
        if self._remaining <= 0:
            return b""
        if size < 0 or size > self._remaining:
            size = self._remaining
        chunk = self._fh.read(size)
        self._remaining -= len(chunk)
        return chunk

    def close(self):
        self._fh.close()


def main(argv):
    port = 8000
    root = REPO_ROOT

    if len(argv) > 1:
        try:
            port = int(argv[1])
        except ValueError:
            sys.exit(f"serve.py: port must be an integer, got {argv[1]!r}")
    if len(argv) > 2:
        root = os.path.abspath(argv[2])
    if not os.path.isdir(root):
        sys.exit(f"serve.py: not a directory: {root}")

    RangeHandler.serve_root = root
    httpd = ThreadingHTTPServer(("127.0.0.1", port), RangeHandler)
    print(f"serve.py: {root}")
    print(f"serve.py: http://127.0.0.1:{port}/  (Range: bytes, Cache-Control: no-store)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nserve.py: stopped")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main(sys.argv)

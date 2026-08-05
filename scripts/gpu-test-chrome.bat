@echo off
REM ==========================================================================
REM  gpu-test-chrome.bat  —  measure the star field on a GPU without changing
REM  anything about your normal Chrome.
REM
REM  WHY THIS EXISTS. chrome://gpu on 2026-08-05 reported "Software Rendering:
REM  Yes" and GL_RENDERER "Microsoft Basic Render Driver" — Chrome was
REM  compositing the whole page on the CPU through WARP, which is what made the
REM  star field's eight render passes cost 50ms/frame. Turning hardware
REM  acceleration back on in Settings would fix it, but that is a change to the
REM  daily browser and hardware acceleration has caused this machine trouble
REM  before.
REM
REM  A separate --user-data-dir sidesteps the whole question. It is a THROWAWAY
REM  profile: acceleration sits at its default (on), your real profile is never
REM  opened, never written to, and never sees a settings change. Close the
REM  window and nothing persists. To clean up completely, delete the folder
REM  printed below.
REM
REM  BEFORE RUNNING: start the local server in the repo root —
REM      python -m http.server 8000
REM
REM  IT OPENS TWO TABS:
REM    chrome://gpu          check "Compositing: Hardware accelerated" FIRST
REM    localhost:8000        then paste scripts/measure-stars.js into DevTools
REM
REM  DRAG THE WINDOW TO THE 240Hz PANEL before measuring, and keep every run on
REM  the same panel. HANDOFF 10's numbers quantise to 4.17ms, so they were taken
REM  at 240Hz; a 60Hz panel gives a 16.95ms timebase and nothing will compare.
REM
REM  IF chrome://gpu STILL SAYS SOFTWARE in this profile, the cause is not a
REM  setting — it is the blocklist or the driver. Re-run this file with
REM  --ignore-gpu-blocklist added to the line below to find out which. If THAT
REM  fixes it, the driver is blocklisted and the real fix is a driver update,
REM  not a Chrome flag.
REM ==========================================================================

setlocal

set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Could not find chrome.exe in either Program Files location.
  echo Edit the CHROME= line in this file to point at it.
  pause
  exit /b 1
)

set "KSPROFILE=%TEMP%\ks-gpu-test"

REM  --uncapped : remove the vsync cap.
REM  On a 240Hz panel a capped page reports 4.2ms in EVERY condition, because
REM  every condition finishes inside the refresh interval. That is one reading of
REM  the cap repeated, not a set of measurements. Uncapped, the frame time
REM  becomes the actual per-frame GPU work and the conditions can be ranked.
REM  Do not read uncapped numbers as "what the page runs at" — nothing ships
REM  uncapped. Read them against each other.
set "KSFLAGS="
if /I "%~1"=="--uncapped" (
  set "KSFLAGS=--disable-gpu-vsync --disable-frame-rate-limit"
  echo   MODE      : UNCAPPED - frame times are GPU work, not refresh rate.
)

echo.
echo   Chrome    : %CHROME%
echo   Profile   : %KSPROFILE%   (throwaway - delete this folder to clean up)
echo.
echo   Your normal Chrome profile is NOT being opened or modified.
echo.

start "" "%CHROME%" ^
  --user-data-dir="%KSPROFILE%" ^
  --no-first-run ^
  --no-default-browser-check ^
  %KSFLAGS% ^
  "chrome://gpu" "http://localhost:8000/"

endlocal

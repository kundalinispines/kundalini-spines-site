@echo off
REM ==========================================================================
REM  gpu-test-uncapped.bat  —  DOUBLE-CLICK THIS. No command prompt needed.
REM
REM  A one-line wrapper around gpu-test-chrome.bat that passes --uncapped, so
REM  the flag does not have to be typed at a prompt. Everything else — the
REM  throwaway profile, the two tabs, the warnings — lives in that file.
REM
REM  WHY UNCAPPED. On a 240Hz panel a normal Chrome reports 4.2ms in EVERY
REM  condition, because every condition finishes inside one refresh interval.
REM  Eleven identical readings of the cap look like eleven measurements of zero
REM  and are not. Uncapped, Chrome renders as fast as the GPU allows and the
REM  frame time becomes actual per-frame work, so the conditions can be ranked.
REM
REM  DO NOT quote an uncapped number as "what the page runs at" — nothing ships
REM  uncapped. Read the conditions against each other, never in absolute.
REM
REM  START THE SERVER FIRST: python -m http.server 8000, in the repo root.
REM ==========================================================================
call "%~dp0gpu-test-chrome.bat" --uncapped

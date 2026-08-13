# How reference/components and reference/ui_kits got here — read before trusting a filename's history

Added Aug 13 2026. The full-system drop's README points at `components/` and
`ui_kits/website/` as the pixel-level spec, but the folder arrived without them
("duplicate copies break the project's component compiler"). The owner then
supplied them through chat attachments from `%TEMP%`, and **the attachment
process scrambled the filenames**: each batch's content sequence lagged its name
sequence (the first names of a batch were dropped while contents flowed in full
order), so e.g. the file named `SpineCard.prompt.md` actually held `Nav.jsx`,
and the last files of every batch were truncated off entirely.

Every file under `reference/components/` and `reference/ui_kits/website/` was
therefore **renamed by content identity, not by its arriving name** — each JSX
declares its component, each `.d.ts` its props interface, each `.prompt.md`
opens with a one-line naming its component. After copying, all 104 files were
signature-verified (a per-file grep for the declaration the correct content must
contain). Re-dropping the same batches produces the same scramble; the fix for
anything still missing is to paste the file's text directly into chat.

## Known gaps, and one stand-in

- **`spine-doc.css` and `components/terminal/` ARRIVED in a third batch**
  (Aug 13, same scramble — spine-doc.css came in under the name
  `ChannelTab.d (1).ts`) and are installed and signature-verified. Two trivia
  files were truncated off that batch's end and are STILL missing:
  `components/terminal/TerminalRow.prompt.md` (a one-line usage note; the
  `.d.ts` and TransmissionsScreen.jsx cover its contract) and
  `components/terminal/terminal.card.html` (the design-system demo card, not
  spec). Neither blocks building.
- **`design_handoff_spine_document/` was never provided** — `reference/github.md`
  names it as the drop-in handoff for the left-axis spine document plus the
  92→47px header collapse. `spine-doc.css` + `SpineDocScreen.jsx` + `Nav.jsx`
  carry the same design with rich comments, so this is likely redundant, but if
  it holds implementation notes à la the navigator drop, it is worth having.
- **`ui_kits/website/navigator-motion.css` is a STAND-IN**, copied from
  `design_handoff_navigator_motion/navigator-motion.css` in this repo. The
  navigator drop's own README describes that file as the reference recreation's
  stylesheet, and `NavigatorScreen.jsx` here uses exactly its `ks-*` class set,
  so they are believed identical — but the kit's own copy was never received.

## What the kit changes about the site's information architecture

`ui_kits/website/index.html` (the click-through shell) states it directly:
**"Home IS the spine document now."** `SpineDocScreen` (left-edge spine rail,
sections hung off one axis) replaced the centred `HomeScreen`, which is kept in
the kit only as a record and is unreachable from its nav. About/Music/Merch/
Connect are sections *inside* the document; Transmissions, Archive and the
magazine About are separate screens; the Navigator exists as a screen but is
**not in the kit's nav** and renders bare (no footer) — its production URL/role
is an open question for the owner.

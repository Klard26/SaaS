---
name: Professional slides content fit
description: How to keep slide body content from overflowing into the footer in the Replit "Professional" slides mode.
---

# Keeping slide content inside the frame

In the Professional slides mode (e.g. `artifacts/klard-pitch`), each slide is a fixed
`w-screen h-screen` box with a header (kicker + title) and a footer (source + page
counter). The shared `SlideFrame` reserves those, leaving a content area of roughly
**~62vh**. Overflow does not scroll — it silently slides under the footer line and
collides with the source/counter text.

**Rule of thumb:** keep body content to **≤ ~8 rendered text lines**. Plan by rendered
lines, not bullet count — a wrapped bullet is 2–3 lines. German compound words
(e.g. "Energieberatungsunternehmen") wrap aggressively in narrow two-column layouts,
so a 4-bullet column can silently become 9–10 lines.

**Why:** body font has a floor (~2.6vw, ~2.2vw absolute), so you cannot shrink your
way out of overflow — you must cut copy or lines.

**How to apply:**
- After writing/editing any slide, screenshot it (`screenshot` app_preview) and check
  the last list item does not touch the footer. Visual check is the only reliable
  gate; typecheck/validate-slides will NOT catch overflow.
- For two-column slides, the text column is much narrower than full width — budget
  ~37–40 chars/line there, not the ~62 you get full-width.
- Prefer one-line bullets; if a list overflows, shorten copy rather than shrinking font.

---
name: Tailwind v4 @import url() font ordering
description: Why a Google-Fonts @import url() must sit ABOVE @import "tailwindcss" in index.css, or it is silently dropped.
---

# Google-Fonts `@import url()` must precede `@import "tailwindcss"`

In these Vite + Tailwind v4 artifacts, `@import "tailwindcss"` is expanded
**inline** into thousands of lines of real CSS by the `@tailwindcss/vite` plugin.
A remote font import written *after* it — e.g.
`@import url("https://fonts.googleapis.com/css2?family=Inter...")` — ends up after
non-`@import` statements in the compiled output, so PostCSS warns
`@import must precede all other statements` and **drops the font import**. The
specified typography then silently falls back to system fonts.

**Rule:** put any `@import url(...)` for remote fonts as the very first import,
directly under the `@layer ...;` declaration and ABOVE `@import "tailwindcss"`.
A bare/empty `@layer name, ...;` line is allowed before imports; `@charset` too.

**Why:** CSS requires all `@import` rules to come before other statements. Tailwind's
inline expansion turns the tailwind import into other statements, so source order
matters even though it looks like "just another @import".

**How to apply:** when adding web fonts via `@import url()` to any artifact's
`src/index.css`, place it first. If you see the PostCSS `@import must precede`
warning in a vite web workflow log, this ordering is the fix.

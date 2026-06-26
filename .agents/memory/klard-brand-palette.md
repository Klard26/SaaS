---
name: Klard customer-app brand palette
description: The @workspace/klard brand is turquoise→elegant-blue; the --klard-teal* CSS tokens are intentionally named "teal" but hold BLUE values.
---

# Klard customer-app brand palette (turquoise → elegant blue)

The `@workspace/klard` (customer marketplace, `/`) brand identity is a **turquoise →
elegant deep blue** transition. The theme is centralized in
`artifacts/klard/src/index.css`.

**Trap:** the semantic tokens are still named `--klard-teal`, `--klard-teal-d`,
`--klard-teal-l`, `--klard-teal-p` (referenced across ~10 page/component files), but
their VALUES are blue (e.g. `--klard-teal: #1D4ED8` blue-700, `--klard-teal-d:
#1E3A8A` deep navy). The names were kept to avoid touching every consumer.

**Why:** renaming the tokens would mean editing every `bg-[var(--klard-teal*)]`
usage; redefining values in one place re-skins the whole app safely.

**How to apply:**
- Do NOT add literal teal/cyan (e.g. `#0891B2`) or `text-teal-*` utilities thinking
  you're "matching the brand" — read the token values; the brand is blue with a
  turquoise gradient accent.
- The literal turquoise→blue *transition* lives only in gradients: `--klard-grad`
  (`linear-gradient(120deg,#06B6D4,#1D4ED8)`), the `.klard-hero` aurora, the
  `.klard-logo span` clip-text, the search CTA, active `.klard-cpill`, and
  `.klard-step-n`.
- `.klard-logo span` uses gradient clip-text with a solid-color fallback gated in
  `@supports`; the footer (dark surface) overrides it with a lighter
  cyan→light-blue gradient for contrast.
- Hero white text needs a central dark radial anchor in the `.klard-hero`
  background stack — the bare turquoise region fails WCAG against white otherwise.

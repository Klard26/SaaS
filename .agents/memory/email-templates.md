---
name: Email templates (Klard branded HTML)
description: How branded .hbs email templates are bundled, rendered, and wired in api-server
---

# Branded email templates

Provided `.hbs` templates live in `artifacts/api-server/src/email-templates/`. They are NOT Handlebars at runtime — only plain `{{var}}` substitution, no block helpers.

**Bundling constraint (the non-obvious part):** api-server `dev` = `build && start`, so the esbuild bundle is used in BOTH dev and prod. Runtime file reads of templates are therefore impossible — they must be compiled IN. This is done with an esbuild `loader: { ".hbs": "text" }` in `build.mjs` plus a `*.hbs` module declaration (`hbs.d.ts`) so `import tpl from "...hbs"` yields the raw string.

**Renderer quirk:** several provided templates contain single-brace `{key}` typos mixed with correct `{{key}}`. `renderTemplate()` in `email.ts` must replace BOTH forms per key, HTML-escape values, then strip leftover `{{...}}`. Don't "fix" the single braces in the templates — the renderer handles them.

**Why some templates stay unwired:** `booking_reminder_1h` needs a second reminder window + second sent-flag column (only `reminderSentAt` exists, 24h only). `payment_failed` has no source event — booking checkout is synchronous Stripe Checkout, failures never produce a completed session. `profile_activated` has no distinct trigger; `welcome_provider` already covers provider creation. Wiring these is real feature work, not just template insertion.

**How to apply:** when adding a new email, add the `.hbs`, import it, render via `renderTemplate`, and wire to an existing route/webhook/scheduler hook. `immobilien_kunde` table has no `id` column (PK is `userId`) — select `userId` when probing existence.

---
name: Klard provider world separation (pro vs alltag)
description: How the klard-berater app separates "Beratung & Bauwesen" (pro) from "Alltag & Handwerk" (alltag) sign-up/onboarding without a role/schema change.
---

# Provider "world" separation in klard-berater

Klard providers can register through two separate entry areas — **Beratung & Bauwesen** (`pro`)
and **Alltag & Handwerk** (`alltag`) — each with its own landing page, sign-up and sign-in CTAs.

**The separation is entry/landing/onboarding-scope ONLY.** It is NOT an account-type, role, DB,
or API change. Providers remain the single `provider` role. The chosen "world" is just a UI hint
that (a) brands the landing page and (b) filters the onboarding category picker to that world's
categories. The world is derived in the end from which category the provider picks; classification
world ids are exactly `"pro"` and `"alltag"`.

**Why this approach:** the user explicitly chose to keep one provider role and build the split
*inside* the existing klard-berater app (not a new artifact). So there is no server-side `world`
concept and `world` is never a security/authorization boundary — do not treat it as one.

## Carrying `world` across Clerk's multi-step sign-up — the gotcha

Clerk's internal navigation (e.g. sign-in ↔ sign-up link, email-verification sub-routes) **drops
the page's query string**. So a `?world=alltag` placed on `/sign-up` cannot be relied on to still
be present when the flow finishes.

**How to apply:** carry world through BOTH channels, with sessionStorage as the durable fallback:
1. CTA on the landing page persists world to sessionStorage *before* navigating.
2. The sign-up/sign-in pages capture world once at mount as `URL ?world ?? rememberedWorld()`
   (URL wins; storage covers Clerk's dropped query / hard refresh mid-flow).
3. The post-sign-up redirect (`forceRedirectUrl`) appends `?world=` to the onboarding URL, and
   onboarding *also* reads `URL ?world ?? rememberedWorld()`.
4. **Clear the remembered world after the provider is created** (success AND the 409
   "already exists" path) so a returning provider re-opening onboarding isn't silently re-scoped
   to a stale world.

Default (no world anywhere) = show ALL worlds in onboarding (back-compat). The category filter
falls back to all groups if the filtered set is empty, to avoid a blank picker.

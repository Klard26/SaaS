---
name: Klard classification v3 (worlds → areas → categories)
description: The Branchen taxonomy is a 3-level hierarchy with strict back-compat constraints and billing intentionally excluded.
---

# Klard classification v3

The flat `categories` (Branchen) taxonomy is structured as **2 worlds → 14 areas → 88 categories** (`worlds`/`areas` tables + metadata columns on `categories`). `GET /classification` returns the hierarchy; `GET /categories` stays flat; `GET /providers?area=<id>` resolves area→category slugs.

**Back-compat is a hard contract:** the 8 legacy category slugs must stay byte-identical (search links, service templates, provider rows key off them). New categories' slug = profession id with `_`→`-`. Extended `Category` fields are nullable/non-required so old clients keep working.

**`indicativePrice` is `numeric` (mode "number"), not integer.**
**Why:** some categories price per unit fractionally (e.g. Bügelservice 2.50 €/Stück); an integer column silently truncates.

**Billing IS driven by the taxonomy (Model B, since the monetization overhaul).** `categories.pricingModel` (now/lead/hybrid) and `categories.worldId` now drive real money: `now`/`hybrid` → percentage commission on booking checkout; `lead`/`hybrid` → a pay-per-lead fee on the RfQ offer flow. `categories.leadPriceCents` holds the alltag A/B/C tier (600/1000/1500). Resolution is server-side via `providerClassification.getCategoryClassification(provider.categorySlug)` (join, no denormalization); `allowsBooking(null)===true` but `allowsLead(null)===false` so unclassified providers stay bookable but cannot sell paid leads. Never trust client-supplied price/world.
**Why:** the earlier "metadata-only, out of scope" stance was superseded — lead/commission billing is now intentionally taxonomy-driven.

**The grouping helper is duplicated** in `artifacts/klard/src/lib/classification.ts` and `artifacts/klard-berater/src/lib/classification.ts`.
**Why:** artifacts cannot import each other (pnpm-workspace rule); shared code would need a new `lib/*` package. Keep the two copies in sync, or promote to a lib if a third consumer appears.

**Seed is non-destructive:** upserts all categories; provider deletion is gated behind `SEED_ALLOW_DELETE` (default: log only). STB/RAB/NOT/WPR keep `requiresDirectBilling=true` (RVG/StBVV).

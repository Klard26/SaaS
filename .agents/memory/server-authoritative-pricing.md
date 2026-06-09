---
name: Server-authoritative pricing
description: Why any binding/paid flow must recompute money from the DB, never trust client amounts
---

Any endpoint that creates a binding commitment, charge, or persisted monetary record must recompute prices, VAT, and totals on the server from the canonical catalog/DB. Accept only identifiers (e.g. serviceId) from the client; ignore client-sent prices entirely. Validate that referenced records belong to the expected owner (e.g. service.providerId === providerId) and reject (400) on missing/foreign IDs.

**Why:** A binding "offer acceptance" or checkout that trusts client-sent net/gross/vat lets a user forge or negative-price the record while it stores status=accepted — undermines the legal/accounting integrity of the whole feature. This was flagged in code review on Klard's `/offers/accept`.

**How to apply:** In Klard, `POST /offers/accept` (artifacts/api-server/src/routes/offers.ts) maps client items → serviceIds, fetches `servicesTable` by (providerId, id), and recomputes net (from gross via vatRate when net is null), gross, and totals. Round money with a 2-decimal helper. Apply the same pattern to any future paid/binding endpoint.
